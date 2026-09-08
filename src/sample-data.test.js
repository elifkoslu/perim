import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/* Bu oturumda aynı kusurun dört örneği çıktı: başlangıç durumunda sabit
   kodlanmış bir değer duruyor, onu yazan bir ekran yok, ve bir yer onu
   kullanıcının kendi verisiymiş gibi gösteriyor.

   - menopause.lastPeriod '2024-03-01' → doktor özetinde "Son adet"
   - pregnancy.dueDate '2026-10-08'    → gebelik haftası, trimester
   - pregnancy.weightKg 68             → "Kilo"
   - postpartum.birthDate '2026-06-04' → "Doğumdan bu yana"

   Bu test yenisinin sessizce eklenmesini zorlaştırıyor: kullanıcının
   kendi ölçümü/tarihi olması gereken alanlar boş başlamalı. */

const SRC = path.join(import.meta.dirname, '.');
const kaynak = fs.readFileSync(path.join(SRC, 'shared.jsx'), 'utf8');

// useLunara'nın başlangıç durumu
const baslangic = (() => {
  const i = kaynak.indexOf('const [state, setState] = React.useState(() => {');
  const j = kaynak.indexOf('\n  });', i);
  return kaynak.slice(i, j);
})();

// Yorum satırlarını çıkar — açıklamalardaki eski tarihler eşleşmesin
const kod = baslangic.split('\n').filter(l => {
  const s = l.trim();
  return !(s.startsWith('//') || s.startsWith('/*') || s.startsWith('*'));
}).join('\n');

describe('başlangıç durumu uydurma veri taşımamalı', () => {
  it('kullanıcı verisi olan alanlarda sabit tarih yok', () => {
    const bulunan = [...kod.matchAll(/(\w+):\s*'(\d{4}-\d{2}-\d{2})'/g)].map(m => `${m[1]}: ${m[2]}`);
    expect(bulunan).toEqual([]);
  });

  it('tarih alanları boş başlıyor', () => {
    for (const alan of ['dueDate', 'birthDate']) {
      const m = new RegExp(`${alan}:\\s*([^,\\n]+)`).exec(kod);
      if (m) expect(m[1].trim(), alan).toMatch(/^(null|saved)/);
    }
  });

  it('kilo gibi ölçümler sayıyla başlamıyor', () => {
    const m = /weightKg:\s*([^,\n]+)/.exec(kod);
    if (m) expect(m[1].trim()).toMatch(/^(null|saved)/);
  });
});
