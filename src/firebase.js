import { initializeApp } from 'firebase/app';
import { initializeAuth, browserLocalPersistence, browserPopupRedirectResolver } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAeuLxfNV_L8ISCJ_fGO35G93ahL-q5e20",
  authDomain: "wfh-lounge.firebaseapp.com",
  projectId: "wfh-lounge",
  storageBucket: "wfh-lounge.firebasestorage.app",
  messagingSenderId: "165256143125",
  appId: "1:165256143125:web:60364412f58d53d92d091c",
  measurementId: "G-CPZ741TQC5"
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: browserLocalPersistence,
  popupRedirectResolver: browserPopupRedirectResolver,
});

export const db = getFirestore(app);
