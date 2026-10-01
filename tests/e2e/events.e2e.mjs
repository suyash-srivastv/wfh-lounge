// Event cards show the host and open a details view with maps, calendar,
// host profile, who's going and RSVP; hosting with a description shows it.
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--remote-debugging-port=9381',
  `--user-data-dir=${mkdtempSync(join(tmpdir(), 'stillroom-e2e-'))}`, 'about:blank'], { stdio: 'ignore' });
setTimeout(() => { console.log('TIMEOUT'); chrome.kill(); process.exit(1); }, 120000);
const wait = ms => new Promise(r => setTimeout(r, ms));
let ws, id = 0; const pending = new Map(); const problems = [];
const send = (m, p = {}) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
const ev = async e => (await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }))?.result?.value;
const until = async (expr, ms = 12000) => { for (let t = 0; t < ms; t += 150) { if (await ev(expr)) return true; await wait(150); } return false; };
const results = []; const check = (n, ok, x = '') => { results.push(ok); console.log(`${ok ? '✔' : '✘'} ${n}${x ? ' — ' + x : ''}`); };
const shot = async n => { if (!process.env.SHOTS) return; await wait(500); const r = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(process.env.SHOTS, 'events-' + n + '.png'), Buffer.from(r.data, 'base64')); };
const H = `window.$$ = s => [...document.querySelectorAll(s)]; window.btn = (t, r = document) => [...r.querySelectorAll('button')].find(b => b.textContent.trim().startsWith(t));
  window.type = (el, v) => { const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); };
  window.card = t => $$('.ev-card').find(c => c.innerText.includes(t));`;
try {
  let url; for (let i = 0; i < 40 && !url; i++) { try { url = (await (await fetch('http://127.0.0.1:9381/json')).json()).find(x => x.type === 'page')?.webSocketDebuggerUrl; } catch {} await wait(250); }
  ws = new WebSocket(url); await new Promise(r => ws.onopen = r);
  ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') { const t = m.params.args.map(a => a.value ?? a.description ?? '').join(' '); if (/permission|denied|failed/i.test(t)) problems.push(t.slice(0, 160)); } };
  await send('Runtime.enable'); await send('Page.enable');
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `localStorage.setItem('stillroom-intro-seen','1')` });
  await send('Emulation.setDeviceMetricsOverride', { width: 1200, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: 'http://localhost:5174/' }); await until(`!!document.querySelector('input[type=email]')`, 20000); await ev(H);
  await ev(`type(document.querySelector('input[type=email]'), 'alice@test.dev'); type(document.querySelector('input[type=password]'), 'password123'); document.querySelector('.auth-submit').click()`);
  await until(`!!card('Coffee meetup')`, 15000); await ev(H);

  check('cards show who hosts', !!(await ev(`card('Coffee meetup').innerText.includes('Hosted by Bob')`)));
  check("cards show faces and names of who's going", await until(`card('Coffee meetup').querySelectorAll('.ev-face').length >= 1 && card('Coffee meetup').querySelector('.ev-who').innerText.includes('Bob')`));
  await shot('cards');
  await ev(`card('Coffee meetup').click()`);
  check('tapping a card opens its details', await until(`document.querySelector('.ed-title')?.textContent === 'Coffee meetup'`));
  check('details: date, time and place', !!(await ev(`(() => { const t = document.querySelector('.ed').innerText; return t.includes('3:30 pm') && t.includes('Third Wave, Koregaon Park'); })()`)));
  check('details: Google Maps + Add to Calendar links', !!(await ev(`(() => { const a = $$('.ed-links a').map(x => x.href); return a.some(h => h.includes('google.com/maps')) && a.some(h => h.includes('calendar.google.com') && h.includes('dates=')); })()`)));
  check("details: who's going", await until(`$$('.ed-going .ed-chip').some(c => c.innerText.includes('Bob'))`));
  await shot('details');
  await ev(`btn('RSVP', document.querySelector('.ed')).click()`);
  check('RSVP from the details view', await until(`document.querySelector('.ed-rsvp')?.textContent.includes('Going') && $$('.ed-going .ed-chip').some(c => c.innerText.includes('You'))`));
  await ev(`document.querySelector('.ed-person').click()`);
  check('tapping the host opens their profile', await until(`!document.querySelector('.ed') && !!btn('Message') && document.body.innerText.includes('Bob')`));
  await ev(`btn('Back')?.click()`); await wait(400); await ev(H);
  await until(`!!card('Coffee meetup')`);
  await ev(`card('Coffee meetup').querySelector('.ev-host-link').click()`);
  check("the host name on a card opens their profile too", await until(`!!btn('Message') && document.body.innerText.includes('Bob')`));
  await ev(`btn('Back')?.click()`); await wait(400); await ev(H);

  // Host an event with a description
  await wait(2200);
  await ev(`btn('Host event').click()`); await until(`!!document.querySelector('.modal textarea')`);
  await ev(`(() => { const m = document.querySelector('.modal'); const ins = m.querySelectorAll('input'); type(ins[0], 'Board games night'); type(ins[1], 'Dice Café'); type(m.querySelector('textarea'), 'Bring a game you love. Beginners welcome.'); })()`);
  await wait(200); await ev(`btn('Create event', document.querySelector('.modal')).click()`);
  await until(`!!card('Board games night')`); await ev(H);
  check('your own event says "Hosted by you"', !!(await ev(`card('Board games night').innerText.includes('Hosted by you')`)));
  await ev(`card('Board games night').click()`);
  check('the description shows in details', await until(`document.querySelector('.ed-desc')?.textContent === 'Bring a game you love. Beginners welcome.'`));
  check('no permission errors', problems.length === 0, problems.slice(0, 3).join(' | '));
} catch (e) { console.log('ERROR:', e?.message || e); results.push(false); }
finally {
  const failed = results.filter(r => !r).length;
  console.log(`\n${results.length - failed}/${results.length} checks passed`); chrome.kill(); process.exit(failed ? 1 : 0);
}
