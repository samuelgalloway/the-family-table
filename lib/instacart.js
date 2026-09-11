const INSTACART_BASE_URL = "https://connect.instacart.com/idp/v1";

// Combines the ingredient lists of several recipes into one Instacart
// shoppable recipe page, via Instacart's Developer Platform "Create Recipe
// Page" API. Returns the shareable products_link_url.
//
// Docs: https://docs.instacart.com/developer_platform_api/api/products/create_recipe_page/
export async function createInstacartRecipeLink({ title, recipes }) {
  const apiKey = process.env.INSTACART_API_KEY;
  if (!apiKey) {
    throw new Error("Missing INSTACART_API_KEY environment variable");
  }

  const ingredients = recipes.flatMap((recipe) =>
    recipe.ingredients.map((line) => ({
      name: line,
      display_text: `${line} (for ${recipe.title})`,
      measurements: [{ quantity: 1, unit: "each" }],
    }))
  );

  const instructions = recipes.map(
    (recipe, i) => `${i + 1}. ${recipe.title}: ${recipe.steps.join(" ")}`
  );

  const body = {
    title: title || "This week's dinners",
    servings: 4,
    instructions,
    ingredients,
    landing_page_configuration: {
      enable_pantry_items: true,
    },
    expires_in: 14,
  };

  const res = await fetch(`${INSTACART_BASE_URL}/products/recipe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(`Instacart API error (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return data.products_link_url;
}
