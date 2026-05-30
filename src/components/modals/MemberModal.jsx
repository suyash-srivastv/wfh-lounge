import Avatar from '../Avatar';

function MemberModal({ member, onClose, currentUserId, userConnections, sentRequests, receivedRequests, onSendRequest, onCancelRequest, onAcceptRequest, onDeclineRequest, onMessage }) {
  if (!member) return null;

  const connected = !!(userConnections[member.id]);
  const sent      = !!(sentRequests[member.id]);
  const received  = !!(receivedRequests[member.id]);

  function renderActions() {
    if (member.id === currentUserId) return null;

    if (received) return (
      <div style={{display:'flex',flexDirection:'column',gap:6}}>
        <div style={{fontSize:12,color:'var(--text-2)',textAlign:'center',marginBottom:2}}>
          <strong>{member.name.split(' ')[0]}</strong> wants to connect with you
        </div>
        <div style={{display:'flex',gap:8}}>
          <button className="connect-btn connect-btn-accept member-modal-connect" style={{flex:1}} onClick={() => onAcceptRequest(member.id)}>
            ✓ Accept
          </button>
          <button className="connect-btn connect-btn-decline member-modal-connect" style={{flex:1}} onClick={() => onDeclineRequest(member.id)}>
            ✗ Decline
          </button>
        </div>
      </div>
    );

    if (connected) return (
      <div style={{display:'flex',gap:8}}>
        <button className="connect-btn connected member-modal-connect" style={{flex:1}} disabled>✓ Connected</button>
        <button className="dm-btn" style={{flex:1}} onClick={() => onMessage(member)}>
          <i className="ti ti-message"/>Message
        </button>
      </div>
    );

    if (sent) return (
      <div style={{display:'flex',flexDirection:'column',gap:6}}>
        <button className="connect-btn connect-btn-pending member-modal-connect" onClick={() => onCancelRequest(member.id)}>
          Request sent · Cancel
        </button>
        <p style={{fontSize:11,color:'var(--text-3)',textAlign:'center',margin:0}}>
          Waiting for {member.name.split(' ')[0]} to accept
        </p>
      </div>
    );

    return (
      <div style={{display:'flex',flexDirection:'column',gap:6}}>
        <button className="connect-btn member-modal-connect" onClick={() => onSendRequest(member.id)}>
          Connect
        </button>
        <p style={{fontSize:11,color:'var(--text-3)',textAlign:'center',margin:0}}>
          Connect to unlock messaging
        </p>
      </div>
    );
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal member-modal" onClick={e => e.stopPropagation()}>
        <button className="member-modal-close" onClick={onClose}><i className="ti ti-x"/></button>
        <div className="member-modal-header">
          <Avatar user={member} size={56}/>
          <div>
            <div className="member-modal-name">{member.name}</div>
            {member.username && <div className="member-modal-handle">@{member.username}</div>}
            <div className="member-modal-meta">
              {member.role && <span>{member.role}</span>}
              {member.yearsExp != null && member.yearsExp !== '' && <><span style={{color:'var(--scrollbar)'}}>·</span><span>{member.yearsExp} yrs</span></>}
              {member.city && <><span style={{color:'var(--scrollbar)'}}>·</span><span><i className="ti ti-map-pin" style={{fontSize:11,verticalAlign:-1,marginRight:2}}/>{member.city}</span></>}
            </div>
          </div>
        </div>

        {member.vibe && <div style={{marginBottom:10}}><span className="vibe-chip">{member.vibe}</span></div>}
        {member.status && (
          <div style={{marginBottom:12}}>
            <span style={{fontSize:12,fontWeight:500,padding:'3px 10px',borderRadius:20,background:'var(--accent-bg)',color:'var(--accent-tc)'}}>
              {member.status}
            </span>
          </div>
        )}

        {member.bio && <p className="member-modal-bio">{member.bio}</p>}

        {member.skills?.length > 0 && (
          <div className="member-modal-section">
            <div className="member-modal-label">Skills</div>
            <div>{member.skills.map(s => <span key={s} className="tag">{s}</span>)}</div>
          </div>
        )}

        <div className="member-modal-stats">
          <div className="member-modal-stat"><span>{member.conn || 0}</span>connections</div>
          <div className="member-modal-stat-divider"/>
          <div className="member-modal-stat"><span>{member.yearsExp || '—'}</span>yrs exp</div>
        </div>

        {renderActions()}
      </div>
    </div>
  );
}

export default MemberModal;
