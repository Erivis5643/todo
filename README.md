# Tasks (Notion + Cloudflare Pages)

Repo layout (top level): `public/` (the app), `functions/api.js` (talks to Notion), `README.md`.

## Cloudflare Pages
1. Workers & Pages > Create application > Pages > Connect to Git > pick this repo.
2. Production branch `main`, framework preset None, build command empty, build output directory `public`.
3. Project > Settings > Variables and Secrets (Production): add
   - `NOTION_TOKEN` (secret), `NOTION_DB`, `APP_PASSWORD` (secret), optional `TZ_NAME` (default Europe/Vienna)
4. Deploy again so the variables apply (Deployments > latest > Retry deployment, or push a commit).
5. Only for a brand-new Notion database, open `https://YOUR-PROJECT.pages.dev/api?setup=1&key=YOUR_PASSWORD` once. It adds the columns.

## iPhone
Open the new address in Safari > Share > Add to Home Screen.

## How it works
- Repeating tasks are template rows (Repeat is not "none"). The app creates a normal row per day/week/month. They are listed under "Repeating".
- Sorting: importance x 2, plus up to 10 points as the deadline gets closer. A day ends at 03:00.
- Chart: a task counts on its deadline day, weighted by importance. Tap a past day to see it.
