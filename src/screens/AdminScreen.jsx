import React, { useEffect, useState } from 'react';
import {
  collection, doc, setDoc, deleteDoc, getDocs, query, orderBy, limit,
  getCountFromServer, writeBatch, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { timeAgo } from '../constants';
import { DEFAULT_FAQS } from '../aboutContent';
import { useAboutContent, AboutBody } from './AboutScreen';
import MsgDelete from '../components/MsgDelete';

// Admin panel — only rendered for the admin account, and every write here is
// also checked by the security rules (isAdmin), so it can't be used by anyone else.

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'about',    label: 'About page' },
  { id: 'faq',      label: 'FAQ' },
  { id: 'content',  label: 'Moderate' },
];

function Overview() {
  const [counts, setCounts] = useState(null);
  useEffect(() => {
    const names = ['users', 'events', 'threads', 'ideas'];
    Promise.all(names.map(n => getCountFromServer(collection(db, n)).then(s => s.data().count).catch(() => '—')))
      .then(v => setCounts(Object.fromEntries(names.map((n, i) => [n, v[i]]))));
  }, []);
  const label = { users: 'Members', events: 'Events', threads: 'Forum posts', ideas: 'Ideas' };
  return (
    <div className="admin-stats">
      {Object.keys(label).map(k => (
        <div key={k} className="admin-stat">
          <div className="admin-stat-val">{counts ? counts[k] : '…'}</div>
          <div className="admin-stat-label">{label[k]}</div>
        </div>
      ))}
    </div>
  );
}

function AboutEditor() {
  const { about } = useAboutContent();
  const [title, setTitle] = useState('');
  const [body, setBody]   = useState('');
  const [state, setState] = useState('idle'); // idle | saving | saved | error
  const [preview, setPreview] = useState(false);

  useEffect(() => { setTitle(about.title); setBody(about.body); }, [about]);

  async function save() {
    setState('saving');
    try { await setDoc(doc(db, 'site', 'about'), { title: title.trim(), body, updatedAt: serverTimestamp() }); setState('saved'); }
    catch (e) { console.error(e); setState('error'); }
  }

  return (
    <div className="admin-card">
      <label className="auth-label">Title</label>
      <input className="modal-input" maxLength={120} value={title} onChange={e => { setTitle(e.target.value); setState('idle'); }}/>
      <label className="auth-label">Story <span className="auth-opt">— blank line = new paragraph · "## " = heading · "- " = bullet</span></label>
      <textarea className="modal-input admin-textarea" rows={16} maxLength={8000} value={body}
        onChange={e => { setBody(e.target.value); setState('idle'); }}/>
      <div className="admin-row">
        <button className="btn-cancel" onClick={() => setPreview(p => !p)}>{preview ? 'Hide preview' : 'Preview'}</button>
        <span className="admin-note">
          {state === 'saving' && 'Saving…'}{state === 'saved' && '✓ Saved — live for everyone'}{state === 'error' && "Couldn't save"}
        </span>
        <button className="btn-primary" onClick={save} disabled={state === 'saving' || !title.trim()}>Save</button>
      </div>
      {preview && <div className="admin-preview about-body"><h1 className="about-title">{title}</h1><AboutBody body={body}/></div>}
    </div>
  );
}

function FaqEditor() {
  const { faqs, reload } = useAboutContent();
  const [editing, setEditing] = useState(null);   // id or 'new'
  const [q, setQ] = useState('');
  const [a, setA] = useState('');
  const [busy, setBusy] = useState(false);

  function startEdit(f) { setEditing(f ? f.id : 'new'); setQ(f?.q || ''); setA(f?.a || ''); }

  async function run(fn) { setBusy(true); try { await fn(); await reload(); } catch (e) { console.error(e); } finally { setBusy(false); } }

  const save = () => run(async () => {
    const order = editing === 'new' ? ((faqs?.at(-1)?.order ?? 0) + 1) : faqs.find(f => f.id === editing).order;
    const ref = editing === 'new' ? doc(collection(db, 'faqs')) : doc(db, 'faqs', editing);
    await setDoc(ref, { q: q.trim(), a: a.trim(), order });
    setEditing(null);
  });

  const move = (i, dir) => run(async () => {
    const x = faqs[i], y = faqs[i + dir];
    const b = writeBatch(db);
    b.update(doc(db, 'faqs', x.id), { order: y.order });
    b.update(doc(db, 'faqs', y.id), { order: x.order });
    await b.commit();
  });

  const addStarters = () => run(async () => {
    const b = writeBatch(db);
    DEFAULT_FAQS.forEach((f, i) => b.set(doc(collection(db, 'faqs')), { ...f, order: i + 1 }));
    await b.commit();
  });

  if (!faqs) return <div className="admin-card">Loading…</div>;

  const form = (
    <div className="admin-faq-form">
      <input className="modal-input" maxLength={200} placeholder="Question" value={q} onChange={e => setQ(e.target.value)}/>
      <textarea className="modal-input" rows={3} maxLength={2000} placeholder="Answer" value={a} onChange={e => setA(e.target.value)}/>
      <div className="admin-row">
        <button className="btn-cancel" onClick={() => setEditing(null)}>Cancel</button>
        <button className="btn-primary" onClick={save} disabled={busy || !q.trim() || !a.trim()}>Save</button>
      </div>
    </div>
  );

  return (
    <div className="admin-card">
      {faqs.length === 0 && editing !== 'new' && (
        <div className="admin-empty">
          No FAQs saved yet — the About page is showing the starter set.
          <button className="btn-primary" onClick={addStarters} disabled={busy}>Add the starter FAQs</button>
        </div>
      )}
      {faqs.map((f, i) => (
        <div key={f.id} className="admin-faq">
          {editing === f.id ? form : (
            <>
              <div className="admin-faq-text"><b>{f.q}</b><span>{f.a}</span></div>
              <div className="admin-faq-actions">
                <button className="admin-icon" onClick={() => move(i, -1)} disabled={busy || i === 0} aria-label="Move up"><i className="ti ti-arrow-up"/></button>
                <button className="admin-icon" onClick={() => move(i, 1)} disabled={busy || i === faqs.length - 1} aria-label="Move down"><i className="ti ti-arrow-down"/></button>
                <button className="admin-icon" onClick={() => startEdit(f)} aria-label="Edit"><i className="ti ti-pencil"/></button>
                <MsgDelete visible title="Delete question" onDelete={() => run(() => deleteDoc(doc(db, 'faqs', f.id)))}/>
              </div>
            </>
          )}
        </div>
      ))}
      {editing === 'new' ? form : <button className="btn-cancel admin-add" onClick={() => startEdit(null)}><i className="ti ti-plus"/>Add a question</button>}
    </div>
  );
}

function Moderate() {
  const [kind, setKind]   = useState('threads');
  const [items, setItems] = useState(null);
  const kinds = { threads: 'Forum posts', events: 'Events', ideas: 'Ideas' };

  useEffect(() => {
    setItems(null);
    getDocs(query(collection(db, kind), orderBy('createdAt', 'desc'), limit(30)))
      .then(s => setItems(s.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(e => { console.error(e); setItems([]); });
  }, [kind]);

  async function remove(id) {
    await deleteDoc(doc(db, kind, id));
    setItems(list => list.filter(x => x.id !== id));
  }

  return (
    <div className="admin-card">
      <div className="admin-kinds">
        {Object.entries(kinds).map(([k, l]) => (
          <button key={k} className={'modal-chip' + (kind === k ? ' active' : '')} onClick={() => setKind(k)}>{l}</button>
        ))}
      </div>
      <p className="admin-note">Newest 30 across all cities. Chat messages and replies can be deleted right where they appear.</p>
      {!items && <div className="admin-empty">Loading…</div>}
      {items?.length === 0 && <div className="admin-empty">Nothing here.</div>}
      {items?.map(x => (
        <div key={x.id} className="admin-item">
          <div className="admin-item-text">
            <b>{x.title}</b>
            <span>{x.author || x.host || '—'} · {x.city || 'All'} · {timeAgo(x.createdAt?.toDate())}</span>
          </div>
          <MsgDelete visible title="Delete" onDelete={() => remove(x.id)}/>
        </div>
      ))}
    </div>
  );
}

function AdminScreen({ onBack }) {
  const [tab, setTab] = useState('overview');
  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Admin</div><div className="page-sub">Only you can see this.</div></div>
        <button className="btn-cancel" onClick={onBack}>Close</button>
      </div>
      <div className="admin-tabs">
        {TABS.map(t => <button key={t.id} className={'nav-tab' + (tab === t.id ? ' active' : '')} onClick={() => setTab(t.id)}>{t.label}</button>)}
      </div>
      {tab === 'overview' && <Overview/>}
      {tab === 'about'    && <AboutEditor/>}
      {tab === 'faq'      && <FaqEditor/>}
      {tab === 'content'  && <Moderate/>}
    </div>
  );
}

export default AdminScreen;
