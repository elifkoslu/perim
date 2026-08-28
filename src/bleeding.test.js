import { describe, expect, it } from 'vitest';
import { bleedExpected, bledOn, phaseBounds, phaseOf, phaseRange, seedRange } from './screens.jsx';
import { sonKanamaBasi } from './shared.jsx';

/* Beklenen kanama döngü matematiğinden, gerçekleşen kanama kullanıcının
   işaretlediği günlerden gelir. İkisi karışırsa takvim yalan söyler:
   uygulamanın tahmini, olan bitmiş gibi görünür. */

describe('bleedExpected', () => {
  it('döngünün ilk beş günü kanama bekler', () => {
    for (let g = 1; g <= 5; g++) expect(bleedExpected(g, 28)).toBe(true);
    expect(bleedExpected(6, 28)).toBe(false);
  });

  it('döngü uzunluğundan bağımsızdır — kanama penceresi başta sabittir', () => {
    expect(bleedExpected(5, 35)).toBe(true);
    expect(bleedExpected(6, 35)).toBe(false);
  });
});

describe('bledOn', () => {
  it('işaretlenmemiş gün 0 döner', () => {
    expect(bledOn({ periodDays: {} }, '2026-03-01')).toBe(0);
    expect(bledOn(null, '2026-03-01')).toBe(0);
  });

  it('işaretli gün yoğunluksuz da olsa kanama sayılır', () => {
    expect(bledOn({ periodDays: { '2026-03-01': true } }, '2026-03-01')).toBe(2);
  });

  /* Loğusa ve perimenopoz belirti setlerinde kanama zaten bir belirti.
     Kullanıcı evre değiştirdiğinde o kayıtlar takvimden silinmiş gibi
     görünmesin diye ayrıca okunuyor. */
  it('belirti olarak girilen kanamayı da görür', () => {
    expect(bledOn({ symptomLog: { '2026-03-02': { bleeding: 3 } } }, '2026-03-02')).toBe(3);
    expect(bledOn({ symptomLog: { '2026-03-02': { cycle: 1 } } }, '2026-03-02')).toBe(1);
    expect(bledOn({ symptomLog: { '2026-03-02': { bleeding: 0 } } }, '2026-03-02')).toBe(0);
  });

  it('kanama dışı belirtiyi kanama saymaz', () => {
    expect(bledOn({ symptomLog: { '2026-03-02': { mood: 3, cramps: 2 } } }, '2026-03-02')).toBe(0);
  });
});

describe('sonKanamaBasi', () => {
  it('kayıt yoksa null döner', () => {
    expect(sonKanamaBasi({})).toBe(null);
  });

  it('kesintisiz serinin ilk gününü verir', () => {
    expect(sonKanamaBasi({
      '2026-03-03': true, '2026-03-04': true, '2026-03-05': true,
    })).toBe('2026-03-03');
  });

  /* Çapa en son seriye bağlanmalı: eski bir kanama serisi hâlâ kayıtlıyken
     yeni regl başladığında döngü günü geçmişe takılı kalırsa tüm ekran şaşar. */
  it('birden fazla seri varsa en sonuncusunun başını verir', () => {
    expect(sonKanamaBasi({
      '2026-02-01': true, '2026-02-02': true,
      '2026-03-03': true, '2026-03-04': true,
    })).toBe('2026-03-03');
  });

  it('ay sınırını geçen seriyi bölmez', () => {
    expect(sonKanamaBasi({
      '2026-02-27': true, '2026-02-28': true, '2026-03-01': true,
    })).toBe('2026-02-27');
  });

  it('artık yıl 29 Şubat üzerinden de geçer', () => {
    expect(sonKanamaBasi({
      '2024-02-28': true, '2024-02-29': true, '2024-03-01': true,
    })).toBe('2024-02-28');
  });

  it('silinmiş (false) günleri seriden saymaz', () => {
    expect(sonKanamaBasi({
      '2026-03-03': true, '2026-03-04': false, '2026-03-05': true,
    })).toBe('2026-03-05');
  });
});

describe('phaseRange', () => {
  // Metin dile göre değişiyor ("6.–12. günler" / "Days 6–12"); testin ilgilendiği
  // sınırlar, biçim değil.
  const sinir = (key, L) => phaseRange(key, L).match(/\d+/g).map(Number);

  /* REGRESYON: bu aralıklar sabit metindi ve örnek hastanın 32 günlük
     döngüsünden geliyordu — 28 günlük bir kullanıcıda luteal faz "19.–32.
     günler" yazıyor, aynı ekrandaki döngü takvimiyle çelişiyordu. */
  it('28 günlük döngüde aralıklar döngüyü tam kaplar', () => {
    expect(sinir('menstrual', 28)).toEqual([1, 5]);
    expect(sinir('follicular', 28)).toEqual([6, 12]);
    expect(sinir('ovulation', 28)).toEqual([13, 16]);
    expect(sinir('luteal', 28)).toEqual([17, 28]);
  });

  it('döngü uzadıkça folliküler faz uzar, luteal ~14 günde kalır', () => {
    expect(sinir('follicular', 35)).toEqual([6, 19]);
    expect(sinir('ovulation', 35)).toEqual([20, 23]);
    expect(sinir('luteal', 35)).toEqual([24, 35]);
  });

  it('phaseOf ile aynı sınırları kullanır — boşluk ya da örtüşme yok', () => {
    for (const L of [21, 28, 35, 45]) {
      const bulunan = {};
      for (let g = 1; g <= L; g++) (bulunan[phaseOf(g, L).key] ||= []).push(g);
      for (const k of ['menstrual', 'follicular', 'ovulation', 'luteal']) {
        const gunler = bulunan[k];
        expect(sinir(k, L)).toEqual([gunler[0], gunler[gunler.length - 1]]);
      }
    }
  });
});

describe('seedRange', () => {
  const sinir = (half, L) => seedRange(half, L).match(/\d+/g).map(Number);

  /* REGRESYON: tohum döngüsü aralıkları sabit metindi ("1.–14." / "15.–28.").
     Protokol aslında ovülasyona bağlı; 35 günlük bir döngüde ikinci yarı
     7 gün erken başlamış gibi görünüyordu. */
  it('28 günlük döngüde geleneksel 1–14 / 15–28 bölünmesini verir', () => {
    expect(sinir('first', 28)).toEqual([1, 14]);
    expect(sinir('second', 28)).toEqual([15, 28]);
  });

  it('döngü uzadıkça bölünme ovülasyonla birlikte kayar', () => {
    expect(sinir('first', 35)).toEqual([1, 21]);
    expect(sinir('second', 35)).toEqual([22, 35]);
    expect(sinir('first', 21)).toEqual([1, 10]);
    expect(sinir('second', 21)).toEqual([11, 21]);
  });

  it('iki yarı döngüyü boşluksuz ve örtüşmesiz kaplar', () => {
    for (const L of [21, 24, 28, 32, 35, 45]) {
      const [a1, a2] = sinir('first', L);
      const [b1, b2] = sinir('second', L);
      expect(a1).toBe(1);
      expect(b1).toBe(a2 + 1);   // boşluk ya da örtüşme yok
      expect(b2).toBe(L);
    }
  });

  it('bölünme noktası phaseBounds ile aynı ovülasyon gününü kullanır', () => {
    for (const L of [21, 28, 35, 45]) {
      expect(sinir('first', L)[1]).toBe(phaseBounds(L).ov);
    }
  });
});
