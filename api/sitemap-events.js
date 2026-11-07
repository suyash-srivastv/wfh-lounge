// /sitemap-events.xml — upcoming public events, for search engines.
import { db, todayIST, SITE } from './_lib/firestore.js';

export default async function handler(req, res) {
  // Filter `public` here rather than in the query, so no composite index is needed.
  const snap = await db().collection('events').where('date', '>=', todayIST()).limit(1000).get();
  const urls = snap.docs.filter(d => d.get('public') === true).map(d => `  <url>
    <loc>${SITE}/e/${d.id}</loc>
    <changefreq>daily</changefreq>
  </url>`);

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`);
}
