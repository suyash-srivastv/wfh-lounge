import { useState } from 'react';
import { timeAgo } from '../constants';
import Avatar from '../components/Avatar';
import ConfirmModal from '../components/modals/ConfirmModal';

const STATUS_DOT = {
  'Open to work':            '#1D9E75',
  'Building something':      '#7F77DD',
  'Available for freelance': '#0ea5e9',
  'Looking for co-founder':  '#f59e0b',
  'Not available':           '#D3D1C7',
};

function MemberProfilePage({ member, threads, currentUserId, userConnections, sentRequests, receivedRequests, blockedUsers, onSendRequest, onCancelRequest, onAcceptRequest, onDeclineRequest, onMessage, onUnfriend, onBlock, onUnblock, onBack }) {
  const [pending, setPending] = useState(null); // { action, onConfirm, title, message }

  const memberPosts = threads.filter(t => t.authorId === member.id);
  const connected   = !!(userConnections[member.id]);
  const sent        = !!(sentRequests[member.id]);
  const received    = !!(receivedRequests[member.id]);
  const blocked     = !!(blockedUsers[member.id]);
  const isSelf      = member.id === currentUserId;

  const firstName = member.name.split(' ')[0];

  function askUnfriend() {
    setPending({
      title:   `Unfriend ${firstName}?`,
      message: `You'll both lose the connection. You'd need to send a new request to reconnect.`,
      confirmLabel: 'Unfriend',
      onConfirm: () => onUnfriend(member.id),
    });
  }
  function askBlock() {
    setPending({
      title:   `Block ${firstName}?`,
      message: `They'll be removed from your connections and won't be able to message you. They won't be notified.`,
      confirmLabel: 'Block',
      onConfirm: () => onBlock(member.id),
    });
  }

  function renderActions() {
    if (isSelf) return null;

    if (blocked) return (
      <div className="profile-blocked-banner">
        <i className="ti ti-ban" style={{fontSize:15}}/>
        <span>You've blocked {member.name.split(' ')[0]}</span>
        <button className="btn-cancel" style={{marginLeft:'auto',padding:'5px 12px',fontSize:12}} onClick={() => onUnblock(member.id)}>
          Unblock
        </button>
      </div>
    );

    if (received) return (
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        <div style={{display:'flex',gap:8}}>
          <button className="connect-btn connect-btn-accept" style={{flex:1}} onClick={() => onAcceptRequest(member.id)}>✓ Accept</button>
          <button className="connect-btn connect-btn-decline" style={{flex:1}} onClick={() => onDeclineRequest(member.id)}>✗ Decline</button>
        </div>
        <div className="profile-danger-row">
          <button className="profile-danger-link" onClick={askBlock}>Block</button>
        </div>
      </div>
    );

    if (connected) return (
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        <div style={{display:'flex',gap:8}}>
          <button className="connect-btn connected" style={{flex:1}} disabled>✓ Connected</button>
          <button className="dm-btn" style={{flex:1}} onClick={() => onMessage(member)}>
            <i className="ti ti-message"/>Message
          </button>
        </div>
        <div className="profile-danger-row">
          <button className="profile-danger-link" onClick={askUnfriend}>Unfriend</button>
          <span style={{color:'var(--border)',userSelect:'none'}}>·</span>
          <button className="profile-danger-link" onClick={askBlock}>Block</button>
        </div>
      </div>
    );

    if (sent) return (
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        <button className="connect-btn connect-btn-pending" style={{width:'100%'}} onClick={() => onCancelRequest(member.id)}>
          Request sent · Cancel
        </button>
        <div className="profile-danger-row">
          <button className="profile-danger-link" onClick={askBlock}>Block</button>
        </div>
      </div>
    );

    return (
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        <button className="connect-btn" style={{width:'100%'}} onClick={() => onSendRequest(member.id)}>Connect</button>
        <div className="profile-danger-row">
          <button className="profile-danger-link" onClick={askBlock}>Block</button>
        </div>
      </div>
    );
  }

  return (
    <>
    {pending && (
      <ConfirmModal
        title={pending.title}
        message={pending.message}
        confirmLabel={pending.confirmLabel}
        danger
        onConfirm={pending.onConfirm}
        onCancel={() => setPending(null)}
      />
    )}
    <div className="profile-page fade">
      <button className="profile-back" onClick={onBack}>
        <i className="ti ti-arrow-left"/>Back
      </button>

      {/* Profile card */}
      <div className="profile-page-header">
        <div style={{display:'flex',alignItems:'flex-start',gap:16}}>
          <Avatar user={member} size={68} style={{flexShrink:0,marginTop:2}}/>
          <div style={{flex:1,minWidth:0}}>
            <div className="profile-page-name">{member.name}</div>
            {member.username && (
              <div style={{fontSize:13,color:'var(--accent)',marginTop:1,marginBottom:6}}>@{member.username}</div>
            )}
            <div style={{fontSize:12,color:'var(--text-2)',display:'flex',flexWrap:'wrap',alignItems:'center',gap:'3px 8px',marginBottom:10}}>
              {member.role && <span>{member.role}</span>}
              {member.yearsExp != null && member.yearsExp !== '' && (
                <><span style={{color:'var(--scrollbar)'}}>·</span><span>{member.yearsExp} yrs exp</span></>
              )}
              {member.city && (
                <><span style={{color:'var(--scrollbar)'}}>·</span>
                <span style={{display:'flex',alignItems:'center',gap:2}}>
                  <i className="ti ti-map-pin" style={{fontSize:11}}/>{member.city}
                </span></>
              )}
            </div>
            {member.vibe && <span className="vibe-chip">{member.vibe}</span>}
          </div>
        </div>

        {member.status && (
          <div style={{marginTop:12}}>
            <span style={{fontSize:12,fontWeight:500,padding:'3px 10px',borderRadius:20,
              background:'var(--accent-bg)',color:'var(--accent-tc)',
              display:'inline-flex',alignItems:'center',gap:5}}>
              <span className="status-dot" style={{background:STATUS_DOT[member.status]||'var(--scrollbar)'}}/>
              {member.status}
            </span>
          </div>
        )}

        {member.bio?.trim() && (
          <p style={{margin:'14px 0 0',paddingTop:14,borderTop:'1px solid var(--border-sub)',
            fontSize:13,color:'var(--text-dim)',lineHeight:1.75}}>
            {member.bio.trim()}
          </p>
        )}

        {!isSelf && (
          <div style={{marginTop:16}}>{renderActions()}</div>
        )}
      </div>

      {/* Stats */}
      <div className="profile-stats">
        <div className="profile-stat">
          <div className="profile-stat-val">{memberPosts.length}</div>
          <div className="profile-stat-label">Posts</div>
        </div>
        <div className="profile-stat">
          <div className="profile-stat-val">{member.conn || 0}</div>
          <div className="profile-stat-label">Connections</div>
        </div>
        <div className="profile-stat">
          <div className="profile-stat-val">{member.yearsExp ?? '—'}</div>
          <div className="profile-stat-label">Yrs exp</div>
        </div>
      </div>

      {/* Posts */}
      <div className="page-title" style={{marginBottom:14}}>
        {isSelf ? 'My posts' : `${member.name.split(' ')[0]}'s posts`}
      </div>

      {memberPosts.length === 0 ? (
        <div className="empty" style={{paddingTop:24}}>No posts yet.</div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {memberPosts.map(t => (
            <div key={t.id} className="thread-card" style={{cursor:'default'}}>
              <div style={{fontWeight:600,fontSize:14,lineHeight:1.4,marginBottom:6}}>{t.title}</div>
              {t.body && (
                <div style={{fontSize:13,color:'var(--text-dim)',lineHeight:1.6,marginBottom:8}}>{t.body}</div>
              )}
              <div style={{display:'flex',alignItems:'center',gap:14,fontSize:12,color:'var(--text-2)'}}>
                <span>{timeAgo(t.createdAt?.toDate())}</span>
                <span><i className="ti ti-message" style={{fontSize:12,verticalAlign:-1}}/> {t.replyCount||0}</span>
                <span><i className="ti ti-heart" style={{fontSize:12,verticalAlign:-1}}/> {t.likeCount||0}</span>
                {t.city !== 'All' && <span className="tag">{t.city}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </>
  );
}

export default MemberProfilePage;
