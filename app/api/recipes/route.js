import { NextResponse } from "next/server";
import { generateFullRecipe } from "../../../lib/anthropic";

// Body: { ideas: [{ id, title, tagline }, ...] }
// Expands each selected idea into a full recipe, in parallel.
export async function POST(request) {
  try {
    const { ideas } = await request.json();
    if (!Array.isArray(ideas) || ideas.length === 0) {
      return NextResponse.json({ error: "No ideas provided" }, { status: 400 });
    }

    const recipes = await Promise.all(
      ideas.map((idea) => generateFullRecipe({ ...idea, servings: 4 }))
    );

    return NextResponse.json({ recipes });
  } catch (err) {
    console.error("Failed to generate recipes:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
