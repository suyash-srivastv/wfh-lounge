import React, { useState, useEffect } from 'react';

// Two-tap delete for your own messages: 🗑 → "Delete?" (resets after 3s).
function MsgDelete({ onDelete }) {
  const [armed, setArmed] = useState(false);
  const [busy, setBusy]   = useState(false);

  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(t);
  }, [armed]);

  async function click() {
    if (!armed) { setArmed(true); return; }
    setBusy(true);
    try { await onDelete(); } catch (e) { console.error('Delete failed:', e); setBusy(false); setArmed(false); }
  }

  return (
    <button type="button" className={'msg-delete' + (armed ? ' armed' : '')} onClick={click} disabled={busy}
      title="Delete message" aria-label={armed ? 'Confirm delete' : 'Delete message'}>
      {armed ? (busy ? 'Deleting…' : 'Delete?') : <i className="ti ti-trash"/>}
    </button>
  );
}

export default MsgDelete;
