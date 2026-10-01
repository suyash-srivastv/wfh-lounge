import React, { useMemo, useState } from 'react';

// Conversation starters — honest, specific questions that real people answer.
// "{city}" is swapped for the city you're browsing.
export const STARTERS = [
  "What's one thing you wish someone told you in your first job?",
  'How do you actually switch off after work?',
  'Anyone else feel lonely in a full office?',
  "Best place in {city} to work from that isn't a chain café?",
  'How did you make real friends after college?',
  'Switched careers? Was it worth it — honestly?',
  'How do you ask for a raise without sounding desperate?',
  'Anyone up for a weekend walk or coffee in {city}?',
  'How are you handling layoff anxiety right now?',
  "What's your unpopular opinion about hustle culture?",
  'What does a good weekday evening look like for you?',
  "What's a side project you keep meaning to start?",
  'How do you say no at work without the guilt?',
  'Recommend one thing in {city} most people miss.',
];

export const pick = (list, n) => [...list].sort(() => Math.random() - 0.5).slice(0, n);

function NewPostModal({ open, onClose, newPost, setNewPost, submitPost, city }) {
  const [seed, setSeed] = useState(0);
  const place = city && city !== 'All cities' ? city : 'your city';
  const starters = useMemo(() => pick(STARTERS, 4).map(s => s.replace('{city}', place)), [seed, place, open]);

  if (!open) return null;
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">Ask the room</div>
        <p className="np-sub">Real questions get real answers. Skip the humblebrag.</p>

        <div className="np-starters-head">
          <span>Need a starter?</span>
          <button type="button" className="np-shuffle" onClick={() => setSeed(n => n + 1)} aria-label="More ideas"><i className="ti ti-arrows-shuffle"/>More ideas</button>
        </div>
        <div className="np-starters">
          {starters.map(s => (
            <button key={s} type="button" className={'np-starter' + (newPost.title === s ? ' on' : '')}
              onClick={() => setNewPost(p => ({ ...p, title: s }))}>{s}</button>
          ))}
        </div>

        <input className="modal-input" maxLength={120} placeholder="Your question, in one line"
          value={newPost.title} onChange={e => setNewPost(p => ({ ...p, title: e.target.value }))}/>
        <textarea className="modal-input" maxLength={5000} rows={4} style={{ resize: 'vertical' }}
          placeholder="Add some context (optional) — what's going on, what you've tried, what kind of answers would help."
          value={newPost.body} onChange={e => setNewPost(p => ({ ...p, body: e.target.value }))}/>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={submitPost} disabled={!newPost.title.trim()}>Post question</button>
        </div>
      </div>
    </div>
  );
}

export default NewPostModal;
