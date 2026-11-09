// POST /api/premium-verify — called by the app right after Razorpay checkout
// succeeds. Checks the signature and that the order belongs to this user,
// then adds 30 days of Premium.
import { caller, razorpay, checkoutSignatureOk, grant, PRICE_PAISE } from './_lib/premium.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const user = await caller(req);
  if (!user) return res.status(401).json({ error: 'Please sign in again.' });

  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body || {};
  if (!orderId || !paymentId || !checkoutSignatureOk(orderId, paymentId, signature)) {
    return res.status(400).json({ error: 'Payment could not be verified.' });
  }
  const order = await razorpay(`orders/${orderId}`);
  if (order.notes?.uid !== user.uid || order.amount !== PRICE_PAISE) {
    return res.status(400).json({ error: 'Payment could not be verified.' });
  }
  const until = await grant({ uid: user.uid, paymentId, orderId, amount: order.amount });
  res.json({ premiumUntil: until.toISOString() });
}
