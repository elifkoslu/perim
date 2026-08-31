import { describe, it, expect } from 'vitest';
import { referenceFor, rangeForLab, curveFor, bandFor, toRefDay, phaseOf } from './physiology.jsx';

/* Fizyoloji eşlemesi saf bir hesap: döngü günü → beklenen hormon düzeyi.
   Buradaki testler yayımlanmış medyanları ve iki parçalı eşlemenin
   davranışını sabitler. */

describe('döngü uzunluğuna eşleme', () => {
  it('luteal fazın şeklini korur: progesteron zirvesi ovülasyondan ~6 gün sonra', () => {
    // Basit orantı kullanılsaydı zirve uzun döngülerde günlerce kayardı.
    for (const L of [26, 28, 32, 35]) {
      const p4 = curveFor('p4', L);
      const zirveGunu = p4.indexOf(Math.max(...p4)) + 1;
      const ovulasyon = L - 14;
      expect(zirveGunu - ovulasyon, `döngü ${L}`).toBeGreaterThanOrEqual(5);
      expect(zirveGunu - ovulasyon, `döngü ${L}`).toBeLessThanOrEqual(7);
    }
  });

  it('estradiol zirvesi ovülasyondan hemen önce olur', () => {
    for (const L of [26, 28, 32]) {
      const e2 = curveFor('e2', L);
      const zirveGunu = e2.indexOf(Math.max(...e2)) + 1;
      const ovulasyon = L - 14;
      expect(zirveGunu, `döngü ${L}`).toBeLessThanOrEqual(ovulasyon);
      expect(zirveGunu, `döngü ${L}`).toBeGreaterThan(ovulasyon - 3);
    }
  });

  it('döngü uzunluğu kadar gün üretir', () => {
    expect(curveFor('e2', 26)).toHaveLength(26);
    expect(curveFor('e2', 35)).toHaveLength(35);
  });

  it('geçersiz döngü uzunluğunu makul sınırlara çeker', () => {
    expect(curveFor('e2', 0)).toHaveLength(28);      // varsayılana düşer
    expect(curveFor('e2', 200)).toHaveLength(60);    // üst sınır
    expect(toRefDay(1, undefined)).toBe(1);
  });
});

describe('referans değerler', () => {
  it('progesteron folliküler fazda pratikte sıfır, luteal fazda yüksek', () => {
    const folliküler = referenceFor(5, 28).values.find(v => v.key === 'p4');
    const luteal = referenceFor(21, 28).values.find(v => v.key === 'p4');
    expect(folliküler.value).toBeLessThan(1);
    expect(luteal.value).toBeGreaterThan(8);
  });

  it('estradiol 3. günde düşük, ovülasyon çevresinde tepe yapar', () => {
    const gun3 = referenceFor(3, 28).values.find(v => v.key === 'e2').value;
    const gun13 = referenceFor(13, 28).values.find(v => v.key === 'e2').value;
    expect(gun3).toBeLessThan(50);
    expect(gun13).toBeGreaterThan(150);
  });

  it('her hormon için bir yayılım aralığı taşır', () => {
    for (const v of referenceFor(14, 28).values) {
      expect(v.low, v.key).toBeLessThan(v.high);
      expect(v.unit, v.key).toBeTruthy();
    }
  });

  it('sınır günlerde çökmez', () => {
    for (const L of [15, 28, 60]) {
      for (const d of [1, L]) {
        expect(() => referenceFor(d, L)).not.toThrow();
      }
    }
  });
});

describe('tahlil aralığı döngü gününe bağlı', () => {
  /* REGRESYON: sabit tek aralık ([50,200]) kullanılırken folliküler fazda
     çekilmiş sağlıklı bir estradiol "düşük" görünüyordu. */
  it('folliküler fazda 42 pg/mL estradiol aralık içinde sayılır', () => {
    const r = rangeForLab('e2', 3, 28);
    expect(42).toBeGreaterThanOrEqual(r.low);
    expect(42).toBeLessThanOrEqual(r.high);
  });

  it('aynı değer luteal fazda da makul kalır ama aralık değişir', () => {
    const foll = rangeForLab('e2', 3, 28);
    const lut = rangeForLab('e2', 21, 28);
    expect(lut.low).not.toBe(foll.low);
    expect(lut.high).toBeGreaterThan(foll.high);
  });

  it('progesteron aralığı fazla birlikte kökten değişir', () => {
    const foll = rangeForLab('p4', 5, 28);
    const lut = rangeForLab('p4', 21, 28);
    expect(foll.high).toBeLessThan(1);
    expect(lut.low).toBeGreaterThan(3);
  });

  it('fizyolojinin kapsamadığı analit için null döner', () => {
    expect(rangeForLab('shbg', 14, 28)).toBeNull();
    expect(rangeForLab('fsh', 14, 28)).toBeNull();
  });
});

describe('faz sınırları', () => {
  it('referans döngüde fazlar sırayla ilerler', () => {
    expect(phaseOf(3)).toBe('follicular');
    expect(phaseOf(15)).toBe('ovulatory');
    expect(phaseOf(25)).toBe('luteal');
  });
});

describe('perimenopoz zarfı', () => {
  it('yalnızca estradiol ve progesteron için tanımlıdır', () => {
    expect(bandFor('e2', 28)).not.toBeNull();
    expect(bandFor('p4', 28)).not.toBeNull();
    expect(bandFor('lh', 28)).toBeNull();
    expect(bandFor('tt', 28)).toBeNull();
  });

  it('döngü uzunluğu kadar gün üretir ve alt sınır üstü geçmez', () => {
    for (const L of [26, 28, 32]) {
      const b = bandFor('e2', L);
      expect(b.low, `döngü ${L}`).toHaveLength(L);
      expect(b.high, `döngü ${L}`).toHaveLength(L);
      for (let i = 0; i < L; i++) expect(b.low[i], `gün ${i + 1}`).toBeLessThanOrEqual(b.high[i]);
    }
  });

  /* Perimenopozun tanımlayıcı asimetrisi: estradiol ovülatuar eğrinin
     ÜSTÜNE çıkabilir, progesteron ise ALTINDA kalır. */
  it('estradiolün üst sınırı ovülatuar eğriyi aşar', () => {
    const b = bandFor('e2', 28), c = curveFor('e2', 28);
    const asan = c.filter((v, i) => b.high[i] > v).length;
    expect(asan).toBeGreaterThan(c.length * 0.6);
  });

  it('progesteronun üst sınırı luteal fazda ovülatuar zirvenin altında kalır', () => {
    const b = bandFor('p4', 28), c = curveFor('p4', 28);
    expect(Math.max(...b.high)).toBeLessThan(Math.max(...c));
  });

  it('estradiol zarfı folliküler fazda bile yüksek değerlere izin verir', () => {
    // Perimenopozda erken folliküler estradiol genç bir döngüdekinin çok üstünde olabilir
    const b = bandFor('e2', 28);
    expect(b.high[2]).toBeGreaterThan(60);
  });
});

/* Yayımlanmış referans aralıkları. Bu sayılar ekranda "normalde bugün şu
   olurdu" diye gösteriliyor; kaynaktan sapmaları sessizce olmasın diye
   teste bağlandı.

   E2/P4/LH: 85 sağlıklı kadın, Elecsys III, cobas e801 — medyan (5-95p),
   pmol/L ve nmol/L olarak yayımlanmış, burada uygulamanın birimlerinde.
   TT: premenopozal ID-LC-MS/MS 0.30-1.69 nmol/L = 8.7-48.7 ng/dL. */
describe('referans aralıkları yayımlanmış değerlerle uyuşur', () => {
  it('estradiol: folliküler 31-90, ovulatuar 60-534, luteal 60-233 pg/mL', () => {
    // 114-332 pmol/L ÷ 3.671 = 31-90
    expect(referenceFor(3, 28).values.find(v => v.key === 'e2')).toMatchObject({ low: 31, high: 90 });
    // 222-1959 ÷ 3.671 = 60-534
    expect(referenceFor(14, 28).values.find(v => v.key === 'e2')).toMatchObject({ low: 60, high: 534 });
    // 222-854 ÷ 3.671 = 60-233
    expect(referenceFor(24, 28).values.find(v => v.key === 'e2')).toMatchObject({ low: 60, high: 233 });
  });

  it('progesteron: folliküler 0.05-0.19, ovulatuar 0.06-4.2, luteal 4.1-14.6 ng/mL', () => {
    expect(referenceFor(3, 28).values.find(v => v.key === 'p4')).toMatchObject({ low: 0.05, high: 0.19 });
    expect(referenceFor(14, 28).values.find(v => v.key === 'p4')).toMatchObject({ low: 0.06, high: 4.2 });
    expect(referenceFor(24, 28).values.find(v => v.key === 'p4')).toMatchObject({ low: 4.1, high: 14.6 });
  });

  it('LH: ovulatuar 8.1-72.7 IU/L, zirve yayımlanmış medyana (22.6) yakın', () => {
    const ov = referenceFor(14, 28).values.find(v => v.key === 'lh');
    expect(ov).toMatchObject({ low: 8.1, high: 72.7 });
    expect(ov.value).toBeGreaterThan(15);
    expect(ov.value).toBeLessThan(35);
  });

  /* REGRESYON: testosteron eğrisi 9.2-10.4 ng/dL, aralık [1.2, 29] idi.
     İkisi de yayımlanmış LC-MS/MS referansının altındaydı; eğri tipik
     değeri değil aralığın tabanını gösteriyordu. */
  it('testosteron: aralık 8.7-48.7 ng/dL ve eğri tabanda değil ortada', () => {
    for (const g of [3, 14, 24]) {
      const tt = referenceFor(g, 28).values.find(v => v.key === 'tt');
      expect(tt).toMatchObject({ low: 8.7, high: 48.7 });
      // tipik değer aralığın alt çeyreğinde olmamalı
      expect(tt.value).toBeGreaterThan(18);
      expect(tt.value).toBeLessThan(35);
    }
  });
});
