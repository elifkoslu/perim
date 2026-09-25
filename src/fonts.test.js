import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/* fonts.css Manrope'un 300–700 ağırlıklarını ve JetBrains Mono 400–500'ü
   istiyordu ama diskte yalnız Manrope 300 ve JetBrains Mono 400 vardı —
   10 dosya hiç olmamış. Geliştirme sunucusu eksik dosya yerine sayfanın
   kendisini 200 ile döndürdüğü için yerelde fark edilmiyordu; tarayıcı
   HTML'i yazı tipi olarak okuyamayıp sessizce sistem yazı tipine
   geçiyordu. Yayında 404 veriyordu (Lunara'nın canlı sitesi dahil).
   Arayüzün ana yazı tipi normal, orta ve kalın ağırlıklarda hiç
   yüklenmemişti. */

const KOK = path.join(import.meta.dirname, '..');

describe('yazı tipleri', () => {
  const css = fs.readFileSync(path.join(KOK, 'src', 'fonts.css'), 'utf8');
  const istenen = [...new Set([...css.matchAll(/url\(['"]?\/?(fonts\/[^'")]+\.woff2)/g)].map(m => m[1]))];

  it('CSS en az bir yazı tipi dosyası istiyor (test kendini kandırmasın)', () => {
    expect(istenen.length).toBeGreaterThan(10);
  });

  it('istenen her dosya public/ altında var ve gerçekten WOFF2', () => {
    const sorunlu = istenen.filter(f => {
      const p = path.join(KOK, 'public', f);
      if (!fs.existsSync(p)) return true;
      return fs.readFileSync(p).subarray(0, 4).toString() !== 'wOF2';
    });
    expect(sorunlu).toEqual([]);
  });
});
