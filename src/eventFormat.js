// Shared formatting for events (cards + details).

// "2026-10-02" → { mon: 'Oct', day: '02', wd: 'Fri', long: 'Friday, 2 October' }; else null
export function dateParts(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3]);
  return {
    mon: d.toLocaleString('en', { month: 'short' }), day: m[3], wd: d.toLocaleString('en', { weekday: 'short' }),
    long: d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }),
  };
}

// "15:30" → "3:30 pm"; anything else → "Time TBD"
export function niceTime(t) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(t || '');
  if (!m) return t && t !== 'TBD' ? t : 'Time TBD';
  const h = +m[1];
  return `${((h + 11) % 12) + 1}:${m[2]} ${h < 12 ? 'am' : 'pm'}`;
}

// Google Calendar "add event" link (2 hours long, or all-day if no time).
export function calendarLink(ev) {
  const dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ev.date || '');
  if (!dm) return null;
  const tm = /^(\d{1,2}):(\d{2})$/.exec(ev.time || '');
  let dates;
  if (tm) {
    const start = new Date(+dm[1], +dm[2] - 1, +dm[3], +tm[1], +tm[2]);
    const end = new Date(start.getTime() + 2 * 3600e3);
    const f = d => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}00`;
    dates = `${f(start)}/${f(end)}`;
  } else {
    const next = new Date(+dm[1], +dm[2] - 1, +dm[3] + 1);
    dates = `${dm[1]}${dm[2]}${dm[3]}/${next.getFullYear()}${String(next.getMonth() + 1).padStart(2, '0')}${String(next.getDate()).padStart(2, '0')}`;
  }
  const p = new URLSearchParams({ action: 'TEMPLATE', text: ev.title, dates, location: ev.location || '', details: (ev.desc ? ev.desc + '\n\n' : '') + 'Found on The Stillroom' });
  return `https://calendar.google.com/calendar/render?${p}`;
}

export const isLink = s => /^https?:\/\//i.test(s || '');
export const mapsLink = (ev) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([ev.location, ev.city !== 'All' ? ev.city : ''].filter(Boolean).join(', '))}`;
