import Anthropic from "@anthropic-ai/sdk";

let client = null;

function getClient() {
  if (!client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("Missing ANTHROPIC_API_KEY environment variable");
    }
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5-20250929";

// Extracts the first top-level JSON value (object or array) from a string,
// tolerating stray prose or markdown fences Claude sometimes wraps around it.
function extractJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.search(/[[{]/);
  if (start === -1) throw new Error("No JSON found in model response");
  const opener = candidate[start];
  const closer = opener === "[" ? "]" : "}";
  let depth = 0;
  for (let i = start; i < candidate.length; i++) {
    if (candidate[i] === opener) depth++;
    else if (candidate[i] === closer) {
      depth--;
      if (depth === 0) return JSON.parse(candidate.slice(start, i + 1));
    }
  }
  throw new Error("Unbalanced JSON in model response");
}

async function askForJson(prompt, maxTokens = 2048) {
  const anthropic = getClient();
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }],
  });
  const text = message.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n");
  return extractJson(text);
}

// Generates a batch of quick dinner ideas for a family of `servings`,
// avoiding anything in `recentTitles` (recipes made recently).
export async function generateIdeas({ count = 6, servings = 4, recentTitles = [], notes = "" } = {}) {
  const avoidLine = recentTitles.length
    ? `Avoid repeating or closely resembling any of these recent dinners: ${recentTitles.join(", ")}.`
    : "";

  const prompt = `You are helping a family plan ${count} quick, approachable weeknight dinner ideas for ${servings} people.
${avoidLine}
${notes ? `Additional preferences: ${notes}` : ""}

Return ONLY a JSON array of exactly ${count} objects, no other text, each shaped like:
{
  "id": "kebab-case-short-id",
  "title": "Recipe title",
  "tagline": "One short, appetizing sentence describing it",
  "tag": "A short label like 'Weeknight', 'Vegetarian', 'One-pot', 'Cozy'",
  "time": "Total time, e.g. '30 min'"
}

Make the ideas varied in protein, cuisine, and cooking method. Keep taglines under 14 words.`;

  const ideas = await askForJson(prompt, 1024);
  if (!Array.isArray(ideas)) throw new Error("Expected a JSON array of ideas");
  return ideas;
}

// Expands one chosen idea into a full recipe.
export async function generateFullRecipe({ id, title, tagline, servings = 4 }) {
  const prompt = `Write a complete, easy-to-follow home-cook recipe for "${title}" (${tagline || ""}), scaled for ${servings} people.

Return ONLY a JSON object, no other text, shaped like:
{
  "id": "${id}",
  "title": "${title}",
  "servings": ${servings},
  "time": "Total time, e.g. '30 min'",
  "ingredients": ["quantity + ingredient, e.g. '1.5 lb chicken thighs'", "..."],
  "steps": ["Step 1 text", "Step 2 text", "..."]
}

Use 6-10 ingredients with clear quantities suitable for grocery shopping, and 4-6 clear numbered steps. No markdown, no extra commentary.`;

  const recipe = await askForJson(prompt, 1536);
  return recipe;
}

// Pantry staples we assume are always on hand and never need to buy.
// Override with a comma-separated PANTRY_STAPLES env var.
const DEFAULT_PANTRY_STAPLES = [
  "olive oil", "vegetable oil", "canola oil", "cooking spray", "cooking oil",
  "salt", "kosher salt", "black pepper", "pepper",
  "butter", "unsalted butter", "sugar", "brown sugar",
  "flour", "all-purpose flour", "garlic powder", "onion powder", "water",
];

export function getPantryStaples() {
  const raw = process.env.PANTRY_STAPLES;
  if (!raw) return DEFAULT_PANTRY_STAPLES;
  return raw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
}

// Combines every recipe's ingredient list into one deduplicated, categorized
// grocery list — merging repeats (e.g. "2 tbsp olive oil" showing up in three
// recipes becomes one line) and dropping anything on the pantry-staples list.
export async function consolidateShoppingList({ recipes, staples = DEFAULT_PANTRY_STAPLES }) {
  const recipesText = recipes
    .map((r) => `${r.title}:\n${r.ingredients.map((i) => `- ${i}`).join("\n")}`)
    .join("\n\n");

  const prompt = `Here are the ingredient lists for ${recipes.length} recipes we're cooking this week:

${recipesText}

Build one consolidated grocery shopping list from all of these combined. Rules:
- Merge the same or near-identical ingredient across recipes into a single line. When units match, combine the quantities into one clear amount (e.g. "2 tbsp olive oil" + "1 tbsp olive oil" -> "3 tbsp olive oil"); when they don't match cleanly, just list the ingredient once without forcing an exact sum.
- Leave out anything that matches, or is a close variant of, one of these pantry staples we always have on hand and never need to buy: ${staples.join(", ")}.
- Group everything else into these categories, omitting any category with nothing in it: Proteins, Produce, Dairy & Eggs, Grains & Bread, Canned & Pantry, Herbs & Spices, Other.

Return ONLY a JSON object, no other text, shaped like:
{
  "categories": [
    { "name": "Proteins", "items": ["1.5 lb chicken thighs", "1 lb ground beef"] },
    { "name": "Produce", "items": ["..."] }
  ]
}

Keep each item a short shoppable line (quantity + ingredient). No markdown, no extra commentary.`;

  const result = await askForJson(prompt, 1536);
  if (!result || !Array.isArray(result.categories)) {
    throw new Error("Expected a categories array from the consolidated list");
  }
  return result.categories;
}
