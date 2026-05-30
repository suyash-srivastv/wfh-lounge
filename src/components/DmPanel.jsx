import { useEffect } from 'react';
import Avatar from './Avatar';

function DmPanel({ dm, userConnections, receivedRequests, onAcceptRequest, onDeclineRequest, onClose }) {
  const { inbox, activeDm, openDm, closeDm, dmMsgs, dmLoading, dmInput, setDmInput, sendDm, dmEnd } = dm;
  const isFriend = activeDm ? !!(userConnections[activeDm.uid]) : false;

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="dm-panel-overlay" onClick={onClose}>
      <div className="dm-panel" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="dm-panel-header">
          {activeDm && (
            <button className="dm-panel-back" onClick={closeDm}>
              <i className="ti ti-arrow-left"/>
            </button>
          )}
          <div className="dm-panel-title">
            {activeDm
              ? <><Avatar user={{id:activeDm.uid,name:activeDm.name,photoURL:activeDm.photoURL,initials:(activeDm.name||'??').slice(0,2).toUpperCase()}} size={22}/>{activeDm.name}</>
              : 'Messages'}
          </div>
          <button className="dm-panel-close" onClick={onClose}><i className="ti ti-x"/></button>
        </div>

        {/* Friend requests */}
        {!activeDm && Object.keys(receivedRequests).length > 0 && (
          <div className="dm-requests-section">
            <div className="dm-requests-header">
              <i className="ti ti-user-plus" style={{fontSize:12}}/>
              Friend Requests
              <span className="dm-unread-badge" style={{marginLeft:'auto'}}>{Object.keys(receivedRequests).length}</span>
            </div>
            {Object.entries(receivedRequests).map(([uid, req]) => (
              <div key={uid} className="dm-request-item">
                <Avatar user={{id:uid, name:req.name, photoURL:req.photoURL, initials:(req.name||'??').slice(0,2).toUpperCase()}} size={34}/>
                <div className="dm-request-text">
                  <div className="dm-request-name">{req.name}</div>
                  <div className="dm-request-sub">wants to connect</div>
                </div>
                <div className="dm-request-actions">
                  <button className="dm-req-accept" onClick={() => onAcceptRequest(uid)}>✓</button>
                  <button className="dm-req-decline" onClick={() => onDeclineRequest(uid)}>✗</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Inbox */}
        {!activeDm && (
          <div className="dm-panel-inbox">
            {inbox.length === 0 && (
              <div className="chat-empty" style={{padding:'40px 20px'}}>
                No messages yet.<br/>
                <span style={{fontSize:12}}>Go to Members and connect with someone to start a DM.</span>
              </div>
            )}
            {inbox.map(item => (
              <button key={item.id} className="dm-inbox-item"
                onClick={() => openDm(item.id, item.name, item.photoURL)}>
                <div style={{position:'relative',flexShrink:0}}>
                  <Avatar user={{id:item.id,name:item.name,photoURL:item.photoURL,initials:(item.name||'??').slice(0,2).toUpperCase()}} size={38}/>
                  {item.unread > 0 && <span className="dm-unread-dot"/>}
                </div>
                <div className="dm-inbox-text">
                  <div className="dm-inbox-name">{item.name}</div>
                  <div className="dm-inbox-preview">{item.lastMsg || 'No messages yet'}</div>
                </div>
                {item.unread > 0 && <span className="dm-unread-badge">{item.unread}</span>}
              </button>
            ))}
          </div>
        )}

        {/* Conversation */}
        {activeDm && (
          <>
            <div className="chat-msgs">
              {dmLoading && (
                <div className="chat-loading">
                  <i className="ti ti-loader-2" style={{animation:'spin 1s linear infinite'}}/>Loading…
                </div>
              )}
              {!dmLoading && dmMsgs.length === 0 && (
                <div className="chat-empty">No messages yet — say hi! 👋</div>
              )}
              {dmMsgs.map(msg => (
                <div key={msg.id} className="msg">
                  <div className="msg-avatar">
                    {(msg.senderName || '?').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="msg-name">{msg.senderName}
                      <span className="msg-time">
                        {msg.timestamp?.toDate().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) || ''}
                      </span>
                    </div>
                    <div className="msg-text">{msg.text}</div>
                  </div>
                </div>
              ))}
              <div ref={dmEnd}/>
            </div>

            {isFriend ? (
              <form className="chat-input-row" onSubmit={e => { e.preventDefault(); sendDm(); }}>
                <input className="chat-input" value={dmInput} onChange={e => setDmInput(e.target.value)}
                  placeholder={`Message ${activeDm.name}…`} enterKeyHint="send" autoComplete="off"/>
                <button type="submit" className="send-btn">
                  <i className="ti ti-send" style={{fontSize:15}}/>
                </button>
              </form>
            ) : (
              <div className="dm-locked">
                <i className="ti ti-lock" style={{fontSize:15}}/>
                Connect with {activeDm.name} to send messages
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default DmPanel;
