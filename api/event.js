// /e/{id} — a public page for one event, so it can be shared (WhatsApp/LinkedIn
// previews) and found on Google. Only events whose host ticked "public" are
// shown; everything else gets a 404. Attendee names and online meeting links
// are never shown here — those stay inside the app.
import { db, todayIST, SITE } from './_lib/firestore.js';
import { dateParts, niceTime, isLink, mapsLink } from '../src/eventFormat.js';

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const first = name => (name || '').trim().split(/\s+/)[0] || 'A member';
const clip = (s, n) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s);

function layout({ title, description, url, image = `${SITE}/og-image.png`, robots, schema, body }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}" />
${robots ? `<meta name="robots" content="${robots}" />\n` : ''}${url ? `<link rel="canonical" href="${url}" />\n` : ''}<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<meta name="theme-color" content="#0C0C0D" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="The Stillroom" />
${url ? `<meta property="og:url" content="${url}" />\n` : ''}<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:image" content="${image}" />
<meta name="twitter:card" content="summary_large_image" />
${schema ? `<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>\n` : ''}<link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,600&family=DM+Serif+Display&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="/pages.css" />
</head>
<body>
<div class="wrap">
<header class="top">
  <a class="brand" href="/">The Stillroom</a>
  <a class="btn" href="/">Join free</a>
</header>
<main>
${body}
</main>
<footer>
  <nav><a href="/">Home</a><a href="/about">About</a><a href="/faq">FAQ</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/cities">Cities</a></nav>
  <p>&copy; 2026 The Stillroom</p>
</footer>
</div>
</body>
</html>
`;
}

function notFound(res) {
  res.status(404).setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=300');
  res.send(layout({
    title: 'Event not found — The Stillroom',
    description: 'This event is private or no longer exists.',
    robots: 'noindex',
    body: `<p class="kicker">Event</p>
<h1>This event isn’t available</h1>
<p class="lede">It may be members-only, or the host may have removed it.</p>
<div class="cta"><p>See what’s on near you — coffee, walks, co-working and more.</p><a class="btn big" href="/">Join The Stillroom — it’s free</a></div>`,
  }));
}

export default async function handler(req, res) {
  const id = String(req.query.id || '');
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(id)) return notFound(res);

  const snap = await db().collection('events').doc(id).get();
  const ev = snap.exists ? snap.data() : null;
  if (!ev || ev.public !== true) return notFound(res);

  const url = `${SITE}/e/${id}`;
  const d = dateParts(ev.date);
  const ended = !!d && ev.date < todayIST();
  const online = ev.type !== 'IRL' || isLink(ev.location); // never print a meeting link
  const city = ev.city && ev.city !== 'All' ? ev.city : '';
  const going = ev.attendeeCount || Object.keys(ev.rsvps || {}).length;
  const when = `${d ? d.long : 'Date to be decided'} · ${niceTime(ev.time)}`;
  const where = online ? 'Online' : ev.location;
  const rsvpUrl = `/?event=${id}`;

  const title = `${ev.title}${city ? ` · ${city}` : ''} — The Stillroom`;
  const description = clip(`${d ? d.long : 'Date TBD'}${online ? ' · Online' : ` · ${ev.location}${city ? `, ${city}` : ''}`}. ${ev.desc || `A small meetup for working professionals, hosted by ${first(ev.host)}.`}`, 160);

  // Google Event rich result. Times are assumed IST (the app is used in India).
  const tm = /^(\d{1,2}):(\d{2})$/.exec(ev.time || '');
  const schema = d && !ended ? {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: ev.title,
    description: ev.desc || description,
    startDate: tm ? `${ev.date}T${tm[1].padStart(2, '0')}:${tm[2]}:00+05:30` : ev.date,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: online ? 'https://schema.org/OnlineEventAttendanceMode' : 'https://schema.org/OfflineEventAttendanceMode',
    location: online
      ? { '@type': 'VirtualLocation', url }
      : { '@type': 'Place', name: ev.location, address: { '@type': 'PostalAddress', addressLocality: city || undefined, addressCountry: 'IN' } },
    organizer: { '@type': 'Person', name: first(ev.host) },
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: 0, priceCurrency: 'INR', availability: 'https://schema.org/InStock', url },
    image: [`${SITE}/og-image.png`],
  } : null;

  const body = `${ended ? `<div class="cta" style="margin-top:0"><p><strong>This event has ended.</strong> See what’s coming up near you.</p><a class="btn" href="/">See upcoming events</a></div>` : ''}
<p class="kicker">${online ? 'Online event' : 'In person'}${city ? ` · ${esc(city)}` : ''}</p>
<h1>${esc(ev.title)}</h1>
<ul style="list-style:none;padding:0">
  <li>📅 ${esc(when)}</li>
  <li>${online ? '🌐 Online — the link is shared with people who RSVP' : `📍 ${esc(where)}${city ? `, ${esc(city)}` : ''} · <a href="${esc(mapsLink(ev))}" target="_blank" rel="noopener noreferrer">Open in Google Maps</a>`}</li>
  <li>👤 Hosted by ${esc(first(ev.host))}</li>
  <li>🙋 ${going ? `${going} going` : 'Be the first to join'}</li>
</ul>
${ev.desc ? `<h2>About this event</h2>\n<p>${esc(ev.desc).replace(/\n/g, '<br/>')}</p>` : ''}
${ev.tags?.length ? `<p class="muted">${ev.tags.map(t => `#${esc(t)}`).join(' ')}</p>` : ''}
${ended ? '' : `<div class="cta"><p>RSVP on The Stillroom — a free community for working professionals to meet people in their city.</p><a class="btn big" href="${rsvpUrl}">RSVP on The Stillroom</a></div>`}
<h2>What is The Stillroom?</h2>
<p>A social network for working professionals and work-from-home people. Find people in your city, join small real-life events like this one, and make friends outside work. <a href="/about">Learn more</a>.</p>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=3600');
  res.send(layout({ title, description, url, robots: ended ? 'noindex' : null, schema, body }));
}
