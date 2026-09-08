import { describe, expect, it } from 'vitest';
import { parseEnabizLines } from './lab-import.jsx';

/* e-Nabız ayrıştırıcısı, devlet sağlık raporunu hekimin göreceği sayılara
   çeviriyor. Buradaki bir hata gürültülü değil sessizdir: yanlış sütun,
   yanlış tarih grubu ya da ondalık ayırıcısının kaçması, ekranda makul
   görünen ama yanlış bir klinik değer üretir. Kod satılabilir bir sağlık
   uygulamasında en riskli parça ve hiç testi yoktu. */

const oku = (satirlar) => parseEnabizLines(satirlar);
const bul = (gruplar, tarih, key) =>
  (gruplar.find(g => g.date === tarih)?.readings || []).find(r => r.key === key);

describe('e-Nabız ayrıştırıcı', () => {
  it('tarihi ISO biçimine çevirir ve tahlilleri o tarihe bağlar', () => {
    const g = oku([['24.08.2026'], ['Estradiol', '210', 'pg/mL', '31-90']]);
    expect(g).toHaveLength(1);
    expect(g[0].date).toBe('2026-08-24');
    expect(g[0].readings[0].value).toBe(210);
  });

  it('ondalık virgülü doğru okur', () => {
    /* Türkçe raporlarda "3,9" yazıyor. Nokta beklenip virgül gelirse
       parseFloat 3 döner — %60 sapma, ve hiçbir uyarı çıkmaz. */
    const g = oku([['07.09.2026'], ['TSH', '3,9', 'uIU/mL', '0,35-4,94']]);
    const r = g[0].readings[0];
    expect(r.value).toBe(3.9);
    expect(r.range).toEqual([0.35, 4.94]);
  });

  it('serbest testosteronu testosteronla karıştırmaz', () => {
    /* HORMONE_MAP sırası önemli: /test[eo]steron/ önce gelseydi serbest
       testosteron da 't' anahtarına düşer, iki farklı analit tek grafikte
       birleşirdi. */
    const g = oku([['01.06.2026'],
      ['Serbest Testosteron', '2,1', 'pg/mL'],
      ['Testosteron', '45', 'ng/dL']]);
    expect(bul(g, '2026-06-01', 'ft').value).toBe(2.1);
    expect(bul(g, '2026-06-01', 't').value).toBe(45);
  });

  it('farklı tarihleri ayrı panellere ayırır', () => {
    const g = oku([
      ['02.06.2026'], ['Estradiol', '96', 'pg/mL'],
      ['08.07.2026'], ['Estradiol', '48', 'pg/mL'],
    ]);
    expect(g.map(x => x.date).sort()).toEqual(['2026-06-02', '2026-07-08']);
    expect(bul(g, '2026-06-02', 'e2').value).toBe(96);
    expect(bul(g, '2026-07-08', 'e2').value).toBe(48);
  });

  it('ayrı satırdaki referans aralığını önceki tahlile iliştirir', () => {
    // Sayfa sonuna denk gelen tahlilin aralığı sonraki satırda gelebiliyor
    const g = oku([['24.08.2026'], ['SHBG', '64', 'nmol/L'], ['25-90']]);
    expect(bul(g, '2026-08-24', 'shbg').range).toEqual([25, 90]);
  });

  it('birimi rapor vermediyse uydurmaz', () => {
    /* Kayıt defterindeki birimi varsaymak, raporun birimi farklıysa
       yanlış yoruma yol açar. */
    const g = oku([['24.08.2026'], ['Estradiol', '210']]);
    expect(bul(g, '2026-08-24', 'e2').unit).toBe('');
  });

  it('başlık ve künye satırlarını tahlil sanmaz', () => {
    const g = oku([
      ['24.08.2026'],
      ['Sayfa', '1'], ['Doğum Tarihi', '1980'], ['Adı Soyadı', '123'],
      ['Estradiol', '210', 'pg/mL'],
    ]);
    expect(g[0].readings).toHaveLength(1);
    expect(g[0].readings[0].key).toBe('e2');
  });

  it('tanımadığı analiti atmaz, kendi anahtarıyla saklar', () => {
    const g = oku([['24.08.2026'], ['Ferritin', '18', 'ng/mL', '13-150']]);
    const r = g[0].readings[0];
    expect(r.key).toMatch(/^enb-/);
    expect(r.name).toBe('Ferritin');
    expect(r.value).toBe(18);
  });

  it('aynı tahlil iki kez geçerse ilkini tutar', () => {
    const g = oku([['24.08.2026'], ['Estradiol', '210', 'pg/mL'], ['Estradiol', '999', 'pg/mL']]);
    expect(g[0].readings).toHaveLength(1);
    expect(g[0].readings[0].value).toBe(210);
  });

  it('değeri olmayan satırdan tahlil üretmez', () => {
    const g = oku([['24.08.2026'], ['Estradiol'], ['Açıklama', 'yok']]);
    expect(g).toEqual([]);
  });
});
