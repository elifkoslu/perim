import React from 'react';
import { t } from './i18n';

/* lab-timeline.jsx — bir analitin tüm ölçümlerini zaman içinde gösterir.

   Ekran eskiden yalnızca son değerin durumunu söylüyordu ("ARALIKTA" /
   "ARALIK DIŞI") ve grafik referans aralığını hiç çizmiyordu: üç tarihte
   tahlil verilmişse bile ilk ikisinin o günkü aralığa göre nerede
   durduğu görünmüyordu.

   Referans aralığı sabit değil — hormonlarda döngü gününe bağlı, ve
   effectiveRange bunu ölçüm tarihinden hesaplıyor. Yani aynı değer bir
   tarihte aralıkta, başka tarihte aralık dışı olabilir. Bu yüzden her
   ölçüm kendi aralığıyla birlikte çiziliyor; bant tarihten tarihe
   basamaklanıyor. Tek bir "referans aralığı" çizmek, döngünün farklı
   günlerinde alınmış tahlilleri aynı cetvele vurmak olurdu. */

/* Ölçümleri kendi aralıklarıyla eşler. Aralık bilinmiyorsa (laboratuvarın
   kendi aralığıyla gelen içe aktarılmış analitler) durum uydurulmaz. */
function labSeries(reads, aralikFn) {
  return (reads || []).map(r => {
    const range = aralikFn ? aralikFn(r.date) : null;
    const durum = !range || r.value == null ? 'bilinmiyor'
      : r.value < range[0] ? 'dusuk'
      : r.value > range[1] ? 'yuksek'
      : 'aralikta';
    return { ...r, range, durum };
  });
}

const DURUM_RENK = {
  aralikta:   'var(--accent)',
  dusuk:      'var(--signal-warn)',
  yuksek:     'var(--signal-warn)',
  bilinmiyor: 'var(--muted-2)',
};

function durumEtiketi(durum) {
  return durum === 'aralikta' ? t('in range', 'aralıkta')
    : durum === 'dusuk' ? t('below range', 'aralık altı')
    : durum === 'yuksek' ? t('above range', 'aralık üstü')
    : t('no reference', 'referans yok');
}

/* Y ekseni önce değerleri kapsar, sonra elverdiği kadar aralıkları.

   Sırf aralıkları da tam kapsasın diye eksen serbest bırakıldığında
   ekran işe yaramaz hale geliyordu: ovülasyon günü alınmış tek bir
   ölçümün referansı 60–534 olduğu için eksen 500'ü aşıyor, 48→96→210
   gibi gerçek bir yükseliş grafiğin dörtte birine sıkışıyordu — oysa
   kullanıcının görmek istediği tam olarak o değişim.

   Bu yüzden aralıklar ekseni değerlerin kapladığı alanın 0.6 katından
   fazla geremez; taşan bant üstten kırpılır, ki bu da doğru okunur:
   aralık görünenin ötesine uzanıyor demektir. Tek ölçümde yayılacak bir
   değişim yok, orada aralığın tamamı gösterilir. */
const ARALIK_PAYI = 0.6;

function eksen(seri) {
  const degerler = [], sinirlar = [];
  for (const d of seri) {
    if (d.value != null) degerler.push(d.value);
    if (d.range) sinirlar.push(d.range[0], d.range[1]);
  }
  if (!degerler.length && !sinirlar.length) return null;

  if (degerler.length < 2) {
    // Yayılacak değişim yok: aralığın tamamı görünsün
    const hepsi = degerler.concat(sinirlar);
    let lo = Math.min(...hepsi), hi = Math.max(...hepsi);
    if (hi === lo) { lo -= 1; hi += 1; }
    const pay = (hi - lo) * 0.12;
    return { lo: lo - pay, hi: hi + pay };
  }

  const vlo = Math.min(...degerler), vhi = Math.max(...degerler);
  const yayilim = vhi - vlo || 1;
  const enAlt = vlo - yayilim * ARALIK_PAYI;
  const enUst = vhi + yayilim * ARALIK_PAYI;
  const rlo = sinirlar.length ? Math.min(...sinirlar) : vlo;
  const rhi = sinirlar.length ? Math.max(...sinirlar) : vhi;
  let lo = Math.max(Math.min(vlo, rlo), enAlt);
  let hi = Math.min(Math.max(vhi, rhi), enUst);
  const pay = (hi - lo) * 0.12;
  return { lo: lo - pay, hi: hi + pay };
}

function LabTimeline({ seri, unit, height = 150 }) {
  const eks = eksen(seri);
  if (!eks || !seri.length) return null;

  const W = 460, H = height, solPay = 4, ustPay = 10, altPay = 10;
  const ic = H - ustPay - altPay;
  const y = (v) => ustPay + ic - ((v - eks.lo) / (eks.hi - eks.lo)) * ic;
  const adim = seri.length > 1 ? (W - solPay * 2) / (seri.length - 1) : 0;
  const x = (i) => solPay + (seri.length > 1 ? i * adim : (W - solPay * 2) / 2);
  const yariAdim = seri.length > 1 ? adim / 2 : (W - solPay * 2) / 2;

  const noktalar = seri.filter(d => d.value != null).map(d => [x(seri.indexOf(d)), y(d.value)]);
  const cizgi = noktalar.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');

  return (
    <svg className="chart" width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none"
      style={{ display: 'block', overflow: 'visible' }} role="img"
      aria-label={t('Each reading with the reference range that applied on its date',
                    'Her ölçüm, o tarihte geçerli olan referans aralığıyla birlikte')}>
      {/* Her ölçümün kendi aralığı — tarihten tarihe basamaklanır */}
      {seri.map((d, i) => d.range && (
        <rect key={'b' + i}
          {...(() => {
            /* Kenardaki bantlar yarım adım dışarı taşıyordu: soldaki
               kırpılıyordu ama sağdaki viewBox'ın dışına çıkıp kartın
               yanına sarkıyordu (overflow görünür). İki uçtan da kes. */
            const sol = Math.max(0, x(i) - yariAdim);
            const sag = Math.min(W, x(i) + yariAdim);
            return { x: sol, width: Math.max(0, sag - sol) };
          })()}
          {...(() => {
            /* Eksen taşan aralığı kapsamıyorsa bant üstten/alttan kırpılır;
               grafiğin dışına taşıp diğer kartların üzerine binmesin. */
            const ust = Math.max(0, Math.min(H, y(d.range[1])));
            const alt = Math.max(0, Math.min(H, y(d.range[0])));
            return { y: ust, height: Math.max(1, alt - ust) };
          })()}
          fill="var(--accent-soft)" opacity="0.75"/>
      ))}
      {noktalar.length > 1 && (
        <path d={cizgi} fill="none" stroke="var(--ink-2)" strokeWidth="1.5"
          strokeLinecap="round" strokeLinejoin="round" opacity="0.55" vectorEffect="non-scaling-stroke"/>
      )}
      {seri.map((d, i) => d.value != null && (
        <circle key={'n' + i} cx={x(i)} cy={y(d.value)} r="4"
          fill={DURUM_RENK[d.durum]} stroke="var(--card)" strokeWidth="1.5"/>
      ))}
    </svg>
  );
}

/* Grafiğin altındaki döküm: kullanıcının asıl sorusu "hangi tarihte ne
   aralıktaydım" — tek tek yazılı olarak da duruyor, renge bakmak
   zorunda kalmasın diye. */
function LabTimelineRows({ seri, unit, fmtDate }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 14 }}>
      {seri.map((d, i) => (
        <div key={i} style={{
          display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 10, alignItems: 'baseline',
          fontSize: 11.5, padding: '7px 10px', borderRadius: 8, background: 'var(--bone)',
        }}>
          <span style={{ fontFamily: 'var(--mono)', color: 'var(--muted)' }}>
            {fmtDate ? fmtDate(d.date) : d.date}
          </span>
          <span style={{ color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 10.5 }}>
            {d.range ? `${t('ref', 'ref')} ${d.range[0]}–${d.range[1]}${unit ? ' ' + unit : ''}` : ''}
            {d.phaseLabel ? ` · ${d.phaseLabel}` : ''}
          </span>
          <span style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
            <span style={{ fontFamily: 'var(--serif)', fontSize: 15 }}>{d.value != null ? d.value : '—'}</span>
            <span style={{
              fontSize: 9.5, fontFamily: 'var(--mono)', letterSpacing: '0.04em',
              padding: '3px 7px', borderRadius: 999, whiteSpace: 'nowrap',
              background: d.durum === 'aralikta' ? 'var(--accent-soft)'
                : d.durum === 'bilinmiyor' ? 'var(--line-soft)' : 'var(--signal-warn)',
              color: d.durum === 'aralikta' || d.durum === 'bilinmiyor' ? 'var(--ink-2)' : 'var(--ivory)',
            }}>{durumEtiketi(d.durum).toLocaleUpperCase('tr')}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

export { labSeries, LabTimeline, LabTimelineRows, durumEtiketi, eksen };
