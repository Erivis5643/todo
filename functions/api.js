// Cloudflare Pages Function, served at /api
// Variables: NOTION_TOKEN, NOTION_DB, APP_PASSWORD, TZ_NAME (optional)
let DB, H, TZ;
const nf = async (p, m = 'GET', b) => {
  const r = await fetch('https://api.notion.com/v1' + p, { method: m, headers: H, body: b && JSON.stringify(b) });
  const j = await r.json();
  if (!r.ok) throw new Error(j.message);
  return j;
};
const res = (c, b) => new Response(JSON.stringify(b), { status: c, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
const txt = a => (a || []).map(t => t.plain_text).join('');
const today = () => new Date(Date.now() - 3 * 36e5).toLocaleDateString('sv', { timeZone: TZ }); // the day ends at 03:00
const add = (s, n) => { const d = new Date(s + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const dim = d => new Date(Date.UTC(+d.slice(0, 4), +d.slice(5, 7), 0)).getUTCDate();
const diff = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);

const toTask = p => {
  const q = p.properties;
  return {
    id: p.id, created: p.created_time.slice(0, 10), name: txt(q.Name.title), category: q.Category.select?.name || '',
    importance: q.Importance.number || 3, start: q.Start.date?.start || null, deadline: q.Deadline.date?.start || null,
    completed: q.Completed.date?.start || null, notes: txt(q.Notes.rich_text), repeat: q.Repeat.select?.name || 'none',
    span: q.Span.number ?? 0, series: txt(q.Series.rich_text),
  };
};
const toProps = t => {
  const o = {};
  if ('name' in t) o.Name = { title: [{ text: { content: t.name } }] };
  if ('category' in t) o.Category = { select: t.category ? { name: t.category.replace(/,/g, ' ') } : null };
  if ('importance' in t) o.Importance = { number: t.importance };
  for (const [k, K] of [['start', 'Start'], ['deadline', 'Deadline'], ['completed', 'Completed']])
    if (k in t) o[K] = { date: t[k] ? { start: t[k] } : null };
  if ('notes' in t) o.Notes = { rich_text: [{ text: { content: t.notes || '' } }] };
  if ('repeat' in t) o.Repeat = { select: { name: t.repeat } };
  if ('span' in t) o.Span = { number: t.span };
  if ('series' in t) o.Series = { rich_text: [{ text: { content: t.series } }] };
  return o;
};
const create = o => nf('/pages', 'POST', { parent: { database_id: DB }, properties: toProps(o) }).then(toTask);

async function list() {
  const since = add(today(), -8);
  const out = []; let cursor;
  do {
    const r = await nf(`/databases/${DB}/query`, 'POST', {
      page_size: 100, start_cursor: cursor,
      filter: { or: [
        { property: 'Completed', date: { is_empty: true } },
        { property: 'Completed', date: { on_or_after: since } },
        { property: 'Deadline', date: { on_or_after: since } },
      ] },
    });
    out.push(...r.results.map(toTask));
    cursor = r.has_more && r.next_cursor;
  } while (cursor);
  return out;
}

// Creates the missing task instances of repeating templates for the last 7 days up to today.
async function sync(tasks) {
  const t = today(), have = new Set(tasks.filter(x => x.series).map(x => x.series + x.start)), made = [];
  for (const T of tasks.filter(x => x.repeat !== 'none' && !x.series)) {
    const s0 = T.start || T.created;
    for (let d = add(t, -6); d <= t; d = add(d, 1)) {
      if (d < s0 || have.has(T.id + d)) continue;
      const hit = T.repeat === 'daily' || (T.repeat === 'weekly' && diff(s0, d) % 7 === 0) || (T.repeat === 'monthly' && +d.slice(8) === Math.min(+s0.slice(8), dim(d)));
      if (hit) made.push(await create({ name: T.name, category: T.category, importance: T.importance, notes: T.notes, start: d, deadline: add(d, T.span), repeat: 'none', span: 0, series: T.id }));
    }
  }
  return made;
}

export async function onRequest({ request, env }) {
  DB = env.NOTION_DB; TZ = env.TZ_NAME || 'Europe/Vienna';
  H = { Authorization: 'Bearer ' + env.NOTION_TOKEN, 'Notion-Version': '2022-06-28', 'Content-Type': 'application/json' };
  const q = new URL(request.url).searchParams, pw = (env.APP_PASSWORD || '').trim();
  if (!pw) return res(401, { error: 'APP_PASSWORD is not set on the server. Add it in Cloudflare, then redeploy.' });
  if ((request.headers.get('x-key') || q.get('key') || '').trim() !== pw) return res(401, { error: 'Wrong password' });
  try {
    const m = request.method, b = m === 'POST' || m === 'PATCH' ? await request.json() : {};
    if (q.get('setup')) { // one-time: adds all columns to your Notion database
      await nf('/databases/' + DB, 'PATCH', { properties: { Category: { select: {} }, Importance: { number: {} }, Start: { date: {} }, Deadline: { date: {} }, Completed: { date: {} }, Notes: { rich_text: {} }, Repeat: { select: {} }, Span: { number: {} }, Series: { rich_text: {} } } });
      return res(200, { ok: 'Database is ready' });
    }
    if (m === 'GET') { const t = await list(); return res(200, [...t, ...await sync(t)]); }
    if (m === 'POST') return res(200, await create(b));
    if (m === 'PATCH') { const { id, ...f } = b; return res(200, toTask(await nf('/pages/' + id, 'PATCH', { properties: toProps(f) }))); }
    if (m === 'DELETE') { await nf('/pages/' + q.get('id'), 'PATCH', { archived: true }); return res(200, { ok: 1 }); }
    return res(405, { error: 'Method not allowed' });
  } catch (x) { return res(500, { error: x.message }); }
}
