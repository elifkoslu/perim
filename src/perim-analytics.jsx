import React from 'react';
import { t, useLang } from './i18n';
import { DoctorSummary } from './doctor-summary';
import { symptomsFor } from './screen-content';
import {
  AdherenceMonth, LabsScreen, bledOn, cycleDayFrom, cycleLenOf,
  phaseLabel, phaseOf, rateLabel, wrap,
} from './screens';
import {
  Card, ICONS, Icon, TODAY_DATE, activeMeds, regimenDay,
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

/* Doz uyumu: alınan / planlanan.
   İki tuzak var, ikisi de kapatıldı:

   1. Planlanmamış bir gün uyumu bozmamalı — payda plandan geliyor.
   2. Takip başlamadan önceki günler sayılmamalı. Program dün eklendiyse
      30 günün 29'unda "doz kaçırılmış" görünüyordu ve uyum %2 çıkıyordu.
      Kullanıcı hata yapmadı; uygulama o günlerde henüz takip etmiyordu.
      Pencere ilk doz kaydından başlıyor. */
function uyumHesapla(lunara) {
  const gunler = sonGunler(PENCERE);
  const kayitli = Object.keys(lunara.doseLog || {}).filter(k => Object.keys(lunara.doseLog[k] || {}).length).sort();
  const ilkKayit = kayitli.length ? kayitli[0] : null;
  const pencere = ilkKayit ? gunler.filter(g => g.key >= ilkKayit) : [];

  let planli = 0, alinan = 0;
  for (const g of pencere) {
    const p = lunara.regimen ? activeMeds(lunara.regimen, regimenDay(lunara.regimen, g.date)).length : 0;
    const a = (lunara.doseLog || {})[g.key] ? Object.keys(lunara.doseLog[g.key]).length : 0;
    planli += p; alinan += Math.min(a, p);
  }
  return {
    planli, alinan, gun: pencere.length,
    yuzde: planli > 0 ? Math.round((alinan / planli) * 100) : null,
  };
}

/* Bir belirtinin son 30 günlük gerçek serisi (hiç kayıt yoksa null — uydurma yok).
   NULL'LAR KORUNUYOR: "o gün kayıt yok" ile "o gün yok olarak kaydedildi"
   aynı şey değil. İkisini de 0'a çevirmek grafiği yalancı yapardı. */
function belirtiSerisi(lunara, key) {
  const seri = sonGunler(PENCERE).map(g => {
    const v = ((lunara.symptomLog || {})[g.key] || {})[key];
    return v == null ? null : v;
  });
  const dolu = seri.filter(v => v != null);
  if (!dolu.length) return null;
  return {
    seri,
    kayitli: dolu.length,
    ortalama: Math.round((dolu.reduce((a, b) => a + b, 0) / dolu.length) * 10) / 10,
    sonDeger: [...seri].reverse().find(v => v != null),
  };
}

/* Eğilim çubuğu. Paylaşılan SymptomTrack sabit genişlikte çubuk çiziyor
   (30 gün × 9 px) ve dar ekranda karttan taşıyordu; ayrıca 0 ile "kayıt yok"u
   aynı gri noktayla gösteriyordu. Burada çubuklar esnek ve üç durum ayrı:
   kayıt yok → çok soluk iz, 0 → kısa çizgi, 1–3 → yükselen dolu çubuk. */
function EgilimCubugu({ seri }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 24, width: '100%' }}>
      {seri.map((v, i) => (
        <div key={i} style={{
          flex: 1, minWidth: 0,
          height: v == null ? 3 : 5 + v * 6,
          borderRadius: 2,
          background: v == null ? 'var(--line-soft)' : (v === 0 ? 'var(--line)' : 'var(--accent)'),
          opacity: v == null ? 1 : (v === 0 ? 1 : 0.45 + v * 0.18),
        }}/>
      ))}
    </div>
  );
}

function PerimAnalytics({ lunara, api, onNav }) {
  useLang();
  const uyum = uyumHesapla(lunara);
  const syms = symptomsFor(lunara.stage);
  const belirtiler = syms.map(s => ({ s, d: belirtiSerisi(lunara, s.key) })).filter(x => x.d);
  const kanamaGun = sonGunler(PENCERE).filter(g => bledOn(lunara, g.key) > 0).length;
  const [raporAcik, setRaporAcik] = React.useState(false);

  /* Tahlil ekranı bu koşulun dışında kaldı: kendi boş durumu var ve tahlil
     girişinin tek kapısı o. "Henüz veri yok" kartı yalnızca uyum, belirti ve
     kanama grafikleri için. */
  const hicVeri = uyum.planli === 0 && belirtiler.length === 0
    && (lunara.labPanels || []).length === 0;

  return (
    <div style={wrap}>
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
          {uyum.planli > 0 && <AdherenceMonth lunara={lunara} adh30={uyum.yuzde} gunSayisi={uyum.gun}/>}

          {/* Belirti eğilimleri */}
          {belirtiler.length > 0 && (
            <Card>
              <div className="eyebrow" style={{ marginBottom: 4 }}>{t('Symptom trends', 'Belirti eğilimleri')}</div>
              <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 16px' }}>
                {t('Only symptoms you have logged appear here. Faint marks are days with no entry.',
                   'Yalnızca kaydettiğin belirtiler burada görünür. Soluk izler kayıt olmayan günler.')}
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
                    <EgilimCubugu seri={d.seri}/>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--ink-2)', textAlign: 'right' }}>
                      {t('avg', 'ort')} {d.ortalama}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

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

        </>
      )}

      {/* Tahliller her zaman burada. Önce "kayıt varsa çiz" diye duruyordu ve
          bu kendini kilitliyordu: ekran açılmadığı için "Sonuç ekle" düğmesine
          hiç ulaşılamıyor, düğmeye ulaşılamadığı için de ilk kayıt hiç
          oluşmuyordu. Kayıt yokken örnek eğri değil, nereden gireceğini
          anlatan tek satır çıkıyor (orneksiz). */}
      <LabsScreen lunara={lunara} api={api} orneksiz/>

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
        {/* DoctorSummary ekranı kaplayan sabit bir katman (position: fixed).
            Burada onClose geçilmiyordu: "Kapat" düğmesi de arka plana
            tıklamak da hiçbir şey yapmıyordu ve katman alttaki aç/kapa
            düğmesini de örttüğü için sayfayı yenilemeden çıkış kalmıyordu.
            Saran div de işlevsizdi — çocuk fixed olduğu için marginTop
            hiçbir zaman uygulanmıyordu. */}
        {raporAcik && <DoctorSummary lunara={lunara} onClose={() => setRaporAcik(false)}/>}
      </Card>
    </div>
  );
}

export { PerimAnalytics, uyumHesapla, belirtiSerisi, PENCERE };
