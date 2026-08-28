import React from 'react';
import { I18N, t, useLang } from './i18n';
import { Card, labReadings } from './shared';
import { cycleDayFrom, phaseLabel as uygulamaFazAdi, phaseOf as uygulamaFazi } from './screens';
import { referenceFor, curveFor, bandFor } from './physiology';

/* reference-card.jsx — "bugün normalde ne olurdu" kartı.

   Ovülatuar bir döngüde o güne düşen hormon düzeylerini gösterir. Bu bir HEDEF
   değil, bağlamdır: normal çalışan bir yumurtalığın ürettiği düzeyler. Perimenopozda
   kendi değerlerin bunun hem üstünde hem altında olabilir ve gün gün değişir —
   hormon tedavisinin amacı bu eğriyi yeniden üretmek değildir. Kart bu yüzden
   hiçbir yerde doz önermez, yalnızca karşılaştırma zemini kurar. */
/* eslint-disable */

const CURVE_W = 320;
const CURVE_H = 54;

/* Tek hormonun eğrisi + bugünün noktası, istenirse perimenopoz zarfıyla.

   Zarf, ovülatuar eğriyle AYNI rengi kullanır: anlattığı şey farklı bir hormon
   değil, aynı hormonun perimenopozdaki dağılımı. Renk kimliği bu kartta
   hormona ayrılmış durumda (mavi estradiol, turuncu progesteron); zarfa ayrı
   bir renk vermek o kimliği bozardı. Ayrım kesik kenar + altındaki etiketle
   yapılıyor, yani yalnızca renge yaslanmıyor. */
function MiniCurve({ series, day, length, color, band, olculen }) {
  // Ölçülen değer eğrinin tepesini aşabilir (BHRT'de sık); eksen ona da yer açmalı,
  // yoksa nokta grafiğin dışında kalır.
  const tepe = Math.max(
    band ? Math.max(...series, ...band.high) : Math.max(...series),
    olculen ? olculen.value : 0,
  );
  const max = tepe * 1.08 || 1;
  const x = i => (i / Math.max(1, length - 1)) * CURVE_W;
  const y = v => CURVE_H - (v / max) * CURVE_H;
  const yol = (arr) => arr.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const d = yol(series);
  const idx = Math.max(0, Math.min(length - 1, day - 1));

  // Zarf: üst sınır ileri, alt sınır geri → kapalı alan
  const zarf = band
    ? yol(band.high) + ' ' + band.low.map((v, i) => `L${x(band.low.length - 1 - i).toFixed(1)},${y(band.low[band.low.length - 1 - i]).toFixed(1)}`).join(' ') + ' Z'
    : null;

  return (
    <svg viewBox={`0 0 ${CURVE_W} ${CURVE_H + 6}`} width="100%" height={CURVE_H + 6}
         preserveAspectRatio="none" aria-hidden="true" style={{ display: 'block', overflow: 'visible' }}>
      {zarf && <path d={zarf} fill={color} opacity="0.13"/>}
      {zarf && (
        <>
          <path d={yol(band.high)} fill="none" stroke={color} strokeWidth="1.25"
                strokeDasharray="4 3" opacity="0.55"/>
          <path d={yol(band.low)} fill="none" stroke={color} strokeWidth="1.25"
                strokeDasharray="4 3" opacity="0.55"/>
        </>
      )}
      {!zarf && <path d={`${d} L${CURVE_W},${CURVE_H} L0,${CURVE_H} Z`} fill={color} opacity="0.10"/>}
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
      <line x1={x(idx)} y1="0" x2={x(idx)} y2={CURVE_H} stroke="var(--ink)" strokeWidth="1" opacity="0.30"/>
      <circle cx={x(idx)} cy={y(series[idx])} r="4.5" fill={color} stroke="var(--card)" strokeWidth="2"/>
      {/* Senin ölçülen değerin: içi boş halka, dolu referans noktasından
          ayrılsın diye. Kanın alındığı döngü gününe oturuyor. */}
      {olculen && (
        <g>
          <line x1={x(olculen.idx)} y1={y(series[olculen.idx])} x2={x(olculen.idx)} y2={y(olculen.value)}
                stroke="var(--ink)" strokeWidth="1" strokeDasharray="2 2" opacity="0.45"/>
          <circle cx={x(olculen.idx)} cy={y(olculen.value)} r="5"
                  fill="var(--card)" stroke="var(--ink)" strokeWidth="2"/>
        </g>
      )}
    </svg>
  );
}

/* Bu kart "bugün normalde şu seviyelerde olurdun" diyor — döngü günü
   bilinmiyorken söyleyecek bir şeyi yok, o yüzden hiç çizilmiyor. */
function ReferenceCard({ lunara, cycleDay, altBolum }) {
  // useLang bir hook; erken çıkış ondan sonra olmalı, yoksa koşullu hook
  // çağrısı olur ve React ağacı bozulur.
  useLang();
  if (cycleDay == null) return null;
  const L = (lunara.regimen && lunara.regimen.cycleLength) || lunara.cycleLength || 28;
  const day = Math.max(1, Math.min(L, cycleDay || 1));
  const ref = referenceFor(day, L);
  const fazAdi = uygulamaFazAdi(uygulamaFazi(day, L)).toLocaleLowerCase(I18N.lang === 'tr' ? 'tr' : 'en');
  // Yalnızca iki ana hormon eğri olarak; LH ve testosteron sayı olarak yeter.
  const curves = { e2: curveFor('e2', L), p4: curveFor('p4', L) };
  const COLORS = { e2: '#2a78d6', p4: '#eb6834' };
  /* Zarf yalnızca perimenopozda anlamlı: kartın asıl anlattığı şey, kendi
     değerlerinin bu eğrinin hem üstüne hem altına çıkabildiği. */
  const periVar = lunara.stage === 'perimeno';
  const bands = periVar ? { e2: bandFor('e2', L), p4: bandFor('p4', L) } : {};

  /* Senin ölçülen değerin. "Bu seviyeye ulaşabildim mi" sorusunun tek dürüst
     cevabı tahlil sonucu; eğri yalnızca bağlam. Kan hangi döngü gününde
     alındıysa nokta oraya oturuyor — aynı değeri bugünün gününe koymak
     ölçümü olmadığı bir güne taşımak olurdu.
     Birim uyuşmuyorsa çizilmiyor: farklı birimi aynı eksene koymak yanlış
     büyüklükte bir nokta üretir. */
  const olculenler = {};
  for (const v of ref.values) {
    if (!v.labKey || !curves[v.key]) continue;
    const okumalar = labReadings(lunara.labPanels, v.labKey);
    if (!okumalar.length) continue;
    const son = okumalar[okumalar.length - 1];
    const panel = (lunara.labPanels || []).find(pn => pn.date === son.date);
    const okuma = panel && (panel.readings || []).find(r => r.key === v.labKey);
    if (okuma && okuma.unit && okuma.unit !== v.unit) continue;
    const gun = cycleDayFrom(lunara.periodStart, new Date(son.date + 'T00:00:00'), L);
    if (gun == null) continue;
    olculenler[v.key] = {
      idx: Math.max(0, Math.min(L - 1, gun - 1)),
      value: son.value,
      date: son.date,
      gun,
    };
  }

  return (
    <Card>
      <div className="eyebrow" style={{ marginBottom: 4 }}>
        {t('Normal cycle reference', 'Normal döngü referansı')}
      </div>
      {/* Cümledeki faz adı uygulamanın faz tanımından gelir (dört faz).
          physiology.phaseOf ise tahlil raporlarının üç bandını seçer
          (folliküler/ovülatuar/luteal) ve sınırları farklıdır — onu buraya
          yazınca hemen üstteki "DÖNGÜ GÜNÜ 13 · OVULASYON" ile çelişiyordu.
          Bantlar aşağıda kendi adlarıyla duruyor, orada doğru karşılık o. */}
      <p style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.55, margin: '6px 0 16px' }}>
        {t(`On day ${day} of an ovulatory cycle — ${fazAdi} phase — these are the levels a cycling ovary typically produces.`,
           `Ovülatuar bir döngünün ${day}. gününde — ${fazAdi} fazı — çalışan bir yumurtalığın tipik olarak ürettiği düzeyler.`)}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {ref.values.filter(v => curves[v.key]).map(v => (
          <div key={v.key}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, marginBottom: 4 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'var(--ink-2)' }}>
                <span style={{ width: 9, height: 9, borderRadius: 3, background: COLORS[v.key], flexShrink: 0 }}/>
                {v.label}
              </span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 15, color: 'var(--ink)' }}>
                {v.value} <span style={{ fontSize: 11, color: 'var(--muted)' }}>{v.unit}</span>
              </span>
            </div>
            <MiniCurve series={curves[v.key]} day={day} length={L} color={COLORS[v.key]} band={bands[v.key]} olculen={olculenler[v.key]}/>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted-2)', marginTop: 3 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 12, height: 2, background: COLORS[v.key], flexShrink: 0 }}/>
                {t('ovulatory', 'ovülatuar')} {v.low}–{v.high} {v.unit}
              </span>
              {olculenler[v.key] && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--ink-2)' }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--card)', boxShadow: 'inset 0 0 0 2px var(--ink)', flexShrink: 0 }}/>
                  {t('yours', 'seninki')} {olculenler[v.key].value} {v.unit} · {t('day', 'gün')} {olculenler[v.key].gun}
                </span>
              )}
              {bands[v.key] && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 12, height: 7, background: COLORS[v.key], opacity: 0.2, borderTop: `1.5px dashed ${COLORS[v.key]}`, flexShrink: 0 }}/>
                  {t('perimenopause range', 'perimenopoz aralığı')} {Math.min(...bands[v.key].low)}–{Math.max(...bands[v.key].high)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Eğrisi çizilmeyenler sayı olarak */}
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--line-soft)' }}>
        {ref.values.filter(v => !curves[v.key]).map(v => (
          <div key={v.key}>
            <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{v.label}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 14, color: 'var(--ink)' }}>
              {v.value} <span style={{ fontSize: 10.5, color: 'var(--muted)' }}>{v.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Dozlar bu kartın içine giriyor: "normalde şu seviye · sende şu ölçüldü
          · bugün şu dozu aldın" üçlüsü tek bakışta okunsun diye. Alttaki not
          üçünü birden kapsıyor — eğri hedef değil, doz kararı hekimin. */}
      {altBolum && (
        <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--line-soft)' }}>
          {altBolum}
        </div>
      )}

      <p style={{ fontSize: 11.5, color: 'var(--muted-2)', lineHeight: 1.55, margin: '16px 0 0' }}>
        {periVar
          ? t('The solid line is an ovulatory cycle; the shaded band is the range seen in perimenopause. Notice the asymmetry: estradiol often runs higher than in a young cycle and swings unpredictably, while progesterone collapses because many cycles do not ovulate. That is why a single blood test neither confirms nor rules out perimenopause — context, not a target. Dose decisions belong with your clinician.',
              'Düz çizgi ovülatuar bir döngü; gölgeli bant perimenopozda görülen aralık. Asimetriye dikkat et: estradiol genç bir döngüdekinden sık sık daha yüksek seyreder ve öngörülemez biçimde dalgalanır, progesteron ise çoğu döngüde ovülasyon olmadığı için çöker. Tek bir kan tahlilinin perimenopozu ne teyit ne de dışlamasının sebebi bu — hedef değil, bağlam. Doz kararı hekiminle birlikte verilir.')
          : t('Reference values from ovulatory cycles in healthy women — context, not a target. Hormone therapy does not aim to reproduce this curve. Dose decisions belong with your clinician.',
              'Sağlıklı kadınların ovülatuar döngülerinden alınan referans değerler — hedef değil, bağlam. Hormon tedavisi bu eğriyi yeniden üretmeyi amaçlamaz. Doz kararı hekiminle birlikte verilir.')}
      </p>
    </Card>
  );
}

export { ReferenceCard };
