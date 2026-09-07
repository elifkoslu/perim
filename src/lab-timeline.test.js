import { describe, expect, it } from 'vitest';
import { eksen, labSeries } from './lab-timeline.jsx';

/* Ekran eskiden yalnızca son ölçümün durumunu söylüyordu. Üç tarihte
   tahlil varsa üçünün de kendi tarihindeki aralığa göre nerede durduğu
   görünmeli — referans döngü gününe bağlı olduğu için her ölçümün
   aralığı farklı olabilir. */

const oku = (...v) => v.map((value, i) => ({ date: `2026-0${i + 1}-15`, value }));

describe('labSeries', () => {
  it('her ölçümü kendi tarihindeki aralıkla eşler', () => {
    // aynı değer, iki farklı tarihte iki farklı aralık
    const araliklar = { '2026-01-15': [30, 90], '2026-02-15': [200, 500] };
    const s = labSeries(oku(100, 100), d => araliklar[d]);
    expect(s[0].durum).toBe('yuksek');   // 100 > 90
    expect(s[1].durum).toBe('dusuk');    // 100 < 200
  });

  it('aralık içindeki değeri aralıkta sayar, sınırlar dahil', () => {
    const s = labSeries(oku(30, 60, 90), () => [30, 90]);
    expect(s.map(d => d.durum)).toEqual(['aralikta', 'aralikta', 'aralikta']);
  });

  it('aralık bilinmiyorsa durum uydurmaz', () => {
    const s = labSeries(oku(100), () => null);
    expect(s[0].durum).toBe('bilinmiyor');
    expect(s[0].range).toBe(null);
  });

  it('ölçüm yokken boş dizi döner', () => {
    expect(labSeries([], () => [1, 2])).toEqual([]);
    expect(labSeries(null, () => [1, 2])).toEqual([]);
  });

  it('tek ölçümde de aralık ve durum kurar', () => {
    const s = labSeries(oku(45), () => [30, 90]);
    expect(s).toHaveLength(1);
    expect(s[0].durum).toBe('aralikta');
  });
});

describe('eksen', () => {
  it('hem değerleri hem aralıkları kapsar', () => {
    // değer aralığın çok üstünde: nokta grafikten taşmamalı
    const s = labSeries(oku(500), () => [30, 90]);
    const e = eksen(s);
    expect(e.lo).toBeLessThan(30);
    expect(e.hi).toBeGreaterThan(500);
  });

  it('aralık değerlerden genişse bant kırpılmaz', () => {
    const s = labSeries(oku(50), () => [10, 400]);
    const e = eksen(s);
    expect(e.lo).toBeLessThan(10);
    expect(e.hi).toBeGreaterThan(400);
  });

  it('tek noktada düz çizgiye çökmez', () => {
    const e = eksen([{ value: 42, range: null }]);
    expect(e.hi).toBeGreaterThan(e.lo);
  });

  it('çizilecek sayı yoksa eksen kurmaz', () => {
    expect(eksen([])).toBe(null);
    expect(eksen([{ value: null, range: null }])).toBe(null);
  });
});

/* Ovülasyon günü alınmış bir ölçümün referansı 60–534 olabiliyor.
   Eksen bunu tam kapsamaya çalışınca 48→96→210 gibi gerçek bir yükseliş
   grafiğin dörtte birine sıkışıyordu — kullanıcının görmek istediği tam
   olarak o değişim. Aralıklar ekseni sınırlı gerebilir. */
describe('eksen — geniş aralık değişimi ezmesin', () => {
  const genisAralikli = () => labSeries(
    [{ date: '2026-06-02', value: 96 }, { date: '2026-07-08', value: 48 }, { date: '2026-08-24', value: 210 }],
    d => (d === '2026-07-08' ? [60, 534] : [31, 90]),
  );

  it('tek geniş aralık ekseni sonuna kadar germez', () => {
    const e = eksen(genisAralikli());
    expect(e.hi).toBeLessThan(534);
  });

  it('değerler grafiğin anlamlı bir bölümünü kaplar', () => {
    const e = eksen(genisAralikli());
    const kapladigi = (210 - 48) / (e.hi - e.lo);
    expect(kapladigi).toBeGreaterThan(0.4);
  });

  it('bütün değerler eksenin içinde kalır', () => {
    const e = eksen(genisAralikli());
    for (const v of [96, 48, 210]) {
      expect(v).toBeGreaterThanOrEqual(e.lo);
      expect(v).toBeLessThanOrEqual(e.hi);
    }
  });

  it('tek ölçümde aralığın tamamı görünür', () => {
    const e = eksen(labSeries([{ date: '2026-07-08', value: 50 }], () => [10, 400]));
    expect(e.lo).toBeLessThan(10);
    expect(e.hi).toBeGreaterThan(400);
  });
});
