import { describe, expect, it } from 'vitest';
import { NAV_META, mobileNav } from './mobile.jsx';
import { navItemsFor } from './shared.jsx';

/* Perim tek evreli: perimenopoz. Beş bölüm barda birden sığıyor, "Daha"
   menüsü yok. Bu testler navigasyonun tek kaynaktan türemesini koruyor —
   Womentum'da bar elle yazılmış sabit bir listeydi ve evre ayarını hiç
   uygulamıyordu; aynı ayrışma burada tekrar oluşmasın. */

describe('mobileNav', () => {
  it('navItemsFor ile aynı bölümleri gösterir', () => {
    const beklenen = navItemsFor().map(i => i.k);
    expect(mobileNav().tabs.map(i => i.k)).toEqual(beklenen);
  });

  it('beş bölümün hepsi barda, taşan yok', () => {
    const { tabs, more } = mobileNav();
    expect(tabs).toHaveLength(5);
    expect(more).toHaveLength(0);
  });

  it('takvim ilk sırada — uygulama oraya açılıyor', () => {
    expect(mobileNav().tabs[0].k).toBe('home');
  });

  it('beklenen bölümler eksiksiz', () => {
    expect(mobileNav().tabs.map(i => i.k))
      .toEqual(['home', 'meds', 'symptoms', 'move', 'analytics']);
  });

  it('profil bara çıkmaz — başlıktaki avatardan açılıyor', () => {
    expect(mobileNav().tabs.map(i => i.k)).not.toContain('profile');
  });

  it('her bölümün ikonu ve iki dilde etiketi var', () => {
    for (const i of mobileNav().tabs) {
      expect(NAV_META[i.k]).toBeTruthy();
      expect(i.icon).toBeTruthy();
      expect(i.en).toBeTruthy();
      expect(i.tr).toBeTruthy();
    }
  });

  it('aynı bölüm iki kez görünmez', () => {
    const k = mobileNav().tabs.map(i => i.k);
    expect(new Set(k).size).toBe(k.length);
  });
});
