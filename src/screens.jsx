import React from 'react';
import { I18N, t, useLang } from './i18n';
import { DoseCalendar } from './dose-calendar';
import { ImportLabModal } from './lab-import';
import { RegimenEditor } from './regimen';
import { DoctorSummary } from './doctor-summary';
import { PHASE_TINT } from './phase-colors';
import { libraryFor, symptomsFor } from './screen-content';
import { Card, DateNav, ICONS, Icon, LABS, Logo, RangeBar, SilBtn, SYMPTOMS, Sparkline, SymptomTrack, TODAY_DATE, TODAY_KEY, activeMeds, getTodayKey, labCurrent, labHistory, labReadings, medTaken, nowHM, regimenDay, todaysDoses, whenLabel } from './shared';
import { STAGES } from './stages';
import { SupplementsPanel } from './supplements';
import { ReferenceCard } from './reference-card';
import { rangeForLab } from './physiology';
import { useMonthView, MonthNav, WeekdayRow } from './month-grid';

/* screens.jsx — Perim navigable screens (interactive, persistent) */
/* eslint-disable */

// ─── Shared helpers ────────────────────────────────────────────
/* Yedek döngü uzunluğu. Kullanıcının kendi değeri (regimen.cycleLength) her
   zaman önceliklidir — burası yalnızca hiç kurulmamışsa devreye girer.
   Eskiden burada örnek hastadan kalma sabit 32 vardı ve gün sayımı herkes için
   32'ye sarıyordu; 28 günlük bir döngüde faz etiketleri günlerce kayıyordu. */
const CYCLE_LEN = 28;
function cycleLenOf(lunara) {
  const n = lunara && ((lunara.regimen && lunara.regimen.cycleLength) || lunara.cycleLength);
  return Math.max(15, Math.min(60, Number(n) || CYCLE_LEN));
}
function daysBetween(aIso, b) {
  const a = new Date(aIso + 'T00:00:00');
  return Math.floor((b - a) / 86400000);
}
/* Döngü çapası yoksa döngü günü BİLİNMİYOR demektir — null döner.
   Eskiden çapa kurulumda sessizce bugüne düşüyordu; kullanıcı hiçbir şey
   girmemişken uygulama "döngünün 1. günündesin, menstrüel fazı" diyor,
   ayı fazlara boyuyor ve beş günü "beklenen kanama" işaretliyordu.
   null döndürmek çağıranı bu hâli ele almaya zorluyor. */
function cycleDayFrom(periodStartIso, today = TODAY_DATE, cycleLength) {
  if (!periodStartIso) return null;
  const L = Math.max(15, Math.min(60, Number(cycleLength) || CYCLE_LEN));
  const d = daysBetween(periodStartIso, today);
  return ((d % L) + L) % L + 1;
}
// Kullanıcı son reglinin ilk gününü işaretlemiş mi
function hasCycleAnchor(lunara) { return !!(lunara && lunara.periodStart); }
/* Faz sınırları döngü uzunluğuna göre kayar. Luteal faz kişiden kişiye pek
   değişmez (~14 gün); uzayıp kısalan folliküler fazdır. Sınırları sabit günlere
   çakmak 32 günlük bir döngüde ovülasyonu haftalarca erken gösterirdi. */
function phaseBounds(cycleLength) {
  const L = Math.max(15, Math.min(60, Number(cycleLength) || CYCLE_LEN));
  const ov = Math.max(10, L - 14);          // tahmini ovülasyon günü
  return { L, ov, bleedEnd: 5, follEnd: ov - 2, ovEnd: Math.min(L, ov + 2) };
}
// Gün bilinmiyorsa faz da bilinmiyor — uydurulmuş bir faz göstermektense null
function phaseOf(day, cycleLength) {
  if (day == null) return null;
  const b = phaseBounds(cycleLength);
  if (day <= b.bleedEnd) return { key: 'menstrual', label: 'Menstrual', labelTr: 'Menstrüel' };
  if (day <= b.follEnd) return { key: 'follicular', label: 'Follicular', labelTr: 'Folliküler' };
  if (day <= b.ovEnd) return { key: 'ovulation', label: 'Ovulation', labelTr: 'Ovulasyon' };
  return { key: 'luteal', label: 'Luteal', labelTr: 'Luteal' };
}
function phaseLabel(ph) {
  if (!ph) return t('not set yet', 'henüz belirlenmedi');
  return t(ph.label, ph.labelTr);
}
const MOON_NAMES_TR = {
  'New': 'Yeni ay', 'Waxing crescent': 'İlk hilal', 'First quarter': 'İlk dördün',
  'Waxing gibbous': 'Şişkin (büyüyen)', 'Full': 'Dolunay', 'Waning gibbous': 'Şişkin (küçülen)',
  'Last quarter': 'Son dördün', 'Waning crescent': 'Son hilal',
};
function moonName(moon) { return I18N.lang === 'tr' ? (MOON_NAMES_TR[moon.name] || moon.name) : moon.name; }

/* ── Kanama ────────────────────────────────────────────────────
   Beklenen kanama döngü matematiğinden gelir; gerçekleşen kanama
   kullanıcının işaretlediği günlerden (periodDays). Loğusa ve perimenopoz
   belirti setlerinde kanama zaten bir belirti — evre değişince o kayıtlar
   görünmez olmasın diye onlar da sayılıyor. */
const BLEED_SYMPTOM_KEYS = ['bleeding', 'cycle'];
// 0 = kanama yok, 1..3 = yoğunluk (yoğunluksuz işaretlenen gün 2 sayılır)
function bledOn(lunara, dateKey) {
  if (!lunara) return 0;
  const marked = (lunara.periodDays || {})[dateKey];
  if (marked) return typeof marked === 'number' ? marked : 2;
  const sym = (lunara.symptomLog || {})[dateKey];
  if (sym) for (const k of BLEED_SYMPTOM_KEYS) if (sym[k] > 0) return sym[k];
  return 0;
}
/* Döngü gününe göre kanama beklenen gün mü.
   Gün bilinmiyorsa beklenti de yoktur: null'ı sessizce 0'a çevirip "evet"
   demek, çapası olmayan bir kaydın takvimini kesikli çerçevelerle doldururdu. */
function bleedExpected(cycleDay, cycleLength) {
  if (cycleDay == null) return false;
  return cycleDay <= phaseBounds(cycleLength).bleedEnd;
}

/* Bir fazın gün aralığı, örn. "6.–12. günler".
   Beslenme ve Hareket ekranlarında bu aralıklar sabit metindi ("19.–32. günler")
   ve örnek hastanın 32 günlük döngüsünden kalmıştı — 28 günlük bir kullanıcıda
   döngü takvimiyle çelişiyordu. Artık phaseBounds ile aynı kaynaktan geliyor. */
/* Tohum döngüsünün iki yarısının gün aralığı.
   Protokol ovülasyona bağlıdır: birinci yarı 1. günden ovülasyona (keten +
   kabak), ikinci yarı ovülasyondan döngü sonuna (susam + ay çekirdeği).
   Metin sabit "1.–14." / "15.–28." yazıyordu; 35 günlük bir döngüde ikinci
   yarı 7 gün erken başlamış gibi görünüyordu. phaseBounds ile aynı kaynak. */
function seedRange(half, cycleLength) {
  const b = phaseBounds(cycleLength);
  const [from, to] = half === 'first' ? [1, b.ov] : [b.ov + 1, b.L];
  return I18N.lang === 'tr' ? `${from}.–${to}. günler` : `Days ${from}–${to}`;
}

function phaseRange(key, cycleLength) {
  const b = phaseBounds(cycleLength);
  const [from, to] = key === 'menstrual' ? [1, b.bleedEnd]
    : key === 'follicular' ? [b.bleedEnd + 1, b.follEnd]
    : key === 'ovulation' ? [b.follEnd + 1, b.ovEnd]
    : [b.ovEnd + 1, b.L];
  return I18N.lang === 'tr' ? `${from}.–${to}. günler` : `Days ${from}–${to}`;
}

// Moon phase (synodic) for a given date
function moonPhase(date) {
  const synodic = 29.53058867;
  const ref = new Date(Date.UTC(2000, 0, 6, 18, 14));
  const days = (date - ref) / 86400000;
  const age = ((days % synodic) + synodic) % synodic;
  const frac = age / synodic; // 0 new, .5 full
  const names = ['New', 'Waxing crescent', 'First quarter', 'Waxing gibbous', 'Full', 'Waning gibbous', 'Last quarter', 'Waning crescent'];
  const idx = Math.floor((frac * 8) + 0.5) % 8;
  return { frac, age, name: names[idx], illum: (1 - Math.cos(frac * 2 * Math.PI)) / 2 };
}

/* Maskedeki gölge dairesinin yeri.

   Eskiden off = cos(frac·2π)·r idi ve iki yerden birden yanlıştı:
   yeni ayda (frac 0) gölgeyi diskin tamamen dışına atıp yeni ayı yarım ay
   gibi gösteriyor, dördünlerde (frac .25/.75) gölgeyi diskin üstüne
   bindirip yarım ayı kararmış bir daireye çeviriyordu — ekranda bugünün
   evresi hiçbir zaman doğru çıkmıyordu.

   Doğrusu aydınlık orana bağlı: gölge yeni ayda diskin tam üstünde
   (hiç ışık), dolunayda 2r kadar uzakta (gölge yok). Yön de terstiydi;
   büyüyen ayda aydınlık sağdadır, dolayısıyla gölge solda kalır. */
function moonMask(frac) {
  const r = 42;
  const illum = (1 - Math.cos(frac * 2 * Math.PI)) / 2;   // 0 yeni, 1 dolu
  return { r, off: 2 * r * illum, waxing: frac < 0.5 };
}

function MoonDisc({ size = 64, frac }) {
  const m = 'moon-' + Math.round(frac * 1000);
  const { r, off, waxing } = moonMask(frac);
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <defs>
        {/* Ay gövdesi krem kalır — ay kremdir; gölgesi mor gökyüzüne uyar. */}
        <radialGradient id={m + 'g'} cx="42%" cy="38%" r="65%">
          <stop offset="0%" stopColor="oklch(0.93 0.02 85)"/>
          <stop offset="100%" stopColor="oklch(0.82 0.03 80)"/>
        </radialGradient>
        <mask id={m}>
          <rect width="100" height="100" fill="black"/>
          <circle cx="50" cy="50" r={r} fill="white"/>
          <circle cx={50 + (waxing ? -off : off)} cy="50" r={r} fill="black"/>
        </mask>
      </defs>
      <circle cx="50" cy="50" r={r} fill="oklch(0.42 0.04 300)" opacity="0.18"/>
      <circle cx="50" cy="50" r={r} fill={`url(#${m}g)`} mask={`url(#${m})`}/>
      <circle cx="50" cy="50" r={r} fill="none" stroke="var(--line)" strokeWidth="1" opacity="0.5"/>
    </svg>
  );
}

// Section header used across screens
function ScreenHead({ eyebrow, title, accent, right }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 22 }}>
      <div>
        <div className="eyebrow" style={{ marginBottom: 6 }}>{eyebrow}</div>
        <h2 className="serif-display" style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 30, margin: 0, color: 'var(--ink)' }}>
          {title}
        </h2>
      </div>
      {right}
    </div>
  );
}

function Btn({ children, primary, onClick, style, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      cursor: disabled ? 'default' : 'pointer',
      opacity: disabled ? 0.45 : 1,
      padding: '10px 16px', borderRadius: 999,
      background: primary ? 'var(--ink)' : 'transparent',
      color: primary ? 'var(--ivory)' : 'var(--ink-2)',
      boxShadow: primary ? 'none' : 'inset 0 0 0 1px var(--line)',
      fontSize: 13, fontWeight: primary ? 600 : 500,
      display: 'inline-flex', alignItems: 'center', gap: 8,
      transition: 'all 160ms ease', ...style,
    }}>{children}</button>
  );
}

const wrap = { padding: '18px 36px 48px', display: 'flex', flexDirection: 'column', gap: 20 };

/* ════════════════ TITRATION LOG (BHRT dose-change history) ════════════════ */
const TITR_REASONS = [
  { k: 'symptoms',  en: 'Symptoms persist',      tr: 'Belirtiler sürüyor' },
  { k: 'side',      en: 'Side effects',          tr: 'Yan etki' },
  { k: 'labs',      en: 'Lab result',            tr: 'Lab sonucu' },
  { k: 'doctor',    en: 'Doctor advised',        tr: 'Doktor önerisi' },
  { k: 'improving', en: 'Going well — continue', tr: 'İyi gidiyor, sürdür' },
];
const reasonLabel = (k) => { const r = TITR_REASONS.find(x => x.k === k); return r ? t(r.en, r.tr) : k; };

function TitrationLog({ lunara, api }) {
  const entries = [...(lunara.titration || [])].sort((a, b) => (a.date < b.date ? 1 : -1));
  const meds = (lunara.regimen && lunara.regimen.meds) || [];
  const [adding, setAdding] = React.useState(false);
  const [date, setDate] = React.useState(getTodayKey());
  const [med, setMed] = React.useState('');
  const [from, setFrom] = React.useState('');
  const [to, setTo] = React.useState('');
  const [reason, setReason] = React.useState('');
  const [note, setNote] = React.useState('');

  const canSave = med.trim() && (to.trim() || from.trim());
  const reset = () => { setMed(''); setFrom(''); setTo(''); setReason(''); setNote(''); setDate(getTodayKey()); setAdding(false); };
  const save = () => {
    if (!canSave) return;
    api.addTitration({ date, med: med.trim(), from: from.trim(), to: to.trim(), reason, note: note.trim() });
    reset();
  };

  const fieldStyle = {
    width: '100%', padding: '10px 12px', borderRadius: 'var(--r-sm)', boxSizing: 'border-box',
    border: '1px solid var(--line)', background: 'var(--ivory)', color: 'var(--ink)',
    fontFamily: 'var(--sans)', fontSize: 13.5, outline: 'none',
  };
  const lblStyle = { fontSize: 10.5, fontFamily: 'var(--mono)', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted)' };

  return (
    <Card style={{ marginTop: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 4 }}>{t('BHRT · DOSE ADJUSTMENTS', 'BHRT · DOZ AYARLAMALARI')}</div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 20 }}>{t('Titration log', 'Titrasyon günlüğü')}</div>
        </div>
        {!adding && <Btn primary onClick={() => setAdding(true)}><Icon d={ICONS.plus} size={13} sw={2}/> {t('Log a change', 'Değişiklik ekle')}</Btn>}
      </div>
      <p style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5, margin: '0 0 16px', maxWidth: 620 }}>
        {t('Record every dose change and why. Over time this shows what worked — and gives your doctor a clear history.',
           'Her doz değişimini ve nedenini kaydet. Zamanla neyin işe yaradığını gösterir — ve doktoruna net bir geçmiş sunar.')}
      </p>

      {adding && (
        <div className="fade-up" style={{ padding: '16px', borderRadius: 'var(--r-md)', background: 'var(--bone)', marginBottom: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <span style={lblStyle}>{t('Date', 'Tarih')}</span>
              <input type="date" max={getTodayKey()} value={date} onChange={e => setDate(e.target.value)} style={fieldStyle}/>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <span style={lblStyle}>{t('Medication', 'İlaç')}</span>
              <input value={med} onChange={e => setMed(e.target.value)} placeholder={t('e.g. Estradiol', 'ör. Estradiol')} style={fieldStyle}/>
            </label>
          </div>
          {meds.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              {meds.map(m => (
                <button key={m.id} onClick={() => setMed(t(m.name, m.nameTr || m.name))} style={{
                  fontSize: 11.5, padding: '5px 10px', borderRadius: 999, cursor: 'pointer',
                  background: 'var(--card)', color: 'var(--ink-2)', boxShadow: 'inset 0 0 0 1px var(--line-soft)',
                }}>{t(m.name, m.nameTr || m.name)}</button>
              ))}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <span style={lblStyle}>{t('From', 'Eskisi')}</span>
              <input value={from} onChange={e => setFrom(e.target.value)} placeholder={t('e.g. 0.5 mg', 'ör. 0.5 mg')} style={fieldStyle}/>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <span style={lblStyle}>{t('To', 'Yenisi')}</span>
              <input value={to} onChange={e => setTo(e.target.value)} placeholder={t('e.g. 0.75 mg', 'ör. 0.75 mg')} style={fieldStyle}/>
            </label>
          </div>
          <span style={{ ...lblStyle, display: 'block', marginBottom: 7 }}>{t('Reason', 'Neden')}</span>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 12 }}>
            {TITR_REASONS.map(r => {
              const on = reason === r.k;
              return (
                <button key={r.k} onClick={() => setReason(on ? '' : r.k)} style={{
                  fontSize: 12, padding: '7px 12px', borderRadius: 999, cursor: 'pointer', fontWeight: on ? 600 : 500,
                  background: on ? 'var(--accent)' : 'var(--card)', color: on ? 'var(--ivory)' : 'var(--ink-2)',
                  boxShadow: on ? 'none' : 'inset 0 0 0 1px var(--line-soft)',
                }}>{t(r.en, r.tr)}</button>
              );
            })}
          </div>
          <input value={note} onChange={e => setNote(e.target.value)} placeholder={t('Note (optional)', 'Not (isteğe bağlı)')} style={{ ...fieldStyle, marginBottom: 14 }}/>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={save} disabled={!canSave} style={{
              flex: 2, padding: '11px 0', borderRadius: 999, border: 'none', cursor: canSave ? 'pointer' : 'not-allowed',
              background: 'var(--ink)', color: 'var(--ivory)', fontFamily: 'var(--sans)', fontSize: 13.5, fontWeight: 600, opacity: canSave ? 1 : 0.45,
            }}>{t('Save', 'Kaydet')}</button>
            <button onClick={reset} style={{
              flex: 1, padding: '11px 0', borderRadius: 999, cursor: 'pointer',
              border: '1px solid var(--line)', background: 'transparent', color: 'var(--ink-2)', fontFamily: 'var(--sans)', fontSize: 13.5, fontWeight: 600,
            }}>{t('Cancel', 'Vazgeç')}</button>
          </div>
        </div>
      )}

      {entries.length === 0 && !adding ? (
        <div style={{ padding: '18px 0', textAlign: 'center', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 15, color: 'var(--muted)' }}>
          {t('No adjustments logged yet.', 'Henüz ayarlama kaydedilmedi.')}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {entries.map((e, i) => (
            <div key={e.id} style={{ display: 'grid', gridTemplateColumns: '20px 1fr auto', gap: 14, alignItems: 'flex-start', paddingBottom: i < entries.length - 1 ? 18 : 0 }}>
              {/* timeline rail */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 3 }}>
                <span style={{ width: 11, height: 11, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }}/>
                {i < entries.length - 1 && <span style={{ width: 2, flex: 1, minHeight: 24, background: 'var(--line-soft)', marginTop: 4 }}/>}
              </div>
              {/* body */}
              <div>
                <div style={{ fontSize: 11, color: 'var(--muted-2)', fontFamily: 'var(--mono)', marginBottom: 3 }}>{fmtLabDate(e.date)}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>{e.med}</span>
                  {(e.from || e.to) && (
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 12.5, color: 'var(--ink-2)' }}>
                      {e.from || '—'} <span style={{ color: 'var(--accent)' }}>→</span> {e.to || '—'}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
                  {e.reason && (
                    <span style={{ fontSize: 10.5, fontFamily: 'var(--mono)', letterSpacing: '0.04em', padding: '3px 9px', borderRadius: 999, background: 'var(--accent-soft)', color: 'var(--ink-2)' }}>{reasonLabel(e.reason)}</span>
                  )}
                  {e.note && <span style={{ fontSize: 12.5, color: 'var(--muted)', fontStyle: 'italic' }}>{e.note}</span>}
                </div>
              </div>
              {/* remove */}
              <button onClick={() => api.removeTitration(e.id)} title={t('Remove', 'Sil')} style={{ padding: 4, color: 'var(--muted-2)', cursor: 'pointer' }}>
                <Icon d={X_ICON} size={14} sw={1.8}/>
              </button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/* ── Alınan miktar ────────────────────────────────────────────────
   İlacın "dose" alanı reçetedeki miktardır ("0.5 mg"). Gerçekte alınan bundan
   farklı olabilir — yarım uygulama, atlanan yarım tablet, hekimin ara ayarı.
   İşaretlerken reçetedeki miktar ön-doldurulur, kullanıcı üzerine yazabilir;
   fark varsa görünür işaretlenir ki doktor özetinde de fark edilsin. */
const DOSE_NUM_RE = /(\d+(?:[.,]\d+)?)/;
const DOSE_UNIT_RE = /\d+(?:[.,]\d+)?\s*([a-zA-Zµμ%/]+)/;
function doseAmountOf(med) {
  const m = DOSE_NUM_RE.exec(String(med.dose || ''));
  return m ? Number(m[1].replace(',', '.')) : null;
}
function doseUnitOf(med) {
  const m = DOSE_UNIT_RE.exec(String(med.dose || ''));
  return m ? m[1] : '';
}

function TakenAmount({ med, entry, last, onChange }) {
  const presc = doseAmountOf(med);
  const unit = entry.unit || doseUnitOf(med);
  const [draft, setDraft] = React.useState(entry.amount == null ? '' : String(entry.amount));
  React.useEffect(() => { setDraft(entry.amount == null ? '' : String(entry.amount)); }, [entry.amount]);

  const val = draft === '' ? null : Number(draft.replace(',', '.'));
  const farkli = val != null && presc != null && Math.abs(val - presc) > 1e-9;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
      padding: '0 0 14px 60px', borderBottom: last ? 'none' : '1px solid var(--line-soft)',
    }}>
      {/* Alınma saati. Geçmiş bir güne işaret koyarken kaydedilen saat, ilacın
          gerçekten alındığı saat değildir — düzeltilebilir olması şart. */}
      <label style={{ fontSize: 11.5, color: 'var(--muted)' }} htmlFor={'at-' + med.id}>
        {t('Time taken', 'Alınma saati')}
      </label>
      <input id={'at-' + med.id} type="time" value={entry.at || med.time || '08:00'}
        onChange={e => e.target.value && onChange({ at: e.target.value })}
        style={{
          padding: '5px 8px', borderRadius: 9, fontFamily: 'var(--mono)', fontSize: 12.5,
          border: '1px solid var(--line)', background: 'var(--card)', color: 'var(--ink)', outline: 'none',
        }}/>
      <label style={{ fontSize: 11.5, color: 'var(--muted)', marginLeft: 4 }} htmlFor={'amt-' + med.id}>
        {t('Amount taken', 'Alınan miktar')}
      </label>
      <input id={'amt-' + med.id} inputMode="decimal" value={draft}
        onChange={e => setDraft(e.target.value.replace(/[^\d.,]/g, '').slice(0, 8))}
        onBlur={() => onChange({ amount: draft, unit })}
        onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}
        placeholder={presc != null ? String(presc) : '—'}
        style={{
          width: 68, padding: '5px 9px', borderRadius: 9, fontFamily: 'var(--mono)', fontSize: 12.5,
          border: '1px solid var(--line)', background: 'var(--card)', color: 'var(--ink)', outline: 'none',
        }}/>
      {unit && <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--muted)' }}>{unit}</span>}
      {farkli && (
        <span style={{ fontSize: 11, color: 'var(--signal-warn)' }}>
          {t('differs from plan', 'plandan farklı')} ({med.dose})
        </span>
      )}
    </div>
  );
}

/* ════════════════ DOSES ════════════════ */
function DosesScreen({ lunara, api, logDate, setLogDate }) {
  const [editing, setEditing] = React.useState(false);
  useLang();
  const dk = logDate || TODAY_KEY;
  const dObj = new Date(dk + 'T00:00:00');
  const isToday = dk === TODAY_KEY;
  const { meds, day } = todaysDoses(lunara, dObj);
  const takenCount = meds.filter(d => medTaken(lunara, d.id, dk)).length;
  const cycLen = lunara.regimen ? lunara.regimen.cycleLength : 28;
  const noRegimen = !lunara.regimen || (lunara.regimen.meds || []).length === 0;

  // Real last-7-days adherence from doseLog + regimen schedule
  const locale = I18N.lang === 'tr' ? 'tr' : 'en';
  // 30-day adherence: taken / scheduled (— when nothing was scheduled)
  let sch30 = 0, tak30 = 0;
  for (let i = 29; i >= 0; i--) {
    const d = new Date(TODAY_DATE); d.setDate(d.getDate() - i);
    const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    const scheduled = lunara.regimen ? activeMeds(lunara.regimen, regimenDay(lunara.regimen, d)).length : 0;
    const takenN = lunara.doseLog[key] ? Object.keys(lunara.doseLog[key]).length : 0;
    sch30 += scheduled; tak30 += Math.min(takenN, scheduled);
  }
  const adh30 = sch30 > 0 ? Math.round((tak30 / sch30) * 100) : null;
  return (
    <div style={wrap}>
      <ScreenHead eyebrow={t(`REGIMEN · DAY ${day} OF ${cycLen}`, `REJİM · ${cycLen} GÜNÜN ${day}. GÜNÜ`)} title={isToday ? t("Today's doses", 'Bugünün dozları') : t('Doses', 'Dozlar')}
        right={<Btn primary={editing || noRegimen} onClick={() => setEditing(e => !e)}>
          <Icon d={editing ? ICONS.check : (noRegimen ? ICONS.plus : ICONS.cog)} size={14} sw={editing ? 2 : 1.6}/> {editing ? t('Done', 'Bitti') : (noRegimen ? t('Add medication', 'İlaç ekle') : t('Edit schedule', 'Programı düzenle'))}
        </Btn>} />

      {setLogDate && !noRegimen && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, margin: '-4px 0 0' }}>
          <DateNav date={dk} onChange={setLogDate}/>
          <span style={{ fontSize: 12, color: 'var(--muted)', fontStyle: 'italic', fontFamily: 'var(--serif)' }}>
            {isToday ? t('Log for another day too', 'Başka bir gün için de kaydedebilirsin') : t('Logging a past day', 'Geçmiş bir güne kaydediyorsun')}
          </span>
        </div>
      )}

      {editing && <RegimenEditor lunara={lunara} api={api} onClose={() => setEditing(false)}/>}

      <div className="mb-stack" style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 20 }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontFamily: 'var(--serif)', fontSize: 22 }}>{takenCount} / {meds.length} {t('taken', 'alındı')}</span>
            <span className="eyebrow-mono" style={{ color: 'var(--accent)' }}>{t('TAP TO LOG', 'KAYDETMEK İÇİN DOKUN')}</span>
          </div>
          {noRegimen ? (
            <div style={{ padding: '28px 0', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 20, fontStyle: 'italic', color: 'var(--ink)', marginBottom: 6 }}>{t('No medication added yet', 'Henüz ilaç eklenmedi')}</div>
              <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 16px', lineHeight: 1.5 }}>
                {t('Add the plan your clinician prescribed — Perim will remind you and track your cycle days.',
                   'Hekiminin verdiği programı ekle — Perim sana hatırlatır ve döngü günlerini takip eder.')}
              </p>
              <Btn primary onClick={() => setEditing(true)}><Icon d={ICONS.plus} size={13} sw={2}/> {t('Add medication', 'İlaç ekle')}</Btn>
            </div>
          ) : meds.length === 0 ? (
            <div style={{ padding: '28px 0', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 20, fontStyle: 'italic', color: 'var(--ink)', marginBottom: 6 }}>{t('A rest day', 'Bir ara günü')}</div>
              <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0, lineHeight: 1.5 }}>{t('No medications scheduled for today in your cycle.', 'Bugün döngünde planlı ilaç yok.')}</p>
            </div>
          ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {meds.map((d, i) => {
              const taken = medTaken(lunara, d.id, dk);
              return (
                <React.Fragment key={d.id}>
                {/* Bugüne işaretlerken "şimdi" doğru varsayılan; geçmiş bir güne
                    işaretlerken kayıt anındaki saatin bir anlamı yok, ilacın
                    planlanan saatinden başlamak daha yakın bir tahmin. */}
                <button onClick={() => api.toggleMed(dk, d.id,
                    dk === TODAY_KEY ? nowHM() : (d.time || nowHM()),
                    doseAmountOf(d), doseUnitOf(d))}
                  style={{
                    display: 'grid', gridTemplateColumns: '46px 1fr auto', gap: 14, alignItems: 'center',
                    padding: '14px 0', borderBottom: i < meds.length - 1 && !taken ? '1px solid var(--line-soft)' : 'none',
                    textAlign: 'left', cursor: 'pointer', background: 'transparent', width: '100%',
                  }}>
                  <div style={{
                    width: 46, height: 46, borderRadius: 14,
                    background: taken ? 'var(--accent)' : 'var(--bone)',
                    color: taken ? 'var(--ivory)' : 'var(--muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: taken ? 'none' : 'inset 0 0 0 1px var(--line)',
                    transition: 'all 180ms ease',
                  }}>
                    <Icon d={taken ? ICONS.check : ICONS.clock} size={18} sw={taken ? 2 : 1.5}/>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <span style={{ fontFamily: 'var(--serif)', fontSize: 18 }}>{t(d.name, d.nameTr || d.name)}</span>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-2)' }}>{d.dose}</span>
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>{t(d.detail || '', d.detailTr || d.detail || '')}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 12.5, color: taken ? 'var(--muted)' : 'var(--ink)', fontWeight: taken ? 400 : 600 }}>
                      {taken ? `${t('Taken', 'Alındı')} ${taken.at}` : d.time}
                    </span>
                    <div className="eyebrow-mono" style={{ fontSize: 9.5, color: 'var(--muted-2)' }}>{whenLabel(d.when).toUpperCase()}</div>
                  </div>
                </button>
                {taken && (
                  <TakenAmount med={d} entry={taken} last={i === meds.length - 1}
                    onChange={(patch) => api.updateDose(dk, d.id, patch)}/>
                )}
                </React.Fragment>
              );
            })}
          </div>
          )}
        </Card>
        {!noRegimen && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <AdherenceMonth lunara={lunara} adh30={adh30}/>
        </div>
        )}
      </div>

      {/* Aylık genel görünüm — bir güne dokununca o gün kayıt tarihi olur */}
      <DoseCalendar lunara={lunara} selected={dk} onPick={setLogDate}/>

      {/* BHRT titration log */}
      <TitrationLog lunara={lunara} api={api}/>

      {/* Supplements + phase recommendations */}
      <div style={{ marginTop: 4 }}>
        <div className="eyebrow" style={{ marginBottom: 14 }}>{t('SUPPLEMENTS', 'TAKVİYELER')}</div>
        <SupplementsPanel lunara={lunara} api={api} logDate={dk}/>
      </div>
    </div>
  );
}

/* ════════════════ SYMPTOMS ════════════════ */
const RATE_LABELS = ['None', 'Mild', 'Moderate', 'Strong'];
const RATE_LABELS_TR = ['Yok', 'Hafif', 'Orta', 'Güçlü'];
function rateLabel(v) { return I18N.lang === 'tr' ? RATE_LABELS_TR[v] : RATE_LABELS[v]; }

// Belirti anahtarı için son 14 günün gerçek log serisini üret (yoksa örnek seriye düş)
function realSeries(symptomLog, key, fallback) {
  const out = [];
  let hasReal = false;
  for (let i = 13; i >= 0; i--) {
    const d = new Date(TODAY_DATE);
    d.setDate(d.getDate() - i);
    const dk = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
    const day = symptomLog[dk];
    if (day && day[key] != null) { out.push(day[key]); hasReal = true; }
    else out.push(0);
  }
  return hasReal ? out : (fallback || out);
}

/* Monthly symptom heatmap — calendar grid tinted by intensity (0–3). */
const HEAT_NAV_BTN = { width: 26, height: 26, borderRadius: 8, background: 'var(--bone)', color: 'var(--ink-2)', fontSize: 15, lineHeight: 1, boxShadow: 'inset 0 0 0 1px var(--line-soft)' };
const HEAT_MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const HEAT_MONTHS_TR = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const HEAT_WD_EN = ['Mo','Tu','We','Th','Fr','Sa','Su'];
const HEAT_WD_TR = ['Pt','Sa','Ça','Pe','Cu','Ct','Pz'];
function heatTint(v) {
  return v == null ? 'var(--ivory)'
    : v === 0 ? 'var(--bone)'
    : v === 1 ? 'color-mix(in oklch, var(--accent) 30%, var(--card))'
    : v === 2 ? 'color-mix(in oklch, var(--accent) 62%, var(--card))'
    : 'var(--accent)';
}
function SymptomHeatmap({ symptomLog, syms, selected, onPick }) {
  const today = new Date(TODAY_DATE);
  const [symKey, setSymKey] = React.useState((syms[0] && syms[0].key) || null);
  const [view, setView] = React.useState({ y: today.getFullYear(), m: today.getMonth() });

  const dk = (y, m, d) => y + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
  const todayKey = dk(today.getFullYear(), today.getMonth(), today.getDate());
  const first = new Date(view.y, view.m, 1);
  const lead = (first.getDay() + 6) % 7; // Monday-first leading blanks
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const isCurrentMonth = view.y === today.getFullYear() && view.m === today.getMonth();
  const go = (delta) => setView(v => { const d = new Date(v.y, v.m + delta, 1); return { y: d.getFullYear(), m: d.getMonth() }; });
  const fg = (v) => (v != null && v >= 2) ? 'var(--ivory)' : 'var(--muted)';

  let logged = 0;
  for (let d = 1; d <= daysInMonth; d++) { const day = symptomLog[dk(view.y, view.m, d)]; if (day && day[symKey] != null) logged++; }

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <div className="eyebrow">{t('Symptom calendar', 'Belirti takvimi')}</div>
          {onPick && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>{t('Tap a day to log it', 'Bir güne dokun ve kaydet')}</div>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => go(-1)} style={{ ...HEAT_NAV_BTN, cursor: 'pointer' }}>‹</button>
          <span style={{ fontSize: 12.5, fontWeight: 600, minWidth: 108, textAlign: 'center' }}>
            {(I18N.lang === 'tr' ? HEAT_MONTHS_TR : HEAT_MONTHS_EN)[view.m]} {view.y}
          </span>
          <button onClick={() => go(1)} disabled={isCurrentMonth}
            style={{ ...HEAT_NAV_BTN, opacity: isCurrentMonth ? 0.3 : 1, cursor: isCurrentMonth ? 'default' : 'pointer' }}>›</button>
        </div>
      </div>

      {/* symptom selector */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
        {syms.map(s => {
          const on = s.key === symKey;
          return (
            <button key={s.key} onClick={() => setSymKey(s.key)} style={{
              padding: '5px 11px', borderRadius: 999, fontSize: 11.5, cursor: 'pointer', fontWeight: on ? 600 : 500,
              background: on ? 'var(--ink)' : 'var(--bone)', color: on ? 'var(--ivory)' : 'var(--muted)',
              boxShadow: on ? 'none' : 'inset 0 0 0 1px var(--line-soft)',
            }}>{t(s.label, s.labelTr)}</button>
          );
        })}
      </div>

      {/* weekday header */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 5, marginBottom: 5 }}>
        {(I18N.lang === 'tr' ? HEAT_WD_TR : HEAT_WD_EN).map((w, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: 9.5, fontFamily: 'var(--mono)', color: 'var(--muted-2)', letterSpacing: '0.04em' }}>{w}</div>
        ))}
      </div>

      {/* day grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 5 }}>
        {Array.from({ length: lead }).map((_, i) => <div key={'b' + i} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const key = dk(view.y, view.m, day);
          const cell = symptomLog[key];
          const v = (cell && cell[symKey] != null) ? cell[symKey] : null;
          const future = key > todayKey;
          const isToday = key === todayKey;
          const isSel = key === selected;
          const pickable = onPick && !future;
          const shadow = isSel ? 'inset 0 0 0 2px var(--accent)'
            : isToday ? 'inset 0 0 0 2px var(--ink)'
            : (v == null && !future ? 'inset 0 0 0 1px var(--line-soft)' : 'none');
          const style = {
            aspectRatio: '1 / 1', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontFamily: 'var(--mono)', padding: 0,
            background: future ? 'transparent' : heatTint(v),
            color: future ? 'var(--muted-2)' : fg(v),
            opacity: future ? 0.4 : 1,
            boxShadow: shadow,
          };
          const label = `${day} · ${v == null ? t('no entry', 'kayıt yok') : rateLabel(v)}`;
          return pickable ? (
            <button key={key} title={label} aria-label={label} onClick={() => onPick(key)}
              style={{ ...style, cursor: 'pointer' }}>{day}</button>
          ) : (
            <div key={key} title={label} style={style}>{day}</div>
          );
        })}
      </div>

      {/* legend */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
        <span style={{ fontSize: 10.5, color: 'var(--muted-2)', fontFamily: 'var(--mono)' }}>{logged} {t('days logged', 'gün kayıtlı')}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: 'var(--muted-2)' }}>{t('None', 'Yok')}</span>
          {[0, 1, 2, 3].map(v => <span key={v} style={{ width: 14, height: 14, borderRadius: 4, background: heatTint(v), boxShadow: v === 0 ? 'inset 0 0 0 1px var(--line-soft)' : 'none' }} />)}
          <span style={{ fontSize: 10, color: 'var(--muted-2)' }}>{t('Strong', 'Güçlü')}</span>
        </div>
      </div>
    </Card>
  );
}

function SymptomsScreen({ lunara, api, logDate, setLogDate }) {
  const dk = logDate || TODAY_KEY;
  const isToday = dk === TODAY_KEY;
  const dayLog = lunara.symptomLog[dk] || {};
  const syms = symptomsFor(lunara.stage);
  const logged = syms.filter(s => dayLog[s.key] != null).length;
  const [note, setNote] = React.useState('');
  return (
    <div style={wrap}>
      <ScreenHead eyebrow={isToday ? t('JOURNAL · TODAY', 'GÜNLÜK · BUGÜN') : t('JOURNAL', 'GÜNLÜK')} title={t('How are you feeling?', 'Nasıl hissediyorsun?')}
        right={<span style={{ fontSize: 12.5, color: 'var(--muted)' }}>{logged} / {syms.length} {t('logged', 'kaydedildi')}</span>} />
      {setLogDate && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, margin: '-4px 0 0' }}>
          <DateNav date={dk} onChange={setLogDate}/>
          <span style={{ fontSize: 12, color: 'var(--muted)', fontStyle: 'italic', fontFamily: 'var(--serif)' }}>
            {isToday ? t('Forgot a day? Pick it and log', 'Bir günü mü kaçırdın? Seçip kaydet') : t('Logging a past day', 'Geçmiş bir güne kaydediyorsun')}
          </span>
        </div>
      )}
      <div className="mb-stack" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Logger */}
        <Card>
          <div className="eyebrow" style={{ marginBottom: 16 }}>{isToday ? t('Rate today', 'Bugünü puanla') : t('Rate this day', 'Bu günü puanla')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {syms.map(s => {
              const val = dayLog[s.key] ?? null;
              return (
                <div key={s.key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 500 }}>{t(s.label, s.labelTr)}</span>
                    <span style={{ fontSize: 11.5, color: val == null ? 'var(--muted-2)' : 'var(--accent)', fontFamily: 'var(--mono)' }}>
                      {val == null ? '—' : rateLabel(val)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[0,1,2,3].map(v => {
                      const on = val === v;
                      return (
                        <button key={v} onClick={() => api.logSymptom(dk, s.key, v)}
                          style={{
                            flex: 1, height: 30, borderRadius: 8,
                            background: on ? 'var(--accent)' : 'var(--bone)',
                            color: on ? 'var(--ivory)' : 'var(--muted)',
                            boxShadow: on ? 'none' : 'inset 0 0 0 1px var(--line-soft)',
                            fontSize: 11, fontWeight: on ? 700 : 500, cursor: 'pointer',
                            transition: 'all 140ms ease',
                          }}>{v}</button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
        {/* History + note */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <SymptomHeatmap symptomLog={lunara.symptomLog} syms={syms} selected={dk} onPick={setLogDate} />
          <Card>
            <div className="eyebrow" style={{ marginBottom: 12 }}>{t('Add a note', 'Not ekle')}</div>
            <textarea value={note} onChange={e => setNote(e.target.value)}
              aria-label={t('Add a note', 'Not ekle')}
              placeholder={t('A line about your day, mood, anything…', 'Günün, ruh halin, aklındaki herhangi bir şey hakkında bir satır…')}
              style={{
                width: '100%', minHeight: 64, resize: 'vertical',
                border: '1px solid var(--line)', borderRadius: 12, padding: 12,
                fontFamily: 'var(--sans)', fontSize: 13.5, color: 'var(--ink)',
                background: 'var(--ivory)', outline: 'none', boxSizing: 'border-box',
              }}/>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
              <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>{lunara.notes.length} {t(lunara.notes.length === 1 ? 'note saved' : 'notes saved', 'not kayıtlı')}</span>
              <Btn primary onClick={() => { if (note.trim()) { api.addNote(note.trim()); setNote(''); } }}>
                <Icon d={ICONS.plus} size={13} sw={2}/> {t('Save note', 'Notu kaydet')}
              </Btn>
            </div>
            {lunara.notes.length > 0 && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--line-soft)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Not eklenebiliyordu ama silinemiyordu — yanlış yazılan bir
                    not kayıtta sonsuza kadar kalıyordu. */}
                {lunara.notes.slice(0, 3).map(n => (
                  <div key={n.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.5 }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--muted-2)', marginTop: 2 }}>{n.at}</span>
                    <span style={{ flex: 1, minWidth: 0 }}>{n.text}</span>
                    <SilBtn onSil={() => api.removeNote(n.id)} label={t('Delete note', 'Notu sil')}/>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ════════════════ LABS ════════════════ */
const X_ICON = 'M18 6 6 18M6 6l12 12';
// Short date label: 'YYYY-MM-DD' -> '4 Haz' / '4 Jun'
function fmtLabDate(iso) {
  const M_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const M_TR = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
  const p = String(iso || '').split('-');
  if (p.length !== 3) return iso || '';
  const d = parseInt(p[2], 10), mi = parseInt(p[1], 10) - 1;
  return d + ' ' + (I18N.lang === 'tr' ? M_TR : M_EN)[mi] || iso;
}

// PDF'ten gelen, kayıtlı hormon listesinde olmayan analitlerin meta bilgisi
function importedMetas(panels) {
  const metas = new Map();
  for (const p of panels) {
    for (const r of (p.readings || [])) {
      if (LABS.some(l => l.key === r.key) || metas.has(r.key)) continue;
      metas.set(r.key, { key: r.key, name: r.name, nameTr: r.nameTr || r.name, unit: r.unit || '', range: r.range || null, imported: true });
    }
  }
  return [...metas.values()];
}

/* ── Döngü gününe bağlı tahlil aralığı ──────────────────────────────
   Estradiol ve progesteronun "normal"i döngü gününe bağlıdır: estradiol
   3. günde ~34, 14. günde ~223 pg/mL; progesteron folliküler fazda <0.3,
   luteal fazda ~12 ng/mL. Tek bir sabit aralık, folliküler fazda çekilmiş
   sağlıklı bir tahlili yanlışlıkla "düşük" gösterir. Panelin çekildiği
   tarihe düşen döngü gününe göre aralık seçilir; fizyoloji modülünün
   kapsamadığı analitler (SHBG, FSH, serbest T) sabit aralığında kalır. */
function effectiveRange(lab, drawDate, lunara) {
  const fallback = { range: lab.range, cycleDay: null };
  if (!drawDate || !lunara || !lunara.periodStart) return fallback;
  const L = cycleLenOf(lunara);
  const cd = cycleDayFrom(lunara.periodStart, new Date(drawDate + 'T00:00:00'), L);
  const r = rangeForLab(lab.key, cd, L);
  if (!r) return { range: lab.range, cycleDay: cd };
  return { range: [r.low, r.high], cycleDay: cd, phaseLabel: r.phaseLabel, typical: r.typical };
}

function LabsScreen({ lunara, api, orneksiz }) {
  const panels = (lunara && lunara.labPanels) || [];
  const hasData = panels.length > 0;
  const [adding, setAdding] = React.useState(false);
  const [importing, setImporting] = React.useState(false);

  // When the user has entered values, show only analytes with data (registry
  // hormones first, then PDF-imported analytes); otherwise fall back to the
  // sample LABS so the screen has something to look at.
  const withData = LABS.filter(l => labHistory(panels, l.key).length > 0);
  const shown = hasData ? [...withData, ...importedMetas(panels)] : LABS;
  const [sel, setSel] = React.useState(shown[0] ? shown[0].key : LABS[0].key);
  React.useEffect(() => {
    if (shown.length && !shown.find(l => l.key === sel)) setSel(shown[0].key);
  }, [hasData, shown.length]); // eslint-disable-line

  const lab = shown.find(l => l.key === sel) || LABS[0];
  const value = hasData ? labCurrent(panels, lab.key) : lab.value;
  const history = hasData ? labHistory(panels, lab.key) : lab.history;
  const dates = hasData ? labReadingsDates(panels, lab.key) : ['Dec','Jan','Feb','Mar','Apr','May','Now'];
  const reads = hasData ? labReadings(panels, lab.key) : [];
  const drawDate = reads.length ? reads[reads.length - 1].date : null;
  const eff = effectiveRange(lab, drawDate, lunara);
  const range = eff.range;
  const inRange = value != null && range != null && value >= range[0] && value <= range[1];

  const name = (l) => t(l.name, l.nameTr || l.name);

  return (
    <div style={wrap}>
      <ScreenHead
        eyebrow={hasData
          ? t(`${panels.length} panel · last ${fmtLabDate(panels[0].date)}`, `${panels.length} panel · son ${fmtLabDate(panels[0].date)}`)
          : orneksiz
            ? t('No results yet', 'Henüz sonuç yok')
            : t('SAMPLE DATA', 'ÖRNEK VERİ')}
        title={t('Lab results', 'Tahlil sonuçları')}
        right={<div style={{ display: 'flex', gap: 8 }}>
          <Btn onClick={() => setImporting(true)}><Icon d={ICONS.vial} size={13} sw={1.6}/> {t('Import PDF', 'PDF’ten aktar')}</Btn>
          <Btn primary onClick={() => setAdding(true)}><Icon d={ICONS.plus} size={13} sw={2}/> {t('Add results', 'Sonuç ekle')}</Btn>
        </div>} />

      {!hasData && (
        <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: '-6px 0 16px', fontStyle: orneksiz ? 'normal' : 'italic' }}>
          {orneksiz
            ? t('Enter a blood test result and it is placed on your cycle day, with the reference range for that day. Values you type and values imported from a PDF end up in the same place.',
                'Bir kan tahlili sonucu gir; o günkü döngü gününe, günün referans aralığıyla birlikte oturur. Elle girdiğin de PDF’ten aktardığın da aynı yere düşer.')
            : t('These are sample values. Tap “Add results” to enter your own.',
                'Bunlar örnek değerlerdir. Kendi değerlerini girmek için “Sonuç ekle”ye dokun.')}
        </p>
      )}

      {/* orneksiz: kayıt yokken örnek eğriler çizilmiyor. Örnek veri, üstünde
          "ÖRNEK VERİ" yazsa bile kendi sonucu sanılıyor — bu uygulamada
          tekrar tekrar çıkan hata bu. Boş ekranda geriye tahlili nereden
          gireceğin kalıyor: baştaki iki düğme. Modallar zaten en altta. */}

      {!hasData && orneksiz ? null : (
      <div className="mb-stack" style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 20 }}>
        {/* List */}
        <Card pad={0} style={{ overflow: 'hidden' }}>
          {shown.map((l, i) => {
            const on = l.key === sel;
            const v = hasData ? labCurrent(panels, l.key) : l.value;
            const rd = hasData ? labReadings(panels, l.key) : [];
            const e = effectiveRange(l, rd.length ? rd[rd.length - 1].date : null, lunara);
            const rr = e.range;
            return (
              <button key={l.key} onClick={() => setSel(l.key)}
                style={{
                  width: '100%', textAlign: 'left', cursor: 'pointer',
                  display: 'grid', gridTemplateColumns: '1fr auto 120px', gap: 14, alignItems: 'center',
                  padding: '16px 22px', background: on ? 'var(--bone)' : 'transparent',
                  borderBottom: i < shown.length - 1 ? '1px solid var(--line-soft)' : 'none',
                  borderLeft: `3px solid ${on ? 'var(--accent)' : 'transparent'}`,
                  transition: 'background 140ms ease',
                }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600 }}>{name(l)}</span>
                  <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>{rr ? <>{t('ref', 'ref')} {rr[0]}–{rr[1]} {l.unit}{e.phaseLabel ? ' · ' + e.phaseLabel : ''}</> : l.unit}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                  <span style={{ fontFamily: 'var(--serif)', fontSize: 22 }}>{v != null ? v : '—'}</span>
                </div>
                <div style={{ width: 120 }}>{v != null && rr && <RangeBar value={v} range={rr} target={l.target}/>}</div>
              </button>
            );
          })}
        </Card>
        {/* Detail */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 4 }}>{name(lab)}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontFamily: 'var(--serif)', fontSize: 40, letterSpacing: '-0.02em' }}>{value != null ? value : '—'}</span>
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>{lab.unit}</span>
              </div>
            </div>
            {value != null && lab.range && (
              <span style={{
                fontSize: 11, fontFamily: 'var(--mono)', letterSpacing: '0.06em',
                padding: '6px 12px', borderRadius: 999,
                background: inRange ? 'var(--accent-soft)' : 'var(--signal-warn)',
                color: inRange ? 'var(--ink-2)' : 'var(--ivory)',
              }}>{inRange ? t('IN RANGE', 'ARALIKTA') : t('OUT OF RANGE', 'ARALIK DIŞI')}</span>
            )}
          </div>
          {history.length > 0 && (
            <>
              <div style={{ margin: '20px 0 8px' }}>
                <Sparkline data={history.length === 1 ? [history[0], history[0]] : history} color="var(--accent)" width={420} height={90}/>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--muted-2)', fontFamily: 'var(--mono)' }}>
                {(hasData ? dates : dates.map(m => (I18N.lang === 'tr'
                  ? ({Dec:'Ara',Jan:'Oca',Feb:'Şub',Mar:'Mar',Apr:'Nis',May:'May',Now:'Şimdi'}[m] || m) : m).toUpperCase()))
                  .map((d, i) => <span key={i}>{d}</span>)}
              </div>
            </>
          )}
          <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 15, lineHeight: 1.5, color: 'var(--ink-2)', marginTop: 22, borderTop: '1px solid var(--line-soft)', paddingTop: 18 }}>
            {lab.imported
              ? t('Imported from your e-Nabız report. Reference range comes from the reporting lab — discuss results with your clinician.',
                  'e-Nabız raporundan içe aktarıldı. Referans aralığı raporu veren laboratuvara aittir — sonuçları hekiminle değerlendir.')
              : labNote(lab.key, reads)}
          </p>
        </Card>
      </div>
      )}

      {/* Entered panels */}
      {hasData && (
        <Card style={{ marginTop: 20 }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>{t('Entered results', 'Girilen sonuçlar')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {panels.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                padding: '10px 14px', borderRadius: 'var(--r-md)', background: 'var(--bone)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{fmtLabDate(p.date)}</span>
                  <span style={{ fontSize: 11, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.readings.map(r => `${t(r.name, r.nameTr || r.name)} ${r.value}`).join(' · ')}
                  </span>
                </div>
                <button onClick={() => api.removeLabPanel(p.id)} title={t('Remove', 'Sil')}
                  style={{ flexShrink: 0, padding: 6, borderRadius: 8, color: 'var(--muted)', cursor: 'pointer' }}>
                  <Icon d={X_ICON} size={15} sw={1.8}/>
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {importing && <ImportLabModal onClose={() => setImporting(false)} api={api} />}
      {adding && <AddLabForm onClose={() => setAdding(false)} onSave={(panel) => api.addLabPanel(panel)} />}
    </div>
  );
}

// Reading dates for an analyte (short labels), oldest -> newest
function labReadingsDates(panels, key) {
  return (panels || [])
    .filter(p => (p.readings || []).some(r => r.key === key))
    .map(p => p.date)
    .sort()
    .map(fmtLabDate);
}

/* Simple manual lab-entry form (modal). Fill any subset of analytes. */
function AddLabForm({ onClose, onSave }) {
  const [date, setDate] = React.useState(getTodayKey());
  const [vals, setVals] = React.useState({});
  const set = (key, v) => setVals(o => ({ ...o, [key]: v }));

  const readings = LABS
    .map(l => {
      const raw = vals[l.key];
      if (raw == null || String(raw).trim() === '') return null;
      const num = parseFloat(String(raw).replace(',', '.'));
      if (isNaN(num)) return null;
      return { key: l.key, name: l.name, nameTr: l.nameTr, unit: l.unit, value: num };
    })
    .filter(Boolean);

  const submit = () => { if (readings.length) { onSave({ date, readings }); onClose(); } };

  const labelStyle = { fontSize: 10.5, fontFamily: 'var(--mono)', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)' };
  const fieldStyle = {
    width: '100%', padding: '10px 12px', borderRadius: 'var(--r-sm)',
    border: '1px solid var(--line)', background: 'var(--ivory)', color: 'var(--ink)',
    fontFamily: 'var(--sans)', fontSize: 14, outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(20,14,10,0.5)', backdropFilter: 'blur(3px)', padding: 18,
    }}>
      <div onClick={e => e.stopPropagation()} className="sheet-up" style={{
        width: '100%', maxWidth: 460, maxHeight: '88vh', overflow: 'auto',
        background: 'var(--card)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-card)',
        padding: 24,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 4 }}>{t('New results', 'Yeni sonuç')}</div>
            <h2 className="serif-display" style={{ margin: 0, fontSize: 24 }}>{t('Add lab values', 'Tahlil değeri ekle')}</h2>
          </div>
          <button onClick={onClose} style={{ padding: 6, color: 'var(--muted)', cursor: 'pointer' }}>
            <Icon d={X_ICON} size={18} sw={2}/>
          </button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ ...labelStyle, display: 'block', marginBottom: 6 }}>{t('DATE', 'TARİH')}</label>
          <input type="date" value={date} max={getTodayKey()} onChange={e => setDate(e.target.value)} style={fieldStyle}/>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {LABS.map(l => (
            <div key={l.key} style={{ display: 'grid', gridTemplateColumns: '1fr 130px', gap: 12, alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>{t(l.name, l.nameTr || l.name)}</span>
                <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>{t('ref', 'ref')} {l.range[0]}–{l.range[1]} {l.unit}</span>
              </div>
              <input
                type="text" inputMode="decimal" placeholder={l.unit}
                value={vals[l.key] || ''} onChange={e => set(l.key, e.target.value)}
                style={{ ...fieldStyle, textAlign: 'right' }}/>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '12px 0', borderRadius: 999, cursor: 'pointer',
            border: '1px solid var(--line)', background: 'transparent', color: 'var(--ink-2)',
            fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 600,
          }}>{t('Cancel', 'İptal')}</button>
          <button onClick={submit} disabled={!readings.length} style={{
            flex: 2, padding: '12px 0', borderRadius: 999,
            cursor: readings.length ? 'pointer' : 'not-allowed',
            border: 'none', background: 'var(--ink)', color: 'var(--ivory)',
            fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 600,
            opacity: readings.length ? 1 : 0.45,
          }}>{t('Save', 'Kaydet')}{readings.length ? ` · ${readings.length}` : ''}</button>
        </div>
      </div>
    </div>
  );
}
/* Analit hakkındaki sabit bilgi + kullanıcının kendi ölçümlerinden
   hesaplanan eğilim.

   Önceden burada örnek bir hastayı anlatan sabit cümleler vardı ve tek
   ölçüm girilmişken "istikrarlı şekilde hedef aralığa tırmandı", hiç
   başlangıç değeri yokken "SHBG başlangıca göre 34 puan düştü" diyordu.
   Biri doğrudan doz talimatıydı ("yatmadan önceki dozu koru") — uygulama
   bunu hiçbir koşulda söylememeli. Artık eğilim cümlesi ancak iki ve
   üzeri ölçüm varken çıkıyor; tek ölçümde neden çıkmadığı yazıyor. */
function labNote(key, reads) {
  const tanim = {
    e2: t('Estradiol swings more than any other hormone across the cycle, so a value only means something next to the cycle day the blood was drawn.',
          'Estradiol döngü boyunca en çok oynayan hormondur; bir değer ancak kanın alındığı döngü günüyle birlikte anlam taşır.'),
    p4: t('Progesterone rises only after ovulation, so a low result from a follicular-phase sample is expected, not a finding.',
          'Progesteron ancak ovülasyondan sonra yükselir; folliküler fazda alınan örnekte düşük çıkması beklenen bir şeydir, bulgu değil.'),
    t: t('Total testosterone is the bound and free fractions together — it can read normal while the active fraction is low if SHBG is high.',
         'Toplam testosteron, bağlı ve serbest fraksiyonun toplamıdır; SHBG yüksekse toplam normal görünürken aktif kısım düşük olabilir.'),
    ft: t('Free testosterone is the unbound, active fraction. Methods differ a lot between labs, so following it in the same lab is more reliable than comparing across them.',
          'Serbest testosteron, proteine bağlı olmayan aktif fraksiyondur. Yöntemler laboratuvarlar arasında çok değişir; aynı laboratuvarda takip etmek karşılaştırmaktan güvenilirdir.'),
    shbg: t('SHBG is the carrier protein that binds sex hormones — when it rises, less hormone stays free. Thyroid, estrogen and insulin status all move it.',
            'SHBG, seks hormonlarını bağlayan taşıyıcı proteindir — yükseldiğinde serbest kalan hormon azalır. Tiroid, östrojen ve insülin durumu bu değeri oynatır.'),
    fsh: t('FSH swings widely from cycle to cycle in perimenopause; a single high reading does not establish a stage on its own.',
           'FSH perimenopozda döngüden döngüye çok oynar; tek bir yüksek değer tek başına evre belirlemez.'),
  }[key] || '';

  const n = (reads || []).length;
  if (!n) return tanim;

  if (n === 1) {
    return [tanim, t('One reading is a point, not a trend — a second one is what makes the direction readable.',
                     'Tek ölçüm bir nokta, eğilim değil — yönü okunur kılan ikinci ölçümdür.')]
      .filter(Boolean).join(' ');
  }

  const ilk = reads[0].value, sonD = reads[n - 1].value;
  const fark = sonD - ilk;
  const oran = ilk ? Math.abs(fark) / Math.abs(ilk) : 0;
  const yon = oran < 0.05
    ? t(`Across ${n} readings the value has stayed about where it started (${ilk} → ${sonD}).`,
        `${n} ölçüm boyunca değer başladığı yerde kaldı (${ilk} → ${sonD}).`)
    : fark > 0
      ? t(`Across ${n} readings it has risen from ${ilk} to ${sonD}.`,
          `${n} ölçümde ${ilk} değerinden ${sonD} değerine yükseldi.`)
      : t(`Across ${n} readings it has fallen from ${ilk} to ${sonD}.`,
          `${n} ölçümde ${ilk} değerinden ${sonD} değerine düştü.`);

  return [tanim, yon].filter(Boolean).join(' ');
}

/* ════════════════ CYCLE + MOON ════════════════ */
function CycleScreen({ lunara, api }) {
  const today = TODAY_DATE;
  const L = cycleLenOf(lunara);
  const day = cycleDayFrom(lunara.periodStart, today, L);
  const ph = phaseOf(day, L);
  const moon = moonPhase(today);
  const [confirming, setConfirming] = React.useState(false);
  const [justStarted, setJustStarted] = React.useState(false);
  useLang();

  const handlePeriodStart = () => {
    api.setPeriodStart(getTodayKey());
    setConfirming(false);
    setJustStarted(true);
    setTimeout(() => setJustStarted(false), 3000);
  };
  // build 7-day strip around today
  return (
    <div style={wrap}>
      <ScreenHead eyebrow={day == null
          ? t('CYCLE NOT SET YET', 'DÖNGÜ HENÜZ BELİRLENMEDİ')
          : t(`CYCLE DAY ${day} · ${L}-DAY`, `DÖNGÜ GÜNÜ ${day} · ${L} GÜNLÜK`)} title={t('Cycle & moon', 'Döngü & ay')}
        right={
          justStarted ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--signal-good)' }}>
              <Icon d={ICONS.check} size={14} stroke="var(--signal-good)" sw={2}/> {t('Period logged ✓', 'Regl kaydedildi ✓')}
            </span>
          ) : confirming ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>{day == null
                ? t('Set today as day 1?', 'Bugünü 1. gün olarak ayarla?')
                : t('Reset cycle to day 1?', 'Döngüyü 1. güne sıfırla?')}</span>
              <Btn primary onClick={handlePeriodStart}>{t('Yes', 'Evet')}</Btn>
              <Btn onClick={() => setConfirming(false)}>{t('Cancel', 'İptal')}</Btn>
            </div>
          ) : (
            <Btn primary onClick={() => setConfirming(true)}>
              <Icon d={ICONS.drop} size={13}/> {t('Period started today', 'Regl bugün başladı')}
            </Btn>
          )
        } />
      <ReferenceCard lunara={lunara} cycleDay={day}/>
      <div className="mb-stack" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Cycle ring */}
        <Card style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <CycleRing day={day} phase={ph} length={L}/>
          <div style={{ display: 'flex', gap: 16, marginTop: 18, flexWrap: 'wrap', justifyContent: 'center' }}>
            {Object.entries(PHASE_TINT).map(([k, c]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: (ph && ph.key === k) ? 'var(--ink)' : 'var(--muted)', fontWeight: (ph && ph.key === k) ? 600 : 400 }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: c }}/>{phaseLabel(phaseOf(k === 'menstrual' ? 1 : k === 'follicular' ? 8 : k === 'ovulation' ? 15 : 25))}
              </div>
            ))}
          </div>
        </Card>
        {/* Moon */}
        <Card style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="eyebrow" style={{ marginBottom: 16 }}>{t("Tonight's moon", 'Bu geceki ay')}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 8 }}>
            <MoonDisc size={92} frac={moon.frac}/>
            <div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 26, letterSpacing: '-0.01em' }}>{moonName(moon)}</div>
              <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 4 }}>{Math.round(moon.illum * 100)}% {t('illuminated', 'aydınlık')} · {t('day', 'gün')} {Math.round(moon.age)} / {t('lunar month', 'ay devri')}</div>
            </div>
          </div>
          <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 14.5, lineHeight: 1.55, color: 'var(--ink-2)', margin: '8px 0 0' }}>
            {t('Many track how mood and sleep shift with the lunar month alongside their cycle. Perim keeps both in view.',
               'Birçok kişi ruh hali ve uykunun, döngüyle birlikte ay devrine göre nasıl değiştiğini izler. Perim ikisini de göz önünde tutar.')}
          </p>
        </Card>
      </div>
      <CycleMonth lunara={lunara} api={api} length={L}/>
    </div>
  );
}


/* ── Ayın döngü takvimi ─────────────────────────────────────────────
   Önce üç gün öncesinden üç gün sonrasına uzanan yedi günlük bir şeritti.
   Döngüyü tek bakışta görmek için ay bütün olarak gerekiyor: hangi gün hangi
   fazdaydı, adet ne zaman başladı, ovülasyon nereye düştü.

   Her hücre üç şey taşır — gün numarası, faz rengi ve döngü günü — çünkü faz
   yalnızca renkle anlatılsa renk ayrımı zayıf biri için okunmaz olurdu. */

/* ── Ayın uyum takvimi ──────────────────────────────────────────────
   Önce son yedi günün çubuk grafiğiydi. Aylık olması, "bu ay hangi günlerde
   aksadım" sorusunu tek bakışta cevaplıyor. Her gün alınan/planlanan oranına
   göre doluyor; planlı doz olmayan gün boş kalır, atlanan günden ayrılsın diye
   ince bir çizgiyle işaretlenir. */
function AdherenceMonth({ lunara, adh30, gunSayisi }) {
  const { go, isCurrentMonth, monthLabel, weekdays, cells } = useMonthView();
  useLang();

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, gap: 12, flexWrap: 'wrap' }}>
        <div className="eyebrow">{t('Adherence calendar', 'Uyum takvimi')}</div>
        <MonthNav label={monthLabel} onPrev={() => go(-1)} onNext={() => go(1)} atCurrent={isCurrentMonth}/>
      </div>

      <WeekdayRow weekdays={weekdays}/>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {cells.map((c, i) => {
          if (!c) return <div key={'b' + i}/>;
          const planli = lunara.regimen ? activeMeds(lunara.regimen, regimenDay(lunara.regimen, c.date)).length : 0;
          const alinan = lunara.doseLog[c.key] ? Object.keys(lunara.doseLog[c.key]).length : 0;
          const oran = planli > 0 ? Math.min(1, alinan / planli) : 0;
          return (
            <div key={c.key} title={planli > 0 ? `${c.d}: ${alinan}/${planli}` : String(c.d)}
              style={{
                position: 'relative', overflow: 'hidden',
                /* Sayı ortadaydı ve dolgu %50'ye gelince tam sayının üstünden
                   geçiyordu: yarısı koyu zeminde koyu mürekkep, okunmuyordu.
                   Sayı üste alındı; dolgu ancak %100'e yaklaşınca ona değer. */
                display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                paddingTop: 4, height: 34, borderRadius: 9,
                background: planli > 0 ? 'var(--bone)' : 'transparent',
                boxShadow: c.isToday ? 'inset 0 0 0 2px var(--ink)' : 'inset 0 0 0 1px var(--line-soft)',
                opacity: c.isFuture ? 0.4 : 1,
              }}>
              {planli > 0 && (
                <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0,
                  height: `${oran * 100}%`, background: 'var(--accent)', opacity: 0.85 }}/>
              )}
              <span style={{ position: 'relative', fontFamily: 'var(--mono)', fontSize: 11,
                color: oran > 0.9 ? 'var(--ivory)' : 'var(--ink-2)' }}>{c.d}</span>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--line-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        {/* Gün sayısı takip başlangıcından geliyor; sabit "30 günlük" demek,
            takibin başlamadığı günleri de kaçırılmış gibi gösterirdi. */}
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>
          {gunSayisi ? t(`Adherence · ${gunSayisi} days tracked`, `Uyum · ${gunSayisi} gün takip`)
                     : t('30-day adherence', '30 günlük uyum')}
        </span>
        <span style={{ fontFamily: 'var(--serif)', fontSize: 16 }}>{adh30 == null ? '—' : t(adh30 + '%', '%' + adh30)}</span>
      </div>
    </Card>
  );
}

/* Geniş yüzeyler pastel, kimliği taşıyan işaretler doygun. Faz renklerinin
   renk körlüğündeki ayrımı ΔE 6.9 ile zaten sınırda; alt şeritleri de
   soluklaştırmak dört fazı birbirine karıştırırdı. */
const BLEED_OUTLINE = '#b04a72';   // menstrüel pembenin koyusu; hem pastel
                                   // yıkamada hem kanama hücresinde görünür
const BLEED_FILL    = '#f2b6cd';   // #e87ba4'ün %45 beyazla açılmışı
const PHASE_ALPHA   = '2b';        // ≈ %17 — pastel yıkama
function CycleMonth({ lunara, api, length }) {
  const { go, isCurrentMonth, monthLabel, weekdays, cells } = useMonthView();
  useLang();
  const L = length;

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div className="eyebrow">{t('Cycle calendar', 'Döngü takvimi')}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>
            {hasCycleAnchor(lunara)
              ? t('Tap a day to log bleeding — phase, cycle day and moon are shown for each',
                  'Kanamayı işaretlemek için güne dokun — her günün fazı, döngü günü ve ayı görünür')
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
          const cd = cycleDayFrom(lunara.periodStart, c.date, L);
          const ph = phaseOf(cd, L);
          const mo = moonPhase(c.date);
          // Çapa yokken faz da beklenen kanama da hesaplanamaz — boş takvim
          // göstermek, uydurulmuş bir döngü boyamaktan iyidir.
          const expected = cd != null && bleedExpected(cd, L);
          const bled = bledOn(lunara, c.key) > 0;
          const durum = ph ? [phaseLabel(ph)] : [];
          if (expected) durum.push(t('bleeding expected', 'kanama bekleniyor'));
          if (bled) durum.push(t('bleeding logged', 'kanama kaydedildi'));
          // Gelecek gün işaretlenemez: olmamış bir kanama döngü çapasını kaydırırdı
          const clickable = !!api && !c.isFuture;
          return (
            <button key={c.key} disabled={!clickable}
              onClick={clickable ? () => api.togglePeriodDay(c.key) : undefined}
              aria-pressed={clickable ? bled : undefined}
              aria-label={[c.d, cd != null && `${t('day', 'gün')} ${cd}`].filter(Boolean).concat(durum).join(' · ')}
              title={[c.d, cd != null && `${t('day', 'gün')} ${cd}`].filter(Boolean).concat(durum).join(' · ')}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                padding: '5px 2px 6px', borderRadius: 10, minHeight: 60, width: '100%',
                background: bled ? BLEED_FILL : (ph ? PHASE_TINT[ph.key] + PHASE_ALPHA : 'var(--ivory)'),
                // Bugün eskiden dolu mürekkep zemindi; pastel alanda tek başına
                // bir siyah blok gibi duruyordu. Zemin fazda kalıyor, bugünü
                // halka işaretliyor — hero takvimiyle de aynı dil.
                boxShadow: c.isToday ? '0 0 0 2px var(--ink)' : 'inset 0 0 0 1px var(--line-soft)',
                outline: expected ? `1.5px dashed ${BLEED_OUTLINE}` : 'none',
                outlineOffset: -3,
                opacity: c.isFuture ? 0.6 : 1,   // zemin pastelleşince gelecek günler fazla siliniyordu
                cursor: clickable ? 'pointer' : 'default',
              }}>
              <span style={{ fontFamily: 'var(--serif)', fontSize: 15, lineHeight: 1.1,
                fontWeight: c.isToday ? 700 : 400, color: 'var(--ink)' }}>{c.d}</span>
              <MoonDisc size={16} frac={mo.frac}/>
              <span style={{ width: 16, height: 4, borderRadius: 3, background: ph ? PHASE_TINT[ph.key] : 'var(--line-soft)' }}/>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 8.5, color: 'var(--muted-2)' }}>{cd == null ? '' : cd}</span>
            </button>
          );
        })}
      </div>

      {/* Faz renklerinin CVD ayrımı ΔE 8'in altında; açıklama isteğe bağlı
          değil, kimliğin ikinci taşıyıcısı. Kanama işaretleri de burada. */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--line-soft)' }}>
        {['menstrual', 'follicular', 'ovulation', 'luteal'].map(k => (
          <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--muted)' }}>
            <span style={{ width: 14, height: 4, borderRadius: 3, background: PHASE_TINT[k] }}/>
            {phaseLabel(phaseOf(k === 'menstrual' ? 1 : k === 'follicular' ? 7 : k === 'ovulation' ? (L - 14) : (L - 4), L))}
          </span>
        ))}
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--muted)' }}>
          <span style={{ width: 13, height: 13, borderRadius: 4, border: `1.5px dashed ${BLEED_OUTLINE}` }}/>
          {t('bleeding expected', 'beklenen kanama')}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--muted)' }}>
          <span style={{ width: 13, height: 13, borderRadius: 4, background: BLEED_FILL }}/>
          {t('bleeding logged', 'gerçekleşen kanama')}
        </span>
      </div>
    </Card>
  );
}

function CycleRing({ day, phase, size = 260, length }) {
  const r = (size - 50) / 2;
  const c = 2 * Math.PI * r;
  const b = phaseBounds(length);
  const L = b.L;
  const segs = [
    { from: 0, to: b.bleedEnd, k: 'menstrual' },
    { from: b.bleedEnd, to: b.follEnd, k: 'follicular' },
    { from: b.follEnd, to: b.ovEnd, k: 'ovulation' },
    { from: b.ovEnd, to: L, k: 'luteal' },
  ];
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--line-soft)" strokeWidth="20"/>
        {segs.map((s, i) => {
          const dash = ((s.to - s.from) / L) * c;
          const offset = -(s.from / L) * c;
          return <circle key={i} cx={size/2} cy={size/2} r={r} fill="none" stroke={PHASE_TINT[s.k]} strokeWidth="20"
            strokeDasharray={`${dash} ${c}`} strokeDashoffset={offset} opacity="0.92"/>;
        })}
        {/* Gün bilinmiyorken işaretçi yok: halka fazların şemasını gösterir,
            ama "buradasın" iddiasında bulunmaz. */}
        {day != null && (
          <g transform={`rotate(${((day-1)/L)*360} ${size/2} ${size/2})`}>
            <circle cx={size/2 + r} cy={size/2} r="10" fill="var(--ink)" stroke="var(--ivory)" strokeWidth="3"/>
          </g>
        )}
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span className="eyebrow">{day == null ? t('Cycle', 'Döngü') : t('Day', 'Gün')}</span>
        <span style={{ fontFamily: 'var(--serif)', fontSize: day == null ? 40 : 72, lineHeight: 0.9, letterSpacing: '-0.04em' }}>
          {day == null ? '—' : day}
        </span>
        <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 15, color: 'var(--ink-2)', textAlign: 'center', padding: '0 24px' }}>
          {day == null
            ? t('mark your last period', 'son regl gününü işaretle')
            : phaseLabel(phase).toLocaleLowerCase(I18N.lang === 'tr' ? 'tr' : 'en')}
        </span>
      </div>
    </div>
  );
}

/* ════════════════ CARE TEAM (AI destekli) ════════════════ */
function CareScreen({ lunara, onNav }) {
  const stage = (lunara && lunara.stage) || 'cycle';
  const stageInfo = (typeof STAGES !== 'undefined' && STAGES[stage]) || {};
  const cycleDay = lunara ? cycleDayFrom(lunara.periodStart, TODAY_DATE, cycleLenOf(lunara)) : null;
  const ph = phaseOf(cycleDay, lunara ? cycleLenOf(lunara) : 28);
  const profileName = (lunara && lunara.profile && lunara.profile.name) || '';
  const [summaryOpen, setSummaryOpen] = React.useState(false);
  useLang();

  // AI chat needs a backend (Anthropic API proxy) and ships in a later
  // release — until then this screen is an honest preview, not a broken chat.
  const intro = t(
    `Hi${profileName ? ` ${profileName}` : ''} 👋 I'm your Perim companion.${ph ? ` You're on cycle day ${cycleDay} — ${ph.label.toLowerCase()} phase.` : ''} Soon you'll be able to ask me anything about your cycle, symptoms or how you're feeling.`,
    `Merhaba${profileName ? ` ${profileName}` : ''} 👋 Ben Perim yoldaşın.${ph ? ` Döngünün ${cycleDay}. günündesin — ${ph.labelTr || ph.label} fazındasın.` : ''} Yakında döngün, belirtilerin veya nasıl hissettiğin hakkında bana her şeyi sorabileceksin.`
  );

  return (
    <div style={wrap}>
      <ScreenHead eyebrow={t('LUNARA AI · WELLNESS COMPANION', 'LUNARA AI · SAĞLIK YOLDAŞI')}
        title={t('Your companion', 'Yoldaşın')}
        right={<Btn onClick={() => onNav && onNav('nourish')}><Icon d={ICONS.leaf} size={13}/> {t('Nourish & move', 'Beslenme ve hareket')}</Btn>} />
      <div className="mb-stack" style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20, alignItems: 'start' }}>
        <Card style={{ display: 'flex', flexDirection: 'column', minHeight: 500 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 16, borderBottom: '1px solid var(--line-soft)' }}>
            <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%, var(--accent-soft), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Logo size={24}/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Perim AI</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--muted)' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--signal-warn)', display: 'inline-block' }}/>
                {t('Coming soon', 'Yakında')}
              </div>
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--muted-2)', textAlign: 'right', lineHeight: 1.4 }}>
              {ph ? <>{t('Day', 'Gün')} {cycleDay}<br/></> : null}
              <span style={{ fontStyle: 'italic', fontFamily: 'var(--serif)', fontSize: 12 }}>
                {ph ? t(ph.label, ph.labelTr || ph.label) : t('cycle not set', 'döngü kurulmadı')}
              </span>
            </div>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, padding: '18px 0' }}>
            <div style={{ display: 'flex' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent-soft)', flexShrink: 0, marginRight: 8, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Logo size={16}/></div>
              <div style={{ maxWidth: '78%' }}>
                <div style={{ padding: '12px 15px', borderRadius: 18, borderBottomLeftRadius: 4, background: 'var(--bone)', color: 'var(--ink)', fontSize: 14, lineHeight: 1.55 }}>{intro}</div>
              </div>
            </div>
            <div style={{ margin: '4px 0 0 36px', padding: '14px 16px', borderRadius: 'var(--r-md)', background: 'linear-gradient(160deg, var(--accent-soft), var(--card))' }}>
              <div className="eyebrow" style={{ marginBottom: 6 }}>{t('COMING SOON', 'YAKINDA')}</div>
              <p style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.55, margin: 0 }}>
                {t('The AI companion is being prepared and will arrive in an upcoming update. Until then, your daily logs and the Nourish & move plan are here for you.',
                   'AI yoldaş hazırlanıyor; yakındaki bir güncellemeyle gelecek. O zamana dek günlük kayıtların ve Beslenme & hareket planın yanında.')}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, paddingTop: 14, borderTop: '1px solid var(--line-soft)' }}>
            <input disabled
              aria-label={t('Chat (not available yet)', 'Sohbet (henüz kullanılamıyor)')}
              placeholder={t('Chat opens with an upcoming update…', 'Sohbet yakındaki bir güncellemeyle açılıyor…')}
              style={{ flex: 1, border: '1px solid var(--line)', borderRadius: 999, padding: '11px 18px', fontFamily: 'var(--sans)', fontSize: 14, background: 'var(--ivory)', outline: 'none', color: 'var(--ink)', opacity: 0.55, cursor: 'not-allowed' }}/>
            <span style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0, background: 'var(--line)', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/></svg>
            </span>
          </div>
        </Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Card>
            <div className="eyebrow" style={{ marginBottom: 12 }}>{t("Things you'll be able to ask", 'Yakında sorabileceklerin')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {careQuickPrompts(stage, ph ? ph.key : 'follicular').map((q, i) => (
                <div key={i}
                  style={{ padding: '10px 14px', borderRadius: 12, textAlign: 'left', background: 'var(--bone)', color: 'var(--muted)', fontSize: 13, lineHeight: 1.4, boxShadow: 'inset 0 0 0 1px var(--line-soft)', fontStyle: 'italic' }}>{q}</div>
              ))}
            </div>
          </Card>
          <Card style={{ background: 'var(--bone)' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <Icon d={ICONS.heart} size={16} stroke="var(--muted)"/>
              <p style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5, margin: 0, fontFamily: 'var(--serif)', fontStyle: 'italic' }}>
                {t('Perim AI is a wellness companion, not a medical professional. Always consult your doctor for diagnosis or urgent concerns.',
                   'Perim AI bir sağlık yoldaşıdır, tıbbi uzman değildir. Tanı veya acil durumlar için mutlaka doktoruna danış.')}
              </p>
            </div>
          </Card>
          {/* Doctor visit summary */}
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <Icon d={ICONS.vial} size={17} stroke="var(--accent)"/>
              <div className="eyebrow">{t('Before your visit', 'Görüşmeden önce')}</div>
            </div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 19, lineHeight: 1.25, marginBottom: 6 }}>{t('Doctor summary', 'Doktora özet')}</div>
            <p style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5, margin: '0 0 12px' }}>
              {t('Your regimen, dose changes, latest labs and symptoms on one page — print it or save as PDF to take along.',
                 'Rejimin, doz değişikliklerin, son tahlillerin ve belirtilerin tek sayfada — yanında götürmek için yazdır ya da PDF kaydet.')}
            </p>
            <Btn primary onClick={() => setSummaryOpen(true)}>{t('Open summary', 'Özeti oluştur')} <Icon d={ICONS.arrow} size={13}/></Btn>
          </Card>

          <Card style={{ background: 'linear-gradient(160deg, var(--accent-soft), var(--card))', cursor: 'pointer' }} onClick={() => onNav && onNav('nourish')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <Icon d={ICONS.leaf} size={17} stroke="var(--accent)"/>
              <div className="eyebrow">{t('Care plan', 'Bakım planı')}</div>
            </div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 19, lineHeight: 1.25, marginBottom: 10 }}>{t('Movement & food for your phase', 'Fazına göre hareket & beslenme')}</div>
            <Btn primary>{t('Open', 'Aç')} <Icon d={ICONS.arrow} size={13}/></Btn>
          </Card>
        </div>
      </div>

      {summaryOpen && <DoctorSummary lunara={lunara} onClose={() => setSummaryOpen(false)}/>}
    </div>
  );
}

/* ════════════════ LIBRARY ════════════════ */
function LibraryScreen({ lunara }) {
  const { featured, articles } = libraryFor(lunara ? lunara.stage : 'cycle');
  return (
    <div style={wrap}>
      <ScreenHead eyebrow={t('LIBRARY', 'BLOG')} title={t('Learn', 'Öğren')}
        right={<Btn><Icon d={ICONS.search} size={13}/> {t('Search', 'Ara')}</Btn>} />
      <Card className="mb-stack" pad={0} style={{ overflow: 'hidden', display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 220 }}>
        <div style={{ position: 'relative', background: 'linear-gradient(150deg, oklch(0.55 0.10 28), oklch(0.78 0.08 60))' }}>
          <div style={{ position: 'absolute', bottom: 20, left: 22, fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.12em', color: 'rgba(251,246,235,0.85)' }}>{t('FEATURED', 'ÖNE ÇIKAN')}</div>
        </div>
        <div style={{ padding: '30px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>{featured.tag}</div>
          <h3 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 27, lineHeight: 1.15, margin: 0, letterSpacing: '-0.01em' }}>{featured.title}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 18 }}>
            <Btn primary>{t('Read', 'Oku')}</Btn>
            <span style={{ fontSize: 11.5, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>{featured.read.toUpperCase()} · {featured.by}</span>
          </div>
        </div>
      </Card>
      <div className="mb-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
        {articles.map((a, i) => (
          <Card key={i} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 12, minHeight: 150 }}>
            <div className="eyebrow" style={{ color: 'var(--accent)' }}>{a.tag}</div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 18, lineHeight: 1.25, flex: 1, letterSpacing: '-0.01em' }}>{a.title}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, color: 'var(--muted-2)', fontFamily: 'var(--mono)' }}>{a.read.toUpperCase()}</span>
              <Icon d={ICONS.arrow} size={14} stroke="var(--muted)"/>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Stage + phase aware quick prompts for AI chat
function careQuickPrompts(stage, phaseKey) {
  const sets = {
    menarche: [
      t('Why do I get cramps?', 'Neden kramp oluyorum?'),
      t('Is my cycle length normal?', 'Döngü uzunluğum normal mi?'),
      t('What foods help during my period?', 'Reglimde hangi yiyecekler iyi gelir?'),
    ],
    cycle: [
      t('Why do I feel tired this week?', 'Bu hafta neden yorgun hissediyorum?'),
      t('What does my cervical fluid tell me?', 'Servikal sıvım bana ne söylüyor?'),
      t('How do I support my hormones naturally?', 'Hormonlarımı doğal olarak nasıl desteklerim?'),
    ],
    ttc: [
      t('How do I know when I\'m ovulating?', 'Ovülasyon yaptığımı nasıl anlarım?'),
      t('Which supplements help with conception?', 'Hangi takviyeler gebe kalmaya yardımcı olur?'),
      t('When should I take a pregnancy test?', 'Ne zaman gebelik testi yapmalıyım?'),
    ],
    pregnancy: [
      t('Is my nausea normal at this stage?', 'Bu aşamada bulantım normal mi?'),
      t('What exercises are safe now?', 'Şu an hangi egzersizler güvenli?'),
      t('When should I feel first movements?', 'İlk hareketleri ne zaman hissedeceğim?'),
    ],
    postpartum: [
      t('How do I know if I have PPD?', 'Doğum sonrası depresyonum var mı?'),
      t('Why is breastfeeding so hard at first?', 'Emzirme neden başta bu kadar zor?'),
      t('When will my cycle return?', 'Döngüm ne zaman geri döner?'),
    ],
    perimeno: [
      t('What causes hot flushes?', 'Sıcak basmasına ne yol açar?'),
      t('How does BHRT help with my symptoms?', 'BHRT belirtilerime nasıl yardımcı olur?'),
      t('What should I track to support my doctor?', 'Doktoruma yardımcı olmak için ne takip etmeliyim?'),
    ],
    menopause: [
      t('How do I protect my bone density?', 'Kemik yoğunluğumu nasıl koruyorum?'),
      t('Why is sleep so disrupted now?', 'Uyku neden bu kadar bozuldu?'),
      t('Is BHRT safe for me?', 'BHRT benim için güvenli mi?'),
    ],
  };
  return sets[stage] || sets.cycle;
}

export { AdherenceMonth, TakenAmount, doseAmountOf, doseUnitOf, CYCLE_LEN, cycleLenOf, phaseBounds, daysBetween, cycleDayFrom, hasCycleAnchor, phaseOf, phaseLabel, phaseRange, seedRange, bledOn, bleedExpected, MOON_NAMES_TR, moonName, PHASE_TINT, moonPhase, moonMask, MoonDisc, ScreenHead, Btn, wrap, DosesScreen, RATE_LABELS, RATE_LABELS_TR, rateLabel, realSeries, SymptomsScreen, LabsScreen, labNote, CycleScreen, CycleRing, CareScreen, LibraryScreen, careQuickPrompts };
