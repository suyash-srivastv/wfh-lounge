import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

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
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
