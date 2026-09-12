// Instacart's Developer Platform (which could generate one shoppable cart
// link for a whole recipe) is no longer accepting new developer
// applications, so there's no way to get a fresh API key. Instead, this
// builds a plain, keyless Instacart product search link per ingredient —
// one tap per item instead of one link for the whole list, but it works
// without any account or approval.
const INSTACART_UNITS =
  "lb|lbs|pound|pounds|oz|ounce|ounces|cup|cups|tbsp|tablespoon|tablespoons|" +
  "tsp|teaspoon|teaspoons|g|gram|grams|kg|ml|l|liter|liters|clove|cloves|" +
  "can|cans|jar|jars|slice|slices|piece|pieces|bunch|bunches|pinch|dash|" +
  "small|medium|large|package|packages|pkg|box|boxes";

// \b after the unit group matters: without it, an alternative like "l" (for
// "liter") or "cup" matches as a prefix of "large" or "cups" and leaves a
// mangled remainder ("arge", "s"). \b forces each alternative to match a
// whole word before the regex accepts it.
const LEADING_QUANTITY_RE = new RegExp(
  `^[\\d\\s./⅛⅜⅝⅞⅓⅔¼½¾-]+\\s*(?:(?:${INSTACART_UNITS})\\b)?\\s*(?:of\\s+)?`,
  "i"
);

// Strips a leading quantity/unit (e.g. "1.5 lb ", "2 cups ", "3 ") from an
// ingredient line so the search focuses on the ingredient itself rather
// than the measurement.
function stripQuantity(line) {
  const stripped = line.replace(LEADING_QUANTITY_RE, "").trim();
  return stripped || line.trim();
}

// Returns a URL to Instacart's own product search for one ingredient.
export function buildInstacartSearchUrl(ingredientLine) {
  const query = stripQuantity(ingredientLine);
  return `https://www.instacart.com/store/s?k=${encodeURIComponent(query)}`;
}
