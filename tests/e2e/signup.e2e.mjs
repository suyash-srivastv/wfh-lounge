// New sign-up → "Verify your email" screen → verify → onboarding.
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const AUTH = 'http://127.0.0.1:9099';
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--disable-gpu', '--remote-debugging-port=9361',
  `--user-data-dir=${mkdtempSync(join(tmpdir(), 'stillroom-e2e-'))}`, 'about:blank'], { stdio: 'ignore' });
setTimeout(() => { console.log('TIMEOUT'); chrome.kill(); process.exit(1); }, 60000);
const wait = ms => new Promise(r => setTimeout(r, ms));
let ws, id = 0; const pending = new Map();
const send = (m, p = {}) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
const ev = async e => (await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })).result?.value;
const until = async (expr, ms = 10000) => { for (let t = 0; t < ms; t += 150) { if (await ev(expr)) return true; await wait(150); } return false; };
const results = []; const check = (n, ok) => { results.push(ok); console.log(`${ok ? '✔' : '✘'} ${n}`); };
try {
  let url; for (let i = 0; i < 40 && !url; i++) { try { url = (await (await fetch('http://127.0.0.1:9361/json')).json()).find(x => x.type === 'page')?.webSocketDebuggerUrl; } catch {} await wait(250); }
  ws = new WebSocket(url); await new Promise(r => ws.onopen = r);
  ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } };
  await send('Page.enable'); await send('Page.navigate', { url: 'http://localhost:5174/' });
  check('first-time visitors see the full-screen intro', await until(`!!document.querySelector('.intro') && document.body.innerText.includes('We forgot to socialise')`, 20000));
  await ev(`window.btn = t => [...document.querySelectorAll('button')].find(b => b.textContent.trim().startsWith(t));
    window.type = (el, v) => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); };`);
  if (process.env.SHOTS) for (const [w, h, n] of [[1200, 900, 'intro-desk'], [390, 844, 'intro-mob']]) {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 600 }); await wait(400);
    const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true }); (await import('node:fs')).writeFileSync(`${process.env.SHOTS}/${n}.png`, Buffer.from(r.data, 'base64'));
  }
  await ev(`btn('Join The Stillroom').click()`);
  check('"Join" goes straight to the sign-up form', await until(`!!document.querySelector('input[placeholder="Your name"]')`));
  await ev(`type(document.querySelector('input[placeholder="Your name"]'), 'Carol'); type(document.querySelector('input[type=email]'), 'carol@test.dev'); type(document.querySelector('input[type=password]'), 'password123')`);
  await ev(`document.querySelector('.auth-submit').click()`);
  check('new sign-up lands on "Verify your email"', await until(`document.body.innerText.includes('Verify your email')`));
  const codes = await fetch(`${AUTH}/emulator/v1/projects/wfh-lounge/oobCodes`).then(r => r.json());
  check('a verification email was sent', (codes.oobCodes || []).some(c => c.email === 'carol@test.dev' && c.requestType === 'VERIFY_EMAIL'));
  await ev(`btn("I've verified").click()`);
  check('before clicking the link it says "not yet"', await until(`document.body.innerText.includes("can't see it yet")`));
  const link = codes.oobCodes.find(c => c.email === 'carol@test.dev').oobLink;
  await fetch(link);
  await ev(`btn("I've verified").click()`);
  check('after verifying, onboarding opens', await until(`document.body.innerText.includes('set up your public profile')`));
  await ev(`type(document.querySelector('input[placeholder="yourhandle"]'), 'carol_test')`);
  check('username shows as available', await until(`document.body.innerText.includes('@carol_test is available')`));
  await ev(`btn('Next').click()`); await wait(400);
  await ev(`btn('Finish setup').click()`);
  check('finishing setup opens the app', await until(`!!document.querySelector('.nav-tabs')`, 15000));
  await ev(`document.querySelector('.avatar').click()`); await wait(200);
  await ev(`btn('Log out').click()`);
  check('returning visitors skip the intro', await until(`!!document.querySelector('input[type=email]') && !document.querySelector('.intro')`));
} finally {
  const failed = results.filter(r => !r).length;
  console.log(`\n${results.length - failed}/${results.length} checks passed`); chrome.kill(); process.exit(failed ? 1 : 0);
}
