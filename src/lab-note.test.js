import { describe, expect, it } from 'vitest';
import { labNote } from './screens.jsx';

/* Bu notlar bir zamanlar örnek bir hastayı anlatan sabit metinlerdi:
   tek ölçüm girilmişken "istikrarlı şekilde hedef aralığa tırmandı",
   hiç başlangıç yokken "SHBG başlangıca göre 34 puan düştü" diyor,
   biri de doğrudan doz talimatı veriyordu. Uygulama kullanıcının
   verisi hakkında yalnızca veriden çıkan şeyi söylemeli. */

const oku = (...v) => v.map((value, i) => ({ date: `2026-09-0${i + 1}`, value }));

describe('labNote', () => {
  it('ölçüm yokken eğilim cümlesi kurmaz', () => {
    const n = labNote('e2', []);
    expect(n).not.toMatch(/yükseldi|düştü|ölçümde/);
    expect(n.length).toBeGreaterThan(0);   // analitin tanımı yine de var
  });

  it('tek ölçümde eğilim yerine neden olmadığını söyler', () => {
    const n = labNote('e2', oku(88));
    expect(n).toMatch(/Tek ölçüm bir nokta/);
    expect(n).not.toMatch(/yükseldi|düştü/);
  });

  it('iki ölçümde yönü gerçek değerlerden kurar', () => {
    expect(labNote('e2', oku(88, 142))).toMatch(/2 ölçümde 88 değerinden 142 değerine yükseldi/);
    expect(labNote('e2', oku(142, 88))).toMatch(/2 ölçümde 142 değerinden 88 değerine düştü/);
  });

  it('değer neredeyse aynıysa yükseldi/düştü demez', () => {
    const n = labNote('e2', oku(100, 102));
    expect(n).toMatch(/başladığı yerde kaldı/);
    expect(n).not.toMatch(/yükseldi|düştü/);
  });

  it('hiçbir analit için doz talimatı vermez', () => {
    for (const k of ['e2', 'p4', 't', 'ft', 'shbg', 'fsh']) {
      for (const r of [[], oku(10), oku(10, 20)]) {
        expect(labNote(k, r)).not.toMatch(/dozu koru|dozu artır|dozu azalt|dose/i);
      }
    }
  });

  it('uydurma bir başlangıç farkı öne sürmez', () => {
    // "başlangıca göre 34 puan düştü" — kullanıcının böyle bir kaydı yokken.
    expect(labNote('shbg', [])).not.toMatch(/34/);
    expect(labNote('shbg', oku(60))).not.toMatch(/34/);
  });
});
