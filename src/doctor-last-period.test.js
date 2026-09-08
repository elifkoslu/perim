import { describe, expect, it } from 'vitest';
import { stageBlockFor } from './doctor-summary.jsx';

/* Doktor özetindeki "Son adet" satırı bir zamanlar sabit bir örnek
   tarihten geliyordu: başlangıç durumunda menopause.lastPeriod
   '2024-03-01' olarak doluydu ve bu alanı yazan hiçbir ekran yoktu.
   Özet "mp.lastPeriod || periodStart" diye okuduğu için takvimden gelen
   gerçek tarihe hiç düşmüyordu — kullanıcı son adetini işaretlese bile
   hekime giden belgede Mart 2024 ve "30 ay" yazıyordu. Klinik olarak da
   yanlış: 30 ay adetsizlik postmenopoz anlamına gelir. */

// stageBlockFor { title, rows } döndürür, satır yoksa null
const satir = (blok, tr) => ((blok && blok.rows) || []).find(r => r.l && r.l.tr === tr);

describe('doktor özeti — son adet', () => {
  it('perimenopozda takvimden gelen tarihi kullanır', () => {
    const rows = stageBlockFor({ stage: 'perimeno', periodStart: '2026-08-20' }, []);
    expect(satir(rows, 'Son adet').v).toBe('2026-08-20');
  });

  it('takvim tarihi, elle girilmiş menopoz tarihini ezer', () => {
    /* Eski hata tam buydu: lastPeriod dolu olduğu için takvim hiç okunmuyordu. */
    const rows = stageBlockFor(
      { stage: 'perimeno', periodStart: '2026-08-20', menopause: { lastPeriod: '2024-03-01' } }, []);
    expect(satir(rows, 'Son adet').v).toBe('2026-08-20');
  });

  it('hiç tarih yoksa satırı uydurmaz', () => {
    const rows = stageBlockFor({ stage: 'perimeno' }, []);
    expect(satir(rows, 'Son adet')).toBeUndefined();
    expect(satir(rows, 'Son adetten bu yana')).toBeUndefined();
  });

  it('menopoz evresinde girilen tarihi kullanır', () => {
    const rows = stageBlockFor({ stage: 'menopause', menopause: { lastPeriod: '2024-03-01' } }, []);
    expect(satir(rows, 'Son adet').v).toBe('2024-03-01');
  });

  it('"bu yana" süresi gösterilen tarihle tutarlı', () => {
    const bugun = new Date();
    const altiAyOnce = new Date(bugun.getFullYear(), bugun.getMonth() - 6, bugun.getDate());
    const iso = altiAyOnce.getFullYear() + '-' + String(altiAyOnce.getMonth() + 1).padStart(2, '0')
      + '-' + String(altiAyOnce.getDate()).padStart(2, '0');
    const rows = stageBlockFor({ stage: 'perimeno', periodStart: iso }, []);
    expect(satir(rows, 'Son adetten bu yana').v).toMatch(/^[56] ay$/);
  });
});
