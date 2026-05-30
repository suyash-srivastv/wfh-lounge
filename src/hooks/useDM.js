import { useEffect, useRef, useState } from 'react';
import { db } from '../firebase';
import {
  collection, doc, addDoc, setDoc,
  query, orderBy, limit, onSnapshot,
  serverTimestamp, increment,
} from 'firebase/firestore';

export function useDM(user) {
  const [inbox,     setInbox]     = useState([]);   // [{ id: otherUid, name, photoURL, lastMsg, lastAt, unread }]
  const [activeDm,  setActiveDm]  = useState(null); // { uid, name, photoURL } | null
  const [dmMsgs,    setDmMsgs]    = useState([]);
  const [dmLoading, setDmLoading] = useState(false);
  const [dmInput,   setDmInput]   = useState('');
  const dmEnd = useRef(null);

  const roomId = (otherUid) => [user.uid, otherUid].sort().join('_');

  // Always-on inbox listener
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, 'userInbox', user.uid, 'dms'),
      orderBy('lastAt', 'desc'),
    );
    return onSnapshot(q, snap => {
      setInbox(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [user?.uid]);

  // Per-conversation message listener — only active DM
  useEffect(() => {
    if (!activeDm?.uid || !user?.uid) { setDmMsgs([]); return; }
    setDmLoading(true);
    const q = query(
      collection(db, 'dms', roomId(activeDm.uid), 'messages'),
      orderBy('timestamp'),
      limit(100),
    );
    return onSnapshot(q, snap => {
      setDmMsgs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setDmLoading(false);
    });
  }, [activeDm?.uid, user?.uid]);

  // Auto-scroll
  useEffect(() => {
    dmEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [dmMsgs]);

  async function openDm(uid, name, photoURL) {
    setActiveDm({ uid, name, photoURL: photoURL || null });
    setDmMsgs([]);
    if (user?.uid) {
      setDoc(doc(db, 'userInbox', user.uid, 'dms', uid), { unread: 0 }, { merge: true }).catch(() => {});
    }
  }

  function closeDm() { setActiveDm(null); setDmMsgs([]); }

  async function sendDm() {
    if (!dmInput.trim() || !activeDm?.uid || !user?.uid) return;
    if (!user?.connections?.[activeDm.uid]) return; // must be connected
    const text = dmInput.trim();
    setDmInput('');
    const rid     = roomId(activeDm.uid);
    const preview = text.length > 60 ? text.slice(0, 60) + '…' : text;
    const now     = serverTimestamp();

    await addDoc(collection(db, 'dms', rid, 'messages'), {
      text, senderId: user.uid, senderName: user.name, timestamp: now,
    });

    // Sender inbox — reset unread
    setDoc(doc(db, 'userInbox', user.uid, 'dms', activeDm.uid), {
      name: activeDm.name, photoURL: activeDm.photoURL || null,
      lastMsg: preview, lastAt: now, unread: 0,
    }, { merge: true }).catch(() => {});

    // Receiver inbox — increment unread
    setDoc(doc(db, 'userInbox', activeDm.uid, 'dms', user.uid), {
      name: user.name, photoURL: user.photoURL || null,
      lastMsg: preview, lastAt: now, unread: increment(1),
    }, { merge: true }).catch(() => {});
  }

  const totalUnread = inbox.reduce((s, d) => s + (d.unread || 0), 0);

  return {
    inbox, activeDm, openDm, closeDm,
    dmMsgs, dmLoading, dmInput, setDmInput, sendDm, dmEnd,
    totalUnread,
  };
}
