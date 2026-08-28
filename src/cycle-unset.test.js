import { describe, expect, it } from 'vitest';
import { bleedExpected, cycleDayFrom, hasCycleAnchor, phaseLabel, phaseOf } from './screens.jsx';

/* REGRESYON: kurulumda hiçbir alan doldurulmadığında periodStart sessizce
   bugüne düşüyordu. Kullanıcı hiçbir bilgi vermemişken uygulama "döngünün
   1. günündesin — menstrüel fazı" diyor, ayın tamamını fazlara boyuyor ve
   beş günü "beklenen kanama" olarak işaretliyordu.

   Bu dosya tek bir kuralı koruyor: çapa yoksa döngü günü de faz da
   BİLİNMİYOR'dur ve uygulama bunun yerine bir şey uydurmaz. */

describe('döngü çapası yokken', () => {
  it('döngü günü null döner, 1 değil', () => {
    expect(cycleDayFrom(null, new Date(2026, 7, 17), 28)).toBe(null);
    expect(cycleDayFrom(undefined, new Date(2026, 7, 17), 28)).toBe(null);
    expect(cycleDayFrom('', new Date(2026, 7, 17), 28)).toBe(null);
  });

  it('faz null döner — menstrüel değil', () => {
    expect(phaseOf(null, 28)).toBe(null);
    expect(phaseOf(cycleDayFrom(null, new Date(2026, 7, 17), 28), 28)).toBe(null);
  });

  it('hasCycleAnchor kaydın gerçekten çapası olup olmadığını söyler', () => {
    expect(hasCycleAnchor(null)).toBe(false);
    expect(hasCycleAnchor({})).toBe(false);
    expect(hasCycleAnchor({ periodStart: null })).toBe(false);
    expect(hasCycleAnchor({ periodStart: '2026-08-09' })).toBe(true);
  });

  /* Beklenen kanama döngü matematiğinden gelir; matematiğin girdisi yoksa
     "beklenen kanama" da yoktur. Takvimin kesikli çerçeveleri buna bakıyor. */
  it('bilinmeyen gün için beklenen kanama hesaplanmaz', () => {
    expect(bleedExpected(null, 28)).toBe(false);
  });

  it('faz etiketi çökmez, bilinmediğini söyler', () => {
    expect(() => phaseLabel(null)).not.toThrow();
    expect(phaseLabel(null)).toBeTruthy();
  });
});

describe('çapa kurulduğunda', () => {
  it('her şey normale döner', () => {
    const bugun = new Date(2026, 7, 17);
    const gun = cycleDayFrom('2026-08-09', bugun, 28);
    expect(gun).toBe(9);
    expect(phaseOf(gun, 28).key).toBe('follicular');
    expect(bleedExpected(cycleDayFrom('2026-08-17', bugun, 28), 28)).toBe(true);
  });
});
