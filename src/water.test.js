import { describe, it, expect } from 'vitest';
import { waterSettings, waterDay, VARSAYILAN_ML, VARSAYILAN_SAATLER } from './water.jsx';
import { buildIcs } from './calendar-export.jsx';

describe('waterSettings', () => {
  it('ayar yoksa altı hatırlatma ve varsayılan bardakla döner', () => {
    const a = waterSettings({});
    expect(a.times).toHaveLength(6);
    expect(a.goal).toBe(6);
    expect(a.servingMl).toBe(VARSAYILAN_ML);
  });

  it('kullanıcının saatlerini ve bardak boyunu kullanır', () => {
    const a = waterSettings({ profile: { water: { times: ['09:00', '15:00'], servingMl: 330 } } });
    expect(a.times).toEqual(['09:00', '15:00']);
    expect(a.goal).toBe(2);        // hedef, hatırlatma sayısı kadar
    expect(a.servingMl).toBe(330);
  });

  /* Kayıt bozuk gelirse ekran çökmemeli — bu uygulamada bozuk state
     geçmişte kalıcı bozulmaya yol açmıştı. */
  it('bozuk ayarda varsayılana düşer', () => {
    expect(waterSettings({ profile: { water: { times: 'metin', servingMl: -5 } } }).times).toEqual(VARSAYILAN_SAATLER);
    expect(waterSettings({ profile: { water: { times: [] } } }).goal).toBe(6);
    expect(waterSettings(null).servingMl).toBe(VARSAYILAN_ML);
  });

  it('saat listesini makul bir üst sınıra çeker', () => {
    const cok = Array.from({ length: 30 }, (_, i) => '0' + (i % 10) + ':00');
    expect(waterSettings({ profile: { water: { times: cok } } }).times.length).toBeLessThanOrEqual(12);
  });
});

describe('waterDay', () => {
  const lunara = { waterLog: { '2026-08-06': [
    { id: 'a', at: '08:00', ml: 250 },
    { id: 'b', at: '11:00', ml: 300 },
  ] } };

  it('kayıt sayısını ve toplam mililitreyi verir', () => {
    const g = waterDay(lunara, '2026-08-06');
    expect(g.count).toBe(2);
    expect(g.totalMl).toBe(550);
  });

  it('kaydı olmayan gün sıfırdır, çökmez', () => {
    expect(waterDay(lunara, '2026-01-01')).toEqual({ entries: [], count: 0, totalMl: 0 });
    expect(waterDay({}, '2026-08-06').count).toBe(0);
    expect(waterDay(null, '2026-08-06').totalMl).toBe(0);
  });

  it('sayı olmayan miktarı toplama katmaz', () => {
    const bozuk = { waterLog: { g: [{ id: 'a', at: '08:00', ml: 'çok' }, { id: 'b', at: '09:00', ml: 200 }] } };
    expect(waterDay(bozuk, 'g').totalMl).toBe(200);
  });
});

describe('su hatırlatmaları takvime giriyor', () => {
  const regimen = { cycleLength: 28, anchor: '2026-01-01',
    meds: [{ id: 'e2', time: '08:00', startDay: 1, endDay: 28, dose: '0.5 mg' }] };

  it('verilen her saat için bir günlük seri üretir', () => {
    const r = buildIcs(regimen, ['09:00', '12:00', '15:00']);
    expect(r.waterCount).toBe(3);
    expect(r.eventCount).toBe(4);          // 1 ilaç + 3 su
  });

  it('su etkinliği ayrı bir başlık taşır', () => {
    const { ics } = buildIcs(regimen, ['09:00']);
    expect(ics).toMatch(/SUMMARY:.*su/i);
    expect(ics).toMatch(/SUMMARY:.*doz/i);
  });

  it('su saatleri verilmezse hiç su etkinliği olmaz', () => {
    expect(buildIcs(regimen, null).waterCount).toBe(0);
    expect(buildIcs(regimen, []).waterCount).toBe(0);
  });

  it('ilaç yokken bile yalnız su için dosya üretilir', () => {
    const r = buildIcs({ cycleLength: 28, anchor: '2026-01-01', meds: [] }, ['09:00', '13:00']);
    expect(r).not.toBeNull();
    expect(r.waterCount).toBe(2);
  });

  it('ne ilaç ne su varsa dosya üretilmez', () => {
    expect(buildIcs({ cycleLength: 28, anchor: '2026-01-01', meds: [] }, [])).toBeNull();
  });

  it('su etkinlikleri de sağlık ayrıntısı sızdırmaz', () => {
    const { ics } = buildIcs(regimen, ['09:00']);
    for (const gizli of ['Estradiol', '0.5', 'mg']) expect(ics, gizli).not.toContain(gizli);
  });
});
