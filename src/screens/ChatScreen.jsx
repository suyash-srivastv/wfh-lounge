import { CHANNELS } from '../constants';

function ChatScreen({ city, chatRoom, setChatRoom, mobileChatView, setMobileChatView, chatMsgs, chatLoading, chatInput, setChatInput, sendChat, chatEnd }) {
  const activeCh = CHANNELS.find(c => chatRoom.endsWith(`__${c.id}`)) || CHANNELS[0];

  return (
    <div className={mobileChatView === 'messages' ? 'chat-messages-active' : ''}>
      <div className="page-header">
        <div>
          <div className="page-title">{city === 'All cities' ? 'Global' : city} Chat Room</div>
          <div className="page-sub">#{activeCh.id} · real-time</div>
        </div>
      </div>

      <div className="chat-wrap">
        {/* Sidebar */}
        <div className={'chat-rooms' + (mobileChatView === 'messages' ? ' mobile-hide' : '')}>
          <div className="chat-rooms-header">{city === 'All cities' ? 'Global' : city}</div>
          {CHANNELS.map(ch => {
            const roomId = `${city}__${ch.id}`;
            return (
              <button key={roomId} className={'room-btn' + (chatRoom === roomId ? ' active' : '')}
                onClick={() => { setChatRoom(roomId); setMobileChatView('messages'); }} title={ch.desc}>
                <i className={'ti ' + ch.icon + ' room-ch-icon'}/>
                <span>{ch.label}</span>
              </button>
            );
          })}
        </div>

        {/* Main panel */}
        <div className={'chat-main' + (mobileChatView === 'rooms' ? ' mobile-hide' : '')}>
          <div className="chat-header">
            <button className="mobile-back-btn" onClick={() => setMobileChatView('rooms')}>
              <i className="ti ti-arrow-left"/>
            </button>
            <i className={'ti ' + activeCh.icon} style={{fontSize:15,color:'var(--text-2)'}}/>
            <span>{activeCh.label}</span>
            <span style={{fontSize:12,color:'var(--text-3)',fontWeight:400,marginLeft:'auto'}}>
              {chatMsgs.length} messages
            </span>
          </div>

          <div className="chat-msgs">
            {chatLoading && <div className="chat-loading"><i className="ti ti-loader-2" style={{animation:'spin 1s linear infinite'}}/>Loading messages…</div>}
            {!chatLoading && chatMsgs.length === 0 && <div className="chat-empty">No messages yet — say hi! 👋</div>}
            {chatMsgs.map(msg => (
              <div key={msg.id || msg.text} className="msg">
                <div className="msg-avatar" style={{background:msg.bg,color:msg.tc}}>
                  {(msg.user || '?').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="msg-name">{msg.user}<span className="msg-time">{msg.time}</span></div>
                  <div className="msg-text">{msg.text}</div>
                </div>
              </div>
            ))}
            <div ref={chatEnd}/>
          </div>

          <form className="chat-input-row" onSubmit={e => { e.preventDefault(); sendChat(); }}>
            <input className="chat-input" value={chatInput} onChange={e => setChatInput(e.target.value)}
              placeholder={`Message #${activeCh.label}…`} enterKeyHint="send" autoComplete="off"/>
            <button type="submit" className="send-btn"><i className="ti ti-send" style={{fontSize:15}}/></button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ChatScreen;
