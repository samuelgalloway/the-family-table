# The Family Table

A small weekly dinner-planning app: it suggests six quick dinner ideas for
a family of four, you pick a few, it writes out the full recipes as
easy-to-follow cards, and combines every recipe's ingredients into one
deduplicated, categorized shopping list &mdash; skipping pantry staples
you always have on hand &mdash; with a one-tap Instacart search link on
each item. Selected recipes are logged to a Google Sheet so future weeks
avoid repeats.

## How it works

1. `GET /api/ideas` asks Claude for 6 dinner ideas (checking your recent
   history sheet first, so it doesn't repeat last week's dinners).
2. You select a few and hit **View recipes** &rarr; `POST /api/recipes`
   asks Claude to expand each into a full recipe (ingredients + steps).
3. At the last recipe, **Get shopping list** &rarr; `POST /api/shopping-list`
   asks Claude to merge every recipe's ingredients into one list (e.g.
   three recipes each calling for olive oil become a single line),
   grouped into categories (Proteins, Produce, Dairy & Eggs, etc.) and
   with pantry staples left out entirely. It also logs the week's picks to
   your history sheet. Each item links to Instacart's product search for
   it.

## Environment variables

Copy `.env.example` to `.env.local` for local development, or set these
in your Vercel project's Environment Variables settings for deployment.

### 1. `ANTHROPIC_API_KEY` (required)

A Claude API key, separate from your claude.ai login:

1. Go to [console.anthropic.com](https://console.anthropic.com) and sign in or create an account.
2. Go to **API Keys** and create a new key.
3. Paste it in as `ANTHROPIC_API_KEY`. You'll be billed per API call (this app's usage is tiny &mdash; a few cents a week at most).

`ANTHROPIC_MODEL` is optional and defaults to a current Sonnet model; override it if you'd like to try a different one.

`PANTRY_STAPLES` is optional &mdash; a comma-separated list of ingredients
to always leave off the shopping list (things you assume you already
have). Defaults to a sensible list (olive oil, salt, pepper, butter,
sugar, flour, garlic/onion powder, water, etc. &mdash; see
`DEFAULT_PANTRY_STAPLES` in `lib/anthropic.js`). Set your own to override
it entirely, e.g. `PANTRY_STAPLES=olive oil,salt,pepper,butter,soy sauce`.

### 2. Instacart (no key needed)

Instacart's Developer Platform &mdash; the official way to generate one
shoppable cart link for a whole recipe &mdash; is closed to new developer
applications, with no waitlist. So instead, each ingredient on the
shopping-list screen links to a plain Instacart product search
(`instacart.com/store/s?k=...`) for that item: one tap per ingredient
instead of one link for the whole list, but it needs no account, key, or
approval. See `lib/instacart.js` for the link-building logic. If Instacart
ever reopens developer applications and you'd like the single-cart-link
version back, the original implementation is in this repo's git history.

### 3. Google Sheets history log (optional, but recommended)

1. In the [Google Cloud Console](https://console.cloud.google.com), create
   a project (or use an existing one) and enable the **Google Sheets API**.
2. Create a **Service Account**, then create a key for it (JSON format) and
   download it.
3. Create a new Google Sheet for the history log, with a tab named
   `History` (the app writes rows here: date, title, tag, time).
4. Share that Sheet with the service account's email address (found in the
   JSON file as `client_email`), giving it **Editor** access.
5. Set the environment variables from the JSON file:
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL` &mdash; the `client_email` field.
   - `GOOGLE_PRIVATE_KEY` &mdash; the `private_key` field, pasted as-is
     (including the `-----BEGIN PRIVATE KEY-----` lines). If your hosting
     provider doesn't allow literal newlines in an env var, keep the
     `\n` escapes as they appear in the JSON file &mdash; the app converts
     them back automatically.
   - `GOOGLE_SHEET_ID` &mdash; the long ID in the Sheet's URL, e.g. for
     `https://docs.google.com/spreadsheets/d/ABC123/edit`, the ID is
     `ABC123`.

If these aren't set, the app still works &mdash; it just won't avoid
repeat recipes or keep a history.

## Local development

```bash
npm install
cp .env.example .env.local   # then fill in your keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploying to Vercel

1. Push this project to a GitHub repo (or run `vercel` from this folder
   with the [Vercel CLI](https://vercel.com/docs/cli)).
2. In the Vercel dashboard, import the repo as a new project.
3. Add the environment variables above under **Settings &rarr; Environment
   Variables**.
4. Deploy. Vercel will give you a URL you can share with the family
   (no login is built in, so treat the link itself as the access control).

## Notes

- Servings are fixed at 4 throughout; change the `servings` values in
  `lib/anthropic.js` and `app/page.js` if that ever changes.
