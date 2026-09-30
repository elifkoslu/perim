import { describe, it, expect } from 'vitest';
import { cycleDayFrom, cycleLenOf, dongUzadi, phaseBounds, phaseOf } from './screens.jsx';
import { TODAY_DATE } from './shared.jsx';

/* Döngü günü ve faz sınırları, uygulamanın her ekranını besleyen saf hesap.
   Buradaki testler, örnek veriden kalma sabit bir döngü uzunluğunun gerçek
   hesaba sızmasını bir daha mümkün kılmamak için var. */

const gun = (n) => { const d = new Date(2026, 0, 1); d.setDate(d.getDate() + n); return d; };
const BASLANGIC = '2026-01-01';

describe('cycleDayFrom', () => {
  it('başlangıç günü 1. gündür', () => {
    expect(cycleDayFrom(BASLANGIC, gun(0), 28)).toBe(1);
  });

  /* REGRESYON: gün sayımı sabit 32'ye sarıyordu. Tahmin (ileri tarih,
     döngü henüz gecikmemişken) verilen döngü uzunluğunda sarmalı.
     Çapa bugünden 5 gün önce: 28 günlükte çapadan 28 gün sonrası 1. gün. */
  it('ileri tarih tahmini verilen döngü uzunluğunda sarar, sabit 32 değil', () => {
    const cap = new Date(TODAY_DATE); cap.setDate(cap.getDate() - 5);
    const capIso = cap.getFullYear() + '-' + String(cap.getMonth() + 1).padStart(2, '0') + '-' + String(cap.getDate()).padStart(2, '0');
    const ileri = (n) => { const d = new Date(cap); d.setDate(d.getDate() + n); return d; };
    expect(cycleDayFrom(capIso, ileri(27), 28)).toBe(28);   // döngünün son günü
    expect(cycleDayFrom(capIso, ileri(28), 28)).toBe(1);    // tahmini yeni döngü
    expect(cycleDayFrom(capIso, ileri(31), 32)).toBe(32);
    expect(cycleDayFrom(capIso, ileri(32), 32)).toBe(1);
    expect(cycleDayFrom(capIso, ileri(28), 32)).toBe(29);
    expect(cycleDayFrom(capIso, ileri(28))).toBe(1);        // uzunluk verilmezse 28
  });

  /* REGRESYON: yeni kanama işaretlenmeden döngü süresi dolunca gün 1'e
     sarıyor ve takvim, başlık ve tohum döngüsü kullanıcı hiç kanamamışken
     "menstrüel / ilk yarı" diyordu. Geçmiş ve bugün için sarma yok. */
  it('süre dolup kanama işaretlenmediyse sayaç devam eder, faz ikinci yarı', () => {
    expect(cycleDayFrom(BASLANGIC, gun(27), 28)).toBe(28);
    expect(cycleDayFrom(BASLANGIC, gun(28), 28)).toBe(29);
    expect(cycleDayFrom(BASLANGIC, gun(30), 28)).toBe(31);
    expect(phaseOf(31, 28).key).toBe('luteal');
    expect(dongUzadi(31, 28)).toBe(true);
    expect(dongUzadi(28, 28)).toBe(false);
  });

  it('döngü gecikmişse ileri tarihler de tahminle sarılmaz', () => {
    // Çapa 2026-01-01, bugün ondan aylar sonra: gecikme var
    const ileri = new Date(TODAY_DATE); ileri.setDate(ileri.getDate() + 10);
    expect(cycleDayFrom(BASLANGIC, ileri, 28)).toBeGreaterThan(28);
  });

  it('saat farkından etkilenmez', () => {
    const sabah = new Date(2026, 0, 15, 6, 0);
    const gece = new Date(2026, 0, 15, 23, 30);
    expect(cycleDayFrom(BASLANGIC, sabah, 28)).toBe(cycleDayFrom(BASLANGIC, gece, 28));
  });
});

describe('cycleLenOf', () => {
  it('rejimdeki değeri tek kaynak sayar', () => {
    expect(cycleLenOf({ regimen: { cycleLength: 31 } })).toBe(31);
  });
  it('rejim yoksa üst seviyedeki değere düşer', () => {
    expect(cycleLenOf({ cycleLength: 26 })).toBe(26);
  });
  it('hiçbiri yoksa varsayılan verir', () => {
    expect(cycleLenOf({})).toBe(28);
    expect(cycleLenOf(null)).toBe(28);
  });
  it('saçma değerleri makul sınırlara çeker', () => {
    expect(cycleLenOf({ cycleLength: 3 })).toBe(15);
    expect(cycleLenOf({ cycleLength: 900 })).toBe(60);
    expect(cycleLenOf({ cycleLength: 'abc' })).toBe(28);
  });
});

describe('faz sınırları döngü uzunluğuna göre kayar', () => {
  /* REGRESYON: sınırlar sabit günlere çakılıydı (≤5, ≤13, ≤18). 32 günlük bir
     döngüde ovülasyonu haftalarca erken gösteriyordu. */
  it('ovülasyon luteal-14 kuralıyla yerleşir', () => {
    expect(phaseBounds(28).ov).toBe(14);
    expect(phaseBounds(32).ov).toBe(18);
    expect(phaseBounds(26).ov).toBe(12);
  });

  it('luteal faz her uzunlukta ~14 gün kalır', () => {
    for (const L of [26, 28, 32, 35]) {
      const b = phaseBounds(L);
      const lutealUzunluk = L - b.ovEnd;
      expect(lutealUzunluk, `döngü ${L}`).toBeGreaterThanOrEqual(10);
      expect(lutealUzunluk, `döngü ${L}`).toBeLessThanOrEqual(14);
    }
  });

  it('aynı gün farklı döngü uzunluklarında farklı faza düşer', () => {
    expect(phaseOf(14, 28).key).toBe('ovulation');
    expect(phaseOf(14, 32).key).toBe('follicular');
  });

  it('fazlar boşluksuz ve sırayla ilerler', () => {
    for (const L of [26, 28, 32]) {
      const gorulen = [];
      for (let d = 1; d <= L; d++) {
        const k = phaseOf(d, L).key;
        if (gorulen[gorulen.length - 1] !== k) gorulen.push(k);
      }
      expect(gorulen, `döngü ${L}`).toEqual(['menstrual', 'follicular', 'ovulation', 'luteal']);
    }
  });
});
