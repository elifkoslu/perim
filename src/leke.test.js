import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { akisYaz, kanamaTuruYaz } from './shared.jsx';
import { bledOn } from './screens.jsx';
import { temizleYedek } from './profile.jsx';

/* Takvimde bir güne dokunmak her zaman "regl" demekti: az bir ara kanama
   döngüyü o günden yeniden başlatıyor, sonraki günler menstrüel faza
   boyanıyordu. Lekelenme artık ayrı ve döngüye karışmıyor. */

const durum = () => ({ periodDays: { '2026-09-01': true, '2026-09-02': true }, periodStart: '2026-09-01', lekeGunleri: {}, symptomLog: {} });

describe('lekelenme', () => {
  it('döngüyü yeniden başlatmıyor', () => {
    const s = kanamaTuruYaz(durum(), '2026-10-03', 'leke');
    expect(s.periodStart).toBe('2026-09-01');
    expect(s.lekeGunleri).toEqual({ '2026-10-03': true });
    expect(bledOn(s, '2026-10-03')).toBe(0);           // takvimde regl sayılmıyor
  });

  it('regl olarak işaretlenmiş günü lekelenmeye çevirmek çapayı önceki regle döndürüyor', () => {
    let s = kanamaTuruYaz(durum(), '2026-10-03', 'regl');
    expect(s.periodStart).toBe('2026-10-03');
    s = kanamaTuruYaz(s, '2026-10-03', 'leke');
    expect(s.periodStart).toBe('2026-09-01');
    expect(s.periodDays['2026-10-03']).toBeUndefined();
  });

  it('bir gün ya regl ya lekelenme', () => {
    let s = kanamaTuruYaz(durum(), '2026-10-03', 'leke');
    s = kanamaTuruYaz(s, '2026-10-03', 'regl');
    expect(s.lekeGunleri['2026-10-03']).toBeUndefined();
    expect(s.periodDays['2026-10-03']).toBe(true);
  });

  it('kaldırmak ikisini de siliyor', () => {
    let s = kanamaTuruYaz(durum(), '2026-10-03', 'leke');
    s = kanamaTuruYaz(s, '2026-10-03', null);
    expect(s.lekeGunleri).toEqual({});
    expect(s.periodStart).toBe('2026-09-01');
  });

  it('tek regl günü lekelenmeye çevrilirse çapa uydurulmuyor', () => {
    const s = kanamaTuruYaz({ periodDays: { '2026-10-03': true }, periodStart: '2026-10-03' }, '2026-10-03', 'leke');
    expect(s.periodStart).toBeNull();
  });

  it('belirtilerden kanama puanı girmek lekelenmeyi kaldırıyor', () => {
    const s = akisYaz(kanamaTuruYaz(durum(), '2026-10-03', 'leke'), '2026-10-03', 2);
    expect(s.lekeGunleri['2026-10-03']).toBeUndefined();
  });

  it('yedekten geri yükleniyor', () => {
    expect(temizleYedek({ lekeGunleri: { '2026-10-03': true } }).lekeGunleri).toEqual({ '2026-10-03': true });
  });
});

describe('ekranlar', () => {
  const oku = (f) => readFileSync(new URL('./' + f, import.meta.url), 'utf8');
  it('ilk sayfadaki takvim doğrudan regl işaretlemiyor, seçim soruyor', () => {
    const k = oku('perim-home.jsx');
    expect(k).not.toMatch(/api\.togglePeriodDay\(c\.key\)/);
    expect(k).toMatch(/api\.kanamaIsaretle\(secili, tur\)/);
  });
  it('belirtilerde lekelenme seçeneği', () => {
    expect(oku('screens.jsx')).toMatch(/api\.kanamaIsaretle\(dk, lekeOn \? null : 'leke'\)/);
  });
  it('hekim özetinde son 90 günün lekelenmesi', () => {
    expect(oku('doctor-summary.jsx')).toMatch(/Ara kanama \/ lekelenme \(son 90 g\)/);
  });
});
