import { useEffect, useState } from 'react';
import { collection, doc, getCountFromServer, getDoc, query, where } from 'firebase/firestore';
import { db, auth } from './firebase';

// Three tags, shown next to a member's vibe:
//   👑 Dictator         — the admin only (set on their own profile; rules enforce it)
//   🐉 Celestial Dragon — earned: hosted 5+ events AND started 5+ forum posts
//   🕶️ CP0              — earned: hosted 2+ events OR started 5+ forum posts
// Earned tags are worked out from real events/posts (which can only be created
// under your own id), so they can't be faked. Only the highest one shows.
const NOT_A_PERSON = ['seed', 'stillroom-team'];

export const BADGES = {
  dictator:  { label: 'Dictator',         icon: '👑', how: 'Runs the place.' },
  celestial: { label: 'Celestial Dragon', icon: '🐉', how: 'Hosted 5 events and started 5 forum posts.' },
  cp0:       { label: 'CP0',              icon: '🕶️', how: 'Hosted 2 events or started 5 forum posts.' },
};

export function earnedBadge({ hosted, posts }) {
  if (hosted >= 5 && posts >= 5) return 'celestial';
  if (hosted >= 2 || posts >= 5) return 'cp0';
  return null;
}

// Counts per member, cached for the session (2 cheap count queries each).
const cache = new Map();
function activity(uid) {
  if (!cache.has(uid)) {
    const p = Promise.all([
      getCountFromServer(query(collection(db, 'events'),  where('hostId',   '==', uid))),
      getCountFromServer(query(collection(db, 'threads'), where('authorId', '==', uid))),
    ]).then(([e, t]) => ({ hosted: e.data().count, posts: t.data().count }))
      .catch(err => { cache.delete(uid); if (auth.currentUser) console.error('Loading activity failed:', err); return { hosted: 0, posts: 0 }; });
    cache.set(uid, p);
  }
  return cache.get(uid);
}

export function useActivity(uid) {
  const [a, setA] = useState(null);
  useEffect(() => {
    if (!uid || NOT_A_PERSON.includes(uid)) return;
    let alive = true;
    activity(uid).then(v => { if (alive) setA(v); });
    return () => { alive = false; };
  }, [uid]);
  return a;
}

// Whether a uid is the Dictator (one profile read per person, cached).
const dictators = new Map();
function isDictator(uid) {
  if (!dictators.has(uid)) {
    dictators.set(uid, getDoc(doc(db, 'users', uid))
      .then(s => !!s.data()?.badges?.includes('dictator'))
      .catch(() => { dictators.delete(uid); return false; }));
  }
  return dictators.get(uid);
}


// The tag for any uid — for places that only have an id (chat, events, forums).
export function useTagFor(uid) {
  const [id, setId] = useState(null);
  useEffect(() => {
    setId(null);
    if (!uid || NOT_A_PERSON.includes(uid)) return;
    let alive = true;
    isDictator(uid).then(d => d ? 'dictator' : activity(uid).then(earnedBadge)).then(v => { if (alive) setId(v); });
    return () => { alive = false; };
  }, [uid]);
  return id;
}

// Wraps a chat message / event card / forum post. No chip — just a glow in the
// colour of the person's tag (class "hl hl-dictator" etc.).
export function Highlight({ uid, as: Tag = 'div', className = '', children, ...rest }) {
  const id = useTagFor(uid);
  return <Tag className={className + (id ? ' hl hl-' + id : '')} {...rest}>{children}</Tag>;
}

export function useBadge(member) {
  const a = useActivity(member?.id || member?.uid);
  if (member?.badges?.includes('dictator')) return 'dictator';
  return a ? earnedBadge(a) : null;
}

export function Badge({ id }) {
  const b = BADGES[id];
  if (!b) return null;
  return <span className={'badge-chip badge-' + id} title={b.label + ' — ' + b.how}>{b.icon} {b.label}</span>;
}

// Tag + vibe on one row (renders nothing if there's neither).
export function ChipRow({ member, style }) {
  const id = useBadge(member);
  if (!id && !member?.vibe) return null;
  return (
    <div className="chip-row" style={style}>
      {id && <Badge id={id}/>}
      {member.vibe && <span className="vibe-chip">{member.vibe}</span>}
    </div>
  );
}

// Your own profile: your tag, plus how close you are to the next one.
export function MyBadge({ user }) {
  const a = useActivity(user?.uid);
  const id = user?.badges?.includes('dictator') ? 'dictator' : a ? earnedBadge(a) : null;
  if (!a && id !== 'dictator') return null;
  let next = null;
  if (id === null) {
    next = a.hosted >= 1 ? `Host ${2 - a.hosted} more event to become 🕶️ CP0`
      : `Host 2 events or start ${Math.max(5 - a.posts, 1)} more forum post${5 - a.posts === 1 ? '' : 's'} to become 🕶️ CP0`;
  } else if (id === 'cp0') {
    const h = Math.max(5 - a.hosted, 0), p = Math.max(5 - a.posts, 0);
    next = `${[h && `host ${h} more event${h === 1 ? '' : 's'}`, p && `start ${p} more post${p === 1 ? '' : 's'}`].filter(Boolean).join(' and ')} to become 🐉 Celestial Dragon`;
    next = next[0].toUpperCase() + next.slice(1);
  }
  return (
    <div className="my-badge">
      {id && <Badge id={id}/>}
      {next && <span className="my-badge-next">{next}</span>}
    </div>
  );
}
