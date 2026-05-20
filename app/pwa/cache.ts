'use client';

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    console.log('[PWA] Service worker registered:', registration.scope);
    return registration;
  } catch (e) {
    console.warn('[PWA] Service worker registration failed:', e);
    return null;
  }
}

export async function unregisterServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;

  const registrations = await navigator.serviceWorker.getRegistrations();
  for (const reg of registrations) {
    await reg.unregister();
  }
}

export async function getCacheSize(): Promise<number> {
  if (!('caches' in window)) return 0;

  let total = 0;
  const cacheNames = await caches.keys();

  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    for (const key of keys) {
      const response = await cache.match(key);
      if (response) {
        const clone = response.clone();
        const blob = await clone.blob();
        total += blob.size;
      }
    }
  }

  return total;
}

export async function clearAllCaches(): Promise<void> {
  if (!('caches' in window)) return;
  const names = await caches.keys();
  await Promise.all(names.map((n) => caches.delete(n)));
}
