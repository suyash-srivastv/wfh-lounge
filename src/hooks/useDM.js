import { useEffect, useRef, useState } from 'react';
import { db } from '../firebase';
import {
  collection, doc, addDoc, setDoc,
  query, orderBy, limit, onSnapshot,
  serverTimestamp, increment,
} from 'firebase/firestore';
import { getDmKey, encryptMessage, decryptMessage } from '../crypto';

export function useDM(user) {
  const [inbox,     setInbox]     = useState([]);
  const [activeDm,  setActiveDm]  = useState(null);
  const [dmMsgs,    setDmMsgs]    = useState([]);
  const [dmLoading, setDmLoading] = useState(false);
  const [dmInput,   setDmInput]   = useState('');
  const dmEnd = useRef(null);

  const roomId = (uid) => [user.uid, uid].sort().join('_');

  // Always-on inbox listener
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(collection(db, 'userInbox', user.uid, 'dms'), orderBy('lastAt', 'desc'));
    return onSnapshot(q, snap => {
      setInbox(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [user?.uid]);

  // Active-conversation listener — decrypts each message after snapshot
  useEffect(() => {
    if (!activeDm?.uid || !user?.uid) { setDmMsgs([]); return; }
    setDmLoading(true);
    const q = query(
      collection(db, 'dms', roomId(activeDm.uid), 'messages'),
      orderBy('timestamp'),
      limit(100),
    );
    return onSnapshot(q, snap => {
      (async () => {
        const key  = await getDmKey(user.uid, activeDm.uid);
        const msgs = await Promise.all(snap.docs.map(async d => {
          const data = d.data();
          return { id: d.id, ...data, text: await decryptMessage(data.text, key) };
        }));
        setDmMsgs(msgs);
        setDmLoading(false);
      })();
    });
  }, [activeDm?.uid, user?.uid]);

  useEffect(() => {
    dmEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [dmMsgs]);

  async function openDm(uid, name, photoURL, justAccepted = false) {
    setActiveDm({ uid, name, photoURL: photoURL || null, justAccepted });
    setDmMsgs([]);
    if (user?.uid) {
      setDoc(doc(db, 'userInbox', user.uid, 'dms', uid), { unread: 0 }, { merge: true }).catch(() => {});
    }
  }

  function closeDm() { setActiveDm(null); setDmMsgs([]); }

  async function sendDm() {
    if (!dmInput.trim() || !activeDm?.uid || !user?.uid) return;
    const text = dmInput.trim();
    setDmInput('');

    const key           = await getDmKey(user.uid, activeDm.uid);
    const encryptedText = await encryptMessage(text, key);
    const now           = serverTimestamp();

    await addDoc(collection(db, 'dms', roomId(activeDm.uid), 'messages'), {
      text: encryptedText, senderId: user.uid, senderName: user.name, timestamp: now,
    });

    const inboxFields = { lastMsg: '🔒 Encrypted message', lastAt: now };

    setDoc(doc(db, 'userInbox', user.uid, 'dms', activeDm.uid), {
      name: activeDm.name, photoURL: activeDm.photoURL || null, ...inboxFields, unread: 0,
    }, { merge: true }).catch(() => {});

    setDoc(doc(db, 'userInbox', activeDm.uid, 'dms', user.uid), {
      name: user.name, photoURL: user.photoURL || null, ...inboxFields, unread: increment(1),
    }, { merge: true }).catch(() => {});
  }

  const totalUnread = inbox.reduce((s, d) => s + (d.unread || 0), 0);

  return {
    inbox, activeDm, openDm, closeDm,
    dmMsgs, dmLoading, dmInput, setDmInput, sendDm, dmEnd,
    totalUnread,
  };
}
