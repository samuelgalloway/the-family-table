const PEXELS_BASE_URL = "https://api.pexels.com/v1";

// Looks up one real food photo matching `query` via the Pexels API — free,
// self-serve API key, no approval process (https://www.pexels.com/api/).
// Returns null (rather than throwing) when no key is configured or nothing
// is found, so callers can fall back to a generic icon instead of erroring
// out the whole recipe.
export async function findFoodPhoto(query) {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(
      `${PEXELS_BASE_URL}/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
      { headers: { Authorization: apiKey } }
    );
    if (!res.ok) {
      console.warn(`Pexels API error (${res.status}) for "${query}"`);
      return null;
    }
    const data = await res.json();
    const photo = data.photos?.[0];
    if (!photo) return null;

    return {
      url: photo.src.large,
      alt: photo.alt || query,
      photographer: photo.photographer,
      photographerUrl: photo.photographer_url,
    };
  } catch (err) {
    console.warn(`Could not fetch a photo for "${query}":`, err.message);
    return null;
  }
}
