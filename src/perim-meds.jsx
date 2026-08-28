import React from 'react';
import { t, useLang } from './i18n';
import { MealLog, ProteinTracker, SeedCycle } from './nourish';
import { ReferenceCard } from './reference-card';
import { RegimenEditor } from './regimen';
import {
  Btn, PHASE_TINT, ScreenHead, TakenAmount, cycleDayFrom, cycleLenOf,
  doseAmountOf, doseUnitOf, phaseOf, wrap,
} from './screens';
import { SupplementsPanel } from './supplements';
import { WaterCard } from './water';
import {
  Card, DateNav, ICONS, Icon, TODAY_DATE, TODAY_KEY, getTodayKey,
  medTaken, nowHM, todaysDoses, whenLabel,
} from './shared';

/* perim-meds.jsx — "İlaçlar": günlük alınan her şey tek ekranda.
   Üç bölüm: BHRT ilaçları, takviyeler, yemekler.

   En üstte hormon tablosu duruyor — bugün normalde hangi seviyeler olurdu,
   tahlilinde ne ölçüldü, ve altında bugünün dozları. Üçü yan yana ama eğri
   bir HEDEF DEĞİL: perimenopozda tedavi bu eğriyi yeniden üretmeyi
   amaçlamaz. Kartın altındaki not bunu söylüyor. Uygulama doz hesaplamıyor,
   önermiyor; doz kararı hekimin. */
/* eslint-disable */

const BOLUMLER = [
  { k: 'bhrt', en: 'BHRT medications', tr: 'BHRT ilaçları', icon: ICONS.pill },
  { k: 'supp', en: 'Supplements',      tr: 'Takviyeler',    icon: ICONS.leaf },
  { k: 'food', en: 'Food',             tr: 'Yemekler',      icon: ICONS.flame },
];

function PerimMeds({ lunara, api, logDate, setLogDate }) {
  useLang();
  const [bolum, setBolum] = React.useState('bhrt');
  const [rejimAcik, setRejimAcik] = React.useState(false);
  const dk = logDate || getTodayKey();
  const L = cycleLenOf(lunara);
  const gun = cycleDayFrom(lunara && lunara.periodStart, TODAY_DATE, L);
  const faz = phaseOf(gun, L);
  const { meds } = todaysDoses(lunara);
  const alinan = meds.filter(d => medTaken(lunara, d.id)).length;
  const rejimYok = !lunara.regimen || (lunara.regimen.meds || []).length === 0;

  return (
    <div style={wrap}>
      <ScreenHead eyebrow={t('WHAT YOU TAKE', 'ALDIKLARIN')} title={t('Medications', 'İlaçlar')}
        right={<DateNav date={dk} onChange={setLogDate}/>}/>

      {/* Bölüm seçici */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        {BOLUMLER.map(b => {
          const on = bolum === b.k;
          return (
            <button key={b.k} onClick={() => setBolum(b.k)} aria-pressed={on}
              style={{
                flex: '1 1 130px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '12px 14px', borderRadius: 12, cursor: 'pointer', border: 'none',
                background: on ? 'var(--card)' : 'var(--bone)',
                boxShadow: on ? 'var(--shadow-soft)' : 'none',
                borderTop: `3px solid ${on ? 'var(--accent)' : 'transparent'}`,
                fontSize: 13.5, fontWeight: on ? 700 : 500,
                color: on ? 'var(--ink)' : 'var(--ink-2)', fontFamily: 'var(--sans)',
                transition: 'all 160ms ease',
              }}>
              <Icon d={b.icon} size={15}/> {t(b.en, b.tr)}
            </button>
          );
        })}
      </div>

      {bolum === 'bhrt' && (
        <>
          {/* Hormon tablosu + bugünün dozları */}
          <ReferenceCard lunara={lunara} cycleDay={gun} altBolum={
            <>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
                <div className="eyebrow">{t("Today's doses", 'Bugünün dozları')}</div>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>
                  {rejimYok ? '' : `${alinan} / ${meds.length}`}
                </span>
              </div>
              {rejimYok ? (
                <p style={{ fontFamily: 'var(--serif)', fontSize: 14.5, fontStyle: 'italic', color: 'var(--muted)', margin: 0, lineHeight: 1.5 }}>
                  {t('Add the plan your clinician prescribed below.', 'Hekiminin verdiği programı aşağıdan ekle.')}
                </p>
              ) : meds.length === 0 ? (
                <p style={{ fontFamily: 'var(--serif)', fontSize: 15, fontStyle: 'italic', color: 'var(--muted)', margin: 0 }}>
                  {t('A rest day — no doses scheduled.', 'Bir ara günü — planlı doz yok.')}
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {meds.map((d, i) => {
                    const alindi = medTaken(lunara, d.id);
                    return (
                      <React.Fragment key={d.id}>
                        <DozSatiri dose={d} taken={alindi} last={i === meds.length - 1 && !alindi}
                          onToggle={() => api.toggleMed(TODAY_KEY, d.id, nowHM(), doseAmountOf(d), doseUnitOf(d))}/>
                        {alindi && (
                          <TakenAmount med={d} entry={alindi} last={i === meds.length - 1}
                            onChange={(patch) => api.updateDose(TODAY_KEY, d.id, patch)}/>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              )}
            </>
          }/>

          {/* Program düzenleme — katlanır, günlük iş değil */}
          <Card>
            <button onClick={() => setRejimAcik(v => !v)} aria-expanded={rejimAcik}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
                fontSize: 14, fontWeight: 600, color: 'var(--ink)', fontFamily: 'var(--sans)',
              }}>
              {t('Medication plan', 'İlaç programı')}
              <span style={{ fontSize: 16, color: 'var(--muted)' }}>{rejimAcik ? '−' : '+'}</span>
            </button>
            {rejimAcik && <div style={{ marginTop: 18 }}><RegimenEditor lunara={lunara} api={api}/></div>}
          </Card>
        </>
      )}

      {bolum === 'supp' && <SupplementsPanel lunara={lunara} api={api} logDate={dk}/>}

      {bolum === 'food' && (
        <>
          <ProteinTracker lunara={lunara} api={api}/>
          <WaterCard lunara={lunara} api={api} dateKey={dk}/>
          <MealLog lunara={lunara} api={api} dk={dk} setDk={setLogDate}/>
          {/* Tohum döngüsü döngü fazına bağlı beslenme — Yemekler'e ait.
              Faz bilinmiyorsa gösterilmiyor: hangi yarıda olduğunu
              söyleyemezken tohum önermek anlamsız. */}
          {faz && (
            <Card>
              <SeedCycle phaseKey={faz.key} liveKey={faz.key} tint={PHASE_TINT[faz.key]}
                standalone cycleLength={L}/>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

/* Doz satırı. Silme her zaman görünür ve iki adımlı — deneme amaçlı eklenmiş
   bir ilacı kaldırmak için programı açmak gerekmesin. */
function DozSatiri({ dose, taken, last, onToggle }) {
  const alindi = !!taken;
  return (
    <button onClick={onToggle} style={{
      display: 'grid', gridTemplateColumns: '44px 1fr auto', gap: 13, alignItems: 'center',
      padding: '13px 0', borderBottom: last ? 'none' : '1px solid var(--line-soft)',
      textAlign: 'left', width: '100%', background: 'transparent', border: 'none', cursor: 'pointer',
    }}>
      <span style={{
        width: 44, height: 44, borderRadius: 13,
        background: alindi ? 'var(--accent)' : 'var(--bone)',
        color: alindi ? 'var(--ivory)' : 'var(--muted)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: alindi ? 'none' : 'inset 0 0 0 1px var(--line)',
      }}>
        <Icon d={alindi ? ICONS.check : ICONS.clock} size={17} sw={alindi ? 2 : 1.5}/>
      </span>
      <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontFamily: 'var(--serif)', fontSize: 17 }}>{t(dose.name, dose.nameTr || dose.name)}</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-2)' }}>{dose.dose}</span>
        </span>
        {dose.detail && <span style={{ fontSize: 12, color: 'var(--muted)' }}>{t(dose.detail, dose.detailTr || dose.detail)}</span>}
      </span>
      <span style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 12.5, color: alindi ? 'var(--muted)' : 'var(--ink)', fontWeight: alindi ? 400 : 600 }}>
          {alindi ? `${t('Taken', 'Alındı')} ${taken.at}` : dose.time}
        </span>
        <span className="eyebrow-mono" style={{ fontSize: 9.5, color: 'var(--muted-2)' }}>{whenLabel(dose.when).toUpperCase()}</span>
      </span>
    </button>
  );
}

export { PerimMeds, BOLUMLER };
