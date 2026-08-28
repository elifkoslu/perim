import { describe, it, expect } from 'vitest';
import { temizleYedek } from './profile.jsx';

/* İçe aktarılan yedek dosyası uygulamanın tek dış girdi kanalı. Doğrulama
   gevşerse, geçerli JSON ama yanlış tipte alan içeren bir dosya uygulamayı
   kalıcı olarak açılamaz hale getirir: kayıt localStorage'a yazılır, her
   açılışta aynı çökme olur ve kullanıcı verisini dışa bile aktaramaz. */

describe('geçerli yedek', () => {
  it('tanınan alanları olduğu gibi alır', () => {
    const y = {
      onboarded: true, stage: 'perimeno', periodStart: '2026-01-01',
      profile: { name: 'Elif' }, symptomLog: { '2026-01-01': { mood: 2 } },
      notes: [], labPanels: [], regimen: { cycleLength: 28, meds: [] },
    };
    expect(temizleYedek(y)).toEqual(y);
  });

  it('meds olmayan bir regimen de kabul edilir', () => {
    const r = temizleYedek({ regimen: { cycleLength: 28 } });
    expect(r.regimen.cycleLength).toBe(28);
  });
});

describe('tip karışıklığı — kalıcı bozulmanın kaynağı', () => {
  /* REGRESYON: bu dosya kabul edildiğinde regimen.meds.filter çöküyordu ve
     uygulama bir daha açılmıyordu. */
  it('dizi beklenen regimen.meds metinse o alan atılır', () => {
    const r = temizleYedek({ profile: { name: 'X' }, regimen: { cycleLength: 28, meds: 'dizi degil' } });
    expect(r.regimen).toBeUndefined();
    expect(r.profile).toEqual({ name: 'X' });
  });

  it('nesne beklenen günlükler metinse atılır', () => {
    const r = temizleYedek({ profile: {}, symptomLog: 'metin', doseLog: 42, suppLog: [] });
    expect(r.symptomLog).toBeUndefined();
    expect(r.doseLog).toBeUndefined();
    expect(r.suppLog).toBeUndefined();
  });

  it('dizi beklenen alanlar nesneyse atılır', () => {
    const r = temizleYedek({ profile: {}, notes: { a: 1 }, labPanels: {}, supplements: 5 });
    expect(r.notes).toBeUndefined();
    expect(r.labPanels).toBeUndefined();
    expect(r.supplements).toBeUndefined();
  });

  it('onboarded boolean değilse atılır', () => {
    expect(temizleYedek({ profile: {}, onboarded: 'evet' }).onboarded).toBeUndefined();
  });

  it('kurtarılabilir alan varsa dosya tümden reddedilmez', () => {
    const r = temizleYedek({ profile: { name: 'X' }, onboarded: true, symptomLog: 'bozuk' });
    expect(r).not.toBeNull();
    expect(r.profile.name).toBe('X');
  });
});

describe('reddedilen dosyalar', () => {
  it('tanınan hiçbir alan yoksa null', () => {
    expect(temizleYedek({ rastgele: 1, baska: 'sey' })).toBeNull();
  });
  it('nesne olmayan girdi null', () => {
    expect(temizleYedek(null)).toBeNull();
    expect(temizleYedek('metin')).toBeNull();
    expect(temizleYedek(42)).toBeNull();
    expect(temizleYedek([1, 2])).toBeNull();
  });
  it('tüm alanları bozuk bir dosya null', () => {
    expect(temizleYedek({ symptomLog: 'a', notes: 'b', labPanels: 'c' })).toBeNull();
  });
});

describe('prototip kirletme', () => {
  it('__proto__ ve constructor şemada olmadığı için taşınmaz', () => {
    const r = temizleYedek(JSON.parse('{"__proto__":{"pwned":1},"constructor":{"x":1},"profile":{"name":"X"}}'));
    expect(Object.keys(r)).toEqual(['profile']);
    expect({}.pwned).toBeUndefined();
    expect(Object.prototype.pwned).toBeUndefined();
  });
});
