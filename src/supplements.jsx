import React from 'react';
import { tx } from './dict';
import { I18N, t } from './i18n';
import { Btn, PHASE_TINT, cycleDayFrom, cycleLenOf, phaseLabel, phaseOf } from './screens';
import { Card, ICONS, Icon, TODAY_DATE, TODAY_KEY, whenLabel } from './shared';

/* supplements.jsx — Lunara · supplements log + phase-based recommendations
   Renders inside the Doses screen. Depends on screens.jsx (cycleDayFrom,
   phaseOf, PHASE_TINT, Btn) and shared.jsx (Card, Icon, ICONS, TODAY_KEY). */
/* eslint-disable */

// Phase-tailored supplement suggestions. `why` is plain-language rationale.
const SUPP_GUIDE = {
  menstrual: [
    { name: 'Iron (bisglycinate)', dose: '18–25 mg', why: 'Replaces what is lost with bleeding; gentle on the stomach', tag: 'IRON' },
    { name: 'Magnesium glycinate', dose: '300 mg', why: 'Eases cramps and supports sleep', tag: 'MG' },
    { name: 'Omega-3 (EPA/DHA)', dose: '1000 mg', why: 'Anti-inflammatory — calms period pain', tag: 'OMEGA' },
  ],
  follicular: [
    { name: 'B-complex', dose: '1 cap', why: 'Supports rising energy and estrogen metabolism', tag: 'B-VIT' },
    { name: 'Myo-inositol', dose: '2 g', why: 'Improves insulin sensitivity — key for PCOS', tag: 'PCOS' },
    { name: 'Vitamin D3 + K2', dose: '2000 IU', why: 'Hormone synthesis and follicle health', tag: 'VIT-D' },
  ],
  ovulation: [
    { name: 'Zinc', dose: '15 mg', why: 'Supports ovulation and healthy progesterone', tag: 'ZINC' },
    { name: 'Vitamin E', dose: '200 IU', why: 'Antioxidant for egg quality', tag: 'ANTIOX' },
    { name: 'Magnesium', dose: '300 mg', why: 'Counters the slight cortisol rise at peak', tag: 'MG' },
  ],
  luteal: [
    { name: 'Magnesium glycinate', dose: '300–400 mg', why: 'Eases PMS, bloating and mood dips', tag: 'PMS' },
    { name: 'Vitamin B6', dose: '50 mg', why: 'Supports progesterone and serotonin', tag: 'B6' },
    { name: 'Calcium', dose: '500 mg', why: 'Shown to reduce luteal-phase symptoms', tag: 'CAL' },
    { name: 'Myo-inositol', dose: '2 g', why: 'Steadies blood sugar through cravings', tag: 'PCOS' },
  ],
};

/* Phase-independent "perimenopause essentials" — the daily, evidence-backed
   base that isn't tied to a cycle phase. Names are English keys (dict.jsx
   provides Turkish); `why` is bilingual and rendered inline. */
const SUPP_ESSENTIALS = [
  { name: 'Creatine monohydrate', dose: '3–5 g', tag: 'CREAT',
    whyEn: 'Muscle, strength, mood and cognition — the strongest midlife evidence. Daily, no loading needed.',
    whyTr: 'Kas, güç, ruh hali ve bilişsel işlev — orta yaşta en güçlü kanıt. Her gün, yükleme gerekmez.' },
  { name: 'Collagen peptides', dose: '5–10 g', tag: 'COLL',
    whyEn: 'Skin elasticity, joints and bone density as estrogen falls. Give it 8–12 weeks.',
    whyTr: 'Östrojen düşerken cilt elastikiyeti, eklemler ve kemik yoğunluğu. 8–12 hafta zaman tanı.' },
];

const WHEN_OPTS = ['morning', 'midday', 'evening', 'bedtime'];

function SupplementsPanel({ lunara, api, logDate }) {
  const dk = logDate || TODAY_KEY;
  const today = TODAY_DATE;
  const day = cycleDayFrom(lunara.periodStart, today, cycleLenOf(lunara));
  const ph = phaseOf(day, cycleLenOf(lunara));
  // Faz bilinmiyorsa genel öneri listesi gösterilir, faz adı iddia edilmez
  const phKey = ph ? ph.key : 'follicular';
  const tint = PHASE_TINT[phKey];
  const log = lunara.suppLog[dk] || {};
  const recs = SUPP_GUIDE[phKey];
  const existingNames = lunara.supplements.map(s => s.name.toLowerCase());

  const [adding, setAdding] = React.useState(false);
  const [name, setName] = React.useState('');
  const [dose, setDose] = React.useState('');
  const [when, setWhen] = React.useState('morning');

  const submit = () => {
    if (!name.trim()) return;
    api.addSupp({ name: name.trim(), dose: dose.trim() || '—', when });
    setName(''); setDose(''); setWhen('morning'); setAdding(false);
  };

  const takenCount = lunara.supplements.filter(s => log[s.id]).length;

  return (
    <div className="mb-stack" style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 20 }}>
      {/* MY SUPPLEMENTS */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontFamily: 'var(--serif)', fontSize: 22 }}>{t('Supplements','Takviyeler')}</span>
          <span className="eyebrow-mono" style={{ color: 'var(--accent)' }}>{takenCount}/{lunara.supplements.length} {t('TAKEN','ALINDI')}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {lunara.supplements.map((s, i) => {
            const taken = log[s.id];
            return (
              <div key={s.id} style={{
                display: 'grid', gridTemplateColumns: '40px 1fr auto auto', gap: 12, alignItems: 'center',
                padding: '12px 0', borderBottom: i < lunara.supplements.length - 1 ? '1px solid var(--line-soft)' : 'none',
              }}>
                <button onClick={() => api.toggleSupp(dk, s.id)}
                  aria-pressed={!!taken}
                  aria-label={taken
                    ? t('Mark ' + s.name + ' as not taken', s.name + ' alınmadı olarak işaretle')
                    : t('Mark ' + s.name + ' as taken', s.name + ' alındı olarak işaretle')}
                  style={{
                    width: 40, height: 40, borderRadius: 12, cursor: 'pointer',
                    background: taken ? 'var(--accent)' : 'var(--bone)',
                    color: taken ? 'var(--ivory)' : 'var(--muted)',
                    boxShadow: taken ? 'none' : 'inset 0 0 0 1px var(--line)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 160ms ease',
                  }}>
                  <Icon d={taken ? ICONS.check : ICONS.plus} size={17} sw={taken ? 2 : 1.6}/>
                </button>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontFamily: 'var(--serif)', fontSize: 17 }}>{tx(s.name)}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-2)' }}>{s.dose}</span>
                  </div>
                  <span className="eyebrow-mono" style={{ fontSize: 9.5, color: 'var(--muted-2)' }}>{whenLabel(s.when).toUpperCase()}</span>
                </div>
                <span style={{ fontSize: 11.5, color: taken ? 'var(--muted)' : 'var(--muted-2)', fontFamily: 'var(--mono)' }}>
                  {taken ? `· ${taken}` : ''}
                </span>
                <button onClick={() => api.removeSupp(s.id)} aria-label="Remove"
                  style={{ width: 26, height: 26, borderRadius: 8, color: 'var(--muted-2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--signal-low)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--muted-2)'}>
                  <Icon d="M6 6l12 12M6 18L18 6" size={14}/>
                </button>
              </div>
            );
          })}
          {lunara.supplements.length === 0 && (
            <div style={{ padding: '20px 0', fontSize: 13, color: 'var(--muted)', fontStyle: 'italic', fontFamily: 'var(--serif)' }}>
              {t('No supplements yet — add what you take below.', 'Henüz takviye yok — aşağıdan aldıklarını ekle.')}
            </div>
          )}
        </div>

        {/* Add form */}
        {adding ? (
          <div style={{ marginTop: 14, padding: 14, borderRadius: 14, background: 'var(--bone)', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <input value={name} onChange={e => setName(e.target.value)} placeholder={t('Supplement name','Takviye adı')} autoFocus
                onKeyDown={e => e.key === 'Enter' && submit()}
                style={inp(2)}/>
              <input value={dose} onChange={e => setDose(e.target.value)} placeholder={t('Dose','Doz')}
                onKeyDown={e => e.key === 'Enter' && submit()}
                style={inp(1)}/>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {WHEN_OPTS.map(w => (
                <button key={w} onClick={() => setWhen(w)}
                  style={{
                    flex: 1, padding: '8px 4px', borderRadius: 8, fontSize: 11, cursor: 'pointer',
                    textTransform: 'capitalize', fontFamily: 'var(--sans)',
                    background: when === w ? 'var(--ink)' : 'var(--card)',
                    color: when === w ? 'var(--ivory)' : 'var(--muted)',
                    boxShadow: when === w ? 'none' : 'inset 0 0 0 1px var(--line)',
                  }}>{whenLabel(w)}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Btn onClick={() => { setAdding(false); setName(''); setDose(''); }}>{t('Cancel','İptal')}</Btn>
              <Btn primary onClick={submit}><Icon d={ICONS.check} size={13} sw={2}/> {t('Add','Ekle')}</Btn>
            </div>
          </div>
        ) : (
          <button onClick={() => setAdding(true)}
            style={{ marginTop: 14, width: '100%', padding: '11px', borderRadius: 12, cursor: 'pointer',
              boxShadow: 'inset 0 0 0 1px var(--line)', color: 'var(--ink-2)', background: 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontSize: 13, fontWeight: 500 }}>
            <Icon d={ICONS.plus} size={14} sw={2}/> {t('Add a supplement','Takviye ekle')}
          </button>
        )}
      </Card>

      {/* Right column: essentials on top, phase suggestions below */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
      {/* PERIMENOPAUSE ESSENTIALS — phase-independent, evidence-backed base */}
      <Card style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--accent)' }}/>
          <div className="eyebrow">{t('Perimenopause essentials', 'Perimenopoz temelleri')}</div>
        </div>
        <p style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5, margin: '6px 0 16px' }}>
          {t('Daily base for muscle, bone and skin as estrogen falls. Tap + to add. Protein is a food target — see Nutrition.',
             'Östrojen düşerken kas, kemik ve cilt için günlük temel. Eklemek için + simgesine dokun. Protein bir besin hedefidir — Beslenme’ye bak.')}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
          {SUPP_ESSENTIALS.map((r, i) => {
            const already = existingNames.includes(r.name.toLowerCase());
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span style={{ fontSize: 9, fontFamily: 'var(--mono)', letterSpacing: '0.04em', color: 'var(--ink-2)', background: 'var(--accent-soft)', padding: '4px 6px', borderRadius: 6, minWidth: 50, textAlign: 'center', marginTop: 2 }}>{r.tag}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{tx(r.name)}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>{r.dose}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.4 }}>{t(r.whyEn, r.whyTr)}</div>
                </div>
                <button disabled={already}
                  aria-label={already
                    ? t(r.name + ' already on your list', r.name + ' zaten listende')
                    : t('Add ' + r.name + ' to your list', r.name + ' takviyesini listene ekle')}
                  onClick={() => api.addSupp({ name: r.name, dose: r.dose, when: 'morning' })}
                  style={{
                    width: 28, height: 28, borderRadius: 9, flexShrink: 0, cursor: already ? 'default' : 'pointer',
                    background: already ? 'transparent' : 'var(--ink)',
                    color: already ? 'var(--accent)' : 'var(--ivory)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                  <Icon d={already ? ICONS.check : ICONS.plus} size={15} sw={2}/>
                </button>
              </div>
            );
          })}
        </div>
      </Card>

      {/* PHASE RECOMMENDATIONS */}
      <Card style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: tint }}/>
          <div className="eyebrow">{t('Suggested','Önerilen')}{ph ? <> · {phaseLabel(ph).toLocaleLowerCase(I18N.lang==='tr'?'tr':'en')} {t('phase','fazı')}</> : null}</div>
        </div>
        <p style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5, margin: '6px 0 16px' }}>
          {t('Common support for where you are in your cycle. Tap + to add to your list.', 'Döngüdeki yerine göre yaygın destek. Listene eklemek için + simgesine dokun.')}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
          {recs.map((r, i) => {
            const already = existingNames.includes(r.name.toLowerCase());
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span style={{ fontSize: 9, fontFamily: 'var(--mono)', letterSpacing: '0.04em', color: 'var(--ink-2)', background: tint + '33', padding: '4px 6px', borderRadius: 6, minWidth: 50, textAlign: 'center', marginTop: 2 }}>{r.tag}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{tx(r.name)}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>{r.dose}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.4 }}>{tx(r.why)}</div>
                </div>
                <button disabled={already}
                  aria-label={already
                    ? t(tx(r.name) + ' already on your list', tx(r.name) + ' zaten listende')
                    : t('Add ' + tx(r.name) + ' to your list', tx(r.name) + ' takviyesini listene ekle')}
                  onClick={() => api.addSupp({ name: r.name, dose: r.dose, when: 'morning' })}
                  style={{
                    width: 28, height: 28, borderRadius: 9, flexShrink: 0, cursor: already ? 'default' : 'pointer',
                    background: already ? 'transparent' : 'var(--ink)',
                    color: already ? 'var(--accent)' : 'var(--ivory)',
                    boxShadow: already ? 'none' : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                  <Icon d={already ? ICONS.check : ICONS.plus} size={15} sw={2}/>
                </button>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--line-soft)', display: 'flex', gap: 8, alignItems: 'center' }}>
          <Icon d={ICONS.heart} size={13} stroke="var(--muted-2)"/>
          <span style={{ fontSize: 11, color: 'var(--muted-2)', fontStyle: 'italic', fontFamily: 'var(--serif)' }}>
            {t('General guidance — confirm doses with your care team.', 'Genel rehberlik — dozları bakım ekibinle doğrula.')}
          </span>
        </div>
      </Card>
      </div>
    </div>
  );
}

function inp(flex) {
  return {
    flex, minWidth: 0, border: '1px solid var(--line)', borderRadius: 9, padding: '10px 12px',
    fontFamily: 'var(--sans)', fontSize: 13, background: 'var(--card)', color: 'var(--ink)', outline: 'none',
  };
}

export { SUPP_GUIDE, WHEN_OPTS, SupplementsPanel, inp };
