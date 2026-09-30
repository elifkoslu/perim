import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { temizleYedek } from './profile.jsx';

describe('yedek dosyası', () => {
  it('su kaydı geri yüklemede korunuyor', () => {
    const w = { '2026-09-29': [{ id: 'w1', at: '10:00', ml: 250 }] };
    expect(temizleYedek({ waterLog: w }).waterLog).toEqual(w);
  });
  it('dosya adı uygulamanın kendi adı ve tarihi', () => {
    const kaynak = readFileSync(new URL('./profile.jsx', import.meta.url), 'utf8');
    expect(kaynak).not.toMatch(/'lunara-data\.json'/);
    expect(kaynak).toMatch(/a\.download = '[a-z]+-yedek-' \+ getTodayKey\(\) \+ '\.json';/);
  });
});
