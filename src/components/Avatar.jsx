import { avatarColors } from '../constants';

function Avatar({ user, size = 32, style = {}, className = '' }) {
  const { bg, tc } = avatarColors(user?.uid || user?.id || '');
  const base = {
    width: size, height: size, borderRadius: '50%',
    flexShrink: 0, overflow: 'hidden', ...style,
  };

  if (user?.photoURL) {
    return <img src={user.photoURL} alt={user.name} style={{ ...base, objectFit: 'cover' }} className={className}/>;
  }

  return (
    <div style={{ ...base, background: bg, color: tc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: Math.round(size * 0.38), fontWeight: 700 }} className={className}>
      {user?.initials || '??'}
    </div>
  );
}

export default Avatar;
