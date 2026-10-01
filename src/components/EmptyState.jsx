// Friendly empty state: a little steaming cup and a line with some personality.
function EmptyState({ title, line, action, style }) {
  return (
    <div className="empty-state" style={style}>
      <svg className="empty-cup" viewBox="0 0 64 64" aria-hidden="true">
        <g className="empty-steam" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <path className="w1" d="M26 20q-4-5 0-9t0-8"/><path className="w2" d="M36 20q4-5 0-9t0-8"/>
        </g>
        <path d="M14 26h32v14a12 12 0 0 1-12 12h-8a12 12 0 0 1-12-12z" fill="currentColor" opacity=".9"/>
        <path d="M46 30h4a6 6 0 0 1 0 12h-4" fill="none" stroke="currentColor" strokeWidth="3.5" opacity=".9"/>
        <path d="M10 56h44" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity=".45"/>
      </svg>
      {title && <div className="empty-title">{title}</div>}
      {line && <div className="empty-line">{line}</div>}
      {action}
    </div>
  );
}

export default EmptyState;
