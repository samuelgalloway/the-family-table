import { NextResponse } from "next/server";
import { generateIdeas } from "../../../lib/anthropic";
import { getRecentRecipeTitles } from "../../../lib/sheets";

export async function GET() {
  try {
    const recentTitles = await getRecentRecipeTitles(4);
    const ideas = await generateIdeas({ count: 6, servings: 4, recentTitles });
    return NextResponse.json({ ideas });
  } catch (err) {
    console.error("Failed to generate ideas:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
