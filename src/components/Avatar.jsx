import { useState } from 'react';
import { avatarColors, realPhoto, initialsOf } from '../constants';

// A member's uploaded photo, or their initials on a colour from their id.
// Falls back to initials if the image can't load.
function Avatar({ user, size = 32, style = {}, className = '' }) {
  const photo = realPhoto(user?.photoURL);
  const [broken, setBroken] = useState(null);
  const { bg, tc } = avatarColors(user?.uid || user?.id || '');
  const base = {
    width: size, height: size, borderRadius: '50%',
    flexShrink: 0, overflow: 'hidden', ...style,
  };

  if (photo && broken !== photo) {
    return <img src={photo} alt={user?.name || ''} referrerPolicy="no-referrer" onError={() => setBroken(photo)}
      style={{ ...base, objectFit: 'cover' }} className={className}/>;
  }

  return (
    <div style={{ ...base, background: bg, color: tc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: Math.round(size * 0.38), fontWeight: 700 }} className={className}>
      {user?.name ? initialsOf(user.name) : (user?.initials || '?')}
    </div>
  );
}

export default Avatar;
