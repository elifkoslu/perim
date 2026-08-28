import { describe, expect, it } from 'vitest';
import { belirtiSerisi, uyumHesapla } from './perim-analytics.jsx';

/* Analizler ekranındaki her sayı gerçek kayıttan gelmeli. Dolu görünüp
   aslında boş olan bir grafik, boş bir ekrandan daha kötüdür — yalan söyler. */

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

describe('uyumHesapla — takip penceresi', () => {
  const anahtar = (g) => { const d=new Date(); d.setDate(d.getDate()-g);
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); };
  const rejim = { cycleLength: 28, anchor: anahtar(20),
    meds: [{ id:'a', name:'A', dose:'1', when:'morning', time:'08:00', startDay:1, endDay:28 }] };

  /* REGRESYON: pencere sabit 30 gündü. Program dün eklendiyse 29 günde
     "doz kaçırılmış" görünüyor ve uyum %2 çıkıyordu. Kullanıcı hata
     yapmadı; uygulama o günlerde henüz takip etmiyordu. */
  it('takip başlamadan önceki günleri saymaz', () => {
    const u = uyumHesapla({ regimen: rejim, doseLog: { [anahtar(1)]: { a: { at: '08:00' } } } });
    expect(u.gun).toBe(2);          // dünden bugüne
    expect(u.yuzde).toBe(50);       // 2 planlı, 1 alınmış — 30 güne bölünmüyor
  });

  it('hiç doz kaydı yoksa uyum hesaplamaz', () => {
    const u = uyumHesapla({ regimen: rejim, doseLog: {} });
    expect(u.gun).toBe(0);
    expect(u.yuzde).toBe(null);
  });

  it('düzenli kayıtta pencere ilk kayıttan bugüne uzar', () => {
    const log = {};
    for (let i = 0; i <= 5; i++) log[anahtar(i)] = { a: { at: '08:00' } };
    const u = uyumHesapla({ regimen: rejim, doseLog: log });
    expect(u.gun).toBe(6);
    expect(u.yuzde).toBe(100);
  });
});

describe('belirtiSerisi — kayıt yok ile sıfır ayrımı', () => {
  const anahtar = (g) => { const d=new Date(); d.setDate(d.getDate()-g);
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); };

  /* "O gün kayıt yok" ile "o gün yok olarak kaydedildi" aynı şey değil.
     İkisini de 0'a çevirmek grafiği yalancı yapardı. */
  it('kayıt olmayan günler null kalır, sıfırlar sıfır', () => {
    const r = belirtiSerisi({ symptomLog: { [anahtar(0)]: { hotflash: 0 }, [anahtar(2)]: { hotflash: 3 } } }, 'hotflash');
    expect(r.seri[r.seri.length - 1]).toBe(0);      // bugün: yok kaydedildi
    expect(r.seri[r.seri.length - 2]).toBe(null);   // dün: kayıt yok
    expect(r.seri[r.seri.length - 3]).toBe(3);
    expect(r.kayitli).toBe(2);                      // null'lar sayılmaz
    expect(r.ortalama).toBe(1.5);                   // (0+3)/2
  });
});
