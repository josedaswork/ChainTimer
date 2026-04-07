// Service worker for Chain Timer notifications with action buttons

self.addEventListener('notificationclick', (event) => {
  const action = event.action;
  event.notification.close();

  // Post action to all clients (the app)
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      clients.forEach((client) => {
        client.postMessage({ type: 'TIMER_ACTION', action: action || 'focus' });
      });
      // If no action (user tapped the notification body), focus the app
      if (!action && clients.length > 0) {
        clients[0].focus();
      }
    })
  );
});

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
