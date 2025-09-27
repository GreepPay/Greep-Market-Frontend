// Service Worker for Greep Market PWA
// Disabled in development to prevent caching issues
const CACHE_NAME = 'greep-market-v1';
const urlsToCache = [
    '/',
    '/static/js/bundle.js',
    '/static/css/main.css',
    '/manifest.json'
];

// Check if we're in development mode
const isDevelopment = location.hostname === 'localhost' || location.hostname === '127.0.0.1';

if (!isDevelopment) {
    // Install event - only in production
    self.addEventListener('install', (event) => {
        event.waitUntil(
            caches.open(CACHE_NAME)
                .then((cache) => {
                    console.log('Opened cache');
                    return cache.addAll(urlsToCache);
                })
        );
    });

    // Fetch event - only in production
    self.addEventListener('fetch', (event) => {
        event.respondWith(
            caches.match(event.request)
                .then((response) => {
                    // Return cached version or fetch from network
                    return response || fetch(event.request);
                }
                )
        );
    });

    // Activate event - only in production
    self.addEventListener('activate', (event) => {
        event.waitUntil(
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
        );
    });
} else {
    // In development, clear all caches and skip caching
    self.addEventListener('install', (event) => {
        console.log('Service Worker: Development mode - skipping caching');
        self.skipWaiting();
    });

    self.addEventListener('activate', (event) => {
        console.log('Service Worker: Development mode - clearing all caches');
        event.waitUntil(
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        console.log('Deleting cache:', cacheName);
                        return caches.delete(cacheName);
                    })
                );
            })
        );
    });

    self.addEventListener('fetch', (event) => {
        // In development, always fetch from network
        event.respondWith(fetch(event.request));
    });
}
