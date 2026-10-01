// Profile photo: picked file → shrunk to 128px in the browser → saved on the
// profile (no file storage) → shows in the nav and on Members, survives reload.
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const PHOTO = resolve('tests/e2e/fixtures/photo.png');
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--remote-debugging-port=9377',
  `--user-data-dir=${mkdtempSync(join(tmpdir(), 'stillroom-e2e-'))}`, 'about:blank'], { stdio: 'ignore' });
setTimeout(() => { console.log('TIMEOUT'); chrome.kill(); process.exit(1); }, 90000);
const wait = ms => new Promise(r => setTimeout(r, ms));
let ws, id = 0; const pending = new Map(); const problems = [];
const send = (m, p = {}) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
const ev = async e => (await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })).result?.value;
const until = async (expr, ms = 15000) => { for (let t = 0; t < ms; t += 150) { if (await ev(expr)) return true; await wait(150); } return false; };
const results = []; const check = (n, ok, x = '') => { results.push(ok); console.log(`${ok ? '✔' : '✘'} ${n}${x ? ' — ' + x : ''}`); };
const H = `window.$$ = s => [...document.querySelectorAll(s)]; window.btn = (t, r = document) => [...r.querySelectorAll('button')].find(b => b.textContent.trim().startsWith(t));`;
try {
  let url; for (let i = 0; i < 40 && !url; i++) { try { url = (await (await fetch('http://127.0.0.1:9377/json')).json()).find(x => x.type === 'page')?.webSocketDebuggerUrl; } catch {} await wait(250); }
  ws = new WebSocket(url); await new Promise(r => ws.onopen = r);
  ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') problems.push(m.params.args.map(a => a.value ?? a.description ?? '').join(' ').slice(0, 160)); };
  await send('Runtime.enable'); await send('Page.enable'); await send('DOM.enable');
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `localStorage.setItem('stillroom-intro-seen','1')` });
  await send('Emulation.setDeviceMetricsOverride', { width: 1200, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: 'http://localhost:5174/' }); await until(`!!document.querySelector('input[type=email]')`, 20000); await ev(H);
  await ev(`(() => { const t = (el, v) => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); };
    t(document.querySelector('input[type=email]'), 'alice@test.dev'); t(document.querySelector('input[type=password]'), 'password123'); document.querySelector('.auth-submit').click(); })()`);
  await until(`!!document.querySelector('.nav-tabs')`); await ev(H);

  await ev(`document.querySelector('.avatar').click()`); await wait(200); await ev(`btn('Edit profile').click()`);
  await until(`!!document.querySelector('.modal input[type=file]')`);
  const { root } = await send('DOM.getDocument', { depth: -1 });
  const { nodeId } = await send('DOM.querySelector', { nodeId: root.nodeId, selector: '.modal input[type=file]' });
  await send('DOM.setFileInputFiles', { nodeId, files: [PHOTO] });
  check('picking a photo finishes quickly (no "stuck uploading")', await until(`document.querySelector('.modal img')?.src.startsWith('data:image/')`, 5000));
  const size = await ev(`document.querySelector('.modal img').src.length`);
  check('photo is shrunk small', size < 20000, `${Math.round(size / 1024)}KB as text (from a ${1600}×${1200} photo)`);
  const dims = await ev(`new Promise(r => { const i = new Image(); i.onload = () => r(i.width + 'x' + i.height); i.src = document.querySelector('.modal img').src; })`);
  check('photo is cropped square to 128px', dims === '128x128', dims);
  await ev(`btn('Save', document.querySelector('.modal')).click()`);
  check('saving the profile works', await until(`!document.querySelector('.modal')`));
  check('new photo shows in the top bar', await until(`document.querySelector('.avatar img')?.src.startsWith('data:image/')`));

  await send('Page.navigate', { url: 'http://localhost:5174/' }); await until(`!!document.querySelector('.nav-tabs')`); await ev(H);
  check('photo is still there after reloading', await until(`document.querySelector('.avatar img')?.src.startsWith('data:image/')`));
  await ev(`[...document.querySelectorAll('.nav-tab')].find(b => b.textContent.includes('Members')).click()`);
  check('other screens show it too (Members)', await until(`$$('.grid2 .card').some(c => c.innerText.includes('Alice') && c.querySelector('img')?.src.startsWith('data:image/'))`));
  check('no errors', problems.length === 0, problems.slice(0, 2).join(' | '));
} finally {
  const failed = results.filter(r => !r).length;
  console.log(`\n${results.length - failed}/${results.length} checks passed`); chrome.kill(); process.exit(failed ? 1 : 0);
}
