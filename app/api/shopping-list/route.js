import { NextResponse } from "next/server";
import { consolidateShoppingList, getPantryStaples } from "../../../lib/anthropic";
import { logSelectedRecipes } from "../../../lib/sheets";

// Body: { recipes: [{ id, title, ingredients, steps, tag, time }, ...] }
// Merges every recipe's ingredients into one deduplicated, categorized list
// (dropping pantry staples), and logs the week's picks to the history
// sheet. Per-ingredient Instacart search links need no API key or server
// round-trip, so they're built client-side (see lib/instacart.js).
export async function POST(request) {
  try {
    const { recipes } = await request.json();
    if (!Array.isArray(recipes) || recipes.length === 0) {
      return NextResponse.json({ error: "No recipes provided" }, { status: 400 });
    }

    const [categories] = await Promise.all([
      consolidateShoppingList({ recipes, staples: getPantryStaples() }),
      logSelectedRecipes(recipes).catch((err) =>
        console.warn("Could not log to history sheet:", err.message)
      ),
    ]);

    return NextResponse.json({ categories });
  } catch (err) {
    console.error("Failed to build shopping list:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
