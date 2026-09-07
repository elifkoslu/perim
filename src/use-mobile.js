import React from 'react';

/* use-mobile.js — dar ekran kancası, yaprak modül.

   Bu kanca eskiden mobile.jsx içindeydi. screens.jsx oradan alınca
   döngüsel bağımlılık oluştu: screens → mobile → shared → screens, ve
   shared'daki ICONS henüz tanımlanmadan mobile.jsx onu okumaya
   çalıştığı için uygulama "Cannot access 'ICONS' before initialization"
   ile boş ekrana düşüyordu. Kanca yalnız React'e bağlı; kimseyi
   içe aktarmayan bir dosyada durursa hiçbir halka kapanmaz. */
function useIsMobile(bp = 720) {
  // URL'de ?mobile=1 varsa her zaman mobil mod (iframe telefon önizlemesi için)
  const forced = typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('mobile') === '1';
  const q = `(max-width:${bp}px)`;
  const detect = () => forced || (document.documentElement.clientWidth || window.innerWidth) <= bp;
  const [m, setM] = React.useState(detect);
  React.useEffect(() => {
    if (forced) return;
    const update = () => setM(detect());
    update();
    const mq = window.matchMedia(q);
    mq.addEventListener('change', update);
    window.addEventListener('resize', update);
    return () => { mq.removeEventListener('change', update); window.removeEventListener('resize', update); };
  }, []);
  return m;
}

export { useIsMobile };
