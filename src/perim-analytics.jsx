import React from 'react';
import { t, useLang } from './i18n';
import { DoctorSummary } from './doctor-summary';
import { symptomsFor } from './screen-content';
import {
  AdherenceMonth, LabsScreen, ScreenHead, bledOn, cycleDayFrom, cycleLenOf,
  phaseLabel, phaseOf, rateLabel, wrap,
} from './screens';
import {
  Card, ICONS, Icon, SymptomTrack, TODAY_DATE, activeMeds, regimenDay,
} from './shared';

/* perim-analytics.jsx — "Analizler": biriken kaydın ne söylediği.
   Dört blok: uyum, belirti eğilimleri, döngü geçmişi, tahliller. Altında
   hekime götürülecek rapor.

   Buradaki her sayı gerçek kayıttan geliyor. Örnek veri yok — bir grafik
   dolu görünüp aslında boşsa, o grafik yalan söylüyor demektir. */
/* eslint-disable */

const PENCERE = 30;

function gunAnahtari(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function sonGunler(n) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(TODAY_DATE); d.setDate(d.getDate() - i);
    out.push({ key: gunAnahtari(d), date: d });
  }
  return out;
}

/* 30 günlük doz uyumu: alınan / planlanan.
   Planlanmamış bir gün uyumu bozmamalı, o yüzden payda plandan geliyor. */
function uyumHesapla(lunara) {
  let planli = 0, alinan = 0;
  for (const g of sonGunler(PENCERE)) {
    const p = lunara.regimen ? activeMeds(lunara.regimen, regimenDay(lunara.regimen, g.date)).length : 0;
    const a = (lunara.doseLog || {})[g.key] ? Object.keys(lunara.doseLog[g.key]).length : 0;
    planli += p; alinan += Math.min(a, p);
  }
  return { planli, alinan, yuzde: planli > 0 ? Math.round((alinan / planli) * 100) : null };
}

// Bir belirtinin son 30 günlük gerçek serisi (kayıt yoksa null — uydurma yok)
function belirtiSerisi(lunara, key) {
  const seri = sonGunler(PENCERE).map(g => {
    const v = ((lunara.symptomLog || {})[g.key] || {})[key];
    return v == null ? null : v;
  });
  const dolu = seri.filter(v => v != null);
  if (!dolu.length) return null;
  return {
    seri: seri.map(v => (v == null ? 0 : v)),
    kayitli: dolu.length,
    ortalama: Math.round((dolu.reduce((a, b) => a + b, 0) / dolu.length) * 10) / 10,
    sonDeger: [...seri].reverse().find(v => v != null),
  };
}

/* Kanama serilerinden döngü uzunlukları. Ardışık kanama serilerinin ilk
   günleri arasındaki fark = o döngünün uzunluğu. Perimenopozda asıl
   anlatan şey ortalama değil, uzunlukların YAYILMASI. */
function dongulerHesapla(lunara) {
  const gunler = Object.keys(lunara.periodDays || {}).filter(k => lunara.periodDays[k]).sort();
  if (gunler.length < 2) return [];
  const kume = new Set(gunler);
  const baslangiclar = gunler.filter(k => {
    const d = new Date(k + 'T00:00:00'); d.setDate(d.getDate() - 1);
    return !kume.has(gunAnahtari(d));
  });
  const out = [];
  for (let i = 1; i < baslangiclar.length; i++) {
    const a = new Date(baslangiclar[i - 1] + 'T00:00:00');
    const b = new Date(baslangiclar[i] + 'T00:00:00');
    out.push({ baslangic: baslangiclar[i - 1], uzunluk: Math.round((b - a) / 86400000) });
  }
  return out;
}

function PerimAnalytics({ lunara, api, onNav }) {
  useLang();
  const uyum = uyumHesapla(lunara);
  const syms = symptomsFor(lunara.stage);
  const belirtiler = syms.map(s => ({ s, d: belirtiSerisi(lunara, s.key) })).filter(x => x.d);
  const donguler = dongulerHesapla(lunara);
  const kanamaGun = sonGunler(PENCERE).filter(g => bledOn(lunara, g.key) > 0).length;
  const [raporAcik, setRaporAcik] = React.useState(false);

  const hicVeri = uyum.planli === 0 && belirtiler.length === 0 && donguler.length === 0
    && (lunara.labPanels || []).length === 0;

  return (
    <div style={wrap}>
      <ScreenHead eyebrow={t('LAST 30 DAYS', 'SON 30 GÜN')} title={t('Analytics', 'Analizler')}/>

      {hicVeri ? (
        <Card>
          <div className="eyebrow" style={{ marginBottom: 10 }}>{t('Nothing to show yet', 'Henüz gösterilecek bir şey yok')}</div>
          <p style={{ fontFamily: 'var(--serif)', fontSize: 16, lineHeight: 1.55, color: 'var(--ink-2)', margin: 0, maxWidth: '48ch' }}>
            {t('Charts here are built from what you log — doses, symptoms, bleeding and labs. After a couple of weeks the patterns start to show.',
               'Buradaki grafikler kaydettiklerinden çıkıyor — dozlar, belirtiler, kanama ve tahliller. Birkaç hafta sonra örüntüler görünmeye başlar.')}
          </p>
        </Card>
      ) : (
        <>
          {/* Uyum */}
          {uyum.planli > 0 && <AdherenceMonth lunara={lunara} adh30={uyum.yuzde}/>}

          {/* Belirti eğilimleri */}
          {belirtiler.length > 0 && (
            <Card>
              <div className="eyebrow" style={{ marginBottom: 4 }}>{t('Symptom trends', 'Belirti eğilimleri')}</div>
              <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 16px' }}>
                {t('Only symptoms you have logged appear here.', 'Yalnızca kaydettiğin belirtiler burada görünür.')}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                {belirtiler.map(({ s, d }) => (
                  <div key={s.key} style={{ display: 'grid', gridTemplateColumns: '112px 1fr auto', gap: 14, alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 500 }}>{t(s.label, s.labelTr)}</span>
                      <span style={{ fontSize: 10.5, color: 'var(--muted-2)', fontFamily: 'var(--mono)' }}>
                        {d.kayitli} {t('days', 'gün')}
                      </span>
                    </div>
                    <SymptomTrack series={d.seri}/>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--ink-2)', textAlign: 'right' }}>
                      {t('avg', 'ort')} {d.ortalama}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Döngü geçmişi */}
          {donguler.length > 0 && <DonguGecmisi donguler={donguler}/>}

          {/* Kanama günü sayısı */}
          {kanamaGun > 0 && (
            <Card>
              <div className="eyebrow" style={{ marginBottom: 10 }}>{t('Bleeding', 'Kanama')}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span style={{ fontFamily: 'var(--serif)', fontSize: 30, lineHeight: 1 }}>{kanamaGun}</span>
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>{t('bleeding days in the last 30', 'son 30 günde kanama günü')}</span>
              </div>
            </Card>
          )}

          {/* Tahliller — kendi ekranı zaten grafikli */}
          {(lunara.labPanels || []).length > 0 && <LabsScreen lunara={lunara} api={api}/>}
        </>
      )}

      {/* Hekim raporu */}
      <Card>
        <button onClick={() => setRaporAcik(v => !v)} aria-expanded={raporAcik}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
            fontSize: 14, fontWeight: 600, color: 'var(--ink)', fontFamily: 'var(--sans)',
          }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <Icon d={ICONS.book} size={16} stroke="var(--accent)"/>
            {t('Report for your clinician', 'Hekimin için rapor')}
          </span>
          <span style={{ fontSize: 16, color: 'var(--muted)' }}>{raporAcik ? '−' : '+'}</span>
        </button>
        {raporAcik && <div style={{ marginTop: 18 }}><DoctorSummary lunara={lunara}/></div>}
      </Card>
    </div>
  );
}

/* Döngü uzunlukları. Perimenopozda asıl anlatan şey ortalama değil,
   uzunlukların yayılması — düzensizleşme tam olarak bu. */
function DonguGecmisi({ donguler }) {
  const uzunluklar = donguler.map(d => d.uzunluk);
  const enUzun = Math.max(...uzunluklar, 35);
  const ort = Math.round(uzunluklar.reduce((a, b) => a + b, 0) / uzunluklar.length);
  const kisa = Math.min(...uzunluklar);
  const uzun = Math.max(...uzunluklar);

  return (
    <Card>
      <div className="eyebrow" style={{ marginBottom: 4 }}>{t('Cycle length', 'Döngü uzunluğu')}</div>
      <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 16px', lineHeight: 1.5 }}>
        {donguler.length === 1
          ? t('One complete cycle so far. Mark bleeding days as they happen and the pattern builds.',
              'Şimdiye kadar bir tam döngü. Kanama günlerini işaretledikçe örüntü oluşuyor.')
          : t(`${donguler.length} cycles · shortest ${kisa}, longest ${uzun} days. In perimenopause the spread matters more than the average.`,
              `${donguler.length} döngü · en kısa ${kisa}, en uzun ${uzun} gün. Perimenopozda yayılma ortalamadan daha çok şey anlatır.`)}
      </p>

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 92, overflowX: 'auto', paddingBottom: 4 }}>
        {donguler.map((d, i) => (
          <div key={i} title={`${d.baslangic} · ${d.uzunluk} ${t('days', 'gün')}`}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: '1 0 26px', minWidth: 26 }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--muted-2)' }}>{d.uzunluk}</span>
            <div style={{
              width: '100%', height: Math.max(6, (d.uzunluk / enUzun) * 62), borderRadius: 4,
              background: 'var(--accent)', opacity: 0.85,
            }}/>
          </div>
        ))}
      </div>
      {donguler.length > 1 && (
        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginTop: 10 }}>
          {t('average', 'ortalama')} {ort} {t('days', 'gün')}
        </div>
      )}
    </Card>
  );
}

export { PerimAnalytics, uyumHesapla, belirtiSerisi, dongulerHesapla, PENCERE };
