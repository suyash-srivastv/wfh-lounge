// Admin is only visible to suyash101997@gmail.com; everyone else sees no difference.
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const SHOTS = process.env.SHOTS || tmpdir();
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--remote-debugging-port=9362',
  `--user-data-dir=${mkdtempSync(join(tmpdir(), 'stillroom-e2e-'))}`, 'about:blank'], { stdio: 'ignore' });
setTimeout(() => { console.log('TIMEOUT'); chrome.kill(); process.exit(1); }, 120000);
const wait = ms => new Promise(r => setTimeout(r, ms));
let ws, id = 0; const pending = new Map(); const problems = [];
const send = (m, p = {}) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
const ev = async e => (await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })).result?.value;
const until = async (expr, ms = 10000) => { for (let t = 0; t < ms; t += 150) { if (await ev(expr)) return true; await wait(150); } return false; };
const results = []; const check = (n, ok, x = '') => { results.push(ok); console.log(`${ok ? '✔' : '✘'} ${n}${x ? ' — ' + x : ''}`); };
const shot = async n => { const r = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(SHOTS, `admin-${n}.png`), Buffer.from(r.data, 'base64')); };
const H = `window.$$ = s => [...document.querySelectorAll(s)];
  window.btn = (t, root = document) => [...root.querySelectorAll('button')].find(b => b.textContent.trim().startsWith(t));
  window.type = (el, v) => { const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); };
  window.tab = t => btn(t, document.querySelector('.nav-tabs')).click();
  window.menu = () => document.querySelector('.avatar').click();`;
async function login(email) {
  await send('Page.navigate', { url: 'http://localhost:5174/' });
  await until(`!!document.querySelector('input[type=email]')`, 20000); await ev(H);
  await ev(`type(document.querySelector('input[type=email]'), '${email}'); type(document.querySelector('input[type=password]'), 'password123'); document.querySelector('.auth-submit').click()`);
  await until(`!!document.querySelector('.nav-tabs')`, 15000); await ev(H);
}
async function logout() { await ev(`menu()`); await wait(200); await ev(`btn('Log out').click()`); await until(`!!document.querySelector('input[type=email]')`); await ev(H); }
try {
  let url; for (let i = 0; i < 40 && !url; i++) { try { url = (await (await fetch('http://127.0.0.1:9362/json')).json()).find(x => x.type === 'page')?.webSocketDebuggerUrl; } catch {} await wait(250); }
  ws = new WebSocket(url); await new Promise(r => ws.onopen = r);
  ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
    if (m.method === 'Runtime.exceptionThrown') problems.push('EXC ' + m.params.exceptionDetails.exception?.description?.slice(0, 160));
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') { const t = m.params.args.map(a => a.value ?? a.description ?? '').join(' '); if (/permission|denied/i.test(t)) problems.push(t.slice(0, 160)); } };
  await send('Runtime.enable'); await send('Page.enable');
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `localStorage.setItem('stillroom-intro-seen', '1')` }); // these tests start past the intro
  await send('Emulation.setDeviceMetricsOverride', { width: 1200, height: 900, deviceScaleFactor: 1, mobile: false });


  // Regular member: no admin anywhere
  await login('alice@test.dev');
  check('About tab sits right after Forums', !!(await ev(`(() => { const t = $$('.nav-tabs .nav-tab').map(b => b.textContent.trim()); return t.indexOf('About') === t.indexOf('Forums') + 1; })()`)));
  await ev(`menu()`); await wait(200);
  check('member menu has NO Admin', !(await ev(`!!btn('Admin')`)));
  await ev(`menu()`); await wait(100);
  await ev(`tab('About')`);
  check('member can read About + FAQ', await until(`document.body.innerText.includes('Questions') && document.body.innerText.includes('Is it free?')`));
  await ev(`tab('Forums')`); await until(`document.body.innerText.includes('How do you switch off?')`);
  check("member sees no delete button on Bob's post", !(await ev(`!!document.querySelector('.thread-card .msg-delete, .thread-card .delete-btn')`)));
  await ev(`tab('Events')`); await until(`document.body.innerText.includes('Coffee meetup')`);
  check("member sees no delete button on Bob's event", !(await ev(`!!document.querySelector('.card .msg-delete, .card .delete-btn')`)));
  await logout();

  // Admin
  await login('suyash101997@gmail.com');
  await ev(`menu()`); await wait(200);
  check('admin menu has Admin', !!(await ev(`!!btn('Admin')`)));
  await ev(`btn('Admin').click()`);
  check('admin panel opens with counts', await until(`document.body.innerText.includes('Members') && /\\d/.test(document.querySelector('.admin-stat-val')?.textContent || '')`));
  await shot('overview');
  await ev(`btn('About page', document.querySelector('.admin-tabs')).click()`); await until(`!!document.querySelector('.admin-textarea')`);
  await ev(`type(document.querySelector('.admin-card input'), 'Why we built The Stillroom'); btn('Save', document.querySelector('.admin-card')).click()`);
  check('admin saves the About page', await until(`document.body.innerText.includes('Saved — live for everyone')`));
  await ev(`btn('FAQ', document.querySelector('.admin-tabs')).click()`); await until(`!!btn('Add the starter FAQs') || $$('.admin-faq').length`);
  await ev(`btn('Add the starter FAQs')?.click()`);
  check('admin adds starter FAQs', await until(`$$('.admin-faq').length === 7`));
  await ev(`$$('.admin-faq')[1].querySelector('[aria-label="Move up"]').click()`);
  check('admin reorders FAQs', await until(`$$('.admin-faq')[0].innerText.startsWith('Is it free?')`));
  await shot('faq');
  await ev(`tab('Forums')`); await until(`document.body.innerText.includes('How do you switch off?')`);
  check("admin sees a delete button on Bob's post", !!(await ev(`!!document.querySelector('.thread-card .msg-delete')`)));
  await ev(`document.querySelector('.thread-card .msg-delete').click()`); await wait(150); await ev(`document.querySelector('.thread-card .msg-delete').click()`);
  check("admin deletes Bob's post", await until(`!document.body.innerText.includes('How do you switch off?')`));
  await logout();

  // Changes are live for other members
  await login('alice@test.dev'); await shot('nav');
  await ev(`tab('About')`);
  check('the new About title + FAQ order show for other members', await until(`document.body.innerText.includes('Why we built The Stillroom') && document.querySelector('.faq-q')?.textContent.startsWith('Is it free?')`));
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true }); await wait(600); await shot('mobile');
  check('no permission errors', problems.length === 0, problems.slice(0, 3).join(' | '));
} finally {
  const failed = results.filter(r => !r).length;
  console.log(`\n${results.length - failed}/${results.length} checks passed`); chrome.kill(); process.exit(failed ? 1 : 0);
}
