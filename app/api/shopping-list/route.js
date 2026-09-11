import { NextResponse } from "next/server";
import { createInstacartRecipeLink } from "../../../lib/instacart";
import { logSelectedRecipes } from "../../../lib/sheets";

// Body: { recipes: [{ id, title, ingredients, steps, tag, time }, ...] }
export async function POST(request) {
  try {
    const { recipes } = await request.json();
    if (!Array.isArray(recipes) || recipes.length === 0) {
      return NextResponse.json({ error: "No recipes provided" }, { status: 400 });
    }

    const [instacartUrl] = await Promise.all([
      createInstacartRecipeLink({ title: "This week's dinners", recipes }),
      logSelectedRecipes(recipes).catch((err) =>
        console.warn("Could not log to history sheet:", err.message)
      ),
    ]);

    return NextResponse.json({ instacartUrl });
  } catch (err) {
    console.error("Failed to build shopping list:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
