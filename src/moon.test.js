import { describe, expect, it } from 'vitest';
import { BEDEN, GELENEK, moonNote } from './moon.jsx';
import { moonMask, moonPhase } from './screens.jsx';

/* Ay şeridinin iki katmanı ayrı tutulmalı: "bedeninde" kullanıcının
   döngü gününden gelir, "gelenekte" ayın evresinden. Ayın evresi
   bedene dair bir iddia taşımamalı — bu testler o sınırı koruyor. */

// 2026 için bilinen evreler (UTC öğlen, evre sınırlarından uzak günler)
const YENI_AY  = new Date(Date.UTC(2026, 0, 18, 12));
const DOLUNAY  = new Date(Date.UTC(2026, 0, 3, 12));

describe('moonNote', () => {
  it('sekiz evrenin hepsi için gelenek metni var', () => {
    const adlar = ['New', 'Waxing crescent', 'First quarter', 'Waxing gibbous',
                   'Full', 'Waning gibbous', 'Last quarter', 'Waning crescent'];
    for (const ad of adlar) expect(GELENEK[ad], ad).toBeTruthy();
  });

  it('evre adını ve aydınlık oranını tarihten hesaplar', () => {
    const yeni = moonNote(YENI_AY, null);
    const dolu = moonNote(DOLUNAY, null);
    expect(yeni.isik).toBeLessThan(15);
    expect(dolu.isik).toBeGreaterThan(85);
  });

  it('döngü çapası yokken beden katmanını hiç kurmaz', () => {
    const n = moonNote(DOLUNAY, null);
    expect(n.beden).toBe('');
    expect(n.gelenek.length).toBeGreaterThan(0);   // gökyüzü yine de anlatılır
  });

  it('beden katmanı ayın evresinden değil döngü fazından gelir', () => {
    const yeniAydaLuteal = moonNote(YENI_AY, 'luteal');
    const dolunaydaLuteal = moonNote(DOLUNAY, 'luteal');
    expect(yeniAydaLuteal.beden).toBe(dolunaydaLuteal.beden);
    expect(dolunaydaLuteal.beden).not.toBe(moonNote(DOLUNAY, 'menstrual').beden);
  });

  it('her döngü fazının kendi fizyoloji metni var', () => {
    for (const k of ['menstrual', 'follicular', 'ovulation', 'luteal']) {
      expect(moonNote(DOLUNAY, k).beden, k).toBeTruthy();
    }
  });

  it('gelenek metinleri bedene dair iddia kurmaz', () => {
    /* "dolunayda kanarsın", "enerjin yükselir" gibi cümleler buraya
       sızarsa uygulama kullanıcının bedeni hakkında dayanaksız
       konuşmaya başlar — labNote'ta düzelttiğimiz kusurun aynısı. */
    const yasak = /kanam|regl|döngün|hormon|östrojen|progesteron|enerjin|bedenin/i;
    for (const [ad, [en, tr]] of Object.entries(GELENEK)) {
      expect(tr, ad).not.toMatch(yasak);
      expect(en, ad).not.toMatch(/bleed|period|your cycle|hormone|estrogen|your energy|your body/i);
    }
  });

  it('fizyoloji metinleri aya atıf yapmaz', () => {
    for (const [k, [en, tr]] of Object.entries(BEDEN)) {
      expect(tr, k).not.toMatch(/\bay\b|dolunay|hilal/i);
      expect(en, k).not.toMatch(/moon|lunar/i);
    }
  });
});

/* MoonDisc bir zamanlar gölgeyi cos(frac·2π)·r ile yerleştiriyordu:
   yeni ay yarım ay gibi, dördünler kararmış daire gibi çiziliyordu.
   Gölgenin yeri artık aydınlık orandan geliyor. */
describe('moonMask', () => {
  const yeni = 0, ilkDordun = 0.25, dolu = 0.5, sonDordun = 0.75;

  it('yeni ayda gölge diski tamamen örter', () => {
    expect(moonMask(yeni).off).toBeCloseTo(0, 5);
  });

  it('dolunayda gölge diskin tamamen dışına çıkar', () => {
    const { r, off } = moonMask(dolu);
    expect(off).toBeCloseTo(2 * r, 5);
  });

  it('dördünlerde gölge yarıyı örter', () => {
    const { r } = moonMask(ilkDordun);
    expect(moonMask(ilkDordun).off).toBeCloseTo(r, 5);
    expect(moonMask(sonDordun).off).toBeCloseTo(r, 5);
  });

  it('büyüyen ayda gölge solda, küçülende sağda kalır', () => {
    expect(moonMask(ilkDordun).waxing).toBe(true);
    expect(moonMask(sonDordun).waxing).toBe(false);
  });

  it('aydınlık oran arttıkça gölge tekdüze uzaklaşır', () => {
    const artan = [0, 0.1, 0.2, 0.3, 0.4, 0.5].map(f => moonMask(f).off);
    for (let i = 1; i < artan.length; i++) expect(artan[i]).toBeGreaterThan(artan[i - 1]);
  });
});
