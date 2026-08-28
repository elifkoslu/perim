import { describe, expect, it } from 'vitest';
import { belirtiSerisi, dongulerHesapla, uyumHesapla } from './perim-analytics.jsx';

/* Analizler ekranındaki her sayı gerçek kayıttan gelmeli. Dolu görünüp
   aslında boş olan bir grafik, boş bir ekrandan daha kötüdür — yalan söyler. */

describe('dongulerHesapla', () => {
  it('kayıt yoksa boş döner', () => {
    expect(dongulerHesapla({})).toEqual([]);
    expect(dongulerHesapla({ periodDays: {} })).toEqual([]);
  });

  it('tek kanama serisinden döngü uzunluğu çıkarmaz', () => {
    // Bir döngü ölçmek için iki başlangıç gerekir
    expect(dongulerHesapla({ periodDays: { '2026-03-01': true, '2026-03-02': true } })).toEqual([]);
  });

  it('ardışık serilerin ilk günleri arasındaki farkı ölçer', () => {
    const d = dongulerHesapla({ periodDays: {
      '2026-01-05': true, '2026-01-06': true, '2026-01-07': true,
      '2026-02-02': true, '2026-02-03': true,
    }});
    expect(d).toHaveLength(1);
    expect(d[0].baslangic).toBe('2026-01-05');
    expect(d[0].uzunluk).toBe(28);
  });

  it('düzensiz döngüleri olduğu gibi verir — ortalamaya düzleştirmez', () => {
    const d = dongulerHesapla({ periodDays: {
      '2026-01-01': true,
      '2026-01-25': true,   // 24 gün
      '2026-03-05': true,   // 39 gün
    }});
    expect(d.map(x => x.uzunluk)).toEqual([24, 39]);
  });

  it('ay ve yıl sınırını doğru geçer', () => {
    const d = dongulerHesapla({ periodDays: { '2025-12-20': true, '2026-01-17': true } });
    expect(d[0].uzunluk).toBe(28);
  });
});

describe('uyumHesapla', () => {
  it('program yoksa yüzde hesaplamaz — sıfır göstermez', () => {
    // Planlanmamış bir gün uyumu bozmamalı
    const u = uyumHesapla({ regimen: null, doseLog: {} });
    expect(u.planli).toBe(0);
    expect(u.yuzde).toBe(null);
  });

  it('alınan doz sayısı planlananı aşarsa uyum %100’ü geçmez', () => {
    const rejim = { cycleLength: 28, anchor: '2026-01-01',
      meds: [{ id: 'a', name: 'A', dose: '1', when: 'morning', time: '08:00', startDay: 1, endDay: 28 }] };
    const doseLog = {};
    for (let i = 0; i < 40; i++) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      doseLog[k] = { a: { at: '08:00' }, hayalet: { at: '09:00' } };   // planda olmayan fazladan kayıt
    }
    const u = uyumHesapla({ regimen: rejim, doseLog });
    expect(u.yuzde).toBeLessThanOrEqual(100);
  });
});

describe('belirtiSerisi', () => {
  it('hiç kayıt yoksa null döner — boş grafik çizilmesin', () => {
    expect(belirtiSerisi({ symptomLog: {} }, 'hotflash')).toBe(null);
  });

  it('kaydedilen gün sayısını ve ortalamayı gerçek girdilerden alır', () => {
    const bugun = new Date();
    const k = (g) => { const d = new Date(bugun); d.setDate(d.getDate() - g);
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
    const r = belirtiSerisi({ symptomLog: { [k(0)]: { hotflash: 3 }, [k(1)]: { hotflash: 1 } } }, 'hotflash');
    expect(r.kayitli).toBe(2);           // 30 gün değil — yalnızca girilenler
    expect(r.ortalama).toBe(2);
    expect(r.seri).toHaveLength(30);     // eksik günler 0 olarak çizilir
  });
});
