// Premium: ₹500 buys 30 days. Payments go through Razorpay; only this server
// code can set users/{uid}.premiumUntil (the rules block clients from it).
import crypto from 'node:crypto';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { db } from './firestore.js';

export const PRICE_PAISE = 50000; // ₹500
export const DAYS = 30;

const keyId = () => process.env.RAZORPAY_KEY_ID;
const keySecret = () => process.env.RAZORPAY_KEY_SECRET;

export async function razorpay(path, body) {
  const res = await fetch(`https://api.razorpay.com/v1/${path}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${keyId()}:${keySecret()}`).toString('base64'),
      ...(body && { 'Content-Type': 'application/json' }),
    },
    body: body && JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Razorpay ${path}: ${data.error?.description || res.status}`);
  return data;
}

// The signed-in user making the request, from their Firebase ID token.
export async function caller(req) {
  const token = /^Bearer (.+)$/.exec(req.headers.authorization || '')?.[1];
  if (!token) return null;
  db(); // initialises the admin app
  try { return await getAuth().verifyIdToken(token); } catch { return null; }
}

const safeEqual = (a, b) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
const hmac = (secret, data) => crypto.createHmac('sha256', secret).update(data).digest('hex');

export const checkoutSignatureOk = (orderId, paymentId, signature) =>
  safeEqual(hmac(keySecret(), `${orderId}|${paymentId}`), String(signature || ''));

export const webhookSignatureOk = (rawBody, signature) =>
  safeEqual(hmac(process.env.RAZORPAY_WEBHOOK_SECRET || '', rawBody), String(signature || ''));

// Adds 30 days for one captured payment. Safe to call twice for the same
// payment (checkout callback and webhook both do): payments/{id} records it once.
export async function grant({ uid, paymentId, orderId, amount }) {
  const fs = db();
  const userRef = fs.doc(`users/${uid}`);
  const payRef = fs.doc(`payments/${paymentId}`);
  return fs.runTransaction(async tx => {
    const [pay, user] = await Promise.all([tx.get(payRef), tx.get(userRef)]);
    const current = user.get('premiumUntil')?.toMillis?.() || 0;
    if (pay.exists) return new Date(current);
    const until = new Date(Math.max(current, Date.now()) + DAYS * 86400e3);
    tx.set(payRef, { uid, orderId, amount, at: FieldValue.serverTimestamp() });
    tx.set(userRef, { premiumUntil: Timestamp.fromDate(until) }, { merge: true });
    return until;
  });
}
