// End-to-end check of the real app against the local emulators: logs in as
// a seeded user and uses each feature whose database writes the rules check.
// Run: npm run emulators  (one terminal), npm run dev:emulators (another),
//      node tests/e2e/seed.mjs && node tests/e2e/app.e2e.mjs
import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const APP = 'http://localhost:5174/';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SHOTS = process.env.SHOTS || tmpdir();
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--remote-debugging-port=9360',
  `--user-data-dir=${mkdtempSync(join(tmpdir(), 'stillroom-e2e-'))}`, 'about:blank'], { stdio: 'ignore' });
setTimeout(() => { console.log('TIMEOUT'); chrome.kill(); process.exit(1); }, 240000);

const wait = ms => new Promise(r => setTimeout(r, ms));
let ws, id = 0; const pending = new Map(); const problems = [];
const send = (m, p = {}) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
const ev = async e => (await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })).result?.value;
const until = async (expr, ms = 8000) => { for (let t = 0; t < ms; t += 150) { if (await ev(expr)) return true; await wait(150); } return false; };
const results = [];
const check = (name, ok, extra = '') => { results.push(ok); console.log(`${ok ? '✔' : '✘'} ${name}${extra ? ' — ' + extra : ''}`); };
const shot = async n => { const r = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(SHOTS, `e2e-${n}.png`), Buffer.from(r.data, 'base64')); };

const H = `
  window.$$ = s => [...document.querySelectorAll(s)];
  window.btn = (t, root = document) => [...root.querySelectorAll('button')].find(b => b.textContent.trim().startsWith(t));
  window.type = (el, v) => { const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); };
  window.tab = t => btn(t, document.querySelector('.nav-tabs')).click();
  window.submitForm = el => el.closest('form').requestSubmit();`;

try {
  let url; for (let i = 0; i < 40 && !url; i++) { try { url = (await (await fetch('http://127.0.0.1:9360/json')).json()).find(x => x.type === 'page')?.webSocketDebuggerUrl; } catch {} await wait(250); }
  ws = new WebSocket(url); await new Promise(r => ws.onopen = r);
  ws.onmessage = e => { const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
    if (m.method === 'Runtime.exceptionThrown') problems.push('EXC ' + m.params.exceptionDetails.exception?.description?.slice(0, 200));
    if (m.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(m.params.type)) {
      const t = m.params.args.map(a => a.value ?? a.description ?? '').join(' ');
      if (/permission|denied|insufficient|failed|not sent/i.test(t)) problems.push(t.slice(0, 220));
    } };
  await send('Runtime.enable'); await send('Page.enable');
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `localStorage.setItem('stillroom-intro-seen', '1')` }); // these tests start past the intro
  await send('Emulation.setDeviceMetricsOverride', { width: 1200, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: APP });
  await until(`!!document.querySelector('input[type=email]')`, 20000); await ev(H);

  // Log in
  await ev(`type(document.querySelector('input[type=email]'), 'alice@test.dev'); type(document.querySelector('input[type=password]'), 'password123')`);
  await ev(`document.querySelector('.auth-submit').click()`);
  check('log in as a verified user', await until(`!!document.querySelector('.nav-tabs')`, 15000));
  await ev(H);

  // Events: list + RSVP
  check('events load (server-side city filter)', await until(`document.body.innerText.includes('Coffee meetup')`));
  await ev(`document.querySelector('.rsvp-btn').click()`);
  check('RSVP to an event', await until(`document.querySelector('.rsvp-btn')?.textContent.includes('Going')`));

  // Forums: like, react, reply, delete reply, new post
  await ev(`tab('Forums')`);
  check('forum posts load', await until(`document.body.innerText.includes('How do you switch off?')`));
  await ev(`document.querySelector('.like-btn').click()`);
  check('like a post', await until(`document.querySelector('.like-btn')?.classList.contains('liked')`));
  await ev(`document.querySelector('.reaction-btn').click()`);
  check('react to a post', await until(`document.querySelector('.reaction-btn')?.classList.contains('reacted')`));
  await ev(`document.querySelector('.thread-card').click()`);
  await until(`!!document.querySelector('input[placeholder="Write a reply…"]')`);
  await ev(`type(document.querySelector('input[placeholder="Write a reply…"]'), 'Walks without my phone.')`); await wait(150);
  await ev(`submitForm(document.querySelector('input[placeholder="Write a reply…"]'))`);
  check('reply to a post (shows in the new replies list)', await until(`!!$$('.reply .msg-text').find(e => e.textContent === 'Walks without my phone.')`));
  check('reply count went up by one', await until(`document.querySelector('.thread-card').innerText.includes(' 1')`));
  await shot('forum-reply');
  await wait(2200); // slow mode
  await ev(`document.querySelector('.reply .msg-delete').click()`); await wait(150); await ev(`document.querySelector('.reply .msg-delete').click()`);
  check('delete your own reply', await until(`!document.querySelector('.reply')`));
  await wait(2200);
  await ev(`btn('New post').click()`); await wait(200);
  await ev(`type(document.querySelector('.modal input'), 'Test post from Alice'); btn('Post', document.querySelector('.modal')).click()`);
  check('create a forum post', await until(`document.body.innerText.includes('Test post from Alice')`));

  // Ideas: upvote
  await ev(`tab('Ideas')`);
  await until(`!!document.querySelector('.upvote-btn')`);
  await ev(`document.querySelector('.upvote-btn').click()`);
  check('upvote an idea', await until(`document.querySelector('.upvote-btn')?.classList.contains('upvoted')`));

  // Chat: send + delete
  await wait(2200);
  await ev(`tab('Chat')`);
  await until(`!!document.querySelector('.chat-main .chat-input')`);
  await ev(`type(document.querySelector('.chat-main .chat-input'), 'Hello Pune')`); await wait(150);
  await ev(`submitForm(document.querySelector('.chat-main .chat-input'))`);
  check('send a chat message', await until(`!!$$('.chat-main .msg-text').find(e => e.textContent === 'Hello Pune')`));
  await ev(`$$('.chat-main .msg-delete').pop().click()`); await wait(150); await ev(`$$('.chat-main .msg-delete').pop().click()`);
  check('delete your own chat message', await until(`!$$('.chat-main .msg-text').find(e => e.textContent === 'Hello Pune')`));

  // Members: paged list, open profile, DM
  await ev(`tab('Members')`);
  check('members load (paged, by city)', await until(`$$('.grid2 .card').length >= 2`));
  check('Google auto-filled pictures show initials instead', !!(await ev(`!document.querySelector('img[src*="googleusercontent"]') && $$('.grid2 .card').some(c => c.innerText.includes('Bob'))`)));
  await ev(`$$('.grid2 .card').find(c => c.innerText.includes('Bob')).click()`);
  check('open a member profile', await until(`!!btn('Message')`));
  await wait(2200);
  await ev(`btn('Message').click()`);
  await until(`!!document.querySelector('.dm-panel .chat-input, [class*=dm] .chat-input')`);
  await ev(`window.dmInput = $$('.chat-input').pop(); type(dmInput, 'Hi Bob')`); await wait(150);  // let the typing register, like a person would
  await ev(`submitForm(dmInput)`);
  check('send a DM to a connection', await until(`!!$$('.msg-text').find(e => e.textContent === 'Hi Bob')`));
  await shot('dm');

  // Clarity plan saves to the account
  await ev(`document.querySelector('[aria-label="Close"], .dm-close')?.click()`); await wait(300);
  await ev(`document.querySelector('.wiw-nav-btn').click()`); await wait(400);
  await ev(`btn('Begin').click()`); await wait(300); await ev(`btn('Peace of mind').click()`); await wait(100);
  await ev(`btn('Next').click()`); await wait(400); await ev(`$$('.tn-row')[0].click()`);
  check('Clarity plan saves to the account', await until(`document.querySelector('.tn-save')?.textContent.includes('Saved privately')`));
  await ev(`document.querySelector('.wiw-overlay [aria-label=Close]').click()`); await wait(300);

  // Edit profile
  await ev(`document.querySelector('.avatar').click()`); await wait(200); await ev(`btn('Edit profile').click()`); await wait(300);
  await ev(`type(document.querySelector('.modal textarea'), 'Building calm things'); btn('Save', document.querySelector('.modal')).click()`);
  check('edit your profile', await until(`!document.querySelector('.modal')`));

  await wait(800);
  check('no permission errors anywhere', problems.length === 0, problems.slice(0, 5).join(' | '));
} finally {
  const failed = results.filter(r => !r).length;
  console.log(`\n${results.length - failed}/${results.length} checks passed`);
  chrome.kill(); process.exit(failed ? 1 : 0);
}
