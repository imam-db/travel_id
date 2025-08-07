const CACHE_NAME = 'travel-expense-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/login.html',
  '/mwp.html',
  '/expenses.html',
  '/approvals.html',
  '/profile.html',
  '/style.css',
  '/script.js',
  '/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('Service Worker: Install event');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: All files cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Cache failed', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activate event');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Claiming clients');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip external requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          console.log('Service Worker: Serving from cache', event.request.url);
          return response;
        }

        console.log('Service Worker: Fetching from network', event.request.url);
        return fetch(event.request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Add to cache
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // If both cache and network fail, show offline page
            if (event.request.destination === 'document') {
              return caches.match('/index.html');
            }
          });
      })
  );
});

// Background sync for offline data
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync', event.tag);
  
  if (event.tag === 'expense-sync') {
    event.waitUntil(
      syncExpenseData()
    );
  }
  
  if (event.tag === 'mwp-sync') {
    event.waitUntil(
      syncMWPData()
    );
  }
});

// Push notification handler
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push received');
  
  let notificationData = {
    title: 'Travel Expense Manager',
    body: 'You have a new notification',
    icon: '/icon-192.png',
    badge: '/icon-72.png',
    tag: 'general',
    requireInteraction: false,
    actions: [
      {
        action: 'open',
        title: 'Open App',
        icon: '/icon-72.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icon-72.png'
      }
    ]
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (e) {
      notificationData.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked', event.action);
  
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  // Default action or 'open' action
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If app is already open, focus it
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Otherwise, open new window
        if (clients.openWindow) {
          let targetUrl = '/';
          
          // Navigate to specific page based on notification tag
          if (event.notification.tag === 'approval') {
            targetUrl = '/approvals.html';
          } else if (event.notification.tag === 'expense') {
            targetUrl = '/expenses.html';
          } else if (event.notification.tag === 'mwp') {
            targetUrl = '/mwp.html';
          }
          
          return clients.openWindow(targetUrl);
        }
      })
  );
});

// Helper functions for background sync
async function syncExpenseData() {
  try {
    // Get offline expense data from IndexedDB
    const offlineExpenses = await getOfflineExpenses();
    
    for (const expense of offlineExpenses) {
      // Attempt to sync with server
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expense)
      });
      
      if (response.ok) {
        // Remove from offline storage
        await removeOfflineExpense(expense.id);
        console.log('Expense synced successfully:', expense.id);
      }
    }
  } catch (error) {
    console.error('Failed to sync expense data:', error);
  }
}

async function syncMWPData() {
  try {
    // Get offline MWP data from IndexedDB
    const offlineMWPs = await getOfflineMWPs();
    
    for (const mwp of offlineMWPs) {
      // Attempt to sync with server
      const response = await fetch('/api/mwp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mwp)
      });
      
      if (response.ok) {
        // Remove from offline storage
        await removeOfflineMWP(mwp.id);
        console.log('MWP synced successfully:', mwp.id);
      }
    }
  } catch (error) {
    console.error('Failed to sync MWP data:', error);
  }
}

// Placeholder functions for IndexedDB operations
// In a real implementation, these would interact with IndexedDB
async function getOfflineExpenses() {
  return [];
}

async function removeOfflineExpense(id) {
  console.log('Removing offline expense:', id);
}

async function getOfflineMWPs() {
  return [];
}

async function removeOfflineMWP(id) {
  console.log('Removing offline MWP:', id);
}

// Message handler for communication with main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});