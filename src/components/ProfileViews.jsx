import { useEffect, useState } from 'react';
import { collection, getDocs, limit, orderBy, query, Timestamp, where } from 'firebase/firestore';
import { db } from '../firebase';
import { timeAgo } from '../constants';
import { isPremium } from '../premium';
import { useProfiles } from '../hooks/useFirestoreListeners';
import Avatar from './Avatar';

// "Who viewed you" on your own profile. Premium sees the list (last 30 days);
// everyone else sees what they'd get. The rules only let Premium owners read it.
function ProfileViews({ user, onViewProfile, onUpgrade }) {
  const premium = isPremium(user);
  const [views, setViews] = useState(null);

  useEffect(() => {
    if (!premium) return;
    const since = Timestamp.fromMillis(Date.now() - 30 * 86400e3);
    getDocs(query(collection(db, 'users', user.uid, 'views'), where('at', '>=', since), orderBy('at', 'desc'), limit(50)))
      .then(s => setViews(s.docs.map(d => ({ id: d.id, at: d.data().at?.toDate() }))))
      .catch(() => setViews([]));
  }, [user.uid, premium]);

  const people = useProfiles(premium ? user : null, (views || []).map(v => v.id));
  const byId = Object.fromEntries(people.items.map(p => [p.id, p]));

  return (
    <div className="profile-views">
      <div className="profile-views-head"><i className="ti ti-eye"/>Who viewed your profile</div>
      {!premium && (
        <div className="profile-views-locked">
          <span>See the members who visited your profile in the last 30 days.</span>
          <button className="btn-primary premium-pay" onClick={onUpgrade}>✨ Get Premium</button>
        </div>
      )}
      {premium && views === null && <div className="ed-muted">Loading…</div>}
      {premium && views?.length === 0 && <div className="ed-muted">No visits in the last 30 days yet.</div>}
      {premium && views?.length > 0 && (
        <div className="profile-views-list">
          {views.filter(v => byId[v.id]).map(v => (
            <button key={v.id} className="profile-views-item" onClick={() => onViewProfile(v.id)}>
              <Avatar user={byId[v.id]} size={32}/>
              <span><b>{byId[v.id].name}</b><span>{timeAgo(v.at)}</span></span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProfileViews;
