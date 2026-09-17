import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/* Aynı hata iki ekranda çıktı: ekranda tarih değiştirici var ama kayıt
   yazan çağrılar TODAY_KEY'e sabit. Kullanıcı tarihi geriye alıp bir şey
   işaretliyor, kayıt sessizce bugüne gidiyor.

   - perim-meds.jsx: medTaken / toggleMed / updateDose bugüne sabitti
   - nourish.jsx: StrengthFocus, KegelTrainer, JumpTrainer bugüne sabitti

   Test ortamında DOM yok; bunun yerine bu bileşenlerin gövdeleri kaynakta
   denetleniyor: tarih alan bir bileşenin içinde TODAY_KEY geçmemeli. */

const SRC = path.join(import.meta.dirname, '.');

function govde(dosya, fn) {
  const s = fs.readFileSync(path.join(SRC, dosya), 'utf8');
  const i = s.indexOf('function ' + fn + '(');
  expect(i, `${dosya}: ${fn} bulunamadı`).toBeGreaterThan(-1);
  const j = s.indexOf('\n}\n', i);
  // imza satırını atla — varsayılan parametre olarak TODAY_KEY meşru
  const ilkSatirSonu = s.indexOf('\n', i);
  return s.slice(ilkSatirSonu, j);
}

describe('tarih alan ekranlar bugüne sabitlenmemeli', () => {
  for (const [dosya, fn] of [
    ['nourish.jsx', 'StrengthFocus'],
    ['nourish.jsx', 'KegelTrainer'],
    ['nourish.jsx', 'JumpTrainer'],
  ]) {
    it(`${fn} kayıtları TODAY_KEY yerine dk ile yazar`, () => {
      const g = govde(dosya, fn);
      expect(g).not.toMatch(/TODAY_KEY/);
      expect(g).toMatch(/\bdk\b/);
    });
  }

  it('PerimMeds doz satırları seçilen güne bağlı', () => {
    const g = govde('perim-meds.jsx', 'PerimMeds');
    expect(g).toMatch(/medTaken\(lunara, d\.id, dk\)/);
    expect(g).toMatch(/toggleMed\(dk,/);
    expect(g).toMatch(/updateDose\(dk,/);
    expect(g).not.toMatch(/toggleMed\(TODAY_KEY|updateDose\(TODAY_KEY/);
  });

  it('MoveScreen tarih alıyor ve App onu geçiyor', () => {
    const n = fs.readFileSync(path.join(SRC, 'nourish.jsx'), 'utf8');
    expect(n).toMatch(/function MoveScreen\(\{ lunara, api, logDate, setLogDate \}\)/);
    const a = fs.readFileSync(path.join(SRC, 'App.jsx'), 'utf8');
    expect(a).toMatch(/<MoveScreen[^>]*logDate=\{logDate\}/);
  });
});
