import React from 'react';
import { t, useLang } from './i18n';
import { Card, DateNav, ICONS, Icon, TODAY_KEY, nowHM } from './shared';
import { exportWaterIcs } from './calendar-export';

/* water.jsx — günlük su takibi ve altı hatırlatma.

   MODEL. Her yudum ayrı bir kayıt ({ id, at, ml }). İki sayı birden gerekiyor:
   "kaç kez içtim" (hedef altı kez) ve "toplam ne kadar" (mL). Tek bir sayaç
   tutsaydık geçmişe dönüp bir kaydın saatini ya da miktarını düzeltmek mümkün
   olmazdı.

   HATIRLATMA. Uygulama açıkken bildirim verir; kapalıyken veremez — sunucusuz
   bir PWA arka planda bildirim zamanlayamaz (bkz. calendar-export.jsx). Kapalı
   uygulamada da çalması için saatler telefonun takvimine aktarılabiliyor. */
/* eslint-disable */

const VARSAYILAN_ML = 250;
// Uyanık saatlere yayılmış altı hatırlatma
const VARSAYILAN_SAATLER = ['08:00', '10:30', '13:00', '15:30', '18:00', '20:30'];

// profile.water yoksa varsayılanlara düşer; kaydı bozuk gelirse de ayakta kalır.
function waterSettings(lunara) {
  const w = (lunara && lunara.profile && lunara.profile.water) || {};
  const saatler = Array.isArray(w.times) && w.times.length ? w.times.slice(0, 12) : VARSAYILAN_SAATLER;
  const ml = Number(w.servingMl) > 0 ? Number(w.servingMl) : VARSAYILAN_ML;
  return { times: saatler, servingMl: ml, goal: saatler.length };
}

// O günün kayıtları → { entries, count, totalMl }
function waterDay(lunara, dateKey) {
  const entries = ((lunara && lunara.waterLog) || {})[dateKey] || [];
  return {
    entries,
    count: entries.length,
    totalMl: entries.reduce((n, e) => n + (Number(e.ml) || 0), 0),
  };
}

// Bir bardak simgesi — dolu/boş
function Bardak({ dolu, onClick, label }) {
  return (
    <button onClick={onClick} aria-label={label} aria-pressed={dolu}
      style={{
        width: 40, height: 48, borderRadius: 10, cursor: 'pointer', flexShrink: 0,
        background: dolu ? 'var(--accent)' : 'var(--bone)',
        color: dolu ? 'var(--ivory)' : 'var(--muted-2)',
        boxShadow: dolu ? 'none' : 'inset 0 0 0 1px var(--line)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 160ms ease',
      }}>
      <Icon d={ICONS.drop} size={20} sw={dolu ? 2 : 1.5}/>
    </button>
  );
}

/* dateKey dışarıdan gelir. setDateKey de verilirse kart kendi tarih seçicisini
   çizer — Perim'da tarihi yemek günlüğü yönetiyor, Lunara'da yemek günlüğü
   olmadığı için kart kendi başına yönetiyor. */
function WaterCard({ lunara, api, dateKey, setDateKey }) {
  useLang();
  const dk = dateKey || TODAY_KEY;
  const ayar = waterSettings(lunara);
  const gun = waterDay(lunara, dk);
  const [ayarAcik, setAyarAcik] = React.useState(false);
  const [aktarDurum, setAktarDurum] = React.useState(null);
  const [miktar, setMiktar] = React.useState('');

  const hedefMl = ayar.goal * ayar.servingMl;
  const yuzde = hedefMl > 0 ? Math.min(100, Math.round((gun.totalMl / hedefMl) * 100)) : 0;

  // Bardağa dokunmak: doluysa son kaydı geri al, boşsa bir porsiyon ekle
  const bardakTikla = (i) => {
    if (i < gun.count) api.removeWater(dk, gun.entries[gun.entries.length - 1].id);
    else api.addWater(dk, ayar.servingMl, dk === TODAY_KEY ? nowHM() : ayar.times[Math.min(i, ayar.times.length - 1)]);
  };

  const elleEkle = () => {
    const n = Number(String(miktar).replace(',', '.'));
    if (!Number.isFinite(n) || n <= 0) return;
    api.addWater(dk, n, dk === TODAY_KEY ? nowHM() : ayar.times[Math.min(gun.count, ayar.times.length - 1)]);
    setMiktar('');
  };

  const saatDegistir = (i, v) => {
    const yeni = ayar.times.slice();
    yeni[i] = v;
    yeni.sort();
    api.updateProfile({ water: { ...(lunara.profile.water || {}), times: yeni, servingMl: ayar.servingMl } });
  };

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
        <div>
          <div className="eyebrow">{t('Water', 'Su')}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
            <span style={{ fontFamily: 'var(--serif)', fontSize: 26, letterSpacing: '-0.01em' }}>
              {(gun.totalMl / 1000).toFixed(1).replace('.', ',')} L
            </span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--muted)' }}>
              / {(hedefMl / 1000).toFixed(1).replace('.', ',')} L · {gun.count}/{ayar.goal}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {setDateKey && <DateNav date={dk} onChange={setDateKey}/>}
          <button onClick={() => setAyarAcik(o => !o)}
            style={{ fontSize: 12, color: 'var(--muted)', padding: '6px 10px', borderRadius: 8, boxShadow: 'inset 0 0 0 1px var(--line)', cursor: 'pointer' }}>
            {ayarAcik ? t('Close', 'Kapat') : t('Settings', 'Ayarlar')}
          </button>
        </div>
      </div>

      {/* ilerleme */}
      <div style={{ height: 6, borderRadius: 6, background: 'var(--line-soft)', overflow: 'hidden', margin: '12px 0 14px' }}>
        <div style={{ height: '100%', width: `${yuzde}%`, background: 'var(--accent)', borderRadius: 6, transition: 'width 220ms ease' }}/>
      </div>

      {/* bardaklar */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        {Array.from({ length: ayar.goal }, (_, i) => (
          <Bardak key={i} dolu={i < gun.count} onClick={() => bardakTikla(i)}
            label={i < gun.count
              ? t(`Undo glass ${i + 1}`, `${i + 1}. bardağı geri al`)
              : t(`Log glass ${i + 1}`, `${i + 1}. bardağı kaydet`)}/>
        ))}
      </div>

      {/* elle miktar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <label htmlFor="su-ml" style={{ fontSize: 12, color: 'var(--muted)' }}>
          {t('Other amount', 'Başka miktar')}
        </label>
        <input id="su-ml" inputMode="numeric" value={miktar}
          onChange={e => setMiktar(e.target.value.replace(/[^\d]/g, '').slice(0, 4))}
          onKeyDown={e => { if (e.key === 'Enter') elleEkle(); }}
          placeholder={String(ayar.servingMl)}
          style={{
            width: 72, padding: '6px 10px', borderRadius: 9, fontFamily: 'var(--mono)', fontSize: 13,
            border: '1px solid var(--line)', background: 'var(--ivory)', color: 'var(--ink)', outline: 'none',
          }}/>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--muted)' }}>mL</span>
        <button onClick={elleEkle}
          style={{ padding: '7px 14px', borderRadius: 999, background: 'var(--ink)', color: 'var(--ivory)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Icon d={ICONS.plus} size={13} sw={2}/> {t('Add', 'Ekle')}
        </button>
      </div>

      {/* günün kayıtları */}
      {gun.entries.length > 0 && (
        <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--line-soft)', display: 'flex', flexDirection: 'column' }}>
          {gun.entries.map((e, i) => (
            <div key={e.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '7px 0', borderBottom: i < gun.entries.length - 1 ? '1px solid var(--line-soft)' : 'none',
            }}>
              <input type="time" value={e.at}
                aria-label={t('Time', 'Saat')}
                onChange={ev => ev.target.value && api.updateWater(dk, e.id, { at: ev.target.value })}
                style={{ padding: '3px 7px', borderRadius: 8, fontFamily: 'var(--mono)', fontSize: 12,
                  border: '1px solid var(--line)', background: 'var(--card)', color: 'var(--ink)', outline: 'none' }}/>
              <input inputMode="numeric" value={String(e.ml)}
                aria-label={t('Amount in mL', 'Miktar (mL)')}
                onChange={ev => api.updateWater(dk, e.id, { ml: ev.target.value.replace(/[^\d]/g, '') })}
                style={{ width: 64, padding: '3px 7px', borderRadius: 8, fontFamily: 'var(--mono)', fontSize: 12,
                  border: '1px solid var(--line)', background: 'var(--card)', color: 'var(--ink)', outline: 'none' }}/>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', flex: 1 }}>mL</span>
              <button onClick={() => api.removeWater(dk, e.id)}
                aria-label={t('Remove this entry', 'Bu kaydı sil')}
                style={{ width: 24, height: 24, borderRadius: 7, color: 'var(--muted-2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon d="M6 6l12 12M6 18L18 6" size={13}/>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ayarlar */}
      {ayarAcik && (
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--line-soft)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
            <label htmlFor="su-porsiyon" style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>
              {t('Glass size', 'Bardak boyu')}
            </label>
            <input id="su-porsiyon" inputMode="numeric" value={String(ayar.servingMl)}
              onChange={e => api.updateProfile({ water: { ...(lunara.profile.water || {}), times: ayar.times, servingMl: e.target.value.replace(/[^\d]/g, '') || VARSAYILAN_ML } })}
              style={{ width: 72, padding: '6px 10px', borderRadius: 9, fontFamily: 'var(--mono)', fontSize: 13,
                border: '1px solid var(--line)', background: 'var(--ivory)', color: 'var(--ink)', outline: 'none' }}/>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--muted)' }}>mL</span>
          </div>

          <div className="eyebrow" style={{ fontSize: 9.5, marginBottom: 8 }}>
            {t('Reminder times', 'Hatırlatma saatleri')}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {ayar.times.map((saat, i) => (
              <input key={i} type="time" value={saat}
                aria-label={t(`Reminder ${i + 1}`, `${i + 1}. hatırlatma`)}
                onChange={e => e.target.value && saatDegistir(i, e.target.value)}
                style={{ padding: '6px 8px', borderRadius: 9, fontFamily: 'var(--mono)', fontSize: 12.5,
                  border: '1px solid var(--line)', background: 'var(--ivory)', color: 'var(--ink)', outline: 'none' }}/>
            ))}
          </div>
          <p style={{ fontSize: 11.5, color: 'var(--muted-2)', lineHeight: 1.55, margin: '12px 0 0' }}>
            {t('Reminders come while Perim is open. To be reminded when the app is closed, add these times to your phone’s calendar.',
               'Hatırlatmalar Perim açıkken gelir. Uygulama kapalıyken de hatırlatılmak için bu saatleri telefonunun takvimine ekle.')}
          </p>
          {/* Eskiden "Dozlar ekranından aktar" diyordu; menarş ve diğer bazı
              evrelerin menüsünde Dozlar yok. Düğme artık burada. */}
          <button onClick={async () => {
              const r = await exportWaterIcs(ayar.times);
              setAktarDurum(r ? r.yol : 'hata');
            }}
            style={{ marginTop: 10, padding: '8px 14px', borderRadius: 999, cursor: 'pointer',
              border: '1px solid var(--line)', background: 'var(--card)', color: 'var(--ink)',
              fontFamily: 'var(--sans)', fontSize: 12.5, fontWeight: 600 }}>
            {t('Add to my calendar', 'Takvimime ekle')}
          </button>
          {aktarDurum && (
            <p style={{ fontSize: 11.5, color: 'var(--muted)', margin: '8px 0 0', lineHeight: 1.5 }}>
              {aktarDurum === 'share' ? t('Pick your calendar app to add the reminders.', 'Hatırlatmaları eklemek için takvim uygulamanı seç.')
                : aktarDurum === 'indir' ? t('A calendar file was downloaded — open it to add the reminders.', 'Bir takvim dosyası indirildi — hatırlatmaları eklemek için onu aç.')
                : aktarDurum === 'iptal' ? t('Cancelled.', 'Vazgeçildi.')
                : t('Could not create the calendar file.', 'Takvim dosyası oluşturulamadı.')}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

export { WaterCard, waterSettings, waterDay, VARSAYILAN_ML, VARSAYILAN_SAATLER };
