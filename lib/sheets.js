import { google } from "googleapis";

const SHEET_TAB = "History";

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  if (!email || !key) {
    throw new Error(
      "Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_PRIVATE_KEY environment variables"
    );
  }
  return new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

function getSheetId() {
  const id = process.env.GOOGLE_SHEET_ID;
  if (!id) throw new Error("Missing GOOGLE_SHEET_ID environment variable");
  return id;
}

// Returns the titles of recipes logged in roughly the last `weeks` weeks,
// so idea generation can avoid repeating them.
export async function getRecentRecipeTitles(weeks = 4) {
  try {
    const sheets = google.sheets({ version: "v4", auth: getAuth() });
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: getSheetId(),
      range: `${SHEET_TAB}!A:C`,
    });
    const rows = res.data.values || [];
    const cutoff = Date.now() - weeks * 7 * 24 * 60 * 60 * 1000;
    return rows
      .filter((row) => {
        const date = new Date(row[0]);
        return !Number.isNaN(date.getTime()) && date.getTime() >= cutoff;
      })
      .map((row) => row[1])
      .filter(Boolean);
  } catch (err) {
    // History is a nice-to-have, not a hard dependency — if the sheet
    // isn't set up yet, just proceed without repeat-avoidance.
    console.warn("Could not read recipe history:", err.message);
    return [];
  }
}

// Appends one row per recipe selected for a given week.
export async function logSelectedRecipes(recipes) {
  const sheets = google.sheets({ version: "v4", auth: getAuth() });
  const now = new Date().toISOString();
  const values = recipes.map((r) => [now, r.title, r.tag || "", r.time || ""]);
  await sheets.spreadsheets.values.append({
    spreadsheetId: getSheetId(),
    range: `${SHEET_TAB}!A:D`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values },
  });
}
