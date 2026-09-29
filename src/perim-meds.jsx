import React from 'react';
import { t, useLang } from './i18n';
import { MealLog, ProteinTracker, SeedCycle } from './nourish';
import { ReferenceCard } from './reference-card';
import { RegimenEditor, medColor } from './regimen';
import { gunEkle, kalanGunler, tarihAnahtari } from './kalan-gun';
import {
  Btn, PHASE_TINT, ScreenHead, TakenAmount, cycleDayFrom, cycleLenOf,
  doseAmountOf, doseUnitOf, phaseOf, wrap,
} from './screens';
import { SupplementsPanel } from './supplements';
import { WaterCard } from './water';
import {
  Card, DateNav, ICONS, Icon, TODAY_DATE, TODAY_KEY, getTodayKey,
  medTaken, nowHM, regimenDay, todaysDoses, whenLabel,
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
  /* İleri tarih önizlemesi yalnızca BHRT bölümünde ve yalnızca bu ekranda:
     App'in ortak logDate'i geleceğe hiç gitmiyor, yoksa Belirtiler ya da
     Hareket ekranına geçince geleceğe kayıt yazılabilirdi. Takviye, su ve
     öğünler de hep geçmiş/bugünle çalışıyor. */
  const [onizleme, setOnizleme] = React.useState(null);
  const bugunKey = getTodayKey();
  const dk = (bolum === 'bhrt' && onizleme) || logDate || bugunKey;
  const gelecek = dk > bugunKey;
  const tarihSec = (k) => {
    if (k > bugunKey) setOnizleme(k);
    else { setOnizleme(null); setLogDate(k); }
  };
  const bolumSec = (k) => { setBolum(k); setOnizleme(null); };
  // Karttan bir tarihe gidince tarih seçici ve o günün dozları görünsün.
  // window değil: telefonda kaydırılan iç kap.
  const ustRef = React.useRef(null);
  // Önizleme ufku: altı ay — birkaç rejim döngüsü için yeter
  const ileriSinir = tarihAnahtari(gunEkle(TODAY_DATE, 182));
  /* Ekranın tarih değiştiricisi (DateNav) takviyeye, suya ve öğünlere
     gidiyordu ama asıl ilaç dozları üç yerde bugüne sabitti: okuma
     (medTaken), yazma (toggleMed) ve düzeltme (updateDose). Kullanıcı
     tarihi geriye alıp doza dokununca kayıt bugüne yazılıyor, döngü günü
     de bugünden hesaplandığı için seçilen günün planlı ilaçları yerine
     bugünküler listeleniyordu. Hepsi artık seçilen güne bağlı. */
  const dkDate = new Date(dk + 'T00:00:00');
  const bugunMu = dk === bugunKey;
  const L = cycleLenOf(lunara);
  const gun = cycleDayFrom(lunara && lunara.periodStart, dkDate, L);
  const faz = phaseOf(gun, L);
  const { meds } = todaysDoses(lunara, dkDate);
  const alinan = meds.filter(d => medTaken(lunara, d.id, dk)).length;
  /* Geçmiş bir güne işaret koyarken şu anki saat yanlış olur — ilacın
     gerçekten alındığı saat o değildir. Bugünse şimdi, değilse ilacın
     planlı saati. */
  const dozSaati = (d) => (bugunMu ? nowHM() : (d.time || nowHM()));
  const rejimYok = !lunara.regimen || (lunara.regimen.meds || []).length === 0;

  const dozlar = (
    <>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
                <div className="eyebrow">
                  {gelecek ? t('Planned doses', 'Planlanan dozlar')
                    : bugunMu ? t("Today's doses", 'Bugünün dozları') : t("That day's doses", 'O günün dozları')}
                </div>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>
                  {rejimYok || gelecek ? '' : `${alinan} / ${meds.length}`}
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
              ) : gelecek ? (
                /* Gelecek gün: yalnızca önizleme. Henüz alınmamış bir doz
                   "alındı" diye işaretlenemez. */
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {meds.map((d, i) => (
                    <DozSatiri key={d.id} dose={d} onizleme last={i === meds.length - 1}/>
                  ))}
                  <p style={{ fontSize: 12, color: 'var(--muted)', margin: '10px 0 0', lineHeight: 1.5 }}>
                    {t('A future day — preview only. You can mark doses when the day comes.',
                       'Gelecek bir gün — yalnızca önizleme. Dozları o gün geldiğinde işaretleyebilirsin.')}
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {meds.map((d, i) => {
                    const alindi = medTaken(lunara, d.id, dk);
                    return (
                      <React.Fragment key={d.id}>
                        <DozSatiri dose={d} taken={alindi} last={i === meds.length - 1 && !alindi}
                          onToggle={() => api.toggleMed(dk, d.id, dozSaati(d), doseAmountOf(d), doseUnitOf(d))}/>
                        {alindi && (
                          <TakenAmount med={d} entry={alindi} last={i === meds.length - 1}
                            onChange={(patch) => api.updateDose(dk, d.id, patch)}/>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              )}
    </>
  );

  return (
    <div style={wrap}>
      {/* Takvim ekranındaki ile aynı sıkıştırma: "ALDIKLARIN / İlaçlar"
          başlığı ~180 px yiyordu ve alt bar zaten hangi bölümde olduğunu
          söylüyor. Tarih gezinmesi bölüm seçicinin yanına indi. */}
      <div ref={ustRef} style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10, scrollMarginTop: 80 }}>
        <DateNav date={dk} onChange={tarihSec}
          maxDate={bolum === 'bhrt' && !rejimYok ? ileriSinir : undefined}/>
      </div>

      {/* Bölüm seçici */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        {BOLUMLER.map(b => {
          const on = bolum === b.k;
          return (
            <button key={b.k} onClick={() => bolumSec(b.k)} aria-pressed={on}
              style={{
                flex: '1 1 0', minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '12px 8px', borderRadius: 12, cursor: 'pointer', border: 'none',
                background: on ? 'var(--card)' : 'var(--bone)',
                boxShadow: on ? 'var(--shadow-soft)' : 'none',
                borderTop: `3px solid ${on ? 'var(--accent)' : 'transparent'}`,
                fontSize: 13, fontWeight: on ? 700 : 500, whiteSpace: 'nowrap',
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
          {/* Hormon tablosu + bugünün dozları. Hormon tablosu döngü gününe
              bağlı; son regl bilinmiyorsa (perimenopozda sık) ReferenceCard hiç
              çizilmiyordu ve dozlar da onunla kayboluyordu — işaretlenemiyordu.
              O durumda dozlar tek başına bir kartta. */}
          {gun == null ? <Card>{dozlar}</Card>
            : <ReferenceCard lunara={lunara} cycleDay={gun} katlanir altBolum={dozlar}/>}

          {!rejimYok && (
            <KalanGunlerKarti regimen={lunara.regimen} secili={dk}
              onGit={(k) => { tarihSec(k); ustRef.current && ustRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}/>
          )}

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
function DozSatiri({ dose, taken, last, onToggle, onizleme }) {
  const alindi = !!taken;
  // Önizlemede satır bir düğme değil: dokunulacak bir şey yok
  const Kap = onizleme ? 'div' : 'button';
  return (
    <Kap onClick={onizleme ? undefined : onToggle} style={{
      display: 'grid', gridTemplateColumns: '44px 1fr auto', gap: 13, alignItems: 'center',
      padding: '13px 0', borderBottom: last ? 'none' : '1px solid var(--line-soft)',
      textAlign: 'left', width: '100%', background: 'transparent', border: 'none', cursor: onizleme ? 'default' : 'pointer',
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
    </Kap>
  );
}

/* ── Döngüde kalan günler ─────────────────────────────────────────
   Her ilaç için bugünden ileriye: bu dönemde kaç gün kaldı, son doz ne
   zaman, sonra ne zaman yeniden başlıyor. Yalnızca programdan hesaplanıyor
   (kalan-gun.js). Tarihlere dokununca yukarıdaki tarih o güne gidiyor ve
   o günün planlı dozları görünüyor. */
function KalanGunlerKarti({ regimen, secili, onGit }) {
  const lang = useLang();
  const locale = lang === 'tr' ? 'tr' : 'en';
  const satirlar = kalanGunler(regimen, TODAY_DATE);
  if (!satirlar.length) return null;
  const L = regimen.cycleLength || 28;
  const rGun = regimenDay(regimen, TODAY_DATE);
  const fmt = (d) => d.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' });

  const Tarih = ({ d }) => {
    const k = tarihAnahtari(d);
    const on = k === secili;
    return (
      <button onClick={() => onGit(k)} aria-pressed={on}
        style={{
          padding: '1px 7px', borderRadius: 6, border: 'none', cursor: 'pointer',
          background: on ? 'var(--accent)' : 'var(--bone)', color: on ? 'var(--ivory)' : 'var(--ink)',
          fontSize: 12, fontWeight: 600, fontFamily: 'var(--sans)', whiteSpace: 'nowrap',
        }}>{fmt(d)}</button>
    );
  };
  const satirStil = { fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.9, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0 6px' };

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
        <div className="eyebrow">{t('Days left this cycle', 'Döngüde kalan günler')}</div>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--muted)' }}>
          {t(`Day ${rGun} of ${L}`, `${L} günün ${rGun}. günü`)}
        </span>
      </div>
      <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 6px', lineHeight: 1.5 }}>
        {t('From your plan. Tap a date to see that day’s doses.', 'Programından hesaplanıyor. Bir tarihe dokun, o günün dozlarını gör.')}
      </p>
      {satirlar.map(({ med, ileri }, i) => {
        const renk = medColor(regimen, med.id);
        const ad = t(med.name, med.nameTr || med.name);
        return (
          <div key={med.id} style={{ padding: '14px 0', borderTop: i ? '1px solid var(--line-soft)' : 'none' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '10px 1fr auto', gap: 10, alignItems: 'baseline' }}>
              <span style={{ width: 10, height: 10, borderRadius: 999, background: renk, alignSelf: 'center' }}/>
              <span style={{ minWidth: 0 }}>
                <span style={{ fontFamily: 'var(--serif)', fontSize: 17 }}>{ad}</span>{' '}
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-2)' }}>{ileri.doz}</span>
              </span>
              {ileri.surekli ? (
                <span style={{ fontSize: 12.5, color: 'var(--ink-2)', fontWeight: 600 }}>{t('Every day', 'Her gün')}</span>
              ) : (
                <span style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <span style={{ fontFamily: 'var(--serif)', fontSize: 24, color: ileri.aktif ? 'var(--accent)' : 'var(--ink-2)' }}>
                    {ileri.aktif ? ileri.kalan : ileri.kalanaKadar}
                  </span>{' '}
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {ileri.aktif
                      ? t(ileri.kalan === 1 ? 'day left' : 'days left', 'gün kaldı')
                      : t(ileri.kalanaKadar === 1 ? 'day to start' : 'days to start', 'gün sonra')}
                  </span>
                </span>
              )}
            </div>

            <div style={{ paddingLeft: 20, marginTop: 4 }}>
              {ileri.surekli ? (
                <div style={satirStil}>{t('Scheduled every day of the cycle — no break.', 'Döngünün her günü planlı — ara yok.')}</div>
              ) : ileri.aktif ? (
                <>
                  <div style={satirStil}>
                    {ileri.kalan === 1 ? t('Today is the last dose', 'Bugün son doz') : t('Including today · last dose', 'Bugün dahil · son doz')}
                    {ileri.kalan > 1 && <Tarih d={ileri.sonDoz}/>}
                  </div>
                  {ileri.dozDegisimi && (
                    <div style={satirStil}>
                      {t('Dose changes', 'Doz değişiyor')} <Tarih d={ileri.dozDegisimi.tarih}/>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--ink-2)' }}>→ {ileri.dozDegisimi.doz}</span>
                    </div>
                  )}
                  <div style={satirStil}>
                    {t('Then a break · starts again', 'Sonra ara · yeniden başlıyor')} <Tarih d={ileri.sonraki}/>
                  </div>
                  {/* Bu dönemin günleri: geçenler soluk, bugün dolu, kalanlar boş */}
                  <div aria-hidden="true" style={{ display: 'flex', gap: 2, marginTop: 8 }}>
                    {Array.from({ length: ileri.donemUzunluk }, (_, j) => {
                      const g = j + 1;
                      const bg = g < ileri.donemGunu ? `color-mix(in oklch, ${renk} 35%, var(--card))`
                        : g === ileri.donemGunu ? renk : 'var(--bone)';
                      return <span key={j} style={{ flex: 1, height: 6, borderRadius: 2, background: bg,
                        boxShadow: g > ileri.donemGunu ? 'inset 0 0 0 1px var(--line-soft)' : 'none' }}/>;
                    })}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted-2)', marginTop: 4, fontFamily: 'var(--mono)' }}>
                    {t(`Day ${ileri.donemGunu} of ${ileri.donemUzunluk} in this stretch`, `${ileri.donemUzunluk} günlük dönemin ${ileri.donemGunu}. günü`)}
                  </div>
                </>
              ) : (
                <div style={satirStil}>
                  {t('On a break · starts', 'Şu an ara · başlıyor')} <Tarih d={ileri.sonraki}/>
                  {t(`· for ${ileri.sonrakiSure} days`, `· ${ileri.sonrakiSure} gün sürecek`)}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </Card>
  );
}

export { PerimMeds, BOLUMLER };
