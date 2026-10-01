import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { db } from '../firebase';
import { doc, getDoc, collection, writeBatch, serverTimestamp } from 'firebase/firestore';

// A self-guided reflection, not a personality quiz: the user names what they
// want, says what it looks like and why, ranks it, and picks one next step.
// Everything is tap-to-choose; typing is always optional ("Write my own").
// The app never tells them what they want — it only asks follow-up questions.

const OPTIONS = [
  { id: 'money', emoji: '💰', label: 'More money',
    looks: ['6+ months of savings', 'No EMI or debt stress', 'A real salary hike', 'A side income', 'Not checking my balance before buying things'],
    steps: ['Work out how many months I could live without a salary', 'Set up an automatic saving on payday', 'Ask for the salary conversation', 'Cancel two subscriptions I don\'t use'] },
  { id: 'people', emoji: '🫂', label: 'Real friends',
    looks: ['A couple of friends I can call anytime', 'Plans most weekends', 'People who get my work life', 'A partner', 'Reconnecting with old friends'],
    steps: ['Message one person I miss', 'Join the Watercooler call once', 'Say yes to the next plan', 'Go to one Stillroom event'] },
  { id: 'peace', emoji: '🌙', label: 'Peace of mind',
    looks: ['Switching off after work', 'Sleeping without Monday dread', 'Fewer notifications', 'No constant comparing', 'Slower mornings'],
    steps: ['Mute work apps after 7pm for five days', 'Take one walk without my phone', 'Keep one evening completely empty', 'Delete one app that makes me anxious'] },
  { id: 'adventure', emoji: '🧭', label: 'Adventure',
    looks: ['Travelling somewhere new', 'Working from a different city', 'Trying something that scares me', 'Meeting new kinds of people', 'Less routine, more surprise'],
    steps: ['Plan a trip and put a date on it', 'Work from a new café for a day', 'Go to an event I\'d normally skip', 'Try one thing I\'ve never done'] },
  { id: 'career', emoji: '🚪', label: 'A different career',
    looks: ['A completely different field', 'Starting my own thing', 'Freelancing', 'Same field, different role', 'Work that uses my creativity'],
    steps: ['List 3 careers I\'d try if nobody judged me', 'Talk to one person already doing it', 'Spend 30 minutes actually trying it', 'Post my idea in Ideas'] },
  { id: 'growth', emoji: '🌱', label: 'To learn and grow',
    looks: ['Learning a new skill', 'Getting really good at one thing', 'A course or certification', 'Reading more', 'Having a mentor'],
    steps: ['Spend 20 minutes on the skill', 'Ask someone good at it how they started', 'Sign up for one class', 'Finish one small thing'] },
  { id: 'family', emoji: '🏡', label: 'Time with family',
    looks: ['Regular meals together', 'Visiting my parents more', 'Being present, not on my phone', 'Living closer to them', 'More time with my kids'],
    steps: ['Call family twice this week', 'Plan one meal together', 'Keep my phone away during family time', 'Book a trip home'] },
  { id: 'health', emoji: '💪', label: 'Better health',
    // Asked as "how are you right now" — nearly everyone recognises something here.
    looksQ: 'How is your body doing right now?', looksLabel: 'Right now',
    looks: ['Tired all the time, even after sleeping', 'Some pain most days (back, neck, wrists)', 'Pain or irritation that comes and goes',
            'Eyes tired or strained from screens', 'Frequent headaches', 'Sleep is all over the place', 'Stiff from sitting all day',
            'Energy crash after lunch', 'Stress shows up in my body', 'Honestly fine — I just want to be fitter'],
    steps: ['Walk 20 minutes, three times this week', 'Fix my desk and chair setup', 'Take a 5-minute stretch break every 2 hours', 'Keep my phone out of the bedroom'] },
  { id: 'title', emoji: '🏆', label: 'A better title',
    looks: ['A promotion', 'Leading a team', 'Being taken seriously in meetings', 'Recognition for my work', 'A title my family understands'],
    steps: ['Ask my manager what the next level needs', 'Write down 3 wins from this quarter', 'Volunteer for one visible project', 'Find someone at that level to learn from'] },
  { id: 'security', emoji: '🛡️', label: 'Job security',
    looks: ['Not fearing every layoff headline', 'Skills that are in demand', 'An emergency fund', 'A backup plan', 'A stable company'],
    steps: ['Update my CV — just in case, not in panic', 'Spend an hour on one in-demand skill', 'Start a small emergency fund', 'Reconnect with 3 people in my network'] },
  { id: 'freedom', emoji: '🪁', label: 'Freedom with my time',
    looks: ['Choosing my own hours', 'A 4-day week', 'Working from anywhere', 'Saying no without guilt', 'Not needing permission'],
    steps: ['Block one hour nobody can book', 'Say no to one thing', 'Ask about flexible hours', 'Take a real day off'] },
  { id: 'meaning', emoji: '✨', label: 'Work that matters',
    looks: ['Work that helps people', 'Building something of my own', 'Knowing my work matters', 'Work that fits my values', 'Something I\'d be proud to explain'],
    steps: ['Finish the sentence "I want my work to…"', 'Spend an hour on something just mine', 'Tell someone the idea I keep circling', 'Volunteer once'] },
];

const CUSTOM_LOOKS = ['Doing it regularly', 'Just starting at all', 'Getting good at it', 'Doing it with other people'];
const CUSTOM_STEPS = ['Spend 30 minutes on it', 'Tell someone I want it', 'Look up how to start', 'Put a date for it in my calendar'];

const WHYS = [
  'To feel safe', 'To feel free', 'To feel proud of myself', 'To be happier day to day',
  'To stop feeling stuck', 'For the people I love', 'To prove something to someone', 'Because everyone around me has it',
];
const OUTSIDE_WHYS = ['To prove something to someone', 'Because everyone around me has it'];

const VOICES = [
  { id: 'me',      label: 'Me, honestly' },
  { id: 'family',  label: 'My family' },
  { id: 'peers',   label: 'Friends / peers' },
  { id: 'work',    label: 'My boss / company' },
  { id: 'society', label: 'Society / social media' },
];

const MAX_PICKS = 5;

// Gentle follow-up questions on the result. Observations, never verdicts.
function nudges(item, rank, items) {
  const out = [];
  const voice = VOICES.find(v => v.id === item.voice);
  if (item.voice && item.voice !== 'me') {
    out.push(`You said this mostly comes from ${voice.label.toLowerCase()}. Would you still want it if nobody ever found out you had it?`);
  }
  const outside = (item.why || []).filter(w => OUTSIDE_WHYS.includes(w));
  if (outside.length) {
    out.push(`You picked "${outside[0].toLowerCase()}". If that person or crowd disappeared tomorrow, would this still be on your list?`);
  }
  if (item.have >= 4) {
    out.push('You already have a fair bit of this. Do you want more — or are you afraid of losing what you have?');
  }
  if (rank === 0 && items.length > 1 && item.have && item.have === Math.min(...items.map(i => i.have || 5))) {
    out.push('This is your top priority and also where you have the least. That gap is worth your attention.');
  }
  return out;
}

const isValid = r => !!(r && r.version === 4 && Array.isArray(r.items) && r.items.length);

// Storage keys keep the old "truenorth" name so existing saved results still load.
const LS_KEY = uid => `stillroom-truenorth-${uid}`;
const SAVED_EVENT = 'truenorth:saved';
const DISMISS_KEY = 'stillroom-truenorth-card-dismissed';

function useSavedResult(uid) {
  const [saved, setSaved] = useState(() => {
    try { const r = JSON.parse(localStorage.getItem(LS_KEY(uid))); return isValid(r) ? r : null; } catch { return null; }
  });

  useEffect(() => {
    getDoc(doc(db, 'reflections', uid))
      .then(snap => { if (snap.exists() && isValid(snap.data())) setSaved(snap.data()); })
      .catch(() => {});
  }, [uid]);

  // Keep the toolbar button and the mobile prompt card in sync.
  useEffect(() => {
    const onSaved = e => setSaved(e.detail);
    window.addEventListener(SAVED_EVENT, onSaved);
    return () => window.removeEventListener(SAVED_EVENT, onSaved);
  }, []);

  // Latest result lives at reflections/{uid}; every finished run is also kept
  // in reflections/{uid}/history so people can see how their answers change.
  async function save(result) {
    setSaved(result);
    window.dispatchEvent(new CustomEvent(SAVED_EVENT, { detail: result }));
    try { localStorage.setItem(LS_KEY(uid), JSON.stringify(result)); } catch {}
    const batch = writeBatch(db);
    batch.set(doc(db, 'reflections', uid), { ...result, updatedAt: serverTimestamp() });
    batch.set(doc(collection(db, 'reflections', uid, 'history')), { ...result, createdAt: serverTimestamp() });
    await batch.commit();
  }

  return [saved, save];
}

// Tappable options; `selected` is an array of labels.
function Chips({ options, selected, onToggle, className = 'tn-voice' }) {
  return (
    <div className="tn-voices">
      {options.map(o => (
        <button key={o} type="button" className={className + (selected.includes(o) ? ' on' : '')} onClick={() => onToggle(o)}>{o}</button>
      ))}
    </div>
  );
}

// "+ Write my own" link that opens a one-line input. Optional by design.
function WriteOwn({ onAdd, disabled, label = 'Write my own', placeholder = 'Type it here…' }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  if (!open) {
    return <button type="button" className="tn-link tn-own" disabled={disabled} onClick={() => setOpen(true)}><i className="ti ti-plus"/>{label}</button>;
  }
  return (
    <form className="tn-custom" onSubmit={e => { e.preventDefault(); if (text.trim()) { onAdd(text.trim()); setText(''); setOpen(false); } }}>
      <input className="tn-input" autoFocus maxLength={60} placeholder={placeholder} value={text} onChange={e => setText(e.target.value)}/>
      <button type="submit" className="wiw-ghost" disabled={!text.trim()}>Add</button>
    </form>
  );
}

function HaveScale({ value, onChange }) {
  const labels = ['None', 'A little', 'Some', 'A lot', 'Plenty'];
  return (
    <div className="tn-scale">
      {labels.map((l, i) => (
        <button key={l} type="button" className={'tn-scale-btn' + (value === i + 1 ? ' on' : '')} onClick={() => onChange(i + 1)}>
          <span className="tn-scale-dot">{i + 1}</span>{l}
        </button>
      ))}
    </div>
  );
}

const toggleIn = (arr = [], v) => arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];

function Flow({ onClose, onDone, initial }) {
  const [picked, setPicked]     = useState([]);   // [{id, emoji, label, looks, steps}]
  const [details, setDetails]   = useState({});   // id -> {looks[], why[], voice, have}
  const [extra, setExtra]       = useState({});   // id -> custom "looks" labels the user typed
  const [order, setOrder]       = useState([]);   // ids, most important first
  const [nextStep, setNextStep] = useState('');
  const [ownStep, setOwnStep]   = useState('');   // typed next step, if any
  const [result, setResult]     = useState(initial || null);
  const [saveState, setSaveState] = useState(initial ? 'saved' : 'idle'); // idle | saving | saved | error
  const [step, setStep]         = useState(initial ? -1 : 0); // -1 = result

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [onClose]);

  // Screens: pick → one "about" screen per want → rank (if 2+) → next step
  const screens = ['pick', ...picked.map(p => 'about:' + p.id), ...(picked.length > 1 ? ['rank'] : []), 'next'];
  const screen  = step >= 0 ? screens[step] : 'result';
  const go      = n => setStep(Math.max(0, Math.min(n, screens.length - 1)));

  function togglePick(opt) {
    setPicked(p => p.some(x => x.id === opt.id) ? p.filter(x => x.id !== opt.id) : p.length < MAX_PICKS ? [...p, opt] : p);
    setOrder([]);
  }

  function addCustomWant(label) {
    if (picked.length >= MAX_PICKS) return;
    setPicked(p => [...p, { id: 'custom-' + Date.now(), emoji: '✏️', label, looks: CUSTOM_LOOKS, steps: CUSTOM_STEPS }]);
    setOrder([]);
  }

  const d = id => details[id] || {};
  // `value` may be an updater fn so quick successive taps never read stale state.
  const setDetail = (id, field, value) => setDetails(all => ({
    ...all, [id]: { ...all[id], [field]: typeof value === 'function' ? value(all[id]?.[field]) : value },
  }));

  const ranked = picked.length > 1 ? order.map(id => picked.find(p => p.id === id)) : picked;
  const top    = ranked[0];

  function finish() {
    const items = ranked.map(p => ({
      id: p.id, emoji: p.emoji, label: p.label,
      looks: d(p.id).looks || [],
      why:   d(p.id).why || [],
      voice: d(p.id).voice || null,
      have:  d(p.id).have || null,
    }));
    const r = { version: 4, items, nextStep: nextStep || '' };
    setResult(r);
    setSaveState('saving');
    onDone(r)
      .then(() => setSaveState('saved'))
      .catch(e => { console.error('Could not save reflection:', e); setSaveState('error'); });
    setStep(-1);
  }

  function restart() {
    setPicked([]); setDetails({}); setExtra({}); setOrder([]); setNextStep(''); setOwnStep(''); setResult(null); setStep(0);
  }

  const aboutId   = screen.startsWith('about:') ? screen.slice(6) : null;
  const aboutItem = aboutId && picked.find(p => p.id === aboutId);
  const aboutIdx  = aboutItem ? picked.indexOf(aboutItem) : -1;

  return createPortal(
    <div className="wiw-overlay" role="dialog" aria-modal="true" aria-label="Clarity">
      <div className="wiw-top">
        {step > 0
          ? <button className="wiw-icon-btn" onClick={() => go(step - 1)} aria-label="Back"><i className="ti ti-arrow-left"/></button>
          : <span/>}
        {step >= 0 && (
          <div className="wiw-dots">
            {screens.map((_, i) => <span key={i} className={i < step ? 'on' : i === step ? 'now' : ''}/>)}
          </div>
        )}
        <button className="wiw-icon-btn" onClick={onClose} aria-label="Close"><i className="ti ti-x"/></button>
      </div>

      <div className="wiw-stage">
        {screen === 'pick' && (
          <div key="pick" className="wiw-body fade">
            <div className="wiw-count">Step 1 · What</div>
            <h2 className="wiw-q">What do you want?</h2>
            <p className="wiw-intro">
              Not what you <i>should</i> want. Not what looks good on LinkedIn. Tap up to {MAX_PICKS} things you actually want right now.
            </p>
            <div className="tn-chips">
              {OPTIONS.map(o => {
                const on = picked.some(p => p.id === o.id);
                return (
                  <button key={o.id} className={'tn-chip' + (on ? ' on' : '')} onClick={() => togglePick(o)}
                    disabled={!on && picked.length >= MAX_PICKS}>
                    <span>{o.emoji}</span>{o.label}
                  </button>
                );
              })}
              {picked.filter(p => p.id.startsWith('custom-')).map(p => (
                <button key={p.id} className="tn-chip on" onClick={() => togglePick(p)}><span>{p.emoji}</span>{p.label}</button>
              ))}
            </div>
            <WriteOwn label="Something else" placeholder="e.g. Learn to surf" disabled={picked.length >= MAX_PICKS} onAdd={addCustomWant}/>
            <div className="tn-footer">
              <span className="tn-hint">{picked.length} / {MAX_PICKS} picked</span>
              <button className="wiw-primary" disabled={!picked.length} onClick={() => go(1)}>Next <i className="ti ti-arrow-right"/></button>
            </div>
          </div>
        )}

        {aboutItem && (
          <div key={screen} className="wiw-body fade">
            <div className="wiw-count">Step 2 · More about it · {aboutIdx + 1} of {picked.length}</div>
            <h2 className="wiw-q tn-about-title"><span>{aboutItem.emoji}</span> {aboutItem.label}</h2>

            <label className="tn-label">{aboutItem.looksQ || 'What would it actually look like?'} <span className="tn-label-sub">Tap all that fit</span></label>
            <Chips options={[...aboutItem.looks, ...(extra[aboutId] || [])]} selected={d(aboutId).looks || []}
              onToggle={v => setDetail(aboutId, 'looks', arr => toggleIn(arr, v))}/>
            <WriteOwn onAdd={v => { setExtra(e => ({ ...e, [aboutId]: [...(e[aboutId] || []), v] })); setDetail(aboutId, 'looks', arr => [...(arr || []), v]); }}/>

            <label className="tn-label">Why do you want it? <span className="tn-label-sub">Tap all that fit</span></label>
            <Chips options={WHYS} selected={d(aboutId).why || []}
              onToggle={v => setDetail(aboutId, 'why', arr => toggleIn(arr, v))}/>

            <label className="tn-label">Whose voice is saying you want this?</label>
            <Chips options={VOICES.map(v => v.label)} selected={VOICES.filter(v => v.id === d(aboutId).voice).map(v => v.label)}
              onToggle={l => { const v = VOICES.find(x => x.label === l).id; setDetail(aboutId, 'voice', cur => cur === v ? null : v); }}/>

            <label className="tn-label">How much of it do you have right now?</label>
            <HaveScale value={d(aboutId).have} onChange={v => setDetail(aboutId, 'have', v)}/>

            <div className="tn-footer">
              <span className="tn-hint">Skip anything you're not sure about.</span>
              <button className="wiw-primary" onClick={() => go(step + 1)}>Next <i className="ti ti-arrow-right"/></button>
            </div>
          </div>
        )}

        {screen === 'rank' && (
          <div key="rank" className="wiw-body fade">
            <div className="wiw-count">Step 3 · Priorities</div>
            <h2 className="wiw-q">Now the hard part. What matters most?</h2>
            <p className="wiw-intro">Tap them in order, most important first. You can't chase everything at once — that's the point.</p>
            <div className="tn-rank-list">
              {picked.map(p => {
                const pos = order.indexOf(p.id);
                const have = d(p.id).have;
                return (
                  <button key={p.id} className={'tn-rank-item' + (pos >= 0 ? ' on' : '')} onClick={() => setOrder(o => toggleIn(o, p.id))}>
                    <span className="tn-rank-num">{pos >= 0 ? pos + 1 : ''}</span>
                    <span className="tn-rank-emoji">{p.emoji}</span>
                    <span className="tn-rank-label">{p.label}</span>
                    {have && <span className="tn-rank-have">have {have}/5</span>}
                  </button>
                );
              })}
            </div>
            <div className="tn-footer">
              {order.length > 0
                ? <button className="tn-link" onClick={() => setOrder([])}>Reset order</button>
                : <span className="tn-hint">Tap to number them.</span>}
              <button className="wiw-primary" disabled={order.length !== picked.length} onClick={() => go(step + 1)}>Next <i className="ti ti-arrow-right"/></button>
            </div>
          </div>
        )}

        {screen === 'next' && top && (
          <div key="next" className="wiw-body fade">
            <div className="wiw-count">Last step · One move</div>
            <h2 className="wiw-q">One small thing you'll do this week for <span className="tn-accent">{top.label.toLowerCase()}</span>:</h2>
            <p className="wiw-intro">Pick the one you'll actually do. Small is fine. Small is the point.</p>
            <div className="tn-rank-list">
              {[...top.steps, ...(ownStep ? [ownStep] : [])].map(s => (
                <button key={s} className={'tn-rank-item' + (nextStep === s ? ' on' : '')} onClick={() => setNextStep(nextStep === s ? '' : s)}>
                  <span className="tn-rank-num">{nextStep === s ? <i className="ti ti-check"/> : ''}</span>
                  <span className="tn-rank-label">{s}</span>
                </button>
              ))}
            </div>
            {!ownStep && <WriteOwn placeholder="This week I will…" onAdd={v => { setOwnStep(v); setNextStep(v); }}/>}
            <div className="tn-footer">
              <span className="tn-hint">{nextStep ? '' : 'Or skip it for now.'}</span>
              <button className="wiw-primary" onClick={finish}>Get my clarity <i className="ti ti-arrow-right"/></button>
            </div>
          </div>
        )}

        {screen === 'result' && result && (
          <div key="result" className="wiw-body wiw-result fade">
            <div className="wiw-count">Clarity · your choices, ranked by you</div>
            <h2 className="wiw-want">Here's what you want.</h2>

            <div className="tn-result-list">
              {result.items.map((it, i) => {
                const voice = VOICES.find(v => v.id === it.voice);
                const qs = nudges(it, i, result.items);
                return (
                  <div key={it.id} className={'tn-result-card' + (i === 0 ? ' first' : '')}>
                    <div className="tn-result-head">
                      <span className="tn-rank-num on">{i + 1}</span>
                      <span className="tn-rank-emoji">{it.emoji}</span>
                      <span className="tn-result-label">{it.label}</span>
                      {it.have && <span className="tn-rank-have">have {it.have}/5</span>}
                    </div>
                    {it.looks?.length > 0 && <p className="tn-result-text"><span>{OPTIONS.find(o => o.id === it.id)?.looksLabel || 'Looks like'}:</span> {it.looks.join(' · ')}</p>}
                    {it.why?.length > 0 && <p className="tn-result-text"><span>Because:</span> {it.why.map(w => w.toLowerCase()).join(' · ')}</p>}
                    {voice && <p className="tn-result-text"><span>Whose voice:</span> {voice.label}</p>}
                    {qs.map(q => <p key={q} className="tn-nudge"><i className="ti ti-help-circle"/>{q}</p>)}
                  </div>
                );
              })}
            </div>

            {result.nextStep && (
              <>
                <div className="wiw-moves-title">This week, you said you'll</div>
                <blockquote className="wiw-quote">{result.nextStep}</blockquote>
              </>
            )}

            <div className="wiw-actions">
              <button className="wiw-ghost" onClick={restart}><i className="ti ti-refresh"/>Start over</button>
            </div>
            <div className={'tn-save tn-save-' + saveState}>
              {saveState === 'saving' && <><i className="ti ti-loader-2" style={{ animation: 'spin 1s linear infinite' }}/>Saving to your account…</>}
              {saveState === 'saved'  && <><i className="ti ti-cloud-check"/>Saved to your account</>}
              {saveState === 'error'  && <><i className="ti ti-cloud-off"/>Couldn't save to your account — it's kept on this device for now.
                <button className="tn-link" onClick={() => { setSaveState('saving'); onDone(result).then(() => setSaveState('saved')).catch(() => setSaveState('error')); }}>Try again</button></>}
            </div>
            <div className="wiw-foot">Only you can see this. It's allowed to change — come back whenever it does.</div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

// Clarity mark: a sun rising over the horizon — things becoming clear.
export function ClarityMark({ size = 16 }) {
  const line = { fill: 'none', stroke: 'currentColor', strokeWidth: 2.1, strokeLinecap: 'round', strokeLinejoin: 'round' };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className="tn-mark">
      <path d="M3.5 18h17" {...line}/>
      <path d="M7 18a5 5 0 0 1 10 0" {...line}/>
      <g className="tn-rays">
        <path d="M12 5v2.6M5.3 8.7l1.8 1.8M18.7 8.7l-1.8 1.8M2.8 14h1.6M19.6 14h1.6" {...line}/>
      </g>
    </svg>
  );
}

// Toolbar button (variant "button") or the mobile prompt card (variant "card").
// Both open the reflection, or your saved one if you've done it.
function Clarity({ userId, variant = 'button' }) {
  const [saved, save] = useSavedResult(userId);
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(DISMISS_KEY) === '1'; } catch { return false; }
  });

  const flow = open && <Flow initial={saved} onClose={() => setOpen(false)} onDone={save}/>;

  if (variant === 'card') {
    if (saved || dismissed) return flow || null;
    return (
      <>
        <div className="tn-card" role="button" tabIndex={0} onClick={() => setOpen(true)}
          onKeyDown={e => { if (e.key === 'Enter') setOpen(true); }}>
          <span className="tn-card-mark"><ClarityMark size={24}/></span>
          <span className="tn-card-text">
            <b>Not sure what you want in life?</b>
            <span>2 minutes, tap-only, private to you.</span>
          </span>
          <span className="tn-card-go">Start</span>
          <button className="tn-card-x" aria-label="Dismiss"
            onClick={e => { e.stopPropagation(); setDismissed(true); try { localStorage.setItem(DISMISS_KEY, '1'); } catch {} }}>
            <i className="ti ti-x"/>
          </button>
        </div>
        {flow}
      </>
    );
  }

  return (
    <>
      <button className={'wiw-nav-btn' + (saved ? '' : ' fresh')} onClick={() => setOpen(true)}
        title={saved ? `Your #1: ${saved.items[0].label}` : 'Not sure what you want in life?'} aria-label="Clarity">
        <span className="wiw-nav-mark"><ClarityMark size={16}/></span>
        <span className="wiw-nav-label">Clarity</span>
        {!saved && <span className="wiw-nav-dot"/>}
      </button>
      {flow}
    </>
  );
}

export default Clarity;
