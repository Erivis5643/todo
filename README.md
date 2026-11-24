# Tasks (Notion + Netlify)

## 1. Notion
1. Create a new full-page database (table) and keep the title column named **Name**.
2. Go to notion.so/profile/integrations, create an internal integration, copy its token.
3. Open your database, click **...** > **Connections** > add your integration.
4. Copy the database ID: the 32 characters in the URL before `?v=`.

## 2. Netlify
1. Put this folder on GitHub, then Netlify > Add new site > Import from Git (or run `netlify deploy --prod`).
2. Site settings > Environment variables:
   - `NOTION_TOKEN` your integration token
   - `NOTION_DB` the database ID
   - `APP_PASSWORD` any password (the app asks for it once per device)
   - `TZ_NAME` optional, default `Europe/Vienna`
3. Redeploy, then open `https://YOUR-SITE.netlify.app/.netlify/functions/api?setup=1&key=YOUR_PASSWORD` once. If that says "Page not found", the function is not deployed: check that `netlify.toml`, `public/` and `netlify/functions/` sit at the top level of what you deploy. It adds all columns to Notion.

## 3. iPhone
Open the site in Safari > Share > **Add to Home Screen**.

## How it works
- Repeating tasks live as one template row (Repeat is not "none"). The app creates a normal row for each day/week/month, so every occurrence can be checked off. Templates are under "Repeating" at the bottom.
- Monthly on the 1st with 2 weeks to finish: Start = a 1st, Repeat = Monthly, Days to finish = 14.
- Sorting: importance x 2, plus up to 10 points as the deadline gets closer.
- "Last day" highlight: today is the deadline of a task that had 3 or more days.
- Chart: a task counts on its deadline day (tasks without deadline count on the day you finish them).

## Reminders
Notion can remind you about dates: open a row in Notion, click the Deadline date > Remind. Those come through the Notion app.
