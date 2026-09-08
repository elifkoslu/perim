/* persist-storage.js — tarayıcıdan veriyi silmemesini istemek.

   Perim'in bütün verisi cihazdaki localStorage'da: tahliller, döngü
   kayıtları, dozlar. Sunucu yok, hesap yok. Bu gizlilik için iyi ama
   tarayıcılar yer sıkıştığında ya da site bir süre açılmadığında
   "script tarafından yazılabilir" depolamayı temizleyebiliyor —
   iOS Safari'de bu eşik 7 gün. Bir sağlık kaydı için kabul edilemez.

   StorageManager.persist() tam olarak bunu sorar: "bu siteyi kalıcı
   say". Destekleyen tarayıcıda veri kendiliğinden silinmez; ana ekrana
   eklenmiş uygulamalarda istek genelde sessizce kabul edilir.
   Desteklemeyende çağrı yok sayılır, zararı olmaz.

   Garanti değil — kullanıcı yine de tarayıcı verisini elle silebilir.
   Bu yüzden düzenli yedek uyarısı (backup-reminder) bunun tamamlayıcısı,
   alternatifi değil. */

const DURUM = { destek: false, kalici: false, soruldu: false };

async function kaliciDepolamaIste() {
  DURUM.soruldu = true;
  try {
    if (!navigator.storage || typeof navigator.storage.persist !== 'function') return DURUM;
    DURUM.destek = true;
    // Zaten kalıcıysa tekrar sorma: bazı tarayıcılarda her istek bir izin
    // istemi açabiliyor ve kullanıcıyı sebepsiz rahatsız eder.
    if (typeof navigator.storage.persisted === 'function' && await navigator.storage.persisted()) {
      DURUM.kalici = true;
      return DURUM;
    }
    DURUM.kalici = await navigator.storage.persist();
  } catch {
    /* Gizli modda ya da kısıtlı bağlamda atabilir; uygulamayı düşürmemeli. */
  }
  return DURUM;
}

export { kaliciDepolamaIste, DURUM };
