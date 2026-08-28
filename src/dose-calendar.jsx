import React from 'react';
import { I18N, t } from './i18n';
import { Card, TODAY_DATE, activeMeds, getTodayKey, regimenDay } from './shared';

/* dose-calendar.jsx — ilaç & hormon rejiminin aylık genel görünümü.

   Hücre rengi KİMLİK değil BÜYÜKLÜK gösterir: o gün planlanan dozların ne
   kadarının alındığı. Tek hue'lu (marka moru, 304) sıralı rampa — açıktan
   koyuya, lightness kesin azalan. Kimliği renge yüklemek cazipti ama takvim
   hücresinde her iki ilaç yan yana düşebiliyor ve o "tüm çiftler" testinde
   kategorik palet 3 renkte tıkanıyor (yeşil↔kehribar protanopide ΔE 1.7).
   İlaç kimliği bu yüzden isimle taşınıyor: hücreye tıkla, altında o günün
   listesi açılır; rejimin renkli bantları ayrı satırlarda duran zaman
   çizelgesinde kalıyor.

   Gelecek günler de çiziliyor — "ilaçların zamanını ayarlarken" rejimin
   ileriye doğru deseni gerçek tarihler üzerinde görünsün diye. */
/* eslint-disable */

// Sıralı rampa: tek hue 304, L 0.94 → 0.40. Metin eşiği son adımda döner.
const ADH = [
  { fill: '#EEE8F5', ink: 'var(--ink)' },       // planlandı, hiçbiri alınmadı
  { fill: '#D2C6E2', ink: 'var(--ink)' },       // yarıdan azı
  { fill: '#A08FB8', ink: 'var(--ink)' },       // yarıdan çoğu
  { fill: '#473061', ink: 'oklch(0.96 0.012 300)' }, // tamamı
];
const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTHS_TR = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const WD_EN = ['Mo','Tu','We','Th','Fr','Sa','Su'];
const WD_TR = ['Pt','Sa','Ça','Pe','Cu','Ct','Pz'];
const NAV_BTN = { width: 26, height: 26, borderRadius: 8, background: 'var(--bone)', color: 'var(--ink-2)', fontSize: 15, lineHeight: 1, boxShadow: 'inset 0 0 0 1px var(--line-soft)' };

const keyOf = (y, m, d) => y + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
const medName = (m) => t(m.name, m.nameTr || m.name);

// Bir günün durumu: kaç doz planlı, kaçı alınmış, doz değişikliği var mı.
function dayState(lunara, y, m, d) {
  const key = keyOf(y, m, d);
  const date = new Date(key + 'T00:00:00');
  const reg = lunara.regimen;
  const meds = reg ? activeMeds(reg, regimenDay(reg, date)) : [];
  const log = (lunara.doseLog && lunara.doseLog[key]) || {};
  const taken = meds.filter(x => log[x.id]).length;
  const titr = (lunara.titration || []).filter(x => x.date === key);
  return { key, date, meds, taken, titr, cycleDay: reg ? regimenDay(reg, date) : null };
}

function DoseCalendar({ lunara, onPick, selected }) {
  const today = new Date(TODAY_DATE);
  const todayKey = getTodayKey();
  const [view, setView] = React.useState({ y: today.getFullYear(), m: today.getMonth() });
  const [open, setOpen] = React.useState(null);   // tıklanan günün anahtarı

  const lang = I18N.lang;
  const first = new Date(view.y, view.m, 1);
  const lead = (first.getDay() + 6) % 7;                       // pazartesi başlangıç
  const dim = new Date(view.y, view.m + 1, 0).getDate();
  const isCurrent = view.y === today.getFullYear() && view.m === today.getMonth();
  const go = (delta) => { setOpen(null); setView(v => { const d = new Date(v.y, v.m + delta, 1); return { y: d.getFullYear(), m: d.getMonth() }; }); };

  // ay özeti: yalnızca geçmiş + bugün sayılır, gelecek günler uyumu bozmaz
  let sch = 0, tak = 0, planned = 0;
  for (let d = 1; d <= dim; d++) {
    const s = dayState(lunara, view.y, view.m, d);
    if (!s.meds.length) continue;
    if (s.key <= todayKey) { sch += s.meds.length; tak += s.taken; }
    else planned += s.meds.length;
  }
  const adh = sch ? Math.round((tak / sch) * 100) : null;

  const openState = open ? dayState(lunara, +open.slice(0, 4), +open.slice(5, 7) - 1, +open.slice(8)) : null;

  if (!lunara.regimen || !(lunara.regimen.meds || []).length) return null;

  return (
    <Card className="mb-stack">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div className="eyebrow">{t('Regimen calendar', 'Rejim takvimi')}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>
            {t('Tap a day to see and log it', 'Bir güne dokun: gör ve kaydet')}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => go(-1)} aria-label={t('Previous month', 'Önceki ay')} style={{ ...NAV_BTN, cursor: 'pointer' }}>‹</button>
          <span style={{ fontSize: 12.5, fontWeight: 600, minWidth: 108, textAlign: 'center' }}>
            {(lang === 'tr' ? MONTHS_TR : MONTHS_EN)[view.m]} {view.y}
          </span>
          <button onClick={() => go(1)} aria-label={t('Next month', 'Sonraki ay')}
            style={{ ...NAV_BTN, opacity: isCurrent ? 0.3 : 1, cursor: isCurrent ? 'default' : 'pointer' }}
            disabled={isCurrent}>›</button>
        </div>
      </div>

      {/* ay özeti — sayı, renkten bağımsız okunabilsin diye metinle de verilir */}
      <div style={{ display: 'flex', gap: 18, alignItems: 'baseline', margin: '14px 0 12px', flexWrap: 'wrap' }}>
        {adh != null && (
          <div>
            <span style={{ fontFamily: 'var(--serif)', fontSize: 26, color: 'var(--ink)' }}>{t(adh + '%', '%' + adh)}</span>
            <span style={{ fontSize: 11.5, color: 'var(--muted)', marginLeft: 7 }}>
              {tak}/{sch} {t('doses taken', 'doz alındı')}
            </span>
          </div>
        )}
        {planned > 0 && (
          <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>
            {planned} {t('planned ahead', 'ileride planlı')}
          </span>
        )}
      </div>

      {/* Izgara + seçilen günün dökümü yan yana; mobilde mb-stack alt alta alır.
          Izgara genişliği sınırlı: kart tam genişlikteyken 7 sütun serbest
          bırakılırsa hücreler 140px'e şişiyor ve takvim okunmaz oluyor. */}
      <div className="mb-stack" style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 26, alignItems: 'start' }}>
      <div>
      {/* hafta başlıkları */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 5, marginBottom: 5 }}>
        {(lang === 'tr' ? WD_TR : WD_EN).map((w, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: 9.5, fontFamily: 'var(--mono)', color: 'var(--muted-2)', letterSpacing: '0.04em' }}>{w}</div>
        ))}
      </div>

      {/* gün ızgarası */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 5 }}>
        {Array.from({ length: lead }).map((_, i) => <div key={'b' + i} />)}
        {Array.from({ length: dim }).map((_, i) => {
          const d = i + 1;
          const s = dayState(lunara, view.y, view.m, d);
          const n = s.meds.length;
          const future = s.key > todayKey;
          const isToday = s.key === todayKey;
          const isSel = s.key === selected || s.key === open;

          let bg = 'transparent', ink = 'var(--muted-2)', ring = 'var(--line-soft)';
          if (n && !future) {
            const r = s.taken / n;
            const step = r === 0 ? 0 : r < 0.5 ? 1 : r < 1 ? 2 : 3;
            bg = ADH[step].fill; ink = ADH[step].ink; ring = 'transparent';
          } else if (n && future) {
            ink = 'var(--muted)'; ring = 'var(--line)';   // planlı ama henüz değil
          }

          const label = n
            ? `${d} · ${s.meds.map(medName).join(', ')}` + (future
                ? ' · ' + t('planned', 'planlı')
                : ` · ${s.taken}/${n} ` + t('taken', 'alındı'))
            : `${d} · ` + t('no doses', 'doz yok');

          return (
            <button key={d} title={label} aria-label={label}
              onClick={() => { setOpen(o => (o === s.key ? null : s.key)); if (!future && onPick) onPick(s.key); }}
              style={{
                position: 'relative', aspectRatio: '1', borderRadius: 9, cursor: 'pointer',
                background: bg, color: ink,
                boxShadow: isSel ? 'inset 0 0 0 2px var(--accent)'
                  : isToday ? 'inset 0 0 0 1.5px var(--ink-2)'
                  : `inset 0 0 0 1px ${ring}`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1,
                fontFamily: 'var(--mono)', fontSize: 11.5, padding: 0,
              }}>
              <span>{d}</span>
              {/* planlı doz sayısı — renk körlüğünde de sayı okunur */}
              {n > 0 && (
                <span style={{ fontSize: 8.5, opacity: future ? 0.75 : 0.85, lineHeight: 1 }}>
                  {future ? n : `${s.taken}/${n}`}
                </span>
              )}
              {/* doz değişikliği işareti */}
              {s.titr.length > 0 && (
                <span aria-hidden="true" style={{
                  position: 'absolute', top: 3, right: 4, width: 5, height: 5, borderRadius: '50%',
                  background: 'var(--signal-warn)', boxShadow: '0 0 0 1.5px var(--card)',
                }}/>
              )}
            </button>
          );
        })}
      </div>

      {/* açıklama — renk tek başına anlam taşımasın diye her adım etiketli */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', marginTop: 14, fontSize: 10.5, color: 'var(--muted)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {ADH.map((a, i) => <span key={i} style={{ width: 13, height: 13, borderRadius: 4, background: a.fill, boxShadow: 'inset 0 0 0 1px var(--line-soft)' }}/>)}
          <span style={{ marginLeft: 3 }}>{t('none → all taken', 'hiçbiri → tamamı alındı')}</span>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 13, height: 13, borderRadius: 4, boxShadow: 'inset 0 0 0 1px var(--line)' }}/>
          {t('planned', 'planlı')}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--signal-warn)' }}/>
          {t('dose change', 'doz değişikliği')}
        </span>
      </div>
      </div>

      {/* seçilen günün dökümü — ilaç kimliği burada isimle taşınır */}
      {openState ? (
        <div style={{ paddingLeft: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10, gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
              {openState.date.toLocaleDateString(lang === 'tr' ? 'tr' : 'en', { day: 'numeric', month: 'long' })}
              {openState.cycleDay != null && (
                <span style={{ fontSize: 11.5, fontWeight: 400, color: 'var(--muted)', marginLeft: 8 }}>
                  {t('cycle day', 'döngü günü')} {openState.cycleDay}
                </span>
              )}
            </span>
            {openState.key > todayKey && (
              <span style={{ fontSize: 11, color: 'var(--muted)', fontStyle: 'italic', fontFamily: 'var(--serif)' }}>
                {t('Upcoming — nothing to log yet', 'İleride — henüz kaydedilecek bir şey yok')}
              </span>
            )}
          </div>
          {openState.meds.length ? openState.meds.map(m => {
            const taken = ((lunara.doseLog || {})[openState.key] || {})[m.id];
            return (
              <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '6px 0', fontSize: 12.5 }}>
                <span style={{ color: 'var(--ink)' }}>{medName(m)}
                  <span style={{ color: 'var(--muted)', marginLeft: 8 }}>{m.dose}</span>
                </span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>
                  {m.time}{openState.key <= todayKey && ' · ' + (taken ? t('taken', 'alındı') : t('not logged', 'kayıt yok'))}
                </span>
              </div>
            );
          }) : (
            <div style={{ fontSize: 12.5, color: 'var(--muted)', fontStyle: 'italic' }}>
              {t('No doses scheduled this day.', 'Bu gün için planlı doz yok.')}
            </div>
          )}
          {openState.titr.map(x => (
            <div key={x.id} style={{ marginTop: 8, fontSize: 11.5, color: 'var(--ink-2)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--signal-warn)', flexShrink: 0 }}/>
              {t('Dose change', 'Doz değişikliği')}{x.note ? ' — ' + x.note : ''}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ paddingLeft: 4, fontSize: 12.5, color: 'var(--muted)', fontStyle: 'italic', fontFamily: 'var(--serif)' }}>
          {t('Pick a day to see its doses.', 'Dozlarını görmek için bir gün seç.')}
        </div>
      )}
      </div>
    </Card>
  );
}

export { DoseCalendar };
