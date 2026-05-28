import React, { useState } from 'react';

function warRoomUrl(city) {
  const slug = city === 'All cities' ? 'global' : city.toLowerCase().replace(/\s+/g, '-');
  return `https://meet.jit.si/WFHLounge-${slug}`;
}

function WarRoom({ city }) {
  const [copied, setCopied] = useState(false);
  const url = warRoomUrl(city);
  const label = city === 'All cities' ? 'everyone' : `${city} folks`;

  function copyLink() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="watercooler-card">
      <div className="watercooler-left">
        <div className="watercooler-emoji">☕</div>
        <div>
          <div className="watercooler-title">The Watercooler</div>
          <div className="watercooler-sub">Drop in for a quick chat with {label} — always open, no agenda.</div>
        </div>
      </div>
      <div className="watercooler-actions">
        <button className="warroom-copy" onClick={copyLink} title="Copy link">
          <i className={"ti "+(copied?"ti-check":"ti-copy")}/>
        </button>
        <a href={url} target="_blank" rel="noopener noreferrer" className="watercooler-join">
          <i className="ti ti-video"/>Join call
        </a>
      </div>
    </div>
  );
}

export default WarRoom;
