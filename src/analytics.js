import { getAnalytics, isSupported, logEvent, setUserId } from 'firebase/analytics';
import { app, useEmulators } from './firebase';

// Google Analytics (via Firebase). Records where visitors come from (referrer,
// invite links with utm_* tags), country/city, device, and a few key actions.
// Off for local emulator testing so test runs don't pollute the numbers.
let analytics = null;
const queue = [];

if (!useEmulators) {
  isSupported().then(ok => {
    if (!ok) return;
    analytics = getAnalytics(app);
    queue.splice(0).forEach(fn => fn());
  }).catch(() => {});
}

const run = fn => (analytics ? fn() : queue.push(fn));

export function track(name, params = {}) {
  run(() => logEvent(analytics, name, params));
}

// The app has no URLs per tab, so tab changes are reported as screen views.
export function trackScreen(screen) {
  track('screen_view', { firebase_screen: screen, firebase_screen_class: screen });
}

// Links visits to an account without sending any personal details (uid only).
export function identify(uid) {
  run(() => setUserId(analytics, uid || null));
}

// Invite links carry utm tags so they show up as their own source in Analytics.
export function inviteLink(medium) {
  const u = new URL(window.location.origin);
  u.searchParams.set('utm_source', 'invite');
  u.searchParams.set('utm_medium', medium);
  u.searchParams.set('utm_campaign', 'member_invite');
  return u.toString();
}
