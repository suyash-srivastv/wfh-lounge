import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

// Sends an in-app notification to another member. The id is fixed per action
// (the rules check it), so repeating an action never notifies twice.
const NOT_A_PERSON = new Set(['seed', 'stillroom-team']);

export function notify(me, toUid, type, { refId, replyId, title } = {}) {
  if (!toUid || toUid === me.uid || NOT_A_PERSON.has(toUid)) return;
  const id = {
    friend_request:   `req_${me.uid}`,
    request_accepted: `acc_${me.uid}`,
    reply:            `reply_${replyId}`,
    event_rsvp:       `rsvp_${refId}_${me.uid}`,
  }[type];
  const data = { type, fromUid: me.uid, fromName: me.name, read: false, createdAt: serverTimestamp() };
  if (refId) data.refId = refId;
  if (replyId) data.replyId = replyId;
  if (title) data.title = String(title).slice(0, 120);
  // Best effort: a repeat (already notified) is refused by the rules — that's fine.
  setDoc(doc(db, 'notifications', toUid, 'items', id), data).catch(() => {});
}
