import { doc, collection, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

// The security rules require every new message or post to be written together
// with rate/{uid} (slow mode: one post every 2 seconds). These helpers do that.

export function addWithRate(uid, collectionPath, data, extra) {
  const ref = doc(collection(db, ...collectionPath));
  const batch = writeBatch(db);
  batch.set(ref, data);
  batch.set(doc(db, 'rate', uid), { last: serverTimestamp() });
  extra?.(batch, ref);
  return batch.commit().then(() => ref);
}

// Friendly message for a refused write (slow mode, size limit, blocked, …).
export function writeErrorMessage(e) {
  if (e?.code === 'permission-denied') return "Couldn't send — wait a moment and try again.";
  return 'Something went wrong. Try again.';
}
