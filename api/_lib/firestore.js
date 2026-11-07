// Server-side Firestore for the Vercel functions in /api. Uses a service
// account (FIREBASE_SERVICE_ACCOUNT env var, the JSON key as one string), so
// the security rules can stay members-only — these functions only ever
// expose events their host marked public.
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export function db() {
  if (!getApps().length) initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
  return getFirestore();
}

// Event dates are typed by hosts in India, so "today" is today in IST.
export const todayIST = () => new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);

export const SITE = 'https://thestillroom.site';
