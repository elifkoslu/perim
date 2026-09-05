import React from 'react';
import { t, useLang } from './i18n';
import { MoonDisc, moonName, moonPhase } from './screens';

/* moon.jsx — ana sayfadaki küçük "bugün gökyüzü" şeridi.

   İki katman kasten ayrı tutuluyor:

   "Bedeninde" kullanıcının kendi döngü gününden gelir — foliküler fazda
   östrojenin yükselmesi ölçülmüş bir şeydir, o cümle kişiseldir ve doğrudur.

   "Gelenekte" ayın evresine bağlıdır ve açıkça gelenek olarak etiketlenir.
   Bu ayrım süs değil: ay evresiyle döngü arasında güvenilir bir bağ
   gösterilememiştir. Clue'nun 1,5 milyon döngülük analizi korelasyon
   bulmadı; Helfrich-Förster ve ark. (Science Advances, 2021) bazı
   kadınlarda zayıf ve aralıklı bir örtüşme buldu ama bulgu tutarsızdı.
   Bu yüzden uygulama hiçbir yerde "dolunaydasın, o yüzden şişkinsin"
   demez — kullanıcıya bedeni hakkında ayın söyleyeceği bir şey yok. */

/* Ayın sekiz evresi için gelenek notu. Kaynak halk anlatısı ve sembolizm;
   fizyolojik iddia içermezler, bilerek. */
const GELENEK = {
  'New':             ['The sky is dark. Tradition reads this as a turning inward — rest, and quietly setting intentions.',
                      'Gökyüzü karanlık. Gelenek bu evreyi içe dönüş olarak okur: dinlenme ve sessizce niyet kurma zamanı.'],
  'Waxing crescent': ['The first sliver of light. Traditionally the phase of beginnings — what has just been set in motion.',
                      'İlk ışık göründü. Gelenekte başlangıçların evresi: yeni kurulmuş olan şeyin evresi.'],
  'First quarter':   ['Half lit and growing. Traditionally the phase of deciding and pushing through resistance.',
                      'Ay yarısına geldi ve büyüyor. Gelenekte karar verme ve direnci aşma evresi.'],
  'Waxing gibbous':  ['Almost full. Traditionally the phase of refining — adjusting what is nearly ready.',
                      'Dolunaya az kaldı. Gelenekte olgunlaştırma evresi: neredeyse hazır olanı ince ayarlama.'],
  'Full':            ['The brightest night. Traditionally the peak — visibility, fullness, and spilling over.',
                      'En parlak gece. Gelenekte doruk evresi: görünürlük, dolgunluk ve taşma.'],
  'Waning gibbous':  ['The light begins to withdraw. Traditionally the phase of sharing what was gathered.',
                      'Işık çekilmeye başladı. Gelenekte toplananı paylaşma ve aktarma evresi.'],
  'Last quarter':    ['Half lit and shrinking. Traditionally the phase of letting go and simplifying.',
                      'Ay yarısına indi ve küçülüyor. Gelenekte bırakma ve sadeleşme evresi.'],
  'Waning crescent': ['The last light. Traditionally the phase of rest and closing — making room for what comes next.',
                      'Son ışık. Gelenekte dinlenme ve kapanış evresi: sıradakine yer açma.'],
};

/* Döngü fazının gerçek fizyolojisi. Bunlar ayla değil, kullanıcının
   kendi döngü günüyle ilgili — tek doğru olabilecek katman bu. */
const BEDEN = {
  menstrual:  ['Estrogen and progesterone are at their lowest and the uterine lining is shedding. Low energy in these days follows that drop.',
               'Östrojen ve progesteron en düşük seviyede, rahim iç zarı dökülüyor. Bu günlerdeki düşük enerji o inişin sonucu.'],
  follicular: ['Estrogen is climbing as a follicle matures. For many people energy and mood rise along with it.',
               'Bir folikül olgunlaşırken östrojen yükseliyor. Çoğu kişide enerji ve ruh hali bu yükselişe eşlik eder.'],
  ovulation:  ['LH peaks and estrogen is at its highest. Body temperature ticks up slightly just after release.',
               'LH tepe yapıyor, östrojen en yüksek noktasında. Yumurtlamadan hemen sonra vücut ısısı hafifçe yükselir.'],
  luteal:     ['Progesterone rises and then falls toward the end. Tension, bloating and broken sleep in the last days track that fall.',
               'Progesteron yükseliyor, sonlara doğru düşüyor. Son günlerdeki gerginlik, şişkinlik ve bölünen uyku o düşüşle birlikte gider.'],
};

/* Ekrana çıkacak metinler. Faz yoksa (döngü çapası kurulmamışsa) beden
   katmanı hiç kurulmaz — uydurmak yerine susar, labNote'taki ilkeyle aynı. */
function moonNote(date, phaseKey) {
  const moon = moonPhase(date);
  const g = GELENEK[moon.name];
  const b = phaseKey && BEDEN[phaseKey];
  return {
    moon,
    ad: moonName(moon),
    isik: Math.round(moon.illum * 100),
    gelenek: g ? t(g[0], g[1]) : '',
    beden: b ? t(b[0], b[1]) : '',
  };
}

function AyDurumu({ date = new Date(), phaseKey, phaseAdi }) {
  useLang();
  const [acik, setAcik] = React.useState(false);
  const n = moonNote(date, phaseKey);

  return (
    <div style={{
      borderRadius: 'var(--r-md)', background: 'var(--bone)',
      boxShadow: 'inset 0 0 0 1px var(--line-soft)', overflow: 'hidden',
    }}>
      <button onClick={() => setAcik(a => !a)} aria-expanded={acik}
        style={{
          display: 'flex', alignItems: 'center', gap: 11, width: '100%',
          padding: '10px 14px', border: 'none', background: 'none',
          cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--sans)',
        }}>
        <MoonDisc size={26} frac={n.moon.frac}/>
        <span style={{ flex: 1, fontSize: 12.5, color: 'var(--ink)' }}>
          {n.ad}
          <span style={{ color: 'var(--muted)' }}> · {t(`${n.isik}% lit`, `%${n.isik} aydınlık`)}</span>
        </span>
        <span style={{ fontSize: 11, color: 'var(--muted-2)' }}>{acik ? '−' : '+'}</span>
      </button>

      {acik && (
        <div style={{ padding: '0 14px 13px', display: 'grid', gap: 10 }}>
          {n.beden && (
            <div>
              <div className="eyebrow" style={{ fontSize: 9.5 }}>
                {t('IN YOUR BODY', 'BEDENİNDE')}{phaseAdi ? ` · ${phaseAdi}` : ''}
              </div>
              <p style={{ fontSize: 12, color: 'var(--ink)', margin: '4px 0 0', lineHeight: 1.5 }}>{n.beden}</p>
            </div>
          )}
          <div>
            <div className="eyebrow" style={{ fontSize: 9.5 }}>{t('IN TRADITION', 'GELENEKTE')}</div>
            <p style={{ fontSize: 12, color: 'var(--ink)', margin: '4px 0 0', lineHeight: 1.5 }}>{n.gelenek}</p>
          </div>
          {/* Bu cümle bölümün varlık sebebi kadar önemli: ayın evresi
              kullanıcının bedeni hakkında bir şey söylemiyor. */}
          <p style={{ fontSize: 11, color: 'var(--muted)', margin: 0, lineHeight: 1.45 }}>
            {t('No reliable link between moon phase and the menstrual cycle has been shown. This is here for the sky and the stories, not to tell you how you should feel.',
               'Ay evresiyle regl döngüsü arasında güvenilir bir bağ gösterilmiş değil. Bu bölüm gökyüzü ve anlatı için; ne hissetmen gerektiğini söylemek için değil.')}
          </p>
        </div>
      )}
    </div>
  );
}

export { AyDurumu, moonNote, GELENEK, BEDEN };
