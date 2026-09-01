import { getApps, initializeApp } from 'firebase/app';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean);

export function getFirebaseApp() {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase is not configured. Add the VITE_FIREBASE_* values to the deployed web build.');
  }
  return getApps().find((candidate) => candidate.name === 'project-notebook')
    || initializeApp(firebaseConfig, 'project-notebook');
}
