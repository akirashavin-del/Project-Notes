/* Firebase Messaging worker. The web app supplies the Firebase config through the SDK registration. */
importScripts('https://www.gstatic.com/firebasejs/12.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.7.0/firebase-messaging-compat.js');

self.addEventListener('message', (event) => {
  if (event.data?.type !== 'firebase-config' || !event.data.config || self.firebase.apps.length) return;
  self.firebase.initializeApp(event.data.config);
  const messaging = self.firebase.messaging();
  messaging.onBackgroundMessage((payload) => {
    const notification = payload.notification || {};
    self.registration.showNotification(notification.title || 'Project Notebook', {
      body: notification.body || 'Your project has an update.',
      icon: '/favicon.svg',
    });
  });
});
