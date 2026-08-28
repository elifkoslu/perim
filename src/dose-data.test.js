import { describe, it, expect } from 'vitest';
import { doseEntry, medSchedule, medSlotFor, activeMeds } from './shared.jsx';

/* Doz kayıtlarının iki biçimi de yaşamak zorunda: eski sürümlerde doz yalnızca
   'HH:MM' metniydi, ilaçlarda tek bir gün aralığı vardı. Bu testler geriye
   dönük uyumun sessizce kırılmasını engeller — kırılırsa kullanıcının geçmiş
   kayıtları görünmez olur. */

describe('doseEntry — geriye dönük uyum', () => {
  it('eski metin biçimini okur', () => {
    expect(doseEntry('08:30')).toEqual({ at: '08:30', amount: null, unit: '' });
  });
  it('yeni nesne biçimini okur', () => {
    expect(doseEntry({ at: '09:00', amount: 0.75, unit: 'mg' }))
      .toEqual({ at: '09:00', amount: 0.75, unit: 'mg' });
  });
  it('alınmamış dozu null sayar', () => {
    expect(doseEntry(undefined)).toBeNull();
    expect(doseEntry(false)).toBeNull();
  });
  it('virgüllü ondalığı sayıya çevirir', () => {
    expect(doseEntry({ at: '08:00', amount: '0,5' }).amount).toBe(0.5);
  });
  it('sayı olmayan miktarı null yapar, kaydı bozmaz', () => {
    const e = doseEntry({ at: '08:00', amount: 'yarım' });
    expect(e.amount).toBeNull();
    expect(e.at).toBe('08:00');
  });
});

describe('medSchedule — tek ve çok aralıklı ilaç', () => {
  const eskiKayit = { id: 'm1', dose: '200 mg', startDay: 15, endDay: 28 };
  const yeniKayit = {
    id: 'm2', dose: '0.5 mg', startDay: 1, endDay: 28,
    schedule: [
      { startDay: 1, endDay: 14, dose: '0.5 mg' },
      { startDay: 15, endDay: 28, dose: '0.75 mg' },
    ],
  };

  it('eski tek aralıklı kaydı tek dilim olarak verir', () => {
    expect(medSchedule(eskiKayit)).toEqual([{ startDay: 15, endDay: 28, dose: '200 mg' }]);
  });

  it('çok aralıklı kayıtta her dilimin kendi dozu olur', () => {
    const s = medSchedule(yeniKayit);
    expect(s).toHaveLength(2);
    expect(s[0].dose).toBe('0.5 mg');
    expect(s[1].dose).toBe('0.75 mg');
  });

  it('dilimde doz yoksa ilacın kendi dozuna düşer', () => {
    const m = { dose: '100 mg', startDay: 1, endDay: 28, schedule: [{ startDay: 1, endDay: 10 }] };
    expect(medSchedule(m)[0].dose).toBe('100 mg');
  });

  it('o güne düşen dilimi bulur', () => {
    expect(medSlotFor(yeniKayit, 5).dose).toBe('0.5 mg');
    expect(medSlotFor(yeniKayit, 20).dose).toBe('0.75 mg');
    expect(medSlotFor(eskiKayit, 5)).toBeNull();      // aralık dışı
    expect(medSlotFor(eskiKayit, 20).dose).toBe('200 mg');
  });

  it('döngü sonundan başına saran aralığı da kapsar', () => {
    const saran = { dose: '1 mg', startDay: 26, endDay: 3 };
    expect(medSlotFor(saran, 27)).not.toBeNull();
    expect(medSlotFor(saran, 2)).not.toBeNull();
    expect(medSlotFor(saran, 10)).toBeNull();
  });
});

describe('activeMeds — o günün dozu', () => {
  const regimen = {
    cycleLength: 28,
    meds: [
      { id: 'e2', name: 'Estradiol', dose: '0.5 mg', startDay: 1, endDay: 28,
        schedule: [
          { startDay: 1, endDay: 14, dose: '0.5 mg' },
          { startDay: 15, endDay: 28, dose: '0.75 mg' },
        ] },
      { id: 'p4', name: 'Progesteron', dose: '200 mg', startDay: 15, endDay: 28 },
    ],
  };

  it('folliküler günde yalnız estradiol, düşük dozla', () => {
    const m = activeMeds(regimen, 5);
    expect(m).toHaveLength(1);
    expect(m[0].id).toBe('e2');
    expect(m[0].dose).toBe('0.5 mg');
  });

  it('luteal günde iki ilaç, estradiol yüksek dozla', () => {
    const m = activeMeds(regimen, 20);
    expect(m.map(x => x.id).sort()).toEqual(['e2', 'p4']);
    expect(m.find(x => x.id === 'e2').dose).toBe('0.75 mg');
  });

  it('rejim yoksa boş liste döner, çökmez', () => {
    expect(activeMeds(null, 5)).toEqual([]);
    expect(activeMeds({}, 5)).toEqual([]);
  });
});
