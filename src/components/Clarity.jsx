import React, { useState, useEffect } from 'react';
import { track } from '../analytics';
import { createPortal } from 'react-dom';
import { db } from '../firebase';
import { doc, getDoc, collection, writeBatch, serverTimestamp } from 'firebase/firestore';

// Clarity: decide what you want, put it in priority order, then act on it.
//   1. What do you want? (up to 3)
//   2. Priority order (tap #1, #2, #3)
//   3. Choose a first action for #1
// The result is a plan — one action per priority, with a timeframe and a
// "Done" tick that is saved. The app never decides for the user.

const OPTIONS = [
  { id: 'money',   label: 'Money & security', actions: [
    'Work out how many months I could live without a salary',
    'Set up an automatic saving on payday',
    'Ask for the salary conversation',
  ] },
  { id: 'people',  label: 'Real friends', actions: [
    'Message one person I miss',
    'Go to one Stillroom event',
    'Say yes to the next plan I\'m invited to',
  ] },
  { id: 'peace',   label: 'Peace of mind', actions: [
    'Mute work apps after 7pm for five days',
    'Keep one evening completely free',
    'Take a walk without my phone',
  ] },
  { id: 'health',  label: 'Better health', actions: [
    'Walk 20 minutes, three times a week',
    'Fix my desk and chair setup',
    'Keep my phone out of the bedroom',
  ] },
  { id: 'family',  label: 'Time with family', actions: [
    'Plan one meal together, phones away',
    'Call home twice a week',
    'Book a visit home',
  ] },
  { id: 'career',  label: 'A different career', actions: [
    'Talk to one person doing the work I\'m curious about',
    'List three careers I\'d try if nobody judged me',
    'Spend 30 minutes trying it',
  ] },
  { id: 'growth',  label: 'Growth & recognition', actions: [
    'Ask my manager what the next level needs',
    'Write down three wins from this quarter',
    'Spend 20 minutes on one skill',
  ] },
  { id: 'freedom', label: 'Freedom & adventure', actions: [
    'Block one hour nobody else can book',
    'Plan a trip and put a date on it',
    'Take a real day off',
  ] },
];
const CUSTOM_ACTIONS = ['Spend 30 minutes on it', 'Put a date for it in my calendar', 'Tell one person I want it'];

const WHEN = ['This week', 'This month', 'Later'];
const NONE = '__none';  // "Nothing for now" on the first-action screen
const MAX_PICKS = 3;

const isValid = r => !!(r && r.version === 6 && Array.isArray(r.plan) && r.plan.length);

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

  // Latest plan lives at reflections/{uid}. A new plan is also kept in
  // reflections/{uid}/history; ticking "Done" only updates the latest one.
  async function save(result, { newRun = true } = {}) {
    setSaved(result);
    window.dispatchEvent(new CustomEvent(SAVED_EVENT, { detail: result }));
    try { localStorage.setItem(LS_KEY(uid), JSON.stringify(result)); } catch {}
    const batch = writeBatch(db);
    batch.set(doc(db, 'reflections', uid), { ...result, updatedAt: serverTimestamp() });
    if (newRun) batch.set(doc(collection(db, 'reflections', uid, 'history')), { ...result, createdAt: serverTimestamp() });
    await batch.commit();
  }

  return [saved, save];
}

// "+ Something else" link that opens a one-line input. Optional by design.
function WriteOwn({ onAdd, disabled, label = 'Something else', placeholder = 'Type it here…' }) {
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

// One option per line; `badge` (e.g. a priority number) replaces the check mark.
function Rows({ options, isOn, onTap, isDisabled = () => false, badge }) {
  return (
    <div className="tn-list" role="group">
      {options.map(o => {
        const on = isOn(o);
        const b = badge?.(o);
        return (
          <button key={o.id} className={'tn-row' + (on ? ' on' : '')} onClick={() => onTap(o)}
            disabled={!on && isDisabled(o)} aria-pressed={on}>
            <span>{o.label}</span>
            <span className="tn-row-check" aria-hidden="true">{b ?? (on && <i className="ti ti-check"/>)}</span>
          </button>
        );
      })}
    </div>
  );
}

const toggleIn = (arr, v) => arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];

function Flow({ onClose, onDone, initial }) {
  const [picked, setPicked]   = useState([]);  // [{id, label, actions}]
  const [order, setOrder]     = useState([]);  // ids, most important first
  const [action, setAction]   = useState('');  // chosen first action for #1
  const [result, setResult]   = useState(initial || null);
  const [saveState, setSaveState] = useState(initial ? 'saved' : 'idle'); // idle | saving | saved | error
  const [step, setStep]       = useState(initial ? -1 : 0); // -1 = plan

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [onClose]);

  // Screens: intro → pick → priority (if 2+) → first action
  const screens = ['intro', 'pick', ...(picked.length > 1 ? ['order'] : []), 'action'];
  const screen  = step >= 0 ? screens[step] : 'plan';
  const ranked  = picked.length > 1 ? order.map(id => picked.find(p => p.id === id)).filter(Boolean) : picked;
  const top     = ranked[0];

  function togglePick(o) {
    setPicked(p => p.some(x => x.id === o.id) ? p.filter(x => x.id !== o.id) : p.length < MAX_PICKS ? [...p, o] : p);
    setOrder([]); setAction('');
  }

  function persist(r, opts) {
    setResult(r);
    setSaveState('saving');
    onDone(r, opts).then(() => setSaveState('saved')).catch(e => { console.error('Could not save plan:', e); setSaveState('error'); });
  }

  function finish(firstAction) {
    const plan = ranked.map((p, i) => ({
      id: p.id, label: p.label, when: WHEN[i],
      action: i === 0 ? (firstAction === NONE ? '' : firstAction) : p.actions[0],
      done: false,
    }));
    persist({ version: 6, plan });
    track('clarity_plan_created', { priorities: plan.length, top: plan[0].id.startsWith('custom-') ? 'custom' : plan[0].id, has_action: !!plan[0].action });
    setStep(-1);
  }

  function chooseAction(a) {
    setAction(a);
    setTimeout(() => finish(a), 260);
  }

  function toggleDone(i) {
    const plan = result.plan.map((x, j) => j === i ? { ...x, done: !x.done } : x);
    persist({ ...result, plan }, { newRun: false });
  }

  function restart() { setPicked([]); setOrder([]); setAction(''); setResult(null); setStep(1); }

  const total = picked.length ? screens.length - 1 : 3;

  return createPortal(
    <div className="wiw-overlay tn-focus" role="dialog" aria-modal="true" aria-label="Clarity">
      <div className="wiw-top">
        {step > 0
          ? <button className="wiw-icon-btn" onClick={() => setStep(step - 1)} aria-label="Back"><i className="ti ti-arrow-left"/></button>
          : <span/>}
        {step > 0 && (
          <div className="tn-progress" aria-hidden="true"><span style={{ width: `${(step / total) * 100}%` }}/></div>
        )}
        <button className="wiw-icon-btn" onClick={onClose} aria-label="Close"><i className="ti ti-x"/></button>
      </div>

      <div className="wiw-stage">
        {screen === 'intro' && (
          <div key="intro" className="wiw-body fade tn-intro">
            <div className="wiw-count">Clarity</div>
            <h2 className="wiw-q">Take a moment.</h2>
            <p className="wiw-intro">
              Decide what you want, what comes first, and one thing to do about it. No right answers — only you will see it.
            </p>
            <button className="wiw-primary" onClick={() => setStep(1)}>Begin</button>
          </div>
        )}

        {screen === 'pick' && (
          <div key="pick" className="wiw-body fade">
            <div className="wiw-count">1 · What you want</div>
            <h2 className="wiw-q">What do you want right now?</h2>
            <p className="wiw-intro">Choose up to {MAX_PICKS}.</p>
            <Rows options={[...OPTIONS, ...picked.filter(p => p.id.startsWith('custom-'))]}
              isOn={o => picked.some(p => p.id === o.id)} onTap={togglePick}
              isDisabled={() => picked.length >= MAX_PICKS}/>
            <WriteOwn placeholder="e.g. Learn to paint" disabled={picked.length >= MAX_PICKS}
              onAdd={label => togglePick({ id: 'custom-' + Date.now(), label, actions: CUSTOM_ACTIONS })}/>
            <div className="tn-footer">
              <span className="tn-hint">{picked.length} of {MAX_PICKS}</span>
              <button className="wiw-primary" disabled={!picked.length} onClick={() => setStep(2)}>Next <i className="ti ti-arrow-right"/></button>
            </div>
          </div>
        )}

        {screen === 'order' && (
          <div key="order" className="wiw-body fade">
            <div className="wiw-count">2 · Priority</div>
            <h2 className="wiw-q">What comes first?</h2>
            <p className="wiw-intro">Tap them in order of priority.</p>
            <Rows options={picked} isOn={o => order.includes(o.id)} onTap={o => setOrder(ord => toggleIn(ord, o.id))}
              badge={o => order.includes(o.id) ? order.indexOf(o.id) + 1 : null}/>
            <div className="tn-footer">
              {order.length
                ? <button className="tn-link" onClick={() => setOrder([])}>Reset</button>
                : <span className="tn-hint">#1 is where you'll start.</span>}
              <button className="wiw-primary" disabled={order.length !== picked.length} onClick={() => setStep(step + 1)}>Next <i className="ti ti-arrow-right"/></button>
            </div>
          </div>
        )}

        {screen === 'action' && top && (
          <div key="action" className="wiw-body fade">
            <div className="wiw-count">{picked.length > 1 ? '3' : '2'} · First action</div>
            <h2 className="wiw-q">For {top.label.toLowerCase()}, what will you do this week?</h2>
            <p className="wiw-intro">Choose one. Small is fine.</p>
            <Rows options={[...top.actions.map(a => ({ id: a, label: a })), { id: NONE, label: 'Nothing for now' }]}
              isOn={o => action === o.id} onTap={o => chooseAction(o.id)}/>
            <WriteOwn label="My own action" placeholder="This week I will…" onAdd={chooseAction}/>
          </div>
        )}

        {screen === 'plan' && result && (
          <div key="plan" className="wiw-body wiw-result fade">
            <div className="wiw-count">Your plan</div>
            <h2 className="wiw-want">{result.plan[0].label}, first.</h2>

            <div className="tn-plan">
              {result.plan.map((x, i) => (
                <div key={x.id} className={'tn-plan-row' + (x.done ? ' done' : '') + (i === 0 ? ' first' : '')}>
                  <span className="tn-plan-num">{i + 1}</span>
                  <div className="tn-plan-body">
                    <div className="tn-plan-head"><span>{x.label}</span><span className="tn-plan-when">{x.when}</span></div>
                    <div className={'tn-plan-action' + (x.action ? '' : ' none')}>{x.action || "No action yet — and that's okay."}</div>
                  </div>
                  {x.action && (
                    <button className="tn-plan-done" onClick={() => toggleDone(i)} aria-pressed={x.done}
                      aria-label={x.done ? 'Mark as not done' : 'Mark as done'}>
                      {x.done ? <i className="ti ti-check"/> : 'Done'}
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="wiw-actions">
              <button className="wiw-ghost" onClick={restart}><i className="ti ti-refresh"/>New plan</button>
            </div>
            <div className={'tn-save tn-save-' + saveState}>
              {saveState === 'saving' && <><i className="ti ti-loader-2" style={{ animation: 'spin 1s linear infinite' }}/>Saving…</>}
              {saveState === 'saved'  && <><i className="ti ti-cloud-check"/>Saved privately</>}
              {saveState === 'error'  && <><i className="ti ti-cloud-off"/>Couldn't save — kept on this device for now.
                <button className="tn-link" onClick={() => persist(result, { newRun: false })}>Try again</button></>}
            </div>
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
            <span>1 minute, tap-only, private to you.</span>
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
        title={saved ? `Your #1: ${saved.plan[0].label}` : 'Not sure what you want in life?'} aria-label="Clarity">
        <span className="wiw-nav-mark"><ClarityMark size={16}/></span>
        <span className="wiw-nav-label">Clarity</span>
        {!saved && <span className="wiw-nav-dot"/>}
      </button>
      {flow}
    </>
  );
}

export default Clarity;
