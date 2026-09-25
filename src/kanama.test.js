import { readFileSync, existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { akisTasi, akisYaz, gunlukLog, kanamaDegeri, KANAMA_ANAHTARLARI } from './shared.jsx';
import { bledOn } from './screens.jsx';

/* Kanama eskiden iki yerde tutuluyordu: belirtilerdeki "Akış" (flow) /
   perimenopozdaki "Kanama" (cycle) symptomLog'a yazılıyor, döngü çapası
   (periodStart) ve takvim periodDays'i okuyordu. Belirtilerden girilen
   kanama döngü gününü güncellemiyordu. Artık tek kaynak periodDays. */

const bos = () => ({ periodDays: {}, symptomLog: {}, periodStart: null });
const kaynak = (f) => readFileSync(new URL('./' + f, import.meta.url), 'utf8');

describe('belirtilerden kanama yazmak', () => {
  it('takvime yansıyor (bledOn)', () => {
    expect(bledOn(akisYaz(bos(), '2026-09-20', 3), '2026-09-20')).toBe(3);
  });

  it('döngü çapası son kanama öbeğinin ilk gününe kayıyor', () => {
    let s = akisYaz(bos(), '2026-09-19', 2);
    s = akisYaz(s, '2026-09-20', 2);
    expect(s.periodStart).toBe('2026-09-19');
  });

  it('"Yok" kanama sayılmıyor ama kayıt olarak kalıyor', () => {
    const s = akisYaz(bos(), '2026-09-20', 0);
    expect(bledOn(s, '2026-09-20')).toBe(0);
    expect(gunlukLog(s)['2026-09-20'].flow).toBe(0);
    expect(gunlukLog(s)['2026-09-20'].cycle).toBe(0);
  });

  it('bir günü "Yok"a çekmek öbeğin başını düzeltiyor', () => {
    let s = bos();
    for (const g of ['2026-09-18', '2026-09-19', '2026-09-20']) s = akisYaz(s, g, 2);
    s = akisYaz(s, '2026-09-18', 0);
    expect(s.periodStart).toBe('2026-09-19');
  });

  it('hiç kanama günü kalmazsa çapa takvimdeki kuralla aynı: eski kalır', () => {
    const s = akisYaz({ ...bos(), periodStart: '2026-08-01' }, '2026-09-20', 0);
    expect(s.periodStart).toBe('2026-08-01');
  });

  it('sonradan girilen "Yok" eski bir symptomLog kanamasına geri düşmüyor', () => {
    const eski = { ...bos(), symptomLog: { '2026-09-20': { cycle: 3, hot: 2 } } };
    const s = akisYaz(eski, '2026-09-20', 0);
    expect(bledOn(s, '2026-09-20')).toBe(0);
    expect(s.symptomLog['2026-09-20']).toEqual({ hot: 2 });
  });
});

describe('belirti ekranlarının okuduğu kayıt', () => {
  it('işaretli gün hem "Akış" hem perimenopoz "Kanama" olarak görünüyor', () => {
    const s = { periodDays: { '2026-09-20': 1 }, symptomLog: { '2026-09-20': { cramps: 3 } } };
    expect(gunlukLog(s)['2026-09-20']).toEqual({ cramps: 3, flow: 1, cycle: 1 });
  });

  it('yoğunluksuz işaret ("Reglim başladı") "Orta" sayılıyor', () => {
    expect(gunlukLog({ periodDays: { '2026-09-20': true } })['2026-09-20'].flow).toBe(2);
    expect(kanamaDegeri(true)).toBe(2);
  });

  it('doğum sonrası kanama (lohusa) birleştirilmiyor — regl değil', () => {
    expect(KANAMA_ANAHTARLARI).not.toContain('bleeding');
    const s = { periodDays: { '2026-09-20': 2 }, symptomLog: {} };
    expect(gunlukLog(s)['2026-09-20'].bleeding).toBeUndefined();
  });
});

describe('eski kayıtların taşınması', () => {
  it('symptomLog.flow ve .cycle periodDays\'e taşınıyor, symptomLog\'dan çıkıyor', () => {
    const t = akisTasi({ periodDays: {}, periodStart: null, symptomLog: {
      '2026-09-01': { flow: 2, cramps: 1 }, '2026-09-20': { cycle: 3 } } });
    expect(t.periodDays).toEqual({ '2026-09-01': 2, '2026-09-20': 3 });
    expect(t.symptomLog).toEqual({ '2026-09-01': { cramps: 1 }, '2026-09-20': {} });
  });

  it('belirtilerden girilen kanama takvimdekinden yeniyse çapa ona kayıyor', () => {
    const t = akisTasi({ periodDays: { '2026-08-01': true }, periodStart: '2026-08-01',
      symptomLog: { '2026-09-20': { flow: 2 } } });
    expect(t.periodStart).toBe('2026-09-20');
  });

  it('takvimde zaten işaret varsa ona dokunmuyor', () => {
    const t = akisTasi({ periodDays: { '2026-09-20': true }, symptomLog: { '2026-09-20': { flow: 1 } } });
    expect(t.periodDays['2026-09-20']).toBe(true);
    expect(t.symptomLog['2026-09-20']).toEqual({});
  });

  it('doğum sonrası kanamaya dokunmuyor', () => {
    const k = { periodDays: {}, symptomLog: { '2026-09-20': { bleeding: 3 } } };
    expect(akisTasi(k)).toBe(k);
  });

  it('açılışta taşıma çalışıyor', () => {
    expect(kaynak('shared.jsx')).toMatch(/const saved = akisTasi\(loadState\(\)\);/);
  });
});

describe('ekranlar tek kaynağı kullanıyor', () => {
  const dosyalar = ['screens.jsx', 'editorial.jsx', 'doctor-summary.jsx', 'perim-analytics.jsx']
    .filter(f => existsSync(new URL('./' + f, import.meta.url)));
  it.each(dosyalar)('%s kanamayı gunlukLog\'dan okuyor', (f) => {
    expect(kaynak(f)).toMatch(/gunlukLog\(lunara\)/);
  });
  it.each(dosyalar.filter(f => /screens|editorial/.test(f)))('%s kanamayı setFlow ile yazıyor', (f) => {
    expect(kaynak(f)).toMatch(/KANAMA_ANAHTARLARI\.includes\(s\.key\) \? api\.setFlow/);
  });
});
