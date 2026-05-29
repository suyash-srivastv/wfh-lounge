import React from 'react';

function InviteModal({ open, onClose }){
  if(!open) return null;
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{maxWidth:440}} onClick={e=>e.stopPropagation()}>
        <div className="modal-title">Invite someone</div>
        <p style={{fontSize:13,color:"#555550",marginBottom:16,lineHeight:1.6}}>Share WFH Lounge with your network. Anyone with the link can sign up and join the community.</p>
        <div className="invite-link-row">
          <span className="invite-link-text">{typeof window!=="undefined"?window.location.origin:"https://wfhlounge.app"}</span>
          <button className="invite-copy-btn" onClick={()=>{
            navigator.clipboard.writeText(typeof window!=="undefined"?window.location.origin:"");
            onClose();
          }}>
            <i className="ti ti-copy"/>Copy link
          </button>
        </div>
        <div style={{marginTop:16,display:"flex",gap:8,justifyContent:"center"}}>
          <a href={`https://wa.me/?text=Join%20me%20on%20WFH%20Lounge%20${encodeURIComponent(typeof window!=="undefined"?window.location.origin:"")}`} target="_blank" rel="noopener noreferrer" className="invite-share-btn" style={{background:"#25D366"}}>
            <i className="ti ti-brand-whatsapp"/>WhatsApp
          </a>
          <a href={`https://twitter.com/intent/tweet?text=Join%20me%20on%20WFH%20Lounge%20—%20the%20community%20for%20remote%20workers%20in%20Indian%20cities.%20${encodeURIComponent(typeof window!=="undefined"?window.location.origin:"")}`} target="_blank" rel="noopener noreferrer" className="invite-share-btn" style={{background:"#1DA1F2"}}>
            <i className="ti ti-brand-twitter"/>Twitter
          </a>
        </div>
      </div>
    </div>
  );
}

export default InviteModal;
