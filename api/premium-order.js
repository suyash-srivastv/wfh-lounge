// POST /api/premium-order — starts a ₹500 Razorpay order for the signed-in user.
import { caller, razorpay, PRICE_PAISE } from './_lib/premium.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const user = await caller(req);
  if (!user) return res.status(401).json({ error: 'Please sign in again.' });

  const order = await razorpay('orders', {
    amount: PRICE_PAISE,
    currency: 'INR',
    receipt: `premium_${user.uid}_${Date.now()}`.slice(0, 40),
    notes: { uid: user.uid, product: 'premium_30d' },
  });
  res.json({ orderId: order.id, amount: order.amount, keyId: process.env.RAZORPAY_KEY_ID });
}
