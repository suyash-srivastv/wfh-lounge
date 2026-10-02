import { useCallback, useEffect, useRef, useState } from 'react';
import { db, auth } from '../firebase';
import {
  collection, query, where, orderBy, limit, startAfter,
  onSnapshot, getDocs, getDoc, doc, getCountFromServer, documentId,
} from 'firebase/firestore';
import { avatarColors } from '../constants';

// Everything loads in pages of 20 and is filtered by city on the server,
// so the app no longer stops at 100 items or downloads the whole database.
const PAGE = 20;

const cityFilter = city => (city && city !== 'All cities' ? [where('city', 'in', [city, 'All'])] : []);

function toMember(d) {
  const data = d.data();
  const { bg, tc } = avatarColors(d.id);
  return {
    id: d.id, name: data.name || '', username: data.username || '',
    role: data.role || '', city: data.city || '',
    initials: data.initials || '??', ini: data.initials || '??',
    skills: data.skills || [], bio: data.bio || '',
    yearsExp: data.yearsExp ?? null, status: data.status || '',
    vibe: data.vibe || '', photoURL: data.photoURL || null, badges: data.badges || [],
    bg, tc, online: false,
    conn: Object.keys(data.connections || {}).length, events: 0,
  };
}

// Live list that grows a page at a time ("Load more").
// `extra` adds filters/ordering; by default newest first by `orderField`.
function useLivePages(user, coll, orderField, city, extra) {
  const [pages, setPages]     = useState(1);
  const [items, setItems]     = useState([]);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => { setPages(1); }, [city]);

  useEffect(() => {
    if (!user) { setItems([]); setHasMore(false); return; }
    const n = PAGE * pages;
    const order = extra ? extra() : [orderBy(orderField, 'desc')];
    const q = query(collection(db, coll), ...cityFilter(city), ...order, limit(n));
    return onSnapshot(q,
      snap => { setItems(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setHasMore(snap.size === n); },
      e => console.error(`Loading ${coll} failed:`, e));
  }, [user?.uid, coll, orderField, city, pages, extra ? extra().map(String).join() : '']);

  const loadMore = useCallback(() => setPages(p => p + 1), []);
  return { items, hasMore, loadMore };
}

// Members aren't live-synced (that got expensive as the community grew):
// they load a page at a time, once per visit, and refresh on city change.
function useMemberPages(user, city) {
  const [items, setItems]     = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const cursor = useRef(null);
  const gen    = useRef(0);   // ignore results from a previous city

  const fetchPage = useCallback(async reset => {
    if (!user || !auth.currentUser) return;   // e.g. mid-logout
    const myGen = reset ? ++gen.current : gen.current;
    setLoading(true);
    try {
      const filters = city && city !== 'All cities' ? [where('city', '==', city)] : [];
      const after   = !reset && cursor.current ? [startAfter(cursor.current)] : [];
      const snap = await getDocs(query(collection(db, 'users'), ...filters, orderBy('name'), ...after, limit(PAGE)));
      if (myGen !== gen.current) return;
      cursor.current = snap.docs[snap.docs.length - 1] || cursor.current;
      const page = snap.docs.map(toMember);
      setItems(prev => (reset ? page : [...prev, ...page]));
      setHasMore(snap.size === PAGE);
    } catch (e) {
      if (auth.currentUser) console.error('Loading members failed:', e);   // refusals mid-logout are expected
    } finally {
      if (myGen === gen.current) setLoading(false);
    }
  }, [user?.uid, city]);

  useEffect(() => { cursor.current = null; fetchPage(true); }, [fetchPage]);

  return { items, hasMore, loading, loadMore: () => fetchPage(false) };
}

export function useFirestoreListeners(user, city) {
  // What's on: soonest first, past events hidden. Dates are "YYYY-MM-DD"; "TBD"
  // sorts after every date, so undated events come last.
  const today   = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const events  = useLivePages(user, 'events', 'date', city, () => [where('date', '>=', today), orderBy('date', 'asc')]);
  const ideas   = useLivePages(user, 'ideas', 'votes', city);
  const threads = useLivePages(user, 'threads', 'createdAt', city);
  const members = useMemberPages(user, city);
  return { events, ideas, threads, members };
}

// One member's profile, fetched on demand (e.g. tapping a name in chat).
const profileCache = new Map();
export function useMemberProfile(user, uid) {
  const [member, setMember] = useState(() => (uid && profileCache.get(uid)) || null);
  useEffect(() => {
    if (!user || !uid) { setMember(null); return; }
    setMember(profileCache.get(uid) || null);
    let alive = true;
    getDoc(doc(db, 'users', uid))
      .then(snap => {
        if (!alive || !snap.exists()) return;
        const m = toMember(snap);
        profileCache.set(uid, m);
        setMember(m);
      })
      .catch(e => console.error('Loading profile failed:', e));
    return () => { alive = false; };
  }, [user?.uid, uid]);
  return member;
}

// A person's own forum posts, newest first — independent of the city filter.
export function useAuthorThreads(user, uid) {
  const [items, setItems] = useState([]);
  useEffect(() => {
    if (!user || !uid) { setItems([]); return; }
    const q = query(collection(db, 'threads'), where('authorId', '==', uid), orderBy('createdAt', 'desc'), limit(PAGE));
    return onSnapshot(q, snap => setItems(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      e => console.error('Loading posts failed:', e));
  }, [user?.uid, uid]);
  return items;
}

// Profile stats counted on the server (1 read per 1,000 matches), not by
// downloading everything.
export function useMyStats(user) {
  const [stats, setStats] = useState({ liked: 0, going: 0 });
  useEffect(() => {
    if (!user) return;
    Promise.all([
      getCountFromServer(query(collection(db, 'threads'), where(`likes.${user.uid}`, '==', true))),
      getCountFromServer(query(collection(db, 'events'),  where(`rsvps.${user.uid}`, '==', true))),
    ])
      .then(([liked, going]) => setStats({ liked: liked.data().count, going: going.data().count }))
      .catch(e => console.error('Loading stats failed:', e));
  }, [user?.uid]);
  return stats;
}

// Profiles for a list of ids (your friends, in any city) — 30 per query.
export function useProfiles(user, ids) {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(false);
  const key = [...ids].sort().join(',');
  useEffect(() => {
    if (!user || !key || !auth.currentUser) { setItems([]); return; }
    const list = key.split(',');
    const chunks = [];
    for (let i = 0; i < list.length; i += 30) chunks.push(list.slice(i, i + 30));
    let alive = true;
    setLoading(true);
    Promise.all(chunks.map(c => getDocs(query(collection(db, 'users'), where(documentId(), 'in', c)))))
      .then(snaps => { if (alive) setItems(snaps.flatMap(s => s.docs.map(toMember)).sort((a, b) => a.name.localeCompare(b.name))); })
      .catch(e => { if (auth.currentUser) console.error('Loading friends failed:', e); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [user?.uid, key]);
  return { items, loading };
}
