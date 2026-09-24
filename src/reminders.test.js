import fs from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { bildirimGoster } from './notify.js';
import { buildIcs, exportWaterIcs } from './calendar-export.jsx';

/* Hatırlatmalar telefonda hiç görünmüyordu: sayfa içinden new Notification()
   çağrılıyordu, Android bu çağrıyı reddediyor, iPhone service worker
   istiyor, ve hata try/catch içinde sessizce yutuluyordu. Ayrıca uygulama
   kapalıyken hatırlatmanın tek yolu olan "takvime aktar" yalnız Dozlar
   ekranındaydı — menarş ve birkaç evrenin menüsünde Dozlar yok. */

const SRC = path.join(import.meta.dirname, '.');

afterEach(() => { vi.unstubAllGlobals(); });

describe('bildirimGoster', () => {
  it('service worker kaydı varsa onu kullanır, sayfa içi yönteme dokunmaz', async () => {
    const goster = vi.fn().mockResolvedValue(undefined);
    const Kurucu = vi.fn();
    vi.stubGlobal('navigator', { serviceWorker: { getRegistration: async () => ({ showNotification: goster }) } });
    vi.stubGlobal('Notification', Kurucu);
    expect(await bildirimGoster('Lunara', { body: 'Su içme zamanı' })).toBe('sw');
    expect(goster).toHaveBeenCalledWith('Lunara', { body: 'Su içme zamanı' });
    expect(Kurucu).not.toHaveBeenCalled();
  });

  it('kayıt yoksa (geliştirme, eski tarayıcı) sayfa içi yönteme düşer', async () => {
    const Kurucu = vi.fn();
    vi.stubGlobal('navigator', { serviceWorker: { getRegistration: async () => undefined } });
    vi.stubGlobal('Notification', Kurucu);
    expect(await bildirimGoster('Lunara', {})).toBe('sayfa');
    expect(Kurucu).toHaveBeenCalledTimes(1);
  });

  it('Android gibi kurucuyu reddeden ortamda patlamaz', async () => {
    vi.stubGlobal('navigator', { serviceWorker: { getRegistration: async () => undefined } });
    vi.stubGlobal('Notification', function () { throw new TypeError('Illegal constructor'); });
    await expect(bildirimGoster('Lunara', {})).resolves.toBe(null);
  });

  it('service worker hatası verirse sayfa içi yönteme düşer', async () => {
    const Kurucu = vi.fn();
    vi.stubGlobal('navigator', { serviceWorker: { getRegistration: async () => { throw new Error('x'); } } });
    vi.stubGlobal('Notification', Kurucu);
    expect(await bildirimGoster('Lunara', {})).toBe('sayfa');
  });
});

describe('su saatlerini takvime aktarma', () => {
  it('ilaç planı olmayan kullanıcıda patlamaz', () => {
    /* buildIcs eskiden ilk satırda regimen.cycleLength okuyordu. */
    const r = buildIcs(null, ['08:00', '13:00']);
    expect(r).not.toBe(null);
    expect(r.waterCount).toBe(2);
    expect(r.ics.match(/BEGIN:VEVENT/g)).toHaveLength(2);
    expect(r.ics).toMatch(/BEGIN:VCALENDAR/);
  });

  it('boş saat listesinde dosya üretmez', async () => {
    expect(await exportWaterIcs([])).toBe(null);
    expect(await exportWaterIcs(null)).toBe(null);
  });

  it('su kartı dışa aktarmayı kendisi sunuyor, Dozlar ekranına göndermiyor', () => {
    const su = fs.readFileSync(path.join(SRC, 'water.jsx'), 'utf8');
    expect(su).toMatch(/exportWaterIcs\(ayar\.times\)/);
    // Yalnız ekrana giden metin (tek tırnaklı dize) — açıklama yorumu sayılmasın
    expect(su).not.toMatch(/'[^'\n]*Dozlar ekranından[^'\n]*'/);
  });
});

describe('sayfa içi new Notification() geri gelmesin', () => {
  it('notify.js dışında hiçbir kaynak dosyada geçmiyor', () => {
    const bulunan = fs.readdirSync(SRC)
      .filter(f => /\.(jsx?|tsx?)$/.test(f) && !/\.test\./.test(f) && f !== 'notify.js')
      .filter(f => /new Notification\(/.test(fs.readFileSync(path.join(SRC, f), 'utf8')));
    expect(bulunan).toEqual([]);
  });
});

/* Lunara'da su hatırlatması BRAND adını kullanıyordu ama sabit hiç
   tanımlanmamıştı: ReferenceError try/catch'te yutuluyor, hatırlatma
   hiçbir cihazda gösterilmiyordu. Bildirim başlığı olarak kullanılan
   ad tanımlı olmalı. */
describe('bildirim başlığı tanımlı', () => {
  it('App.jsx BRAND kullanıyorsa tanımlıyor', () => {
    const app = fs.readFileSync(path.join(SRC, 'App.jsx'), 'utf8');
    if (/bildirimGoster\(BRAND\b/.test(app)) {
      expect(app).toMatch(/\bconst BRAND\s*=\s*'[^']+'/);
    }
  });
});
