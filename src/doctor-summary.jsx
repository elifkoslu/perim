import React from 'react';
import ReactDOM from 'react-dom';
import { I18N, t } from './i18n';
import { LABS, TODAY_DATE, activeMeds, getTodayKey, medSchedule, regimenDay, gunlukLog } from './shared';
import { symptomsFor } from './screen-content';

/* doctor-summary.jsx — a one-page summary the user can print / save as PDF
   or copy, to bring to a BHRT consultation. All computed on-device. */
/* eslint-disable */

function fmt(iso, lang) {
  if (!iso) return '';
  return new Date(iso + 'T00:00:00').toLocaleDateString(lang === 'tr' ? 'tr' : 'en', { day: 'numeric', month: 'long', year: 'numeric' });
}
function dateKey(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }

// Build the summary data model from state

/* Bir ilacın gün aralıklarını tek satırlık özete çevirir. Tek aralıkta eski
   görünüm korunur; fazına göre değişen dozda her aralık dozuyla yazılır —
   hekimin hangi günlerde ne alındığını görmesi gerekir. */
function medPlanText(m) {
  const slots = medSchedule(m);
  if (slots.length <= 1) return t('days', 'gün') + ' ' + m.startDay + '\u2013' + m.endDay;
  return slots.map(s => t('d', 'g') + s.startDay + '\u2013' + s.endDay + ': ' + s.dose).join(' \u00b7 ');
}
function medDoseText(m) {
  return medSchedule(m).length > 1 ? t('varies by day', 'güne göre değişir') : m.dose;
}

function buildSummary(lunara) {
  const p = lunara.profile || {};
  const meds = (lunara.regimen && lunara.regimen.meds) || [];
  const titration = [...(lunara.titration || [])].sort((a, b) => (a.date < b.date ? 1 : -1));

  // latest lab panel
  const panels = [...(lunara.labPanels || [])].sort((a, b) => (a.date < b.date ? 1 : -1));
  const latestPanel = panels[0] || null;

  // symptom summary over last 30 days
  const syms = symptomsFor(lunara.stage);
  const keys = [];
  for (let i = 29; i >= 0; i--) { const d = new Date(TODAY_DATE); d.setDate(d.getDate() - i); keys.push(dateKey(d)); }
  // Kanama tek kaynaktan (periodDays) — belirtilerden girilen kanama da sayılsın
  const symLog = gunlukLog(lunara);
  const symptomSummary = syms.map(s => {
    const vals = keys.map(k => symLog[k] && symLog[k][s.key]).filter(v => v != null);
    if (!vals.length) return null;
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    return { key: s.key, label: s.label, labelTr: s.labelTr, days: vals.length, avg };
  }).filter(Boolean).sort((a, b) => b.avg - a.avg);

  // 30-day adherence
  let sch = 0, tak = 0;
  for (const k of keys) {
    const d = new Date(k + 'T00:00:00');
    const scheduled = lunara.regimen ? activeMeds(lunara.regimen, regimenDay(lunara.regimen, d)).length : 0;
    const takenN = (lunara.doseLog && lunara.doseLog[k]) ? Object.keys(lunara.doseLog[k]).length : 0;
    sch += scheduled; tak += Math.min(takenN, scheduled);
  }
  const adherence = sch > 0 ? Math.round((tak / sch) * 100) : null;

  return { p, meds, titration, latestPanel, symptomSummary, adherence, stageBlock: stageBlockFor(lunara, keys) };
}

/* Stage-specific block: what a clinician actually needs for this life stage.
   Each row is { l: {en,tr}, v: string }. No rows → section is hidden. */
const daysApart = (a, b) => Math.round((b - a) / 86400000);
// profile.bhrtStatus ham anahtarını ('on' / 'exploring' / 'no') okunur metne çevirir.
const bhrtLabel = (bs) =>
  bs === 'on' ? t('using', 'kullanıyor')
  : bs === 'exploring' ? t('exploring', 'değerlendiriyor')
  : t('not yet', 'henüz değil');
const sumOver = (log, keys) => keys.reduce((n, k) => n + (Number((log || {})[k]) || 0), 0);
const daysWith = (log, keys) => keys.filter(k => (log || {})[k] != null).length;

function stageBlockFor(lunara, keys) {
  const st = lunara.stage;
  const rows = [];
  const today = TODAY_DATE;
  const last7 = keys.slice(-7);

  if (st === 'ttc') {
    const ttc = lunara.ttc || {};
    if (lunara.periodStart) {
      rows.push({ l: { en: 'Last period started', tr: 'Son adet başlangıcı' }, v: lunara.periodStart });
      rows.push({ l: { en: 'Cycle day today', tr: 'Bugün döngü günü' }, v: String(daysApart(new Date(lunara.periodStart + 'T00:00:00'), today) + 1) });
    }
    const cl = (lunara.regimen && lunara.regimen.cycleLength) || lunara.cycleLength;
    if (cl) rows.push({ l: { en: 'Usual cycle length', tr: 'Olağan döngü uzunluğu' }, v: cl + ' ' + t('days', 'gün') });
    const bbtDays = daysWith(ttc.bbt, keys);
    if (bbtDays) rows.push({ l: { en: 'BBT logged (30 d)', tr: 'BBT kaydı (30 g)' }, v: bbtDays + '/30 ' + t('days', 'gün') });
    const lhPos = keys.filter(k => ttc.lh && (ttc.lh[k] === 'peak' || ttc.lh[k] === 'high' || ttc.lh[k] === true)).length;
    if (lhPos) rows.push({ l: { en: 'LH surge days (30 d)', tr: 'LH pik günleri (30 g)' }, v: String(lhPos) });
  }

  if (st === 'pregnancy') {
    const pg = lunara.pregnancy || {};
    if (pg.dueDate) {
      const due = new Date(pg.dueDate + 'T00:00:00');
      const week = Math.max(0, 40 - Math.ceil(daysApart(today, due) / 7));
      rows.push({ l: { en: 'Gestational age', tr: 'Gebelik haftası' }, v: t(`week ${week}`, `${week}. hafta`) });
      rows.push({ l: { en: 'Trimester', tr: 'Trimester' }, v: String(week < 14 ? 1 : week < 28 ? 2 : 3) });
      rows.push({ l: { en: 'Due date', tr: 'Tahmini doğum' }, v: pg.dueDate });
    }
    if (pg.weightKg) rows.push({ l: { en: 'Weight', tr: 'Kilo' }, v: pg.weightKg + ' kg' });
    const kicks7 = sumOver(pg.kicks, last7);
    if (kicks7) rows.push({ l: { en: 'Kicks (last 7 d)', tr: 'Tekme (son 7 g)' }, v: `${kicks7} · ${t('avg', 'ort')} ${Math.round(kicks7 / 7)}/${t('day', 'gün')}` });
  }

  if (st === 'postpartum') {
    const pp = lunara.postpartum || {};
    if (pp.birthDate) {
      const wk = Math.floor(daysApart(new Date(pp.birthDate + 'T00:00:00'), today) / 7);
      rows.push({ l: { en: 'Weeks since birth', tr: 'Doğumdan bu yana' }, v: wk + ' ' + t('weeks', 'hafta') });
      rows.push({ l: { en: 'Birth date', tr: 'Doğum tarihi' }, v: pp.birthDate });
    }
    const eps = [...(pp.epds || [])].sort((a, b) => (a.date < b.date ? 1 : -1));
    if (eps.length) {
      const e = eps[0];
      rows.push({ l: { en: 'EPDS score (latest)', tr: 'EPDS puanı (son)' }, v: `${e.score}/30 · ${e.date}${e.score >= 13 ? ' ⚠' : ''}` });
      if (e.q10 != null && e.q10 > 0) rows.push({ l: { en: 'EPDS item 10 (self-harm)', tr: 'EPDS 10. madde (kendine zarar)' }, v: String(e.q10) + ' ⚠' });
    }
    const feeds7 = sumOver(pp.feeds, last7);
    if (feeds7) rows.push({ l: { en: 'Feeds (last 7 d)', tr: 'Emzirme (son 7 g)' }, v: `${feeds7} · ${t('avg', 'ort')} ${Math.round(feeds7 / 7)}/${t('day', 'gün')}` });
    const moodVals = keys.map(k => (pp.mood || {})[k]).filter(v => v != null);
    if (moodVals.length) rows.push({ l: { en: 'Mood (30 d avg)', tr: 'Ruh hali (30 g ort)' }, v: (moodVals.reduce((a, b) => a + b, 0) / moodVals.length).toFixed(1) + '/5' });
  }

  if (st === 'menopause' || st === 'perimeno') {
    const mp = lunara.menopause || {};
    /* Perimenopozda doğru kaynak takvim: periodStart, işaretlenen kanama
       günlerinden (sonKanamaBasi) sürekli güncelleniyor. menopause.lastPeriod
       ancak kullanıcı ayrıca girdiyse anlamlı, o yüzden yedekte duruyor. */
    const last = (st === 'perimeno' ? (lunara.periodStart || mp.lastPeriod) : mp.lastPeriod) || null;
    if (last) {
      const months = Math.floor(daysApart(new Date(last + 'T00:00:00'), today) / 30.44);
      rows.push({ l: { en: 'Last period', tr: 'Son adet' }, v: last });
      rows.push({ l: { en: 'Time since last period', tr: 'Son adetten bu yana' }, v: months + ' ' + t('months', 'ay') });
    }
    if (st === 'perimeno') {
      const cl = (lunara.regimen && lunara.regimen.cycleLength) || lunara.cycleLength;
      if (cl) rows.push({ l: { en: 'Cycle length used', tr: 'Kullanılan döngü uzunluğu' }, v: cl + ' ' + t('days', 'gün') });
    }
    /* Ara kanama / lekelenme: BHRT altında ve perimenopozda hekimin ayrıca
       bilmek istediği şey; regl günlerinden ayrı sayılıyor. */
    const leke = Object.keys(lunara.lekeGunleri || {})
      .filter(k => lunara.lekeGunleri[k])
      .filter(k => { const g = daysApart(new Date(k + 'T00:00:00'), today); return g >= 0 && g < 90; })
      .sort();
    if (leke.length) rows.push({ l: { en: 'Spotting days (90 d)', tr: 'Ara kanama / lekelenme (son 90 g)' },
      v: leke.length + ' ' + t('days', 'gün') + ' · ' + t('last', 'son') + ' ' + leke[leke.length - 1] });
    const bs = lunara.profile && lunara.profile.bhrtStatus;
    if (bs) rows.push({ l: { en: 'Hormone therapy', tr: 'Hormon tedavisi' }, v: bhrtLabel(bs) });
  }

  const titles = {
    ttc: { en: 'Trying to conceive', tr: 'Gebe kalma hazırlığı' },
    pregnancy: { en: 'Pregnancy', tr: 'Gebelik' },
    postpartum: { en: 'Postpartum', tr: 'Doğum sonrası' },
    menopause: { en: 'Menopause', tr: 'Menopoz' },
    perimeno: { en: 'Perimenopause', tr: 'Perimenopoz' },
  };
  return rows.length ? { title: titles[st], rows } : null;
}

// Plain-text version (for copy / messaging)
function summaryText(lunara) {
  const lang = I18N.lang;
  const { p, meds, titration, latestPanel, symptomSummary, adherence, stageBlock } = buildSummary(lunara);
  const L = [];
  L.push(t('WOMENTUM — DOCTOR SUMMARY', 'WOMENTUM — DOKTORA ÖZET'));
  L.push(fmt(getTodayKey(), lang));
  if (p.name || p.age) L.push(`${p.name || ''}${p.age ? ` · ${p.age} ${t('yrs', 'yaş')}` : ''}`);
  if (p.bhrtStatus) L.push('BHRT: ' + bhrtLabel(p.bhrtStatus));
  if (stageBlock) {
    L.push('');
    L.push(t(stageBlock.title.en, stageBlock.title.tr).toLocaleUpperCase(lang === 'tr' ? 'tr' : 'en'));
    stageBlock.rows.forEach(r => L.push(`• ${t(r.l.en, r.l.tr)}: ${r.v}`));
  }
  if (meds.length) {
    L.push('');
    L.push(t('CURRENT REGIMEN', 'GÜNCEL REJİM'));
    meds.forEach(m => L.push(`• ${t(m.name, m.nameTr || m.name)} — ${medDoseText(m)} · ${medPlanText(m)} · ${t(m.detail || '', m.detailTr || m.detail || '')} · ${m.time}`));
    if (adherence != null) L.push(t(`30-day adherence: ${adherence}%`, `30 günlük uyum: %${adherence}`));
  }
  if (titration.length) {
    L.push('');
    L.push(t('DOSE CHANGES', 'DOZ DEĞİŞİKLİKLERİ'));
    titration.forEach(x => L.push(`• ${fmt(x.date, lang)} — ${x.med} ${x.from || '—'} → ${x.to || '—'}${x.reason ? ` (${x.reason})` : ''}${x.note ? ` — ${x.note}` : ''}`));
  }
  L.push('');
  L.push(t('LATEST LABS', 'SON TAHLİLLER') + (latestPanel ? ` · ${fmt(latestPanel.date, lang)}` : ''));
  if (latestPanel) latestPanel.readings.forEach(r => {
    const oor = r.range && (r.value < r.range[0] || r.value > r.range[1]);
    L.push(`• ${t(r.name, r.nameTr || r.name)}: ${r.value} ${r.unit || ''}${r.range ? ` (ref ${r.range[0]}–${r.range[1]})` : ''}${oor ? ' ⚠' : ''}`);
  });
  else L.push(t('(none)', '(yok)'));
  L.push('');
  L.push(t('SYMPTOMS · last 30 days', 'BELİRTİLER · son 30 gün'));
  if (symptomSummary.length) symptomSummary.forEach(s => L.push(`• ${t(s.label, s.labelTr)}: ${s.days}/30 ${t('days', 'gün')} · ${t('avg', 'ort')} ${s.avg.toFixed(1)}/3`));
  else L.push(t('(none logged)', '(kayıt yok)'));
  return L.join('\n');
}

function DoctorSummary({ lunara, onClose }) {
  /* Escape ile kapansın: bu bileşen ekranı kaplayan sabit bir katman ve
     kapanmanın tek yolu onClose. Bir çağrı yeri onClose geçmeyi unutunca
     (perim-analytics.jsx'te olan buydu) kullanıcı katmanın altında kalıp
     sayfayı yenilemek zorunda kalıyordu. Escape ikinci bir çıkış. */
  React.useEffect(() => {
    if (!onClose) return;
    const esc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  const lang = I18N.lang;
  const { p, meds, titration, latestPanel, symptomSummary, adherence, stageBlock } = buildSummary(lunara);
  const [copied, setCopied] = React.useState(false);

  const copy = async () => {
    try { await navigator.clipboard.writeText(summaryText(lunara)); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch (e) {}
  };

  // Print-safe palette (dark ink on white, independent of theme)
  const INK = '#2A2233', MUT = '#6B6178', LINE = '#DFD7C9', ACC = '#3A294E';
  const h2 = { fontFamily: 'var(--serif)', fontSize: 15, color: INK, margin: '0 0 8px', letterSpacing: '0.02em', textTransform: 'uppercase', borderBottom: `1px solid ${LINE}`, paddingBottom: 5 };
  const row = { display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, padding: '5px 0', fontSize: 12.5, color: INK };

  // body'ye portallanır: bu modal .fade-up içinden açılıyor ve o sınıf
  // animation-fill-mode:both ile transform'u element üzerinde bırakıyor.
  // Transform'lu bir ata, position:fixed için kapsayıcı blok yarattığından
  // katman viewport'a değil kaydırılmış kaba çakılıyordu.
  return ReactDOM.createPortal((
    <div onClick={onClose} className="doc-overlay" style={{
      position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      background: 'rgba(20,14,10,0.5)', backdropFilter: 'blur(3px)', padding: '24px 18px', overflow: 'auto',
    }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 640 }}>
        {/* toolbar — not printed */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ color: 'var(--ivory)', fontSize: 13, fontFamily: 'var(--mono)' }}>{t('Doctor summary', 'Doktora özet')}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={copy} style={{ padding: '9px 16px', borderRadius: 999, border: 'none', cursor: 'pointer', background: 'var(--bone)', color: 'var(--ink)', fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 600 }}>
              {copied ? t('Copied ✓', 'Kopyalandı ✓') : t('Copy text', 'Metni kopyala')}
            </button>
            <button onClick={() => window.print()} style={{ padding: '9px 16px', borderRadius: 999, border: 'none', cursor: 'pointer', background: 'var(--accent)', color: 'var(--ivory)', fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 600 }}>
              {t('Print / Save PDF', 'Yazdır / PDF kaydet')}
            </button>
            <button onClick={onClose} style={{ padding: '9px 14px', borderRadius: 999, cursor: 'pointer', border: '1px solid var(--line)', background: 'transparent', color: 'var(--ivory)', fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 600 }}>
              {t('Close', 'Kapat')}
            </button>
          </div>
        </div>

        {/* the printable document */}
        <div id="doctor-summary" style={{ background: '#fff', borderRadius: 12, padding: '36px 40px', color: INK, boxShadow: '0 24px 60px -20px rgba(0,0,0,0.4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: `2px solid ${INK}`, paddingBottom: 14, marginBottom: 20 }}>
            <div>
              <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 26, color: INK }}>Perim</div>
              <div style={{ fontSize: 11, color: MUT, fontFamily: 'var(--mono)', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 2 }}>{t('Doctor summary', 'Doktora özet')}</div>
            </div>
            <div style={{ textAlign: 'right', fontSize: 12, color: MUT }}>
              {(p.name || p.age) && <div style={{ fontSize: 14, color: INK, fontWeight: 600 }}>{p.name}{p.age ? ` · ${p.age} ${t('yrs', 'yaş')}` : ''}</div>}
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, marginTop: 2 }}>{fmt(getTodayKey(), lang)}</div>
              {p.bhrtStatus && <div style={{ fontSize: 11, marginTop: 2 }}>BHRT: {bhrtLabel(p.bhrtStatus)}</div>}
            </div>
          </div>

          {/* Stage-specific block — the clinical picture for this life stage */}
          {stageBlock && (
            <section style={{ marginBottom: 22 }}>
              <h2 style={h2}>{t(stageBlock.title.en, stageBlock.title.tr)}</h2>
              {stageBlock.rows.map((r, i) => (
                <div key={i} style={row}>
                  <span>{t(r.l.en, r.l.tr)}</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: MUT }}>{r.v}</span>
                </div>
              ))}
            </section>
          )}

          {/* Regimen — hidden when empty (irrelevant in pregnancy, TTC etc.) */}
          {meds.length > 0 && (
          <section style={{ marginBottom: 22 }}>
            <h2 style={h2}>{t('Current regimen', 'Güncel rejim')}{adherence != null ? ` · ${t('adherence', 'uyum')} ${t(adherence + '%', '%' + adherence)}` : ''}</h2>
            {meds.length ? meds.map(m => (
              <div key={m.id} style={row}>
                <span><strong>{t(m.name, m.nameTr || m.name)}</strong> — {medDoseText(m)} · <span style={{ color: MUT }}>{t(m.detail || '', m.detailTr || m.detail || '')}</span></span>
                <span style={{ fontFamily: 'var(--mono)', color: MUT, fontSize: 11.5 }}>{m.time} · {medPlanText(m)}</span>
              </div>
            )) : <div style={{ fontSize: 12.5, color: MUT, fontStyle: 'italic' }}>{t('No regimen entered.', 'Rejim girilmedi.')}</div>}
          </section>
          )}

          {/* Titration — only when there is something to show */}
          {titration.length > 0 && (
          <section style={{ marginBottom: 22 }}>
            <h2 style={h2}>{t('Dose changes', 'Doz değişiklikleri')}</h2>
            {titration.length ? titration.map(x => (
              <div key={x.id} style={{ padding: '6px 0', fontSize: 12.5, borderBottom: `1px solid ${LINE}` }}>
                <span style={{ fontFamily: 'var(--mono)', color: MUT, fontSize: 11 }}>{fmt(x.date, lang)}</span>{'  '}
                <strong>{x.med}</strong> {x.from || '—'} <span style={{ color: ACC }}>→</span> {x.to || '—'}
                {x.reason && <span style={{ color: MUT }}> · {x.reason}</span>}
                {x.note && <span style={{ color: MUT, fontStyle: 'italic' }}> — {x.note}</span>}
              </div>
            )) : <div style={{ fontSize: 12.5, color: MUT, fontStyle: 'italic' }}>{t('None logged.', 'Kayıt yok.')}</div>}
          </section>
          )}

          {/* Labs */}
          <section style={{ marginBottom: 22 }}>
            <h2 style={h2}>{t('Latest labs', 'Son tahliller')}{latestPanel ? ` · ${fmt(latestPanel.date, lang)}` : ''}</h2>
            {latestPanel ? latestPanel.readings.map((r, i) => {
              const oor = r.range && (r.value < r.range[0] || r.value > r.range[1]);
              return (
                <div key={i} style={row}>
                  <span>{t(r.name, r.nameTr || r.name)}</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5 }}>
                    <strong style={{ color: oor ? ACC : INK }}>{r.value} {r.unit}</strong>
                    {r.range ? <span style={{ color: MUT }}> · ref {r.range[0]}–{r.range[1]}</span> : null}
                    {oor ? <span style={{ color: ACC }}> ⚠</span> : null}
                  </span>
                </div>
              );
            }) : <div style={{ fontSize: 12.5, color: MUT, fontStyle: 'italic' }}>{t('No labs entered.', 'Tahlil girilmedi.')}</div>}
          </section>

          {/* Symptoms */}
          <section style={{ marginBottom: 20 }}>
            <h2 style={h2}>{t('Symptoms · last 30 days', 'Belirtiler · son 30 gün')}</h2>
            {symptomSummary.length ? symptomSummary.map(s => (
              <div key={s.key} style={row}>
                <span>{t(s.label, s.labelTr)}</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: MUT }}>{s.days}/30 {t('days', 'gün')} · {t('avg', 'ort')} {s.avg.toFixed(1)}/3</span>
              </div>
            )) : <div style={{ fontSize: 12.5, color: MUT, fontStyle: 'italic' }}>{t('None logged.', 'Kayıt yok.')}</div>}
          </section>

          <div style={{ borderTop: `1px solid ${LINE}`, paddingTop: 12, fontSize: 10.5, color: MUT, fontStyle: 'italic', lineHeight: 1.5 }}>
            {t('Self-tracked data from the Perim app, for discussion with your clinician. Not a medical record or diagnosis.',
               'Perim uygulamasından kullanıcı tarafından takip edilen veriler; hekiminle görüşmek içindir. Tıbbi kayıt veya tanı değildir.')}
          </div>
        </div>
      </div>
    </div>
  ), document.body);
}

export { DoctorSummary, summaryText, stageBlockFor };
