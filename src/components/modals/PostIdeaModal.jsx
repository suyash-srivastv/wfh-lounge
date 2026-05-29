import React from 'react';

function PostIdeaModal({ open, onClose, newIdea, setNewIdea, submitIdea, ROLES }){
  if(!open) return null;
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{maxWidth:520}} onClick={e=>e.stopPropagation()}>
        <div className="modal-title">Post a startup idea</div>
        <input className="modal-input" placeholder="Idea title…" value={newIdea.title} onChange={e=>setNewIdea(p=>({...p,title:e.target.value}))}/>
        <textarea className="modal-input" placeholder="Describe the problem and your solution…" rows={3} style={{resize:"vertical"}} value={newIdea.desc} onChange={e=>setNewIdea(p=>({...p,desc:e.target.value}))}/>
        <div className="modal-label">Stage</div>
        <div className="modal-type-toggle">
          {["Idea","Validating","Building"].map(s=>(
            <button key={s} className={"modal-type-btn"+(newIdea.stage===s?" active":"")} onClick={()=>setNewIdea(p=>({...p,stage:s}))}>{s}</button>
          ))}
        </div>
        <div className="modal-label">Looking for <span style={{fontWeight:400,color:"#B4B2A9"}}>(optional)</span></div>
        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>
          {ROLES.map(r=>(
            <button key={r} type="button"
              className={"modal-chip"+(newIdea.looking.includes(r)?" active":"")}
              onClick={()=>setNewIdea(p=>({...p,looking:p.looking.includes(r)?p.looking.filter(x=>x!==r):[...p.looking,r]}))}>
              {r}
            </button>
          ))}
        </div>
        <input className="modal-input" placeholder="Tags — SaaS, fintech, wellness… (comma separated)" value={newIdea.tags} onChange={e=>setNewIdea(p=>({...p,tags:e.target.value}))}/>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={submitIdea} disabled={!newIdea.title.trim()}>Post idea</button>
        </div>
      </div>
    </div>
  );
}

export default PostIdeaModal;
