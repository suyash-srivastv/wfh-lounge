import { useState } from 'react';
import { buyPremium, isPremium, premiumEnds, PREMIUM_PRICE, PREMIUM_DAYS } from '../../premium';

const PERKS = [
  { icon: 'ti-calendar-plus', title: 'Host events',            line: 'Create meetups in your city — coffee, walks, co-working, games.' },
  { icon: 'ti-sparkles',      title: 'Violet Premium glow',    line: 'A ✨ Premium tag, and a glow on your messages, events and posts.' },
  { icon: 'ti-eye',           title: 'See who viewed you',     line: 'The members who visited your profile in the last 30 days.' },
];

const fmt = d => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

// Upgrade window. `reason` explains what sent them here (e.g. tapping Host event).
function PremiumModal({ open, user, reason, onClose, onPaid }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (!open) return null;
  const active = isPremium(user);

  async function pay() {
    setBusy(true); setError('');
    try {
      const until = await buyPremium(user);
      if (until) onPaid(until);
    } catch (e) { setError(e.message); }
    setBusy(false);
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal premium-modal" onClick={e => e.stopPropagation()} role="dialog" aria-label="Premium">
        <div className="premium-kicker">✨ The Stillroom Premium</div>
        <div className="modal-title">{active ? 'You’re Premium' : reason || 'Do more in your city'}</div>
        {active && <p className="premium-note">Active until <b>{fmt(premiumEnds(user))}</b>. Paying again adds {PREMIUM_DAYS} more days.</p>}
        <ul className="premium-perks">
          {PERKS.map(p => <li key={p.title}><i className={'ti ' + p.icon}/><div><b>{p.title}</b><span>{p.line}</span></div></li>)}
        </ul>
        <div className="premium-price"><b>₹{PREMIUM_PRICE}</b> for {PREMIUM_DAYS} days · UPI, cards, netbanking · no auto-renew</div>
        {error && <div className="premium-error">{error}</div>}
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Not now</button>
          <button className="btn-primary premium-pay" onClick={pay} disabled={busy}>
            {busy ? 'Opening…' : active ? `Add ${PREMIUM_DAYS} days · ₹${PREMIUM_PRICE}` : `Get Premium · ₹${PREMIUM_PRICE}`}
          </button>
        </div>
        <p className="premium-fine">By paying you agree to the <a href="/terms" target="_blank" rel="noopener noreferrer">Terms</a> and <a href="/refunds" target="_blank" rel="noopener noreferrer">Refund policy</a>.</p>
      </div>
    </div>
  );
}

export default PremiumModal;
