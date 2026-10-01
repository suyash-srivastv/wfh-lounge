// Friends tab + notifications, across three accounts:
// Suyash requests Alice → Alice is notified, accepts from Friends → Suyash is
// notified and lands in the chat; Alice replies to + RSVPs on Bob's things → Bob is notified.
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--disable-gpu', '--remote-debugging-port=9378',
  `--user-data-dir=${mkdtempSync(join(tmpdir(), 'stillroom-e2e-'))}`, 'about:blank'], { stdio: 'ignore' });
setTimeout(() => { console.log('TIMEOUT'); chrome.kill(); process.exit(1); }, 150000);
const wait = ms => new Promise(r => setTimeout(r, ms));
let ws, id = 0; const pending = new Map(); const problems = [];
const send = (m, p = {}) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
const ev = async e => (await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }))?.result?.value;
const until = async (expr, ms = 12000) => { for (let t = 0; t < ms; t += 150) { if (await ev(expr)) return true; await wait(150); } return false; };
const shot = async n => { if (!process.env.SHOTS) return; await wait(500); const r = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(process.env.SHOTS, 'notif-' + n + '.png'), Buffer.from(r.data, 'base64')); };
const results = []; const check = (n, ok, x = '') => { results.push(ok); console.log(`${ok ? '✔' : '✘'} ${n}${x ? ' — ' + x : ''}`); };
const H = `window.$$ = s => [...document.querySelectorAll(s)]; window.btn = (t, r = document) => [...r.querySelectorAll('button')].find(b => b.textContent.trim().startsWith(t));
  window.type = (el, v) => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); };
  window.tab = t => btn(t, document.querySelector('.nav-tabs')).click();
  window.bell = () => document.querySelector('button[title="Notifications"]');`;
async function login(email) {
  await send('Page.navigate', { url: 'http://localhost:5174/' }); await until(`!!document.querySelector('input[type=email]')`, 20000); await ev(H);
  await ev(`type(document.querySelector('input[type=email]'), '${email}'); type(document.querySelector('input[type=password]'), 'password123'); document.querySelector('.auth-submit').click()`);
  await until(`!!document.querySelector('.nav-tabs')`, 15000); await ev(H);
}
async function logout() { await ev(`document.querySelector('.avatar').click()`); await wait(200); await ev(`btn('Log out').click()`); await until(`!!document.querySelector('input[type=email]')`); }
try {
  let url; for (let i = 0; i < 40 && !url; i++) { try { url = (await (await fetch('http://127.0.0.1:9378/json')).json()).find(x => x.type === 'page')?.webSocketDebuggerUrl; } catch {} await wait(250); }
  ws = new WebSocket(url); await new Promise(r => ws.onopen = r);
  ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') { const t = m.params.args.map(a => a.value ?? a.description ?? '').join(' '); if (/permission|denied|failed/i.test(t)) problems.push(t.slice(0, 160)); } };
  await send('Runtime.enable'); await send('Page.enable');
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `localStorage.setItem('stillroom-intro-seen','1')` });
  await send('Emulation.setDeviceMetricsOverride', { width: 1200, height: 900, deviceScaleFactor: 1, mobile: false });

  // Suyash sends Alice a request
  await login('suyash101997@gmail.com');
  await ev(`tab('Members')`); await until(`$$('.grid2 .card').some(c => c.innerText.includes('Alice'))`);
  check('Members has two tabs: People nearby + Friends', await ev(`!!(btn('People nearby') && btn('Friends'))`));
  await ev(`btn('Connect', $$('.grid2 .card').find(c => c.innerText.includes('Alice'))).click()`);
  await until(`$$('.grid2 .card').find(c => c.innerText.includes('Alice'))?.innerText.includes('Pending')`);
  await logout();

  // Alice is notified and accepts from the Friends tab
  await login('alice@test.dev');
  check('Alice sees a notification badge', await until(`bell()?.querySelector('.dm-trigger-badge')?.textContent === '1'`));
  await ev(`bell().click()`);
  await shot('bell');
  check('it says Suyash sent a friend request', await until(`document.querySelector('.nb-item')?.innerText.includes('Suyash sent you a friend request')`));
  await ev(`document.querySelector('.nb-item').click()`);
  check('tapping it opens Members → Friends with the request', await until(`document.querySelector('.fr-request')?.innerText.includes('Suyash')`));
  check('Friends lists existing friends from any city', await until(`$$('.grid2 .card').some(c => c.innerText.includes('Bob') && c.innerText.includes('Message'))`));
  await shot('friends');
  await ev(`btn('Accept', document.querySelector('.fr-request')).click()`);
  check('accepting moves Suyash into Friends', await until(`!document.querySelector('.fr-request') && $$('.grid2 .card').some(c => c.innerText.includes('Suyash'))`));
  check('badge clears once read', await until(`!bell()?.querySelector('.dm-trigger-badge')`));
  // Alice replies to Bob's post and RSVPs to Bob's event
  await wait(2200);
  await ev(`tab('Forums')`); await until(`document.body.innerText.includes('How do you switch off?')`);
  await ev(`$$('.thread-card').find(c => c.innerText.includes('How do you switch off?')).click()`);
  await until(`!!document.querySelector('input[placeholder="Write a reply…"]')`);
  await ev(`type(document.querySelector('input[placeholder="Write a reply…"]'), 'Long walks.')`); await wait(150);
  await ev(`document.querySelector('input[placeholder="Write a reply…"]').closest('form').requestSubmit()`);
  await until(`$$('.reply .msg-text').some(e => e.textContent === 'Long walks.')`);
  await ev(`tab('Events')`); await until(`!!document.querySelector('.rsvp-btn')`);
  await ev(`document.querySelector('.rsvp-btn').click()`); await until(`document.querySelector('.rsvp-btn').textContent.includes('Going')`);
  await logout();

  // Suyash hears it was accepted, and lands in the chat
  await login('suyash101997@gmail.com');
  await until(`!!bell()?.querySelector('.dm-trigger-badge')`); await ev(`bell().click()`);
  check('Suyash is told Alice accepted', await until(`document.querySelector('.nb-item')?.innerText.includes('Alice accepted your request')`));
  await ev(`document.querySelector('.nb-item').click()`);
  check('tapping it opens a chat with Alice', await until(`!!$$('.chat-input').length && document.body.innerText.includes('Alice')`));
  await logout();

  // Bob hears about the reply and the RSVP
  await login('bob@test.dev');
  check('Bob has 2 notifications', await until(`bell()?.querySelector('.dm-trigger-badge')?.textContent === '2'`));
  await ev(`bell().click()`); await wait(300);
  const texts = await ev(`$$('.nb-item').map(i => i.innerText.split('\\n')[0]).join(' | ')`);
  check('reply + RSVP notifications', texts.includes('Alice replied to “How do you switch off?”') && texts.includes('Alice is going to “Coffee meetup”'), texts);
  await ev(`$$('.nb-item').find(i => i.innerText.includes('replied')).click()`);
  check('tapping the reply opens that post', await until(`$$('.reply .msg-text').some(e => e.textContent === 'Long walks.')`));
  check('no permission errors', problems.length === 0, problems.slice(0, 3).join(' | '));
} catch (e) {
  console.log('ERROR:', e?.message || e); results.push(false);
} finally {
  const failed = results.filter(r => !r).length;
  console.log(`\n${results.length - failed}/${results.length} checks passed`); chrome.kill(); process.exit(failed ? 1 : 0);
}
