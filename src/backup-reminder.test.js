import { describe, expect, it } from 'vitest';
import { ESIK_GUN, korunacakVeriVar, yedekDurumu } from './backup-reminder.jsx';

/* Perim'in verisi yalnız cihazda. persist-storage.js tarayıcıdan veriyi
   silmemesini istiyor ama bu garanti değil — tek gerçek güvence dışa
   aktarılmış bir dosya. Uyarı yalnız korunacak veri varken çıkmalı:
   boş bir kayıt için yedek istemek gürültüdür. */

const GUN = 86400000;
const simdi = Date.parse('2026-09-08T12:00:00Z');
const gunOnce = (n) => new Date(simdi - n * GUN).toISOString();

describe('yedek hatırlatması', () => {
  it('hiç veri yokken uyarmaz', () => {
    expect(yedekDurumu({}, simdi)).toBe(null);
    expect(yedekDurumu({ periodDays: {}, symptomLog: {}, labPanels: [] }, simdi)).toBe(null);
  });

  it('veri varken ve hiç yedek alınmamışken uyarır', () => {
    const d = yedekDurumu({ periodDays: { '2026-09-01': true } }, simdi);
    expect(d).toMatchObject({ hicYok: true });
  });

  it('yeni yedek alınmışsa susar', () => {
    const lunara = { labPanels: [{ id: 'a' }], lastExportAt: gunOnce(3) };
    expect(yedekDurumu(lunara, simdi)).toBe(null);
  });

  it('eşiği geçince gün sayısıyla uyarır', () => {
    const lunara = { labPanels: [{ id: 'a' }], lastExportAt: gunOnce(ESIK_GUN + 5) };
    expect(yedekDurumu(lunara, simdi)).toMatchObject({ hicYok: false, gun: ESIK_GUN + 5 });
  });

  it('eşiğin bir gün altında henüz uyarmaz', () => {
    const lunara = { labPanels: [{ id: 'a' }], lastExportAt: gunOnce(ESIK_GUN - 1) };
    expect(yedekDurumu(lunara, simdi)).toBe(null);
  });

  it('bozuk tarih kaydını "hiç yedek yok" sayar', () => {
    /* Sessizce susup kullanıcıyı yedeksiz bırakmaktansa uyarmak yeğ. */
    const lunara = { labPanels: [{ id: 'a' }], lastExportAt: 'bozuk' };
    expect(yedekDurumu(lunara, simdi)).toMatchObject({ hicYok: true });
  });

  it('her kayıt türü korunmaya değer sayılır', () => {
    for (const alan of ['periodDays', 'symptomLog', 'doseLog', 'workoutLog']) {
      expect(korunacakVeriVar({ [alan]: { x: 1 } }), alan).toBe(true);
    }
    expect(korunacakVeriVar({ labPanels: [{ id: 'a' }] })).toBe(true);
  });
});
