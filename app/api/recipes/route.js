import { NextResponse } from "next/server";
import { generateFullRecipe } from "../../../lib/anthropic";
import { findFoodPhoto } from "../../../lib/pexels";

// Body: { ideas: [{ id, title, tagline }, ...] }
// Expands each selected idea into a full recipe, in parallel, and attaches
// a matching food photo (photo is null if PEXELS_API_KEY isn't set or
// nothing matched — the recipe still comes back fine either way).
export async function POST(request) {
  try {
    const { ideas } = await request.json();
    if (!Array.isArray(ideas) || ideas.length === 0) {
      return NextResponse.json({ error: "No ideas provided" }, { status: 400 });
    }

    const recipes = await Promise.all(
      ideas.map(async (idea) => {
        const [recipe, photo] = await Promise.all([
          generateFullRecipe({ ...idea, servings: 4 }),
          findFoodPhoto(idea.title),
        ]);
        return { ...recipe, photo };
      })
    );

    return NextResponse.json({ recipes });
  } catch (err) {
    console.error("Failed to generate recipes:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
