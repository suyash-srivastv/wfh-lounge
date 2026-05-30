import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { avatarColors } from '../constants';

export function useFirestoreListeners(user) {
  const [events,  setEvents]  = useState([]);
  const [members, setMembers] = useState([]);
  const [ideas,   setIdeas]   = useState([]);
  const [threads, setThreads] = useState([]);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(
      query(collection(db, 'users'), limit(100)),
      snap => setMembers(snap.docs.map(d => {
        const data = d.data();
        const { bg, tc } = avatarColors(d.id);
        return {
          id: d.id, name: data.name || '', username: data.username || '',
          role: data.role || '', city: data.city || '',
          initials: data.initials || '??', ini: data.initials || '??',
          skills: data.skills || [], bio: data.bio || '',
          yearsExp: data.yearsExp ?? null, status: data.status || '',
          vibe: data.vibe || '', photoURL: data.photoURL || null,
          bg, tc, online: false,
          conn: Object.keys(data.connections || {}).length, events: 0,
        };
      }))
    );
  }, [user?.uid]);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(
      query(collection(db, 'events'), orderBy('createdAt', 'desc'), limit(100)),
      snap => setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }, [user?.uid]);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(
      query(collection(db, 'ideas'), orderBy('votes', 'desc'), limit(100)),
      snap => setIdeas(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }, [user?.uid]);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(
      query(collection(db, 'threads'), orderBy('createdAt', 'desc'), limit(100)),
      snap => setThreads(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }, [user?.uid]);

  return { events, members, ideas, threads };
}
