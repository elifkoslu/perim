import { describe, it, expect } from 'vitest';
import { cycleDayFrom, cycleLenOf, phaseBounds, phaseOf } from './screens.jsx';

/* Döngü günü ve faz sınırları, uygulamanın her ekranını besleyen saf hesap.
   Buradaki testler, örnek veriden kalma sabit bir döngü uzunluğunun gerçek
   hesaba sızmasını bir daha mümkün kılmamak için var. */

const gun = (n) => { const d = new Date(2026, 0, 1); d.setDate(d.getDate() + n); return d; };
const BASLANGIC = '2026-01-01';

describe('cycleDayFrom', () => {
  it('başlangıç günü 1. gündür', () => {
    expect(cycleDayFrom(BASLANGIC, gun(0), 28)).toBe(1);
  });

  /* REGRESYON: gün sayımı sabit 32'ye sarıyordu. 28 günlük bir döngüde
     29. gün yeni döngünün 1. günü olmalı; eskiden 29 diye devam ediyordu. */
  it('verilen döngü uzunluğunda sarar, sabit 32 değil', () => {
    expect(cycleDayFrom(BASLANGIC, gun(27), 28)).toBe(28);   // döngünün son günü
    expect(cycleDayFrom(BASLANGIC, gun(28), 28)).toBe(1);    // yeni döngü başlar
    expect(cycleDayFrom(BASLANGIC, gun(31), 32)).toBe(32);   // 32 günlükte son gün
    expect(cycleDayFrom(BASLANGIC, gun(32), 32)).toBe(1);
    // Aynı takvim günü, iki farklı döngü uzunluğunda farklı döngü günü:
    expect(cycleDayFrom(BASLANGIC, gun(28), 32)).toBe(29);
  });

  it('döngü uzunluğu verilmezse 28 varsayar', () => {
    expect(cycleDayFrom(BASLANGIC, gun(28))).toBe(1);
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
