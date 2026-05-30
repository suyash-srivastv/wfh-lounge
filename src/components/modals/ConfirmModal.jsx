function ConfirmModal({ title, message, confirmLabel = 'Confirm', danger = false, onConfirm, onCancel }) {
  return (
    <div className="overlay" onClick={onCancel}>
      <div className="modal" style={{maxWidth:360}} onClick={e => e.stopPropagation()}>
        <div className="modal-title" style={{fontSize:17,marginBottom:8}}>{title}</div>
        {message && <p style={{fontSize:13,color:'var(--text-dim)',lineHeight:1.6,marginBottom:20}}>{message}</p>}
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onCancel}>Cancel</button>
          <button
            className="btn-primary"
            style={danger ? {background:'#c0392b'} : {}}
            onClick={() => { onConfirm(); onCancel(); }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
