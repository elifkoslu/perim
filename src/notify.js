/* notify.js — bildirimi telefonların kabul ettiği yoldan göstermek.

   Hatırlatmalar sayfanın içinden new Notification(...) ile gösteriliyordu.
   Masaüstünde çalışıyor ama telefonda çalışmıyordu: Android'de tarayıcı
   bu çağrıyı reddediyor ("Illegal constructor — use
   ServiceWorkerRegistration.showNotification()"), iPhone'da bildirim
   yalnızca ana ekrana eklenmiş uygulamada ve service worker üzerinden
   gösterilebiliyor. Çağrılar try/catch içinde olduğu için hata sessizce
   yutuluyor, ekranda hiçbir şey olmuyordu.

   Önce service worker kaydı üzerinden gösteriyoruz; kayıt yoksa (geliştirme
   sunucusu, eski tarayıcı) sayfa içi yönteme düşüyoruz. getRegistration()
   kullanılıyor, ready değil: ready kayıt yoksa hiç çözülmez ve hatırlatma
   döngüsünü askıda bırakırdı.

   Kimseyi içe aktarmıyor — döngüsel bağımlılığa düşmesin diye yaprak. */

async function bildirimGoster(baslik, secenek) {
  try {
    if (typeof navigator !== 'undefined' && navigator.serviceWorker) {
      const kayit = await navigator.serviceWorker.getRegistration();
      if (kayit && typeof kayit.showNotification === 'function') {
        await kayit.showNotification(baslik, secenek);
        return 'sw';
      }
    }
  } catch (e) { /* aşağıdaki yola düş */ }
  try {
    new Notification(baslik, secenek);
    return 'sayfa';
  } catch (e) {
    return null;
  }
}

export { bildirimGoster };
