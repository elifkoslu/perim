import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ilacIleri, kalanGunler, ostrojenMi, rejimAraGunu, rejimdeAraVar, tarihAnahtari } from './kalan-gun.js';
import { regimenDay } from './shared.jsx';

/* "Bu ilacı bu döngüde daha kaç gün kullanacağım?" — yalnızca programdan
   hesaplanıyor. Rejim 1 Eylül'de 1. gün; 28 günlük döngü. */
const rejim = (meds, cycleLength = 28) => ({ anchor: '2026-09-01', cycleLength, meds });
const gun = (iso) => new Date(iso + 'T00:00:00');
const k = (d) => tarihAnahtari(d);

const progesteron = { id: 'p', name: 'Progesteron', dose: '100 mg', startDay: 15, endDay: 26 };
const estradiol = { id: 'e', name: 'Estradiol', dose: '1 mg', startDay: 1, endDay: 28 };

describe('bugün planlı ilaç', () => {
  // 20 Eylül = 20. gün; progesteron 15–26 → 20..26 = 7 gün
  const r = ilacIleri(rejim([progesteron]), progesteron, gun('2026-09-20'));

  it('bugün dahil kalan gün ve son doz', () => {
    expect(r.aktif).toBe(true);
    expect(r.kalan).toBe(7);
    expect(k(r.sonDoz)).toBe('2026-09-26');
  });

  it('dönemin kaçıncı günü', () => {
    expect(r.donemGunu).toBe(6);
    expect(r.donemUzunluk).toBe(12);
  });

  it('aradan sonra ne zaman yeniden başlıyor', () => {
    expect(k(r.sonraki)).toBe('2026-10-13');   // ikinci döngünün 15. günü
    expect(r.sonrakiSure).toBe(12);
  });

  it('son doz günü: 1 gün kaldı', () => {
    expect(ilacIleri(rejim([progesteron]), progesteron, gun('2026-09-26')).kalan).toBe(1);
  });
});

describe('bugün planlı olmayan ilaç', () => {
  it('kaç gün sonra başlıyor, ne kadar sürecek', () => {
    const r = ilacIleri(rejim([progesteron]), progesteron, gun('2026-09-05'));
    expect(r.aktif).toBe(false);
    expect(r.kalanaKadar).toBe(10);
    expect(k(r.sonraki)).toBe('2026-09-15');
    expect(r.sonrakiSure).toBe(12);
  });
});

describe('özel durumlar', () => {
  it('her gün alınan ilaç: ara yok', () => {
    expect(ilacIleri(rejim([estradiol]), estradiol, gun('2026-09-20'))).toEqual({ aktif: true, surekli: true, doz: '1 mg' });
  });

  it('döngü sonundan başına saran aralık tek dönem sayılıyor', () => {
    const m = { id: 'x', name: 'X', dose: '1', startDay: 25, endDay: 3 };  // 25..28 + 1..3 = 7 gün
    const r = ilacIleri(rejim([m]), m, gun('2026-09-27'));                // 27. gün
    expect(r.kalan).toBe(5);                                               // 27, 28, 1, 2, 3
    expect(k(r.sonDoz)).toBe('2026-10-01');
    expect(r.donemUzunluk).toBe(7);
  });

  it('dönem içinde doz değişiyorsa tarihi ve yeni doz', () => {
    const m = { id: 'e2', name: 'Estradiol', dose: '0.5 mg',
      schedule: [{ startDay: 1, endDay: 14, dose: '0.5 mg' }, { startDay: 15, endDay: 25, dose: '0.75 mg' }] };
    const r = ilacIleri(rejim([m]), m, gun('2026-09-10'));
    expect(r.kalan).toBe(16);                                              // 10..25
    expect(k(r.dozDegisimi.tarih)).toBe('2026-09-15');
    expect(r.dozDegisimi.doz).toBe('0.75 mg');
  });

  it('hiçbir günü kapsamayan ilaç listelenmiyor', () => {
    const bozuk = { id: 'b', name: 'B', dose: '1', startDay: 40, endDay: 45 };
    expect(kalanGunler(rejim([progesteron, bozuk]), gun('2026-09-20')).map(x => x.med.id)).toEqual(['p']);
  });

  it('program yoksa boş liste', () => {
    expect(kalanGunler(null, gun('2026-09-20'))).toEqual([]);
  });
});

describe('rejim günü', () => {
  it('ileri tarihlerde her takvim günü bir rejim günü ilerliyor', () => {
    const r = rejim([]);
    const d = gun('2026-09-01');
    for (let i = 0; i < 200; i++) {
      const g = new Date(d); g.setDate(g.getDate() + i);
      expect(regimenDay(r, g)).toBe((i % 28) + 1);
    }
  });

  it('floor değil round — yaz saati geçişinde gün kaymasın', () => {
    expect(readFileSync(new URL('./shared.jsx', import.meta.url), 'utf8'))
      .toMatch(/const d = Math\.round\(\(gun - anchor\) \/ 86400000\);/);
  });

  it('saat taşıyan tarih o günün rejim günü (hatırlatıcı öğleden sonra da doğru)', () => {
    const r = rejim([]);
    expect(regimenDay(r, new Date('2026-09-10T23:30:00'))).toBe(10);
    expect(regimenDay(r, new Date('2026-09-10T00:10:00'))).toBe(10);
  });
});

describe('ileri tarih önizlemesi', () => {
  const kaynak = readFileSync(new URL('./perim-meds.jsx', import.meta.url), 'utf8');

  it('ortak kayıt tarihi (logDate) geleceğe hiç gitmiyor', () => {
    expect(kaynak).toMatch(/if \(k > bugunKey\) setOnizleme\(k\);\s*else \{ setOnizleme\(null\); setLogDate\(k\); \}/);
    expect(kaynak).not.toMatch(/<DateNav date=\{dk\} onChange=\{setLogDate\}/);
  });

  it('gelecek yalnızca BHRT bölümünde açılıyor', () => {
    expect(kaynak).toMatch(/maxDate=\{bolum === 'bhrt' && !rejimYok \? ileriSinir : undefined\}/);
    expect(kaynak).toMatch(/const dk = \(bolum === 'bhrt' && onizleme\) \|\| logDate \|\| bugunKey;/);
  });

  it('gelecek günün dozları işaretlenemiyor', () => {
    expect(kaynak).toMatch(/<DozSatiri key=\{d\.id\} dose=\{d\} onizleme /);
    expect(kaynak).toMatch(/onClick=\{onizleme \? undefined : onToggle\}/);
  });
});

describe('son regl bilinmiyorken', () => {
  it('dozlar hormon kartı olmadan da gösteriliyor', () => {
    const kaynak = readFileSync(new URL('./perim-meds.jsx', import.meta.url), 'utf8');
    expect(kaynak).toMatch(/\{gun == null \? <Card>\{dozlar\}<\/Card>/);
  });
});

describe('östrojen arası', () => {
  // 28 günlük rejim, 1 Eylül 1. gün; estradiol 1–24, progesteron 13–24, DHEA her gün
  const e = { id: 'e', name: 'Estradiol', dose: '1', startDay: 1, endDay: 24 };
  const p = { id: 'p', name: 'Progesteron', dose: '1', startDay: 13, endDay: 24 };
  const dhea = { id: 'd', name: 'DHEA', dose: '10 mg', startDay: 1, endDay: 28 };
  const r = rejim([e, p, dhea]);

  it('östrojenin planlı olmadığı günler ara — başka ilaçlar sürse de', () => {
    expect(rejimdeAraVar(r)).toBe(true);
    expect(rejimAraGunu(r, gun('2026-09-24'))).toBe(false);
    expect(rejimAraGunu(r, gun('2026-09-25'))).toBe(true);    // DHEA sürüyor, yine ara
    expect(rejimAraGunu(r, gun('2026-09-28'))).toBe(true);
    expect(rejimAraGunu(r, gun('2026-09-29'))).toBe(false);   // yeni rejim döngüsü
  });

  it('progesteronun kesildiği ama östrojenin sürdüğü günler ara değil', () => {
    const r2 = rejim([{ ...e, startDay: 1, endDay: 28 }, p]);
    expect(rejimdeAraVar(r2)).toBe(false);
  });

  it('östrojen yoksa ara yok', () => {
    expect(rejimdeAraVar(rejim([p, dhea]))).toBe(false);
    expect(rejimdeAraVar(rejim([]))).toBe(false);
    expect(rejimdeAraVar(null)).toBe(false);
  });

  it('adından tanıma', () => {
    for (const ad of ['Estradiol', 'estradiol valerat', 'Östrojen jel', 'ostrojen', 'Estrogel', 'Oestrogel', 'Estriol krem', 'Divigel', 'Sandrena', 'Climara', 'Progynova', 'Lenzetto'])
      expect(ostrojenMi({ name: ad })).toBe(true);
    for (const ad of ['Progesteron', 'Progesterone', 'Utrogestan', 'Dydrogesterone', 'Norethisterone', 'Testosteron', 'DHEA'])
      expect(ostrojenMi({ name: ad })).toBe(false);
  });

  it('elle işaret addan önce gelir', () => {
    expect(ostrojenMi({ name: 'Femoston', ostrojen: true })).toBe(true);
    expect(ostrojenMi({ name: 'Estradiol', ostrojen: false })).toBe(false);
  });
});

describe('ana takvim', () => {
  const kaynak = readFileSync(new URL('./perim-home.jsx', import.meta.url), 'utf8');
  it('rejimde ara varsa beklenen kanama aradan', () => {
    expect(kaynak).toMatch(/const bekleniyor = araVar \? ara : \(cd != null && bleedExpected\(cd, L\)\);/);
  });
  it('döngü uzadıysa başlık menstrüel demiyor', () => {
    expect(kaynak).toMatch(/YENİ REGL HENÜZ GELMEDİ/);
  });
});
