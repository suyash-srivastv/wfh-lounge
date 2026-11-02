import Avatar from './components/Avatar';

// "Online" = the app was open and in view in the last 5 minutes. The app
// writes lastActive (server time) every 2 minutes while it's visible.
export const HEARTBEAT_MS = 2 * 60 * 1000;
const ONLINE_MS = 5 * 60 * 1000;

export const isOnline = d => !!d && Date.now() - d.getTime() < ONLINE_MS;

// "Online now" · "Active 12m ago" · "Active 3h ago" · "Active 2d ago" · null if unknown / long ago
export function lastSeen(d) {
  if (!d) return null;
  if (isOnline(d)) return 'Online now';
  const m = Math.floor((Date.now() - d.getTime()) / 60000);
  if (m < 60) return `Active ${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Active ${h}h ago`;
  const days = Math.floor(h / 24);
  return days <= 7 ? `Active ${days}d ago` : null;
}

// Avatar with a green dot when the person is online.
export function PresenceAvatar({ user, size, style, className }) {
  const on = isOnline(user?.lastActive);
  return (
    <span className="pa" style={{ width: size, height: size, ...style }}>
      <Avatar user={user} size={size} className={className}/>
      {on && <span className="pa-dot" title="Online now" aria-label="Online now"/>}
    </span>
  );
}

// Small "Online now" / "Active 3h ago" line.
export function LastSeen({ member, style }) {
  const t = lastSeen(member?.lastActive);
  if (!t) return null;
  return <span className={'last-seen' + (isOnline(member.lastActive) ? ' on' : '')} style={style}>{t}</span>;
}
