import { CHANNELS } from '../../constants';

function ChatTab({ city, chatRoom, setChatRoom, mobileChatView, setMobileChatView, chatMsgs, chatLoading, chatInput, setChatInput, sendChat, chatEnd }){
  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">City chat</div><div className="page-sub">Real-time rooms · your people</div></div>
      </div>
      <div className="chat-wrap">
        <div className={"chat-rooms"+(mobileChatView==="messages"?" mobile-hide":"")}>
          <WarRoom city={city}/>
          <div className="chat-rooms-header">{city==="All cities"?"Global":city}</div>
          {CHANNELS.map(ch=>{
            const roomId=`${city}__${ch.id}`;
            return (
              <button key={roomId} className={"room-btn"+(chatRoom===roomId?" active":"")}
                onClick={()=>{setChatRoom(roomId);setMobileChatView("messages");}} title={ch.desc}>
                <i className={"ti "+ch.icon+" room-ch-icon"}/>
                <span>{ch.label}</span>
              </button>
            );
          })}
        </div>
        <div className={"chat-main"+(mobileChatView==="rooms"?" mobile-hide":"")}>
          {(()=>{
            const activeCh=CHANNELS.find(c=>chatRoom.endsWith(`__${c.id}`))||CHANNELS[0];
            return (
              <div className="chat-header">
                <button className="mobile-back-btn" onClick={()=>setMobileChatView("rooms")}><i className="ti ti-arrow-left"/></button>
                <i className={"ti "+activeCh.icon} style={{fontSize:15,color:"#888780"}}/>
                <span>{activeCh.label}</span>
                <span style={{fontSize:12,color:"#B4B2A9",fontWeight:400,marginLeft:"auto"}}>{chatMsgs.length} messages</span>
              </div>
            );
          })()}
          <div className="chat-msgs">
            {chatLoading&&<div className="chat-loading"><i className="ti ti-loader-2" style={{animation:"spin 1s linear infinite"}}/>Loading messages…</div>}
            {!chatLoading&&chatMsgs.length===0&&<div className="chat-empty">No messages yet — say hi! 👋</div>}
            {chatMsgs.map(msg=>(
              <div key={msg.id||msg.text} className="msg">
                <div className="msg-avatar" style={{background:msg.bg,color:msg.tc}}>{(msg.user||"?").slice(0,2).toUpperCase()}</div>
                <div>
                  <div className="msg-name">{msg.user}<span className="msg-time">{msg.time}</span></div>
                  <div className="msg-text">{msg.text}</div>
                </div>
              </div>
            ))}
            <div ref={chatEnd}/>
          </div>
          <div className="chat-input-row">
            <input className="chat-input" value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendChat()} placeholder={"Message #"+chatRoom+"…"}/>
            <button className="send-btn" onClick={sendChat}><i className="ti ti-send" style={{fontSize:15}}/></button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatTab;
