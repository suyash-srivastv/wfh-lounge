import React from 'react';

function NewPostModal({ open, onClose, newPost, setNewPost, submitPost }){
  if(!open) return null;
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-title">New post</div>
        <input className="modal-input" placeholder="Post title…" value={newPost.title} onChange={e=>setNewPost(p=>({...p,title:e.target.value}))}/>
        <textarea className="modal-input" placeholder="What's on your mind?" rows={4} value={newPost.body} onChange={e=>setNewPost(p=>({...p,body:e.target.value}))} style={{resize:"vertical"}}/>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={submitPost}>Post</button>
        </div>
      </div>
    </div>
  );
}

export default NewPostModal;
