import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, memoryLocalCache, connectFirestoreEmulator } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

const firebaseConfig = {
  apiKey: "AIzaSyAeuLxfNV_L8ISCJ_fGO35G93ahL-q5e20",
  authDomain: "wfh-lounge.firebaseapp.com",
  projectId: "wfh-lounge",
  storageBucket: "wfh-lounge.firebasestorage.app",
  messagingSenderId: "165256143125",
  appId: "1:165256143125:web:60364412f58d53d92d091c",
  measurementId: "G-CPZ741TQC5"
};

export const app = initializeApp(firebaseConfig);

// App Check blocks scripts and bots that call Firebase directly. It turns on
// once a reCAPTCHA v3 site key is set in .env as VITE_RECAPTCHA_SITE_KEY.
const recaptchaKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
if (recaptchaKey) {
  initializeAppCheck(app, { provider: new ReCaptchaV3Provider(recaptchaKey), isTokenAutoRefreshEnabled: true });
}

// Local testing only: `npm run dev:emulators` points the app at the Firebase
// emulators (fake accounts, local database) instead of the real project.
export const useEmulators = import.meta.env.VITE_USE_EMULATORS === '1';

export const auth = getAuth(app);
// Offline cache: repeat visits read mostly from this device instead of the server.
export const db = initializeFirestore(app, {
  localCache: useEmulators ? memoryLocalCache() : persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});

if (useEmulators) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
}
