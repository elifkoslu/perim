import { describe, expect, it } from 'vitest';
import { GUN_SAYISI, sonGunler } from './dose-backfill.jsx';

/* İlaçlar ekranı günü tek tek ilerletiyor ve her seferinde tek gün
   gösteriyordu; üstelik doz satırları TODAY_KEY'e sabit olduğu için
   tarih değiştirmek işe yaramıyor, kayıt bugüne yazılıyordu. Ana
   sayfadaki ızgara son günleri alt alta gösteriyor ve her satır kendi
   gününe yazıyor. Bu testler ızgaranın gün gün doğru kurulduğunu
   koruyor. */

const BUGUN = new Date('2026-09-15T00:00:00');

const rejim = (meds) => ({ regimen: { cycleLength: 28, anchor: '2026-09-01', meds }, doseLog: {} });
const ilac = (id, ek = {}) => ({ id, name: id, startDay: 1, endDay: 28, time: '08:00', ...ek });

describe('sonGunler', () => {
  it('rejim yoksa hiç satır kurmaz', () => {
    expect(sonGunler({}, GUN_SAYISI, BUGUN)).toEqual([]);
    expect(sonGunler({ regimen: { meds: [] } }, GUN_SAYISI, BUGUN)).toEqual([]);
  });

  it('bugünden geriye doğru n gün üretir', () => {
    const g = sonGunler(rejim([ilac('e2')]), 3, BUGUN);
    expect(g.map(x => x.key)).toEqual(['2026-09-15', '2026-09-14', '2026-09-13']);
  });

  it('bugün ve dün etiketlenir, gerisi tarihle', () => {
    const g = sonGunler(rejim([ilac('e2')]), 3, BUGUN);
    expect(g[0].label).toBe('Bugün');
    expect(g[1].label).toBe('Dün');
    expect(g[2].label).not.toMatch(/Bugün|Dün/);
  });

  it('alınmış dozu o günün kaydından okur, başka günden değil', () => {
    const l = rejim([ilac('e2')]);
    l.doseLog = { '2026-09-13': { e2: { at: '08:00' } } };   // sadece 13'ü alınmış
    const g = sonGunler(l, 3, BUGUN);
    expect(g.find(x => x.key === '2026-09-13').meds[0].alindi).toBe(true);
    expect(g.find(x => x.key === '2026-09-15').meds[0].alindi).toBe(false);
    expect(g.find(x => x.key === '2026-09-14').meds[0].alindi).toBe(false);
  });

  it('planlı ilaçları gün gün hesaplar — döngüsel rejimde dün bugünden farklı olabilir', () => {
    /* Çapa 1 Eylül: 15 Eylül döngünün 15. günü, 14 Eylül 14. günü.
       Sadece 15. günden itibaren aktif bir ilaç dünün listesinde olmamalı. */
    const l = rejim([ilac('e2'), ilac('p4', { startDay: 15, endDay: 28 })]);
    const g = sonGunler(l, 2, BUGUN);
    expect(g[0].meds.map(m => m.id)).toEqual(['e2', 'p4']);   // bugün (15. gün)
    expect(g[1].meds.map(m => m.id)).toEqual(['e2']);         // dün (14. gün)
  });

  it('ara gününü boş listeyle işaretler, satırı atmaz', () => {
    const l = rejim([ilac('p4', { startDay: 15, endDay: 28 })]);
    const g = sonGunler(l, 2, BUGUN);
    expect(g[1].meds).toEqual([]);   // dün ara günü ama satır duruyor
    expect(g).toHaveLength(2);
  });
});
