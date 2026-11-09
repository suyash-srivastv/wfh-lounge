// Premium membership: ₹500 for 30 days, paid with Razorpay. The server
// (api/premium-*.js) checks the payment and sets premiumUntil; this file
// only reads it and opens the checkout.
import { auth } from './firebase';
import { track } from './analytics';

export const PREMIUM_PRICE = 500;
export const PREMIUM_DAYS = 30;

const ms = t => (t?.toMillis ? t.toMillis() : t instanceof Date ? t.getTime() : 0);
export const isPremium = (u) => ms(u?.premiumUntil) > Date.now();
export const premiumEnds = (u) => (isPremium(u) ? new Date(ms(u.premiumUntil)) : null);

let script;
function loadCheckout() {
  script ||= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = resolve;
    s.onerror = () => { script = null; reject(new Error('Could not load the payment window. Check your connection and try again.')); };
    document.body.appendChild(s);
  });
  return script;
}

async function api(path, body) {
  const token = await auth.currentUser.getIdToken();
  const res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body || {}) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
  return data;
}

// Opens Razorpay checkout. Resolves with the new end date once paid,
// or null if the user closes the window.
export async function buyPremium(user) {
  await loadCheckout();
  const order = await api('/api/premium-order');
  track('begin_checkout', { value: PREMIUM_PRICE, currency: 'INR' });
  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: order.keyId,
      order_id: order.orderId,
      amount: order.amount,
      currency: 'INR',
      name: 'The Stillroom',
      description: `Premium · ${PREMIUM_DAYS} days`,
      prefill: { name: user.name || '', email: auth.currentUser?.email || '' },
      theme: { color: '#8B5CF6' },
      handler: async (resp) => {
        try {
          const { premiumUntil } = await api('/api/premium-verify', resp);
          track('purchase', { value: PREMIUM_PRICE, currency: 'INR', transaction_id: resp.razorpay_payment_id });
          resolve(new Date(premiumUntil));
        } catch (e) { reject(e); }
      },
      modal: { ondismiss: () => resolve(null) },
    });
    rzp.on('payment.failed', (r) => reject(new Error(r.error?.description || 'Payment failed. You have not been charged.')));
    rzp.open();
  });
}
