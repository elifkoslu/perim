import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/* Gizlilik metni yalnızca kodun gerçekten yaptığını söylemeli. Eski metin
   olmayan bir AI sohbetini (Anthropic), kullanılmayan Google Fonts'u ve var
   olmayan bir adresi (privacy@lunara.app) anlatıyordu. */
const kaynak = readFileSync(new URL('./profile.jsx', import.meta.url), 'utf8');
const metin = kaynak.slice(kaynak.indexOf('function PrivacyModal'), kaynak.indexOf('function PrivSection'));

describe('gizlilik metni', () => {
  it('olmayan şeyleri söylemiyor', () => {
    expect(metin).not.toMatch(/Anthropic|lunara\.app|Google Fonts'tur|Export & delete|onay vermiş sayılırsın/);
  });
  it('dış bağlantı yok — CSP ile uyumlu', () => {
    const vercel = readFileSync(new URL('../vercel.json', import.meta.url), 'utf8');
    expect(vercel).toMatch(/connect-src 'self';/);
    expect(metin).toMatch(/başka servislere bağlanmaz/);
  });
  it('haklar uygulamadaki gerçek düğmelere gidiyor', () => {
    for (const ad of ['Girdilerim', 'Verilerimi dışa aktar', 'Tüm verilerimi sil']) {
      expect(metin).toContain(ad);
      expect(kaynak.replace(metin, '')).toContain(ad);
    }
  });
});
