/* sw-bildirim.js — service worker'a eklenen bildirim davranışı.

   Bildirimler artık service worker kaydı üzerinden gösteriliyor
   (src/notify.js). Service worker'da notificationclick dinleyicisi
   olmazsa telefonda bildirime dokunmak hiçbir şey yapmıyor. Açık bir
   pencere varsa ona dönüyoruz, yoksa uygulamayı açıyoruz. */
self.addEventListener('notificationclick', (olay) => {
  olay.notification.close();
  olay.waitUntil((async () => {
    const pencereler = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const p of pencereler) {
      if ('focus' in p) return p.focus();
    }
    if (self.clients.openWindow) return self.clients.openWindow('/');
  })());
});
