import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDli06QGAoPZQHTK1JezgglUN6C7HwRlME',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'copassage-ad6e4.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'copassage-ad6e4',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'copassage-ad6e4.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '876857612747',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:876857612747:web:42802737b53b3227e73e4e',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-JX77WVVV9Q',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export default app;

