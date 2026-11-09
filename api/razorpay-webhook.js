// POST /api/razorpay-webhook — Razorpay's server tells us a payment was
// captured. Backup for when the app closes before /api/premium-verify runs.
import { webhookSignatureOk, grant, razorpay, PRICE_PAISE } from './_lib/premium.js';

async function rawBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return Buffer.concat(chunks).toString('utf8');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const body = await rawBody(req);
  if (!webhookSignatureOk(body, req.headers['x-razorpay-signature'])) return res.status(400).end();

  const event = JSON.parse(body);
  const p = event.payload?.payment?.entity;
  if (event.event === 'payment.captured' && p?.order_id && p.amount === PRICE_PAISE) {
    // Trust the uid we put on the order ourselves, not anything set in the browser.
    const order = await razorpay(`orders/${p.order_id}`);
    if (order.notes?.product === 'premium_30d' && order.notes.uid) {
      await grant({ uid: order.notes.uid, paymentId: p.id, orderId: p.order_id, amount: p.amount });
    }
  }
  res.status(200).json({ ok: true });
}
