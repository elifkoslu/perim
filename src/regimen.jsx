import React from 'react';
import { t, useLang } from './i18n';
import { Btn } from './screens';
import { exportRegimenIcs, CYCLE_COUNT } from './calendar-export';
import { waterSettings } from './water';
import { Card, ICONS, Icon, SilBtn, TODAY_DATE, medSchedule, regimenDay, slotCovers, whenLabel } from './shared';

/* regimen.jsx — Lunara döngü-temelli ilaç programı düzenleyici
   Her ilaç döngünün [startDay..endDay] günlerinde aktif olur.
   Döngü uzunluğu kullanıcı tarafından belirlenir (örn. 29 gün = 25 aktif + 4 ara).
   shared.jsx (Card, Icon, ICONS, Btn from screens, t, whenLabel) ve i18n'e bağlıdır. */
/* eslint-disable */

/* İlaç kimlik renkleri — sabit sırayla atanır.
   Önceki set renk körlüğü testinde kalıyordu: yeşil ile kehribar
   protanopide yalnızca ΔE 1.7 ayrışıyordu (eşik 8), yani kırmızı-yeşil
   ayrımı zayıf biri için iki hormon aynı renkti. Bunlar doğrulanmış
   yuvalar, en kötü bitişik çift ΔE 9.1. Zaman çizelgesinde her bandın
   yanında adı da yazılı — kimlik hiçbir yerde yalnız renge yaslanmıyor,
   üç yuvanın yüzey kontrastı 3:1'in altında olduğu için bu şart. */
const MED_COLORS = [
  '#2a78d6',  // mavi
  '#eb6834',  // turuncu
  '#1baf7a',  // deniz yeşili
  '#eda100',  // sarı
  '#e87ba4',  // magenta
  '#008300',  // yeşil
  '#4a3aa7',  // menekşe
  '#e34948',  // kırmızı
];
function medColor(regimen, id) {
  const i = regimen.meds.findIndex(m => m.id === id);
  return MED_COLORS[((i % MED_COLORS.length) + MED_COLORS.length) % MED_COLORS.length];
}

const WHEN_OPTS = ['morning', 'midday', 'evening', 'bedtime'];

/* Zaman dilimi ile saat tek bir gerçeğin iki yüzü olmalı.
   Önceden bu düğmeler yalnızca etiketti: saati hiç değiştirmiyorlardı ve
   düzenleyicide saat alanı da yoktu, yani her ilaç addMed varsayılanı olan
   08:00'de kalıyordu — "yatmadan" seçilmiş progesteronun takvim alarmı bile
   sabah çalardı. Artık dilim seçilince saat ona göre ayarlanıyor, saat elle
   değiştirilince de dilim saate göre güncelleniyor. */
const WHEN_TIMES = { morning: '08:00', midday: '13:00', evening: '19:00', bedtime: '22:00' };
function whenForTime(hhmm) {
  const h = parseInt(String(hhmm || '').slice(0, 2), 10);
  if (!Number.isFinite(h)) return 'morning';
  if (h < 11) return 'morning';
  if (h < 16) return 'midday';
  if (h < 21) return 'evening';
  return 'bedtime';
}

// Saat girişi — ilacın alınacağı gerçek saat, alarm da bunu kullanır.
function TimeField({ value, onChange }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span className="eyebrow" style={{ fontSize: 9.5 }}>{t('Time', 'Saat')}</span>
      <input type="time" value={value || '08:00'}
        onChange={e => e.target.value && onChange(e.target.value)}
        style={{
          border: '1px solid var(--line)', borderRadius: 9, padding: '9px 11px',
          fontFamily: 'var(--mono)', fontSize: 13.5, color: 'var(--ink)',
          background: 'var(--ivory)', outline: 'none', width: '100%', boxSizing: 'border-box',
        }}/>
    </label>
  );
}

/* ── Visual timeline: cycle days 1..L, each med a colored band ── */
function RoutineTimeline({ regimen, today }) {
  const L = regimen.cycleLength;
  const cur = regimenDay(regimen, today || TODAY_DATE);
  // day axis ticks every 7 + last
  const ticks = [];
  for (let d = 1; d <= L; d += 7) ticks.push(d);
  if (ticks[ticks.length - 1] !== L) ticks.push(L);

  const Track = ({ med }) => {
    const c = medColor(regimen, med.id);
    /* Her doz aralığı ayrı bant. Aralığın dozu bandın üstünde yazar — fazına
       göre değişen dozda hangi günlerde ne alındığı çizelgeden okunabilsin. */
    const segs = [];
    for (const s of medSchedule(med)) {
      if (s.startDay <= s.endDay) segs.push([s.startDay, s.endDay, s.dose]);
      else { segs.push([s.startDay, L, s.dose]); segs.push([1, s.endDay, s.dose]); }
    }
    const cok = medSchedule(med).length > 1;
    return (
      <div style={{ position: 'relative', height: 18, background: 'var(--bone)', borderRadius: 6, overflow: 'hidden' }}>
        {segs.map(([a, b, dose], i) => {
          const w = ((b - a + 1) / L) * 100;
          return (
            <div key={i} title={dose} style={{
              position: 'absolute', top: 0, bottom: 0,
              left: `${((a - 1) / L) * 100}%`, width: `${w}%`,
              background: c, borderRadius: 5,
              display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
            }}>
              {cok && w > 14 && (
                <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ivory)', whiteSpace: 'nowrap', padding: '0 4px' }}>{dose}</span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      {/* med rows */}
      {regimen.meds.map(m => (
        <div key={m.id} style={{ display: 'grid', gridTemplateColumns: '96px 1fr', gap: 12, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
            <span style={{ width: 9, height: 9, borderRadius: 3, background: medColor(regimen, m.id), flexShrink: 0 }}/>
            <span style={{ fontSize: 12, color: 'var(--ink-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t(m.name, m.nameTr || m.name)}</span>
          </div>
          <Track med={m}/>
        </div>
      ))}
      {/* axis */}
      <div style={{ display: 'grid', gridTemplateColumns: '96px 1fr', gap: 12, marginTop: 2 }}>
        <span/>
        <div style={{ position: 'relative', height: 16 }}>
          {ticks.map(d => (
            <span key={d} style={{
              position: 'absolute', left: `${((d - 1) / L) * 100}%`, transform: d === L ? 'translateX(-100%)' : 'none',
              fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--muted-2)',
            }}>{d}</span>
          ))}
          {/* current day marker */}
          <div style={{ position: 'absolute', top: -88, height: 96, left: `${((cur - 0.5) / L) * 100}%`, width: 2, background: 'var(--ink)', opacity: 0.4 }}/>
          <span style={{ position: 'absolute', top: 0, left: `${((cur - 0.5) / L) * 100}%`, transform: 'translateX(-50%)', fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ink)', fontWeight: 700, whiteSpace: 'nowrap' }}>
            {t('today', 'bugün')} ·{cur}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Range control: start + end day steppers ── */
function DayRange({ start, end, max, onChange }) {
  const Step = ({ val, set, label }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
      <span className="eyebrow" style={{ fontSize: 9.5 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, border: '1px solid var(--line)', borderRadius: 9, overflow: 'hidden', background: 'var(--ivory)' }}>
        <button onClick={() => set(Math.max(1, val - 1))} style={stepBtn}>−</button>
        <span style={{ flex: 1, textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--ink)' }}>{val}</span>
        <button onClick={() => set(Math.min(max, val + 1))} style={stepBtn}>+</button>
      </div>
    </div>
  );
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
      <Step val={start} set={v => onChange(v, end)} label={t('Start day', 'Başlangıç günü')}/>
      <span style={{ paddingBottom: 9, color: 'var(--muted-2)' }}>→</span>
      <Step val={end} set={v => onChange(start, v)} label={t('End day', 'Bitiş günü')}/>
    </div>
  );
}
const stepBtn = {
  width: 32, height: 34, fontSize: 17, color: 'var(--ink-2)', cursor: 'pointer',
  background: 'var(--bone)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
};

/* ── Doz programı: bir ilaç için birden çok gün aralığı ──────────────
   Tek aralıkken doz ilacın kendi alanından gelir ve arayüz eskisi gibi görünür.
   Aralık eklenince her aralık kendi dozunu taşır (med.schedule) — fazına göre
   değişen doz böyle kurulur: 1–14 gün 0.5 mg, 15–28 gün 0.75 mg gibi. */
function DoseSchedule({ med, max, api }) {
  const slots = medSchedule(med);
  const cok = slots.length > 1;

  const yaz = (next) => {
    // Tek aralığa dönüldüyse schedule'ı kaldır, eski biçime geri dön.
    if (next.length === 1) {
      api.updateMed(med.id, {
        schedule: undefined, startDay: next[0].startDay, endDay: next[0].endDay,
        dose: next[0].dose != null ? next[0].dose : med.dose,
      });
    } else {
      api.updateMed(med.id, { schedule: next, startDay: next[0].startDay, endDay: next[0].endDay });
    }
  };
  const degistir = (i, patch) => yaz(slots.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  /* Yeni aralık, henüz kapsanmayan ilk güne yerleşir ve bir sonraki kapsanan
     günden hemen önce biter. Sadece "son gün + 1"den başlatmak, son aralık
     zaten döngü sonuna ulaştığında 28–28 gibi dejenere ve üst üste binen bir
     aralık üretiyordu. Her gün doluysa son aralığı ikiye böleriz. */
  const ekle = () => {
    const kapali = d => slots.some(s => slotCovers(s, d));
    let bas = 0;
    for (let d = 1; d <= max; d++) if (!kapali(d)) { bas = d; break; }
    if (bas) {
      let bit = bas;
      while (bit + 1 <= max && !kapali(bit + 1)) bit++;
      yaz([...slots, { startDay: bas, endDay: bit, dose: slots[slots.length - 1].dose }]);
      return;
    }
    const son = slots[slots.length - 1];
    if (son.endDay > son.startDay) {
      const orta = Math.floor((son.startDay + son.endDay) / 2);
      yaz([...slots.slice(0, -1),
        { ...son, endDay: orta },
        { startDay: orta + 1, endDay: son.endDay, dose: son.dose }]);
    }
  };
  const sil = (i) => yaz(slots.filter((_, j) => j !== i));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {slots.map((s, i) => (
        <div key={i} style={{
          display: 'flex', flexDirection: 'column', gap: 8,
          padding: cok ? '10px 12px' : 0,
          background: cok ? 'var(--bone)' : 'transparent',
          borderRadius: cok ? 10 : 0,
        }}>
          {cok && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="eyebrow" style={{ fontSize: 9.5 }}>{t('Range', 'Aralık')} {i + 1}</span>
              {slots.length > 1 && (
                <button onClick={() => sil(i)}
                  aria-label={t('Remove range ' + (i + 1), (i + 1) + '. aralığı kaldır')}
                  style={{ fontSize: 11, color: 'var(--signal-low)', cursor: 'pointer' }}>
                  {t('Remove', 'Kaldır')}
                </button>
              )}
            </div>
          )}
          <DayRange start={s.startDay} end={s.endDay} max={max}
            onChange={(a, b) => degistir(i, { startDay: a, endDay: b })}/>
          {cok && (
            <LabeledInput label={t('Dose for these days', 'Bu günlerin dozu')}
              value={s.dose == null ? '' : String(s.dose)}
              onChange={v => degistir(i, { dose: v })}/>
          )}
        </div>
      ))}
      <button onClick={ekle} style={{
        alignSelf: 'flex-start', fontSize: 12, color: 'var(--ink-2)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px',
        borderRadius: 8, boxShadow: 'inset 0 0 0 1px var(--line)',
      }}>
        <Icon d={ICONS.plus} size={13} sw={2}/> {t('Different dose on other days', 'Başka günlerde farklı doz')}
      </button>
    </div>
  );
}

/* ── Takvime alarm aktar ─────────────────────────────────────────────
   Uygulama içi hatırlatma yalnızca uygulama açıkken çalışır; sunucusuz bir PWA
   kapalıyken bildirim zamanlayamaz. Telefonun kendi takvimi bunu yapabilir,
   o yüzden rejimi alarmlı bir .ics dosyası olarak veriyoruz. */
function CalendarAlarmRow({ lunara }) {
  const [sonuc, setSonuc] = React.useState(null);
  // Su hatırlatmaları da aynı dosyaya girer; ayrı bir aktarma gereksiz olurdu.
  const [suDahil, setSuDahil] = React.useState(true);
  const suSaatleri = waterSettings(lunara).times;
  const aktar = async () => {
    const r = await exportRegimenIcs(lunara, suDahil ? suSaatleri : null);
    if (!r) { setSonuc({ ok: false }); return; }
    if (r.yol === 'iptal') { setSonuc(null); return; }   // kullanıcı vazgeçti
    setSonuc({ ok: true, n: r.eventCount, yol: r.yol });
  };
  return (
    <div style={{ marginTop: 16, padding: '14px 16px', background: 'var(--bone)', borderRadius: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>
            {t('Alarms in your phone’s calendar', 'Telefonunun takviminde alarm')}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.5, marginTop: 2 }}>
            {t('Rings at each dose time even when Perim is closed.',
               'Perim kapalıyken de her doz saatinde çalar.')}
          </div>
        </div>
        <Btn onClick={aktar}><Icon d={ICONS.clock} size={13}/> {t('Export', 'Aktar')}</Btn>
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, fontSize: 12.5, color: 'var(--ink-2)', cursor: 'pointer' }}>
        <input type="checkbox" checked={suDahil} onChange={e => setSuDahil(e.target.checked)}/>
        {t(`Include ${suSaatleri.length} water reminders`, `${suSaatleri.length} su hatırlatmasını da ekle`)}
      </label>
      <p style={{ fontSize: 11, color: 'var(--muted-2)', lineHeight: 1.55, margin: '10px 0 0' }}>
        {t(`The event says only “dose time” — no medicine name or amount, so nothing about your health leaves the device if your calendar syncs to iCloud or Google. Covers about ${CYCLE_COUNT} cycles; export again if your cycle length or period start changes.`,
           `Etkinlikte yalnızca “doz zamanı” yazar — ilaç adı ve miktar yazmaz, yani takvimin iCloud veya Google ile senkronlansa bile sağlık bilgin cihazdan çıkmaz. Yaklaşık ${CYCLE_COUNT} döngüyü kapsar; döngü uzunluğun ya da adet başlangıcın değişirse yeniden aktar.`)}
      </p>
      {sonuc && (
        <div role="status" style={{ fontSize: 12, color: sonuc.ok ? 'var(--signal-good)' : 'var(--signal-low)', marginTop: 8 }}>
          {!sonuc.ok
            ? t('Could not create the file.', 'Dosya oluşturulamadı.')
            : sonuc.yol === 'share'
              ? t(`${sonuc.n} alarms ready — pick Calendar in the share sheet.`,
                  `${sonuc.n} alarm hazır — paylaşım sayfasından Takvim’i seç.`)
              : t(`${sonuc.n} alarms written to a file — open it to add them to your calendar.`,
                  `${sonuc.n} alarm dosyaya yazıldı — takvime eklemek için dosyayı aç.`)}
        </div>
      )}
    </div>
  );
}

/* ── The editor ── */
function RegimenEditor({ lunara, api, onClose }) {
  const r = lunara.regimen;
  const [adding, setAdding] = React.useState(false);
  useLang();

  return (
    <Card style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 4 }}>{t('CYCLE SCHEDULE', 'DÖNGÜ PROGRAMI')}</div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 22, letterSpacing: '-0.01em' }}>{t('Build your routine', 'Rutinini oluştur')}</div>
        </div>
        {onClose && <Btn onClick={onClose}>{t('Done', 'Bitti')}</Btn>}
      </div>

      {/* Cycle length */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--bone)', borderRadius: 12, marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{t('Cycle length', 'Döngü uzunluğu')}</div>
          <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{t('Days before the routine repeats', 'Rutin tekrarlanmadan önceki gün sayısı')}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, border: '1px solid var(--line)', borderRadius: 9, overflow: 'hidden', background: 'var(--ivory)' }}>
          <button onClick={() => api.setRegimenCycle(r.cycleLength - 1)} style={stepBtn}>−</button>
          <span style={{ width: 44, textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 14, color: 'var(--ink)' }}>{r.cycleLength}</span>
          <button onClick={() => api.setRegimenCycle(r.cycleLength + 1)} style={stepBtn}>+</button>
        </div>
      </div>

      {/* Timeline preview */}
      <div style={{ padding: '16px 16px 8px', background: 'var(--ivory)', borderRadius: 12, marginBottom: 18, border: '1px solid var(--line-soft)' }}>
        <div className="eyebrow" style={{ marginBottom: 14 }}>{t('Your cycle at a glance', 'Döngüne bakış')}</div>
        {r.meds.length > 0
          ? <RoutineTimeline regimen={r}/>
          : <div style={{ fontSize: 13, color: 'var(--muted)', fontStyle: 'italic', fontFamily: 'var(--serif)', padding: '6px 0' }}>{t('No medications yet.', 'Henüz ilaç yok.')}</div>}
      </div>

      {/* Med list (editable) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {r.meds.map(m => <MedEditRow key={m.id} med={m} max={r.cycleLength} api={api} color={medColor(r, m.id)}/>)}
      </div>

      {r.meds.length > 0 && <CalendarAlarmRow lunara={lunara}/>}

      {/* Add */}
      {adding
        ? <MedAddForm max={r.cycleLength} onAdd={(med) => { api.addMed(med); setAdding(false); }} onCancel={() => setAdding(false)}/>
        : <button onClick={() => setAdding(true)} style={{
            marginTop: 14, width: '100%', padding: '12px', borderRadius: 12,
            border: '1px dashed var(--line)', color: 'var(--ink-2)', background: 'transparent',
            fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer',
          }}>
            <Icon d={ICONS.plus} size={15} sw={2}/> {t('Add a medication', 'İlaç ekle')}
          </button>}
    </Card>
  );
}

function MedEditRow({ med, max, api, color }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div style={{ border: '1px solid var(--line-soft)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
        <span style={{ width: 10, height: 10, borderRadius: 3, background: color, flexShrink: 0 }}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontFamily: 'var(--serif)', fontSize: 16 }}>{t(med.name, med.nameTr || med.name)}</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-2)' }}>
              {medSchedule(med).length > 1
                ? t('varies by day', 'güne göre değişir')
                : med.dose}
            </span>
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>
            {medSchedule(med).map(s => `${s.startDay}–${s.endDay}` + (medSchedule(med).length > 1 ? ` ${s.dose}` : '')).join(' · ')} · {whenLabel(med.when)}
          </div>
        </div>
        <button onClick={() => setOpen(o => !o)} style={{ fontSize: 12, color: 'var(--muted)', padding: '6px 10px', borderRadius: 8, boxShadow: 'inset 0 0 0 1px var(--line)' }}>
          {open ? t('Close', 'Kapat') : t('Edit', 'Düzenle')}
        </button>
        {/* Silme eskiden yalnızca satır açıldığında görünüyordu; deneme amaçlı
            eklenen bir ilacı kaldırmak isteyen kişi onu bulamıyordu. */}
        <SilBtn onSil={() => api.removeMed(med.id)}
          label={t('Delete medication', 'İlacı sil')}
          confirmLabel={t('Tap again', 'Tekrar dokun')}/>
      </div>
      {open && (
        <div style={{ padding: '4px 14px 16px', display: 'flex', flexDirection: 'column', gap: 12, borderTop: '1px solid var(--line-soft)' }}>
          {/* Birden çok aralık varsa doz her aralığın kendi alanından gelir;
              buradaki tek doz alanı ölü bir kontrol olurdu, gösterilmiyor. */}
          <div style={{ display: 'grid', gridTemplateColumns: medSchedule(med).length > 1 ? '1fr' : '2fr 1fr', gap: 10, marginTop: 12 }}>
            <LabeledInput label={t('Name', 'Ad')} value={med.name} onChange={v => api.updateMed(med.id, { name: v, nameTr: v })}/>
            {medSchedule(med).length <= 1 && (
              <LabeledInput label={t('Dose', 'Doz')} value={med.dose} onChange={v => api.updateMed(med.id, { dose: v })}/>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <TimeField value={med.time}
              onChange={v => api.updateMed(med.id, { time: v, when: whenForTime(v) })}/>
            <span/>
          </div>
          <div>
            <span className="eyebrow" style={{ fontSize: 9.5 }}>{t('When', 'Ne zaman')}</span>
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              {WHEN_OPTS.map(w => {
                const on = med.when === w;
                return (
                  <button key={w} onClick={() => api.updateMed(med.id, { when: w, time: WHEN_TIMES[w] })} style={{
                    flex: '1 1 64px', minWidth: 0, padding: '8px 2px', borderRadius: 8, fontSize: 11.5, cursor: 'pointer',
                    background: on ? 'var(--ink)' : 'var(--bone)', color: on ? 'var(--ivory)' : 'var(--ink-2)',
                    boxShadow: on ? 'none' : 'inset 0 0 0 1px var(--line-soft)', fontWeight: on ? 700 : 500,
                  }}>{whenLabel(w)}</button>
                );
              })}
            </div>
          </div>
          <DoseSchedule med={med} max={max} api={api}/>
        </div>
      )}
    </div>
  );
}

function MedAddForm({ max, onAdd, onCancel }) {
  const [name, setName] = React.useState('');
  const [dose, setDose] = React.useState('');
  const [when, setWhen] = React.useState('morning');
  const [time, setTime] = React.useState(WHEN_TIMES.morning);
  const [start, setStart] = React.useState(1);
  const [end, setEnd] = React.useState(max);
  /* Ad boşken buton sessizce hiçbir şey yapmıyordu: etkin görünüyor,
     dokunuyorsun, hiçbir şey olmuyor ve sebebi söylenmiyordu. Artık buton
     devre dışı ve yanında niye olduğu yazıyor. */
  const gecerli = name.trim().length > 0;
  const submit = () => { if (gecerli) onAdd({ name: name.trim(), nameTr: name.trim(), dose: dose.trim() || '\u2014', when, time, startDay: start, endDay: end }); };
  return (
    <div style={{ marginTop: 14, padding: 16, borderRadius: 12, border: '1px solid var(--line)', background: 'var(--ivory)', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="eyebrow">{t('New medication', 'Yeni ilaç')}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
        <LabeledInput label={t('Name', 'Ad')} value={name} onChange={setName} autoFocus placeholder={t('e.g. Progesterone', 'örn. Progesteron')}/>
        <LabeledInput label={t('Dose', 'Doz')} value={dose} onChange={setDose} placeholder="100 mg"/>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <TimeField value={time} onChange={v => { setTime(v); setWhen(whenForTime(v)); }}/>
        <span/>
      </div>
      <div>
        <span className="eyebrow" style={{ fontSize: 9.5 }}>{t('When', 'Ne zaman')}</span>
        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
          {WHEN_OPTS.map(w => {
            const on = when === w;
            return (
              <button key={w} onClick={() => { setWhen(w); setTime(WHEN_TIMES[w]); }} style={{
                flex: '1 1 64px', minWidth: 0, padding: '8px 2px', borderRadius: 8, fontSize: 11.5, cursor: 'pointer',
                background: on ? 'var(--ink)' : 'var(--bone)', color: on ? 'var(--ivory)' : 'var(--ink-2)',
                boxShadow: on ? 'none' : 'inset 0 0 0 1px var(--line-soft)', fontWeight: on ? 700 : 500,
              }}>{whenLabel(w)}</button>
            );
          })}
        </div>
      </div>
      <DayRange start={start} end={end} max={max} onChange={(s, e) => { setStart(s); setEnd(e); }}/>
      <div style={{ display: 'flex', gap: 10, marginTop: 2 }}>
        <Btn primary onClick={submit} disabled={!gecerli}><Icon d={ICONS.check} size={13} sw={2}/> {t('Add', 'Ekle')}</Btn>
        {!gecerli && (
          <span style={{ fontSize: 12, color: 'var(--muted)', alignSelf: 'center' }}>
            {t('Enter a name first', 'Önce bir ad gir')}
          </span>
        )}
        <Btn onClick={onCancel}>{t('Cancel', 'İptal')}</Btn>
      </div>
    </div>
  );
}

function LabeledInput({ label, value, onChange, placeholder, autoFocus }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span className="eyebrow" style={{ fontSize: 9.5 }}>{label}</span>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} autoFocus={autoFocus}
        style={{
          border: '1px solid var(--line)', borderRadius: 9, padding: '10px 12px',
          fontFamily: 'var(--sans)', fontSize: 13.5, color: 'var(--ink)',
          background: 'var(--card)', outline: 'none', width: '100%', boxSizing: 'border-box',
        }}/>
    </label>
  );
}

export { MED_COLORS, medColor, WHEN_OPTS, DoseSchedule, RoutineTimeline, DayRange, stepBtn, RegimenEditor, MedEditRow, MedAddForm, LabeledInput };
