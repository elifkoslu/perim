import { medSlotFor, regimenDay } from './shared';

/* kalan-gun.js — "Bu ilacı bu döngüde daha kaç gün kullanacağım?"

   Program döngüseldir: her ilaç rejim döngüsünün belli günlerinde
   (startDay..endDay, sona sarabilir; birden çok aralık ve aralık başına doz
   olabilir). Burada takvim günleri tek tek ileri/geri yürünerek bugünün
   içinde olduğu kullanım dönemi bulunuyor: kaç gün kaldı, son doz ne zaman,
   ardından ara ne zaman bitiyor. Hesap yalnızca programdan — alınmış ya da
   atlanmış dozlar kalan günü değiştirmiyor, çünkü plan hekiminki. */

function gunEkle(tarih, n) {
  const d = new Date(tarih);
  d.setDate(d.getDate() + n);
  return d;
}

function tarihAnahtari(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

/* Bir ilaç için bugünden ileriye bakış.
   Dönen nesne:
     aktif      bugün planlı mı
     doz        bugünkü doz (aktif değilse sıradaki dönemin ilk dozu)
     surekli    döngünün her günü planlı (ara hiç yok)
     kalan      aktifse: bugün dahil kalan gün
     sonDoz     aktifse: bu dönemin son dozunun tarihi
     donemGunu, donemUzunluk   aktifse: dönemin kaçıncı günü / toplam
     dozDegisimi  aktifse ve dönem içinde doz değişiyorsa { tarih, doz }
     sonraki    bir sonraki dönemin ilk günü (aktifse aradan sonra)
     sonrakiSure  o dönemin uzunluğu
   Program hiçbir günü kapsamıyorsa null. */
function ilacIleri(regimen, med, bugun) {
  const L = (regimen && regimen.cycleLength) || 28;
  const slot = (n) => medSlotFor(med, regimenDay(regimen, gunEkle(bugun, n)));

  const bugunku = slot(0);
  if (bugunku) {
    let ileri = 0;
    while (ileri < L && slot(ileri)) ileri++;
    if (ileri >= L) return { aktif: true, surekli: true, doz: bugunku.dose };
    let geri = 0;
    while (geri < L && slot(-(geri + 1))) geri++;

    let dozDegisimi = null;
    for (let n = 1; n < ileri; n++) {
      const s = slot(n);
      if (s.dose !== bugunku.dose) { dozDegisimi = { tarih: gunEkle(bugun, n), doz: s.dose }; break; }
    }

    let bosluk = ileri;
    while (bosluk < ileri + L && !slot(bosluk)) bosluk++;
    let sure = 0;
    while (sure < L && slot(bosluk + sure)) sure++;

    return {
      aktif: true, surekli: false, doz: bugunku.dose,
      kalan: ileri,
      sonDoz: gunEkle(bugun, ileri - 1),
      donemGunu: geri + 1,
      donemUzunluk: geri + ileri,
      dozDegisimi,
      sonraki: gunEkle(bugun, bosluk),
      sonrakiSure: sure,
    };
  }

  let n = 1;
  while (n <= L && !slot(n)) n++;
  if (n > L) return null;
  let sure = 0;
  while (sure < L && slot(n + sure)) sure++;
  return { aktif: false, surekli: false, doz: slot(n).dose, kalanaKadar: n, sonraki: gunEkle(bugun, n), sonrakiSure: sure };
}

// Programdaki bütün ilaçlar, sırası korunarak. Hiçbir günü kapsamayan ilaç atlanır.
function kalanGunler(regimen, bugun) {
  if (!regimen || !regimen.meds) return [];
  return regimen.meds
    .map(med => ({ med, ileri: ilacIleri(regimen, med, bugun) }))
    .filter(x => x.ileri);
}

/* Östrojen arası: rejim döngüsünde hiçbir östrojenin planlı olmadığı günler.
   Döngüsel BHRT'de kanama çoğu zaman östrojen kesildikten bir iki gün sonra
   gelir (bazen hiç gelmez); takvim beklenen kanamayı bir östrojen arası
   varsa buradan gösteriyor. Aynı günlerde başka ilaçlar (DHEA, takviye…)
   sürse de ara sayılıyor — kullanıcının tanımı: "yalnızca östrojenin
   kesildiği günler". Programda östrojen yoksa ya da sürekli kullanılıyorsa
   ara yok, takvim son regl tarihine göre çiziyor.

   Östrojen olduğu adından anlaşılıyor; ilaç kaydındaki `ostrojen` alanı
   (programda elle işaretlenen kutu) her zaman önce gelir — adından
   anlaşılmayan birleşik ilaçlar ya da yanlış eşleşme için. */
const OSTROJEN_ADI = /(estr|östr|ostroj|divigel|sandrena|climara|progynova|lenzetto)/i;
function ostrojenMi(med) {
  if (!med) return false;
  if (typeof med.ostrojen === 'boolean') return med.ostrojen;
  return OSTROJEN_ADI.test((med.name || '') + ' ' + (med.nameTr || ''));
}
function ostrojenGunu(regimen, gun) {
  return regimen.meds.some(m => ostrojenMi(m) && medSlotFor(m, gun));
}
function rejimdeAraVar(regimen) {
  if (!regimen || !Array.isArray(regimen.meds) || !regimen.meds.some(ostrojenMi)) return false;
  const L = regimen.cycleLength || 28;
  let bos = 0;
  for (let g = 1; g <= L; g++) if (!ostrojenGunu(regimen, g)) bos++;
  return bos > 0 && bos < L;
}
function rejimAraGunu(regimen, tarih) {
  if (!rejimdeAraVar(regimen)) return false;
  return !ostrojenGunu(regimen, regimenDay(regimen, tarih));
}

export { ilacIleri, kalanGunler, gunEkle, tarihAnahtari, ostrojenMi, rejimdeAraVar, rejimAraGunu };
