import { useEffect, useState } from 'react';
import LoadMore from '../components/LoadMore';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { timeAgo } from '../constants';
import MsgDelete from '../components/MsgDelete';

// Replies for the open thread only (most recent 50), loaded when it's opened.
function Replies({ threadId, userId, deleteReply }) {
  const [replies, setReplies] = useState(null);
  useEffect(() => {
    const q = query(collection(db, 'threads', threadId, 'replies'), orderBy('createdAt'), limit(50));
    return onSnapshot(q, snap => setReplies(snap.docs.map(d => ({ id: d.id, ...d.data() }))), () => setReplies([]));
  }, [threadId]);

  if (!replies) return <div className="reply-empty">Loading replies…</div>;
  if (!replies.length) return <div className="reply-empty">No replies yet.</div>;
  return (
    <div className="reply-list">
      {replies.map(r => (
        <div key={r.id} className="msg reply">
          <div className="msg-body">
            <div className="msg-name">{r.author}<span className="msg-time">{timeAgo(r.createdAt?.toDate())}</span></div>
            <div className="msg-text">{r.body}</div>
          </div>
          {r.authorId === userId && <MsgDelete onDelete={() => deleteReply(threadId, r.id)}/>}
        </div>
      ))}
    </div>
  );
}

function ThreadsScreen({ threads, hasMore, onLoadMore, city, userId, openThread, toggleThread, replyText, setReplyText, submitReply, likeThread, deleteThread, onNewPost, reactThread, reactions, deleteReply }){
  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Forums</div><div className="page-sub">Async discussions · {city}</div></div>
        <button className="btn-primary" onClick={onNewPost}><i className="ti ti-plus"/>New post</button>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {threads.map(t=>(
          <div key={t.id} className="thread-card" onClick={()=>toggleThread(t.id)}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
              <div style={{fontWeight:600,fontSize:14,lineHeight:1.4,flex:1,paddingRight:10}}>{t.title}</div>
              {t.city!=="All"&&<span className="tag">{t.city}</span>}
            </div>
            {openThread===t.id&&(
              <div className="thread-expand" onClick={e=>e.stopPropagation()}>
                <div style={{fontSize:13,color:"var(--text-dim)",lineHeight:1.7,marginBottom:12}}>{t.body}</div>
                <Replies threadId={t.id} userId={userId} deleteReply={deleteReply}/>
                <form style={{display:"flex",gap:8}} onSubmit={e=>{e.preventDefault();submitReply();}}>
                  <input className="chat-input" value={replyText} onChange={e=>setReplyText(e.target.value)} placeholder="Write a reply…" maxLength={2000} enterKeyHint="send" autoComplete="off"/>
                  <button type="submit" className="send-btn">Reply</button>
                </form>
              </div>
            )}
            {reactions && (
              <div className="reactions" onClick={e=>e.stopPropagation()}>
                {reactions.map(emoji => {
                  const count   = Object.keys(t.reactions?.[emoji] || {}).length;
                  const reacted = !!(t.reactions?.[emoji]?.[userId]);
                  return (
                    <button key={emoji} className={'reaction-btn'+(reacted?' reacted':'')}
                      onClick={e=>{e.stopPropagation();reactThread(t.id,emoji);}}>
                      {emoji}{count>0&&<span>{count}</span>}
                    </button>
                  );
                })}
              </div>
            )}
            <div style={{display:"flex",alignItems:"center",gap:14,fontSize:12,color:"var(--text-2)",marginTop:8}}>
              <span>{t.author} · {timeAgo(t.createdAt?.toDate())}</span>
              <span><i className="ti ti-message" style={{fontSize:12,verticalAlign:-1}}/> {t.replyCount||0}</span>
              <button className={"like-btn"+(!!(t.likes?.[userId])?" liked":"")} onClick={e=>likeThread(t.id,e)}>
                <i className={"ti "+(!!(t.likes?.[userId])?"ti-heart-filled":"ti-heart")} style={{fontSize:13}}/>{t.likeCount||0}
              </button>
              {t.authorId===userId&&<button className="delete-btn" style={{marginLeft:"auto"}} title="Delete post" onClick={e=>{e.stopPropagation();deleteThread(t.id);}}><i className="ti ti-trash"/></button>}
            </div>
          </div>
        ))}
        {threads.length===0&&<div className="empty">No posts yet. Start the conversation!</div>}
      </div>
      <LoadMore hasMore={hasMore} onLoadMore={onLoadMore}/>
    </div>
  );
}

export default ThreadsScreen;
