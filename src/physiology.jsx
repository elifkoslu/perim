import { t } from './i18n';

/* physiology.jsx — ovülatuar bir döngüde hormonların gün gün normal seyri.

   KAYNAK. Eğriler, 85 normo-ovülatuar kadında (22-37 yaş) haftada ~3 kez
   örnekleme ile ölçülmüş serum medyanlarına sabitlendi; çalışma tüm döngüleri
   29 güne, ovülasyonu 15. güne normalize ediyor (Roche Elecsys, cobas e801).
   Faz bazlı 5-95 persentil aralıkları da aynı çalışmadan.
   Testosteron ayrı bir kaynaktan: 588 sağlıklı kadında LC-MS/MS ile ölçüm.
   Not: kadın düzeylerinde testosteron immünoassay'i güvenilmez; buradaki
   sayılar LC-MS/MS'e ait ve immünoassay aralıklarından belirgin düşüktür.

   BU NE DEĞİL. Bunlar "hedef" değil, bağlamdır: normal çalışan bir yumurtalığın
   ürettiği düzeyler. Hormon tedavisinin amacı bu eğriyi yeniden üretmek değil,
   en düşük etkili dozla belirtiyi kontrol etmektir — uygulama bu sayıları doz
   önerisine çevirmez. */
/* eslint-disable */

// 29 günlük referans döngü, ovülasyon 15. gün.
const REF_LEN = 29;
const REF_OV = 15;

// Estradiol, pg/mL (pmol/L ÷ 3.671)
const E2 = [32, 33, 34, 36, 40, 45, 50, 58, 68, 82, 100, 140, 200, 223, 175,
            120, 100, 105, 112, 118, 122, 120, 115, 105, 92, 78, 62, 48, 38];
// Progesteron, ng/mL (nmol/L ÷ 3.18)
const P4 = [0.1, 0.1, 0.1, 0.15, 0.15, 0.2, 0.2, 0.2, 0.25, 0.25, 0.3, 0.35, 0.45, 0.6, 1.5,
            3.5, 6.0, 8.5, 10.5, 11.8, 12.3, 12.0, 11.0, 9.5, 7.5, 5.7, 3.5, 1.8, 0.6];
// LH, IU/L
const LH = [5.5, 5.5, 5.8, 6, 6.2, 6.5, 6.8, 7, 7.2, 7.5, 8, 10, 14, 24, 20,
            9, 7, 6.5, 6.2, 6, 6, 5.9, 5.8, 5.7, 5.6, 5.5, 5.4, 5.4, 5.5];
// Total testosteron, ng/dL (nmol/L × 28.8) — döngü içi oynama küçük (~%10)
const TT = [9.2, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9, 10.0, 10.1, 10.2, 10.3, 10.4, 10.3,
            10.2, 10.1, 10.0, 10.0, 9.9, 9.9, 9.8, 9.8, 9.7, 9.6, 9.5, 9.4, 9.3, 9.2];

/* Faz bazlı 5-95 persentil. Günlük tek bir sayı ne kadar "normal"in ortası olsa da
   sağlıklı kadınlar arasındaki yayılım geniş; aralığı da taşımak şart. */
const BANDS = {
  e2: { follicular: [31, 90],  ovulatory: [60, 534], luteal: [60, 233] },
  p4: { follicular: [0.05, 0.19], ovulatory: [0.06, 4.2], luteal: [4.1, 14.6] },
  lh: { follicular: [4.8, 13.2], ovulatory: [8.1, 72.7], luteal: [2.7, 13.1] },
  tt: { follicular: [1.2, 29], ovulatory: [1.2, 29], luteal: [1.2, 29] },
};

/* Perimenopozda görülen aralık.
   Perimenopoz "hormonların yavaşça azalması" değildir: estradiol düzensizdir ve
   sıklıkla genç kadınlardan daha yüksek seyreder, progesteron ise anovulatuar
   döngüler yüzünden çöker. Aşağıdaki zarf tek bir eğri değil, bir olasılık
   alanıdır — asıl anlatan şey, aynı günde değerin nerede olabileceğinin bu kadar
   geniş olması. Tek bir kan tahlili bu yüzden perimenopozu ne teyit ne dışlar.
   Ovülatuar eğriyle aynı 29 günlük referans döngüye hizalıdır. */
const PERI = {
  e2: {
    low:  [20, 20, 22, 24, 25, 26, 28, 30, 32, 35, 38, 45, 55, 60, 55,
           45, 40, 38, 36, 34, 32, 30, 28, 26, 24, 22, 20, 18, 18],
    high: [60, 70, 85, 100, 130, 180, 240, 300, 340, 360, 380, 390, 400, 395, 370,
           330, 300, 280, 260, 240, 220, 200, 180, 160, 140, 120, 100, 85, 70],
  },
  p4: {
    low:  [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.15, 0.15, 0.2,
           0.2, 0.25, 0.3, 0.3, 0.35, 0.35, 0.35, 0.3, 0.3, 0.25, 0.2, 0.2, 0.15, 0.1],
    high: [0.3, 0.3, 0.3, 0.3, 0.35, 0.35, 0.4, 0.4, 0.45, 0.5, 0.5, 0.6, 0.7, 0.9, 1.6,
           2.6, 3.8, 5.0, 6.0, 6.6, 7.0, 6.8, 6.2, 5.2, 4.0, 2.8, 1.7, 0.9, 0.4],
  },
};

const HORMONES = [
  { key: 'e2', labKey: 'e2', unit: 'pg/mL', en: 'Estradiol',   tr: 'Estradiol',   series: E2 },
  { key: 'p4', labKey: 'p4', unit: 'ng/mL', en: 'Progesterone', tr: 'Progesteron', series: P4 },
  { key: 'lh', labKey: null, unit: 'IU/L',  en: 'LH',           tr: 'LH',          series: LH },
  { key: 'tt', labKey: 't',  unit: 'ng/dL', en: 'Testosterone', tr: 'Testosteron', series: TT },
];

function phaseOf(refDay) {
  if (refDay < REF_OV - 1) return 'follicular';
  if (refDay <= REF_OV + 1) return 'ovulatory';
  return 'luteal';
}

function phaseLabel(phase) {
  if (phase === 'follicular') return t('follicular', 'folliküler');
  if (phase === 'ovulatory') return t('ovulatory', 'ovülasyon');
  return t('luteal', 'luteal');
}

/* Kullanıcının döngü uzunluğunu referans döngüye eşler.
   Luteal faz uzunluğu kişiden kişiye pek değişmez (~14 gün); değişen folliküler
   fazdır. Bu yüzden basit orantı yerine iki parçalı eşleme yapıyoruz — yoksa
   32 günlük bir döngüde progesteron zirvesi günlerce kayardı. */
function toRefDay(cycleDay, cycleLength) {
  const L = Math.max(15, Math.min(60, Math.round(cycleLength) || 28));
  const ov = Math.max(10, L - 14);              // kullanıcının tahmini ovülasyon günü
  const d = Math.max(1, Math.min(L, Math.round(cycleDay) || 1));
  if (d <= ov) {
    // folliküler: [1..ov] → [1..15]
    return 1 + ((d - 1) / Math.max(1, ov - 1)) * (REF_OV - 1);
  }
  // luteal: [ov..L] → [15..29]
  return REF_OV + ((d - ov) / Math.max(1, L - ov)) * (REF_LEN - REF_OV);
}

// Diziden kesirli günde doğrusal ara değer
function at(series, refDay) {
  const x = Math.max(1, Math.min(REF_LEN, refDay));
  const i = Math.floor(x) - 1;
  const f = x - Math.floor(x);
  const a = series[i];
  const b = series[Math.min(REF_LEN - 1, i + 1)];
  return a + (b - a) * f;
}

const round = (v, key) => (key === 'p4' ? Math.round(v * 10) / 10 : Math.round(v));

/* Bir döngü günü için normal referans değerleri.
   → { cycleDay, refDay, phase, phaseLabel, values: [{key,label,unit,value,low,high}] } */
function referenceFor(cycleDay, cycleLength) {
  const refDay = toRefDay(cycleDay, cycleLength);
  const phase = phaseOf(refDay);
  return {
    cycleDay: Math.round(cycleDay) || 1,
    refDay,
    phase,
    phaseLabel: phaseLabel(phase),
    values: HORMONES.map(h => {
      const band = BANDS[h.key][phase];
      return {
        key: h.key,
        labKey: h.labKey,
        label: t(h.en, h.tr),
        unit: h.unit,
        value: round(at(h.series, refDay), h.key),
        low: band[0],
        high: band[1],
      };
    }),
  };
}

/* Tahlil karşılaştırması için: bir analitin, verilen döngü gününde beklenen
   aralığı. Sabit bir aralık yerine bunu kullanmak şart — estradiolün normali
   3. günde ~34, 14. günde ~223 pg/mL; tek aralık folliküler fazda çekilmiş
   tahlili yanlışlıkla "düşük" gösterir. */
function rangeForLab(labKey, cycleDay, cycleLength) {
  const h = HORMONES.find(x => x.labKey === labKey);
  if (!h) return null;
  const refDay = toRefDay(cycleDay, cycleLength);
  const phase = phaseOf(refDay);
  const band = BANDS[h.key][phase];
  return {
    low: band[0],
    high: band[1],
    typical: round(at(h.series, refDay), h.key),
    phase,
    phaseLabel: phaseLabel(phase),
    unit: h.unit,
  };
}

/* Perimenopoz zarfı, kullanıcının döngü uzunluğuna eşlenmiş alt ve üst sınır.
   Yalnızca estradiol ve progesteron için tanımlı — asıl kontrast orada. */
function bandFor(key, cycleLength) {
  const b = PERI[key];
  if (!b) return null;
  const L = Math.max(15, Math.min(60, Math.round(cycleLength) || 28));
  const low = [], high = [];
  for (let d = 1; d <= L; d++) {
    const rd = toRefDay(d, L);
    low.push(round(at(b.low, rd), key));
    high.push(round(at(b.high, rd), key));
  }
  return { low, high };
}

// Grafik için: kullanıcının döngü uzunluğuna göre 1..L günlerinin tam serisi
function curveFor(key, cycleLength) {
  const h = HORMONES.find(x => x.key === key);
  if (!h) return [];
  const L = Math.max(15, Math.min(60, Math.round(cycleLength) || 28));
  const out = [];
  for (let d = 1; d <= L; d++) out.push(round(at(h.series, toRefDay(d, L)), key));
  return out;
}

export { HORMONES, referenceFor, rangeForLab, curveFor, bandFor, toRefDay, phaseOf, phaseLabel, REF_LEN, REF_OV };
