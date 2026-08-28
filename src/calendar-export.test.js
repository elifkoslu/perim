import { describe, it, expect } from 'vitest';
import { buildIcs, CYCLE_COUNT } from './calendar-export.jsx';

/* Üretilen .ics dosyası kullanıcının telefonundaki takvime, oradan da çoğu
   zaman iCloud/Google'a gider. İki şey kritik: dosyanın geçerli olması ve
   içinde hiçbir sağlık bilgisinin bulunmaması. */

const regimen = {
  cycleLength: 28,
  anchor: '2026-01-01',
  meds: [
    { id: 'e2', name: 'Estradiol', time: '08:00', startDay: 1, endDay: 28, dose: '0.5 mg' },
    { id: 'p4', name: 'Progesteron', time: '22:00', startDay: 15, endDay: 28, dose: '200 mg' },
  ],
};

const satirlar = (ics) => ics.split('\r\n').filter(Boolean);

describe('gizlilik', () => {
  /* Bu kart bilinçli olarak isimsiz: kullanıcının takvimi buluta
     senkronlanıyor olabilir. */
  it('ilaç adı, doz ve miktar dosyaya yazılmaz', () => {
    const { ics } = buildIcs(regimen);
    for (const gizli of ['Estradiol', 'Progesteron', '0.5', '200 mg', 'mg']) {
      expect(ics, gizli).not.toContain(gizli);
    }
  });

  it('etkinlik başlığı yalnızca genel bir hatırlatmadır', () => {
    const { ics } = buildIcs(regimen);
    const basliklar = satirlar(ics).filter(l => l.startsWith('SUMMARY:'));
    expect(basliklar.length).toBeGreaterThan(0);
    for (const b of basliklar) expect(b).toMatch(/Perim/);
  });
});

describe('iCalendar yapısı', () => {
  it('BEGIN/END blokları dengelidir', () => {
    const { ics } = buildIcs(regimen);
    const yigin = [];
    for (const l of satirlar(ics)) {
      if (l.startsWith('BEGIN:')) yigin.push(l.slice(6));
      else if (l.startsWith('END:')) expect(yigin.pop()).toBe(l.slice(4));
    }
    expect(yigin).toHaveLength(0);
  });

  it('her etkinlikte UID, DTSTAMP ve DTSTART bulunur', () => {
    const { ics } = buildIcs(regimen);
    for (const e of ics.split('BEGIN:VEVENT').slice(1)) {
      expect(e).toContain('UID:');
      expect(e).toContain('DTSTAMP:');
      expect(e).toContain('DTSTART:');
    }
  });

  it('UID’ler benzersizdir', () => {
    const { ics } = buildIcs(regimen);
    const uids = ics.match(/UID:[^\r\n]*/g) || [];
    expect(new Set(uids).size).toBe(uids.length);
  });

  it('her etkinliğin bir alarmı vardır', () => {
    const { ics, eventCount } = buildIcs(regimen);
    expect((ics.match(/BEGIN:VALARM/g) || [])).toHaveLength(eventCount);
  });

  it('satırlar 75 okteti aşmaz (RFC 5545)', () => {
    const { ics } = buildIcs(regimen);
    for (const l of satirlar(ics)) {
      expect(new TextEncoder().encode(l).length, l.slice(0, 40)).toBeLessThanOrEqual(75);
    }
  });

  it('CRLF satır sonu kullanır', () => {
    expect(buildIcs(regimen).ics).toContain('\r\n');
  });
});

describe('zamanlama', () => {
  it('aynı saatteki ilaçlar tek alarmda birleşir', () => {
    const ayniSaat = {
      cycleLength: 28, anchor: '2026-01-01',
      meds: [
        { id: 'a', time: '08:00', startDay: 1, endDay: 28, dose: '1' },
        { id: 'b', time: '08:00', startDay: 1, endDay: 28, dose: '2' },
      ],
    };
    // İki ilaç, tek saat → tek günlük seri
    expect(buildIcs(ayniSaat).eventCount).toBe(1);
    expect(buildIcs(ayniSaat).timeCount).toBe(1);
  });

  it('her gün alınan ilaç tek günlük seri olur', () => {
    const hergun = {
      cycleLength: 28, anchor: '2026-01-01',
      meds: [{ id: 'a', time: '08:00', startDay: 1, endDay: 28, dose: '1' }],
    };
    const { ics, eventCount } = buildIcs(hergun);
    expect(eventCount).toBe(1);
    expect(ics).toContain('FREQ=DAILY;COUNT=');
    expect(ics).not.toContain('INTERVAL=');
  });

  it('döngüye bağlı ilaç, döngü uzunluğunda tekrarlar', () => {
    const lutealSadece = {
      cycleLength: 28, anchor: '2026-01-01',
      meds: [{ id: 'p', time: '22:00', startDay: 15, endDay: 28, dose: '1' }],
    };
    const { ics, eventCount } = buildIcs(lutealSadece);
    expect(eventCount).toBe(14);              // 14 gün, her biri kendi serisi
    expect(ics).toContain('INTERVAL=28');
  });

  it('ilacın saati DTSTART’a yansır', () => {
    const gece = {
      cycleLength: 28, anchor: '2026-01-01',
      meds: [{ id: 'p', time: '22:30', startDay: 15, endDay: 28, dose: '1' }],
    };
    expect(buildIcs(gece).ics).toMatch(/DTSTART:\d{8}T223000/);
  });

  it('seriler sınırsız değil — çapa kaydığı için biter', () => {
    const { ics } = buildIcs(regimen);
    for (const r of ics.match(/RRULE:[^\r\n]*/g) || []) {
      expect(r, r).toContain('COUNT=');
    }
    expect(CYCLE_COUNT).toBeGreaterThan(0);
  });

  it('ilaç yoksa dosya üretmez', () => {
    expect(buildIcs({ cycleLength: 28, anchor: '2026-01-01', meds: [] })).toBeNull();
  });
});
