# Tasks (Notion + Cloudflare Worker)

Repo layout (top level): `public/` (the app), `worker.js` (serves the app and talks to Notion at /api), `wrangler.jsonc`, `README.md`.

## Cloudflare
1. Keep the Git-connected Worker named `todo` (the name in `wrangler.jsonc` must match). Settings > Builds: build command empty, deploy command `npx wrangler deploy`.
2. Push to GitHub and wait until the deployment is done.
3. Settings > Variables and Secrets > Add, type **Secret**, for each of: `NOTION_TOKEN`, `NOTION_DB`, `APP_PASSWORD`. Optional: `TZ_NAME` (default Europe/Vienna).
4. Test: open `https://YOUR-WORKER.workers.dev/api?key=YOUR_PASSWORD`. It should show a list of your tasks.
5. Only for a brand-new Notion database: `/api?setup=1&key=YOUR_PASSWORD` once. It adds the columns.

## iPhone
Open the address in Safari > Share > Add to Home Screen.

## How it works
- Repeating tasks are template rows (Repeat is not "none"). The app creates a normal row per day/week/month. They are listed under "Repeating".
- Sorting: importance x 2, plus up to 10 points as the deadline gets closer. A day ends at 03:00.
- Chart: a task counts on its deadline day, weighted by importance. Tap a past day to see it.
