import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/* DoctorSummary ekranı kaplayan sabit bir katman (position: fixed,
   inset: 0). Kapanmanın tek yolu onClose; geçilmezse "Kapat" düğmesi de
   arka plana tıklamak da ölü kalıyor ve katman altındaki her şeyi
   örttüğü için kullanıcı sayfayı yenilemeden çıkamıyor.

   perim-analytics.jsx'te tam olarak bu olmuştu. Test ortamında DOM yok,
   bu yüzden bileşen render edilerek denenemiyor — bunun yerine çağrı
   yerleri kaynakta denetleniyor. */

const SRC = path.join(import.meta.dirname, '.');

function jsxDosyalari() {
  return fs.readdirSync(SRC).filter(f => f.endsWith('.jsx')).map(f => path.join(SRC, f));
}

// <DoctorSummary ... /> çağrılarını (çok satırlı olanlar dahil) yakalar
function cagrilar(kaynak) {
  return [...kaynak.matchAll(/<DoctorSummary\b[\s\S]*?\/>/g)].map(m => m[0]);
}

describe('DoctorSummary çağrıları', () => {
  const bulunanlar = [];
  for (const dosya of jsxDosyalari()) {
    const kaynak = fs.readFileSync(dosya, 'utf8');
    for (const c of cagrilar(kaynak)) bulunanlar.push({ dosya: path.basename(dosya), cagri: c });
  }

  it('en az bir yerde kullanılıyor (test kendini kandırmasın)', () => {
    expect(bulunanlar.length).toBeGreaterThan(0);
  });

  it('her çağrı onClose geçiyor', () => {
    const eksik = bulunanlar.filter(b => !/\bonClose\s*=/.test(b.cagri));
    expect(eksik.map(b => b.dosya)).toEqual([]);
  });

  it('katman Escape ile de kapanıyor', () => {
    const kaynak = fs.readFileSync(path.join(SRC, 'doctor-summary.jsx'), 'utf8');
    expect(kaynak).toMatch(/e\.key === 'Escape'/);
    expect(kaynak).toMatch(/removeEventListener\('keydown'/);   // dinleyici bırakılıyor
  });
});
