import React from 'react';
import { t, useLang } from './i18n';
import { MonthNav, WeekdayRow, useMonthView } from './month-grid';
import {
  PHASE_TINT, bleedExpected, bledOn, cycleDayFrom, cycleLenOf,
  hasCycleAnchor, phaseLabel, phaseOf, phaseRange, wrap,
} from './screens';
import { ReferenceCard } from './reference-card';
import { Card, ICONS, Icon, TODAY_DATE, TODAY_KEY, getTodayKey, medTaken, todaysDoses } from './shared';

/* perim-home.jsx — açılış ekranı: bir takvim.
   "Döngünün neresindeyiz, takipler nasıl gidiyor" sorusunun ikisi de tek
   ızgarada cevaplanıyor. Hücre zemini fazı, kesikli çerçeve beklenen
   kanamayı, dolu pembe gerçekleşeni, alttaki noktalar o gün ne kaydedildiğini
   gösteriyor.

   Renk yükü kasten dengesiz: geniş yüzeyler pastel, kimliği taşıyan işaretler
   doygun. Faz renklerinin renk körlüğündeki ayrımı ΔE 6.9 ile sınırda, o
   yüzden renk hiçbir yerde tek başına bırakılmıyor — altta yazılı açıklama var. */
/* eslint-disable */

const BEKLENEN_CIZGI = '#b04a72';
const KANAMA_ZEMIN   = '#f2b6cd';
const FAZ_ALFA       = '2b';

// Bir günde ne kaydedilmiş
function gunKaydi(lunara, key) {
  const sym = (lunara.symptomLog || {})[key];
  const doz = (lunara.doseLog || {})[key];
  const hrk = (lunara.workoutLog || {})[key];
  const keg = (lunara.kegelLog || {})[key];
  const jmp = (lunara.jumpLog || {})[key];
  return {
    belirti: !!(sym && Object.keys(sym).length),
    doz: !!(doz && Object.keys(doz).length),
    hareket: !!((hrk && Object.keys(hrk).length) || (keg && Object.keys(keg).length) || jmp),
  };
}

function PerimHome({ lunara, api, onNav }) {
  const { go, isCurrentMonth, monthLabel, weekdays, cells } = useMonthView();
  useLang();
  const [aciklama, setAciklama] = React.useState(false);
  const L = cycleLenOf(lunara);
  const gun = cycleDayFrom(lunara && lunara.periodStart, TODAY_DATE, L);
  const ph = phaseOf(gun, L);
  const capa = hasCycleAnchor(lunara);
  const { meds } = todaysDoses(lunara);
  const kalan = meds.filter(m => !medTaken(lunara, m.id)).length;
  const bugun = gunKaydi(lunara, TODAY_KEY);

  return (
    <div style={wrap}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, gap: 12, flexWrap: 'wrap' }}>
          <div>
            {/* Eskiden üç başlık katmanı vardı: dış eyebrow, dev "Luteal"
                başlığı, ve kartın kendi başlığı — ilk ekranın ~180px'ini
                yiyordu. Hepsi tek satıra indi; faz bilgisi zaten takvimin
                renklerinde de var. */}
            <div className="eyebrow">
              {capa && ph
                ? t(`DAY ${gun} · ${phaseLabel(ph)} · ${L}-DAY`, `${gun}. GÜN · ${phaseLabel(ph)} · ${L} GÜNLÜK`)
                : t('CYCLE NOT SET YET', 'DÖNGÜ HENÜZ BELİRLENMEDİ')}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 3 }}>
              {capa
                ? t('Tap a day to log bleeding', 'Kanamayı işaretlemek için güne dokun')
                : t('Tap the first day of your last period — phases appear once it is set',
                    'Son reglinin ilk gününe dokun — fazlar ancak o zaman görünür')}
            </div>
          </div>
          <MonthNav label={monthLabel} onPrev={() => go(-1)} onNext={() => go(1)} atCurrent={isCurrentMonth}/>
        </div>

        <WeekdayRow weekdays={weekdays}/>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {cells.map((c, i) => {
            if (!c) return <div key={'b' + i}/>;
            const cd = cycleDayFrom(lunara && lunara.periodStart, c.date, L);
            const faz = phaseOf(cd, L);
            const bekleniyor = cd != null && bleedExpected(cd, L);
            const oldu = bledOn(lunara, c.key) > 0;
            const kayit = gunKaydi(lunara, c.key);
            const durum = faz ? [phaseLabel(faz)] : [];
            if (bekleniyor) durum.push(t('bleeding expected', 'kanama bekleniyor'));
            if (oldu) durum.push(t('bleeding logged', 'kanama kaydedildi'));
            if (kayit.belirti) durum.push(t('symptoms', 'belirti'));
            if (kayit.doz) durum.push(t('doses', 'doz'));
            if (kayit.hareket) durum.push(t('movement', 'hareket'));
            const dokunabilir = !!api && !c.isFuture;
            return (
              <button key={c.key} disabled={!dokunabilir}
                onClick={dokunabilir ? () => api.togglePeriodDay(c.key) : undefined}
                aria-pressed={dokunabilir ? oldu : undefined}
                aria-label={[c.d, cd != null && `${t('day', 'gün')} ${cd}`].filter(Boolean).concat(durum).join(' · ')}
                title={[c.d, cd != null && `${t('day', 'gün')} ${cd}`].filter(Boolean).concat(durum).join(' · ')}
                style={{
                  position: 'relative', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'flex-start', gap: 3,
                  padding: '7px 2px 8px', borderRadius: 10, minHeight: 48, width: '100%',
                  background: oldu ? KANAMA_ZEMIN : (faz ? PHASE_TINT[faz.key] + FAZ_ALFA : 'var(--ivory)'),
                  boxShadow: c.isToday ? '0 0 0 2px var(--ink)' : 'inset 0 0 0 1px var(--line-soft)',
                  outline: bekleniyor ? `1.5px dashed ${BEKLENEN_CIZGI}` : 'none',
                  outlineOffset: -3,
                  opacity: c.isFuture ? 0.55 : 1,
                  cursor: dokunabilir ? 'pointer' : 'default',
                }}>
                <span style={{ fontFamily: 'var(--serif)', fontSize: 15, lineHeight: 1,
                  fontWeight: c.isToday ? 700 : 400, color: 'var(--ink)' }}>{c.d}</span>
                {/* takip noktaları — o gün ne kaydedilmiş */}
                <span style={{ display: 'flex', gap: 2.5, marginTop: 'auto', height: 5 }}>
                  {kayit.belirti && <i style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)' }}/>}
                  {kayit.doz && <i style={{ width: 5, height: 5, borderRadius: '50%', background: PHASE_TINT.luteal }}/>}
                  {kayit.hareket && <i style={{ width: 5, height: 5, borderRadius: '50%', background: PHASE_TINT.follicular }}/>}
                </span>
                {/* faz şeridi */}
                <span style={{
                  position: 'absolute', left: 6, right: 6, bottom: 3, height: 3, borderRadius: 2,
                  background: faz ? PHASE_TINT[faz.key] : 'transparent',
                }}/>
              </button>
            );
          })}
        </div>

        {/* Açıklama katlanır: dokuz kalem, üç satır ve takvimden sonra koca
            bir blok oluyordu. Renk tek başına kimlik taşımadığı için hâlâ
            erişilebilir olmalı — sadece varsayılan olarak kapalı. */}
        <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--line-soft)' }}>
          <button onClick={() => setAciklama(v => !v)} aria-expanded={aciklama}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: 0, background: 'transparent',
              border: 'none', cursor: 'pointer', fontSize: 11.5, color: 'var(--muted)', fontFamily: 'var(--sans)',
            }}>
            {t('What the colours mean', 'Renkler ne anlama geliyor')}
            <span style={{ fontSize: 13 }}>{aciklama ? '−' : '+'}</span>
          </button>

          {aciklama && (
            <div className="fade-up" style={{ marginTop: 10 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px 14px' }}>
                {capa && ['menstrual', 'follicular', 'ovulation', 'luteal'].map(k => (
                  <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--muted)' }}>
                    <span style={{ width: 13, height: 4, borderRadius: 2, background: PHASE_TINT[k] }}/>
                    {phaseLabel(phaseOf(k === 'menstrual' ? 1 : k === 'follicular' ? 7 : k === 'ovulation' ? (L - 14) : (L - 4), L))}
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px 14px', marginTop: 7 }}>
                {capa && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--muted)' }}>
                    <span style={{ width: 13, height: 13, borderRadius: 4, border: `1.5px dashed ${BEKLENEN_CIZGI}` }}/>
                    {t('bleeding expected', 'beklenen kanama')}
                  </span>
                )}
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--muted)' }}>
                  <span style={{ width: 13, height: 13, borderRadius: 4, background: KANAMA_ZEMIN }}/>
                  {t('bleeding logged', 'gerçekleşen kanama')}
                </span>
                {[['var(--accent)', t('symptoms', 'belirti')],
                  [PHASE_TINT.luteal, t('doses', 'doz')],
                  [PHASE_TINT.follicular, t('movement', 'hareket')]].map(([renk, ad]) => (
                  <span key={ad} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--muted)' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: renk }}/>{ad}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Bugün ne kaldı — takvimin altında tek satırlık durum */}
      <Card>
        <div className="eyebrow" style={{ marginBottom: 12 }}>{t('Today', 'Bugün')}</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <DurumRozeti tamam={bugun.doz} onClick={() => onNav && onNav('meds')}
            etiket={meds.length === 0
              ? t('No doses today', 'Bugün doz yok')
              : kalan === 0 ? t('All doses taken', 'Tüm dozlar alındı')
                            : t(`${kalan} dose${kalan > 1 ? 's' : ''} left`, `${kalan} doz kaldı`)}
            ikon={ICONS.pill}/>
          <DurumRozeti tamam={bugun.belirti} onClick={() => onNav && onNav('symptoms')}
            etiket={bugun.belirti ? t('Symptoms logged', 'Belirtiler kaydedildi') : t('Log symptoms', 'Belirtileri kaydet')}
            ikon={ICONS.pulse}/>
          <DurumRozeti tamam={bugun.hareket} onClick={() => onNav && onNav('move')}
            etiket={bugun.hareket ? t('Movement done', 'Hareket yapıldı') : t('Log movement', 'Hareketi kaydet')}
            ikon={ICONS.spark}/>
        </div>
        {capa && ph && (
          <p style={{ fontSize: 12, color: 'var(--muted)', margin: '14px 0 0', lineHeight: 1.5 }}>
            {phaseLabel(ph)} · {phaseRange(ph.key, L)}
          </p>
        )}
      </Card>

      {/* Normal döngü referansı — gün gün E2/P4 tablosuyla.
          Katlanır: eğriler ve 28 satırlık tablo açık dururken "bugün ne
          yapmalıyım" ekrandan çıkıyordu. Çapa yoksa hiç gösterilmiyor,
          çünkü hangi gündeyiz bilinmeden gösterecek bir şey yok. */}
      {capa && <ReferenceCard lunara={lunara} cycleDay={gun} katlanir gunlukTablo/>}
    </div>
  );
}

function DurumRozeti({ tamam, etiket, ikon, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 9, flex: '1 1 180px',
      padding: '13px 15px', borderRadius: 'var(--r-md)', cursor: 'pointer', border: 'none',
      background: tamam ? 'var(--accent-soft)' : 'var(--bone)',
      boxShadow: tamam ? 'none' : 'inset 0 0 0 1px var(--line-soft)',
      textAlign: 'left', fontFamily: 'var(--sans)',
    }}>
      <span style={{
        width: 30, height: 30, borderRadius: 9, flexShrink: 0,
        background: tamam ? 'var(--accent)' : 'var(--card)',
        color: tamam ? 'var(--ivory)' : 'var(--muted)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon d={tamam ? ICONS.check : ikon} size={15} sw={tamam ? 2 : 1.5}/>
      </span>
      <span style={{ flex: 1, fontSize: 13, color: 'var(--ink)', lineHeight: 1.35 }}>{etiket}</span>
      {/* Bitmemiş olan bir çağrı, bitmiş olan bir durum — aynı görünmemeliler */}
      {!tamam && <Icon d={ICONS.arrow} size={13} stroke="var(--muted-2)"/>}
    </button>
  );
}

export { PerimHome, gunKaydi };
