import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getFirebaseApp, isFirebaseConfigured, firebaseConfig } from './firebaseConfig';

const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
export const isFirebaseMessagingConfigured = isFirebaseConfigured && Boolean(vapidKey);

export async function requestPushPermission() {
  if (!isFirebaseMessagingConfigured) throw new Error('Firebase push is not configured. Add the Firebase web config and VITE_FIREBASE_VAPID_KEY first.');
  if (!window.isSecureContext || !('serviceWorker' in navigator) || !('Notification' in window)) {
    throw new Error('Push notifications need HTTPS (or localhost) and browser notification support.');
  }
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Notification permission was not granted.');
  const messaging = getMessaging(getFirebaseApp());
  const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
  const worker = registration.active || registration.waiting || registration.installing;
  worker?.postMessage({ type: 'firebase-config', config: firebaseConfig });
  return getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
}

export async function listenForPushMessages(callback) {
  if (!isFirebaseMessagingConfigured) throw new Error('Firebase push is not configured.');
  return onMessage(getMessaging(getFirebaseApp()), callback);
}

export { firebaseConfig, isFirebaseConfigured };
