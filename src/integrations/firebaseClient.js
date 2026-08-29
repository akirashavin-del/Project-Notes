const FIREBASE_VERSION = '12.7.0';
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean) && Boolean(import.meta.env.VITE_FIREBASE_VAPID_KEY);
let modulesPromise;
let app;
let messaging;

const loadFirebaseModules = () => {
  if (!modulesPromise) {
    modulesPromise = Promise.all([
      import(/* @vite-ignore */ `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-app.js`),
      import(/* @vite-ignore */ `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-messaging.js`),
    ]);
  }
  return modulesPromise;
};

export async function requestPushPermission() {
  if (!isFirebaseConfigured) throw new Error('Firebase push is not configured. Add the VITE_FIREBASE_* values first.');
  if (!window.isSecureContext || !('serviceWorker' in navigator) || !('Notification' in window)) {
    throw new Error('Push notifications need HTTPS (or localhost) and browser notification support.');
  }
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Notification permission was not granted.');
  const [{ initializeApp }, { getMessaging, getToken }] = await loadFirebaseModules();
  app ||= initializeApp(firebaseConfig, 'project-notebook');
  messaging ||= getMessaging(app);
  const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
  const worker = registration.active || registration.waiting || registration.installing;
  worker?.postMessage({ type: 'firebase-config', config: firebaseConfig });
  return getToken(messaging, { vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY, serviceWorkerRegistration: registration });
}

export async function listenForPushMessages(callback) {
  if (!isFirebaseConfigured) throw new Error('Firebase push is not configured.');
  const [{ initializeApp }, { getMessaging, onMessage }] = await loadFirebaseModules();
  app ||= initializeApp(firebaseConfig, 'project-notebook');
  messaging ||= getMessaging(app);
  return onMessage(messaging, callback);
}

export { firebaseConfig };
