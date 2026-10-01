import React, { useEffect, useState } from 'react';
import { collection, doc, getDoc, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';
import { DEFAULT_ABOUT, DEFAULT_FAQS } from '../aboutContent';

// Loads the admin-edited About text and FAQ, falling back to the defaults.
export function useAboutContent() {
  const [about, setAbout] = useState(DEFAULT_ABOUT);
  const [faqs, setFaqs]   = useState(null);   // null = loading

  async function reload() {
    try {
      const snap = await getDoc(doc(db, 'site', 'about'));
      setAbout(snap.exists() ? { ...DEFAULT_ABOUT, ...snap.data() } : DEFAULT_ABOUT);
    } catch { setAbout(DEFAULT_ABOUT); }
    try {
      const fs = await getDocs(query(collection(db, 'faqs'), orderBy('order')));
      setFaqs(fs.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch { setFaqs([]); }
  }

  useEffect(() => { reload(); }, []);
  return { about, faqs, reload };
}

// Plain-text body → paragraphs, "## " headings and "- " bullet lists.
// Rendered as text (never HTML), so nothing typed here can run as code.
export function AboutBody({ body }) {
  const blocks = (body || '').split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);
  return blocks.map((b, i) => {
    const lines = b.split('\n');
    return (
      <React.Fragment key={i}>
        {lines[0].startsWith('## ') && <h3 className="about-h">{lines[0].slice(3)}</h3>}
        {(() => {
          const rest = lines[0].startsWith('## ') ? lines.slice(1) : lines;
          if (!rest.length) return null;
          if (rest.every(l => l.startsWith('- '))) {
            return <ul className="about-list">{rest.map((l, j) => <li key={j}>{l.slice(2)}</li>)}</ul>;
          }
          return <p className="about-p">{rest.join(' ')}</p>;
        })()}
      </React.Fragment>
    );
  });
}

function AboutScreen({ onBack }) {
  const { about, faqs } = useAboutContent();
  const [open, setOpen] = useState(null);
  const list = faqs && faqs.length ? faqs : DEFAULT_FAQS.map((f, i) => ({ id: 'd' + i, ...f }));

  return (
    <div className="about">
      {onBack && <button className="about-back" onClick={onBack}><i className="ti ti-arrow-left"/>Back</button>}

      <div className="about-hero">
        <div className="about-kicker">About The Stillroom</div>
        <h1 className="about-title">{about.title}</h1>
      </div>

      <div className="about-body"><AboutBody body={about.body}/></div>

      <h2 className="about-faq-title">Questions</h2>
      <div className="about-faq">
        {list.map(f => (
          <div key={f.id} className={'faq-item' + (open === f.id ? ' open' : '')}>
            <button className="faq-q" onClick={() => setOpen(open === f.id ? null : f.id)} aria-expanded={open === f.id}>
              <span>{f.q}</span><i className={'ti ' + (open === f.id ? 'ti-minus' : 'ti-plus')}/>
            </button>
            {open === f.id && <div className="faq-a">{f.a}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default AboutScreen;
