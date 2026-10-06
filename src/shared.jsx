import React from 'react';
import { I18N, LangToggle, t } from './i18n';
import { cycleDayFrom, wrap } from './screens';
import { STAGES, StageChip } from './stages';

/* shared.jsx — BHRT app primitives, data, nav */
/* eslint-disable */

// ─── Sample patient data ───────────────────────────────────────
const PATIENT = {
  name: 'Maeve',
  initial: 'm',
  age: 31,
  condition: 'PCOS · hormone imbalance',
  conditionTr: 'PKOS · hormon dengesizliği',
  cycleDay: 14,
  cycleLength: 32, // PCOS = longer
  programWeek: 18,
};

// Today's prescribed doses
const DOSES_TODAY = [
  {
    id: 'e2-am',
    name: 'Estradiol',
    detail: 'Bi-est 80/20 transdermal',
    dose: '0.5 mg',
    route: 'topical',
    when: 'morning',
    time: '07:30',
    taken: true,
    takenAt: '07:42',
  },
  {
    id: 'test-am',
    name: 'Testosterone',
    detail: 'Cream, inner thigh',
    dose: '1.5 mg',
    route: 'topical',
    when: 'morning',
    time: '07:30',
    taken: true,
    takenAt: '07:42',
  },
  {
    id: 'prog-pm',
    name: 'Progesterone',
    detail: 'Oral micronized · Prometrium',
    dose: '100 mg',
    route: 'oral',
    when: 'bedtime',
    time: '22:00',
    taken: false,
  },
];

// Last 14 days symptom intensities (0-3) for trend
const SYMPTOMS = [
  { key: 'mood',    label: 'Mood',       labelTr: 'Ruh hali',  good: 'lifted',  goodTr: 'iyi',     bad: 'low',      badTr: 'düşük',    today: 1,
    series: [3,3,2,3,2,2,1,2,1,1,2,1,1,1] },
  { key: 'energy',  label: 'Energy',     labelTr: 'Enerji',    good: 'high',    goodTr: 'yüksek',  bad: 'fatigued', badTr: 'yorgun',   today: 2,
    series: [3,3,3,2,2,2,2,1,2,2,2,2,1,2] },
  { key: 'acne',    label: 'Acne',       labelTr: 'Akne',      good: 'clear',   goodTr: 'temiz',   bad: 'flaring',  badTr: 'alevli',   today: 1,
    series: [3,3,3,3,2,2,2,2,1,1,1,2,1,1] },
  { key: 'sleep',   label: 'Sleep',      labelTr: 'Uyku',      good: 'restful', goodTr: 'dinlenmiş', bad: 'broken', badTr: 'bölük',    today: 1,
    series: [2,3,3,3,2,1,2,2,1,1,1,2,1,1] },
  { key: 'cramps',  label: 'Cramps',     labelTr: 'Kramp',     good: 'none',    goodTr: 'yok',     bad: 'strong',   badTr: 'güçlü',    today: 0,
    series: [3,2,1,0,0,0,1,1,0,0,0,1,0,0] },
  { key: 'libido',  label: 'Libido',     labelTr: 'Libido',    good: 'present', goodTr: 'var',     bad: 'absent',   badTr: 'yok',      today: 2,
    series: [0,0,1,1,1,1,2,2,2,2,2,2,2,2] },
  { key: 'fog',     label: 'Brain fog',  labelTr: 'Zihin pusu', good: 'sharp',  goodTr: 'berrak',  bad: 'foggy',    badTr: 'puslu',    today: 1,
    series: [3,3,2,2,3,2,2,1,1,1,2,1,1,1] },
  { key: 'flow',    label: 'Flow',       labelTr: 'Akış',      good: '—',       goodTr: '—',       bad: 'heavy',    badTr: 'yoğun',    today: 0,
    series: [2,2,1,1,0,0,0,0,0,0,0,0,0,0] },
];

// Latest labs (with reference ranges + trend)
const LABS = [
  { key: 'e2',   name: 'Estradiol',      nameTr: 'Estradiol',           value: 87,   unit: 'pg/mL',  range: [50, 200],   status: 'in',     drawn: '2 weeks ago',
    history: [22, 28, 35, 51, 64, 78, 87], target: 80 },
  { key: 'p4',   name: 'Progesterone',   nameTr: 'Progesteron',         value: 11.4, unit: 'ng/mL',  range: [10, 25],    status: 'in',     drawn: '2 weeks ago',
    history: [0.4, 0.6, 1.2, 4.1, 8.0, 9.6, 11.4], target: 15 },
  { key: 't',    name: 'Total Testos.',  nameTr: 'Total Testosteron',   value: 42,   unit: 'ng/dL',  range: [30, 70],    status: 'in',     drawn: '2 weeks ago',
    history: [12, 18, 22, 28, 34, 38, 42], target: 50 },
  { key: 'ft',   name: 'Free T',         nameTr: 'Serbest Testosteron', value: 3.6,  unit: 'pg/mL',  range: [1.5, 6.5],  status: 'in',     drawn: '2 weeks ago',
    history: [0.9, 1.4, 1.8, 2.4, 2.9, 3.2, 3.6], target: 4.0 },
  { key: 'shbg', name: 'SHBG',           nameTr: 'SHBG',                value: 64,   unit: 'nmol/L', range: [25, 90],    status: 'in',     drawn: '2 weeks ago',
    history: [98, 92, 86, 78, 71, 67, 64], target: 55 },
  { key: 'fsh',  name: 'FSH',            nameTr: 'FSH',                 value: 5.8,  unit: 'mIU/mL', range: [3, 12],     status: 'in',     drawn: '2 weeks ago',
    history: [4.9, 5.1, 5.6, 6.0, 5.7, 5.9, 5.8], target: 6 },
];

// ── User-entered lab panels: helpers ──────────────────────────────
// A panel = { id, date:'YYYY-MM-DD', readings:[{ key, name, nameTr, unit, value }] }
function labReadings(panels, key) {
  return (panels || [])
    .map(p => { const r = (p.readings || []).find(x => x.key === key); return r ? { date: p.date, value: r.value } : null; })
    .filter(Boolean)
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}
function labHistory(panels, key) { return labReadings(panels, key).map(r => r.value); }
function labCurrent(panels, key) { const h = labReadings(panels, key); return h.length ? h[h.length - 1].value : null; }

const PROVIDER = {
  name: 'Dr. Sera Halevi, MD',
  spec: 'Reproductive endocrinology',
  specTr: 'Üreme endokrinolojisi',
  initials: 'SH',
  nextConsult: 'Wed, 3 Jun · 10:30',
  lastMsg: 'Your SHBG continues to drop nicely. Let\u2019s hold the current dose for two more weeks.',
  lastMsgAt: 'Yesterday',
  lastMsgTr: 'SHBG değerin güzel düşmeye devam ediyor. Mevcut dozu iki hafta daha koruyalım.',
  lastMsgAtTr: 'Dün',
};

const PROGRAM = {
  name: 'Hormone Restore',
  nameTr: 'Hormon Restorasyonu',
  startedAt: 'Started 17 Jan 2026',
  phase: 'Stabilization',
  phaseTr: 'Stabilizasyon',
  phaseIdx: 2, phaseTotal: 4,
  phases: ['Baseline', 'Titration', 'Stabilization', 'Maintenance'],
  adherence: 0.94,
  nextLabs: 'Fri, 5 Jun',
};

// ─── Icons (minimal stroke) ────────────────────────────────────
const Icon = ({ d, size = 18, stroke = 'currentColor', fill = 'none', sw = 1.4 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke}
       strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d={d} />
  </svg>
);
const ICONS = {
  home: 'M3 11l9-8 9 8M5 10v10h14V10',
  pulse: 'M3 12h4l3-8 4 16 3-8h4',
  vial: 'M9 3h6M10 3v8.5L5.5 18a3.5 3.5 0 005.5 4.2A3.5 3.5 0 0018.5 18L14 11.5V3',
  pill: 'M10.5 3.5a5 5 0 017 7l-7 7a5 5 0 01-7-7l7-7zM7 7l10 10',
  chat: 'M21 12a8 8 0 11-3.2-6.4L21 5l-1 4-3-1.5',
  book: 'M4 4h7a3 3 0 013 3v13M20 4h-7a3 3 0 00-3 3v13M4 4v16h7M20 4v16h-7',
  cog: 'M12 3l1.6 2.5 2.9-.7.6 2.9 2.6 1.3-1 2.8 1 2.8-2.6 1.3-.6 2.9-2.9-.7L12 21l-1.6-2.5-2.9.7-.6-2.9L4.3 15l1-2.8-1-2.8L6.9 8.1l.6-2.9 2.9.7zM12 9a3 3 0 100 6 3 3 0 000-6z',
  search: 'M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3',
  bell: 'M6 8a6 6 0 1112 0c0 7 3 8 3 8H3s3-1 3-8M10 21a2 2 0 004 0',
  plus: 'M12 5v14M5 12h14',
  check: 'M5 13l4 4L19 7',
  clock: 'M12 6v6l4 2M12 22a10 10 0 110-20 10 10 0 010 20z',
  drop: 'M12 3s6 7 6 12a6 6 0 01-12 0c0-5 6-12 6-12z',
  moon: 'M21 13A9 9 0 1111 3a7 7 0 0010 10z',
  flame: 'M12 3s4 4 4 9a4 4 0 11-8 0c0-3 2-4 2-6 0-1 2-3 2-3z',
  spark: 'M12 2v6M12 16v6M2 12h6M16 12h6M5 5l4 4M15 15l4 4M5 19l4-4M15 9l4-4',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  arrowUp: 'M12 19V5M5 12l7-7 7 7',
  arrowDown: 'M12 5v14M19 12l-7 7-7-7',
  leaf: 'M21 3c0 9-6 15-12 15-3 0-6-1-6-1s6-9 12-12c1-1 6-2 6-2zM3 21c2-8 8-12 12-13',
  brain: 'M9 4a3 3 0 00-3 3 3 3 0 00-2 5 3 3 0 002 5 3 3 0 003 3 3 3 0 003-2v-14a3 3 0 00-3 0zM15 4a3 3 0 013 3 3 3 0 012 5 3 3 0 01-2 5 3 3 0 01-3 3 3 3 0 01-3-2',
  heart: 'M12 21s-7-4.5-7-10a4.5 4.5 0 018-3 4.5 4.5 0 018 3c0 5.5-7 10-7 10z',
  ring: 'M12 22a10 10 0 110-20 10 10 0 010 20zM12 18a6 6 0 110-12 6 6 0 010 12z',
  trash: 'M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v6M14 11v6',
};

// ─── Side rail (stage-aware routes) ──────────────────────────
/* Perim tek evreli: perimenopoz. Beş bölüm, hepsi eşit seviyede.
   Profil başlıktaki avatardan açılıyor, o yüzden barda yeri yok. */
function navItemsFor() {
  return [
    { k: 'home',      icon: ICONS.moon,  label: t('Calendar', 'Takvim') },
    { k: 'meds',      icon: ICONS.pill,  label: t('Medications', 'İlaçlar') },
    { k: 'symptoms',  icon: ICONS.pulse, label: t('Symptoms', 'Belirtiler') },
    { k: 'move',      icon: ICONS.spark, label: t('Movement', 'Hareketler') },
    { k: 'analytics', icon: ICONS.vial,  label: t('Analytics', 'Analizler') },
  ];
}

function SideRail({ active = 'home', onNav, profile, stage = 'cycle' }) {
  const items = navItemsFor(stage);
  return (
    <aside style={{
      width: 220, flexShrink: 0,
      borderRight: '1px solid var(--line)',
      background: 'var(--bone)',
      display: 'flex', flexDirection: 'column',
      padding: '26px 18px',
      gap: 26,
    }}>
      {/* Wordmark — "Perim" 34px'te dar rayı taşıyordu; küçültüp sıkıştırıldı */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, paddingLeft: 2, minWidth: 0 }}>
        <Logo size={40}/>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 29, fontStyle: 'var(--display-italic)',
                      color: 'var(--ink)', letterSpacing: '-0.01em', fontWeight: 500, whiteSpace: 'nowrap' }}>
          Perim
        </div>
      </div>

      {/* Focus chip — this is a single-purpose perimenopause + BHRT app */}
      <div style={{
        padding: '11px 13px', borderRadius: 12, background: 'var(--card)',
        boxShadow: 'inset 0 0 0 1px var(--line-soft)', display: 'flex', flexDirection: 'column', gap: 3,
      }}>
        <span className="eyebrow-mono" style={{ fontSize: 9 }}>{t('YOUR FOCUS', 'ODAĞIN')}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{t('Perimenopause & BHRT', 'Perimenopoz & BHRT')}</span>
      </div>

      {/* Nav */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {items.map(item => {
          const isActive = item.k === active;
          return (
            <button
              key={item.k}
              onClick={() => onNav && onNav(item.k)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px',
                borderRadius: 10,
                fontSize: 14,
                color: isActive ? 'var(--ink)' : 'var(--muted)',
                background: isActive ? 'var(--card)' : 'transparent',
                boxShadow: isActive ? 'inset 0 0 0 1px var(--line)' : 'none',
                fontWeight: isActive ? 600 : 500,
                textAlign: 'left',
                transition: 'all 160ms ease',
              }}
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = 'var(--ink)'; }}
              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = 'var(--muted)'; }}
            >
              <Icon d={item.icon} size={17} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div style={{ flex: 1 }} />

      {/* Profile */}
      <button
        onClick={() => onNav && onNav('profile')}
        style={{
          display: 'flex', alignItems: 'center', gap: 10, width: '100%',
          padding: '12px 8px 12px', borderTop: '1px solid var(--line)',
          background: active === 'profile' ? 'var(--card)' : 'transparent',
          borderRadius: active === 'profile' ? 10 : 0,
          textAlign: 'left', cursor: 'pointer',
          transition: 'background 160ms ease',
        }}
      >
        <div style={{
          width: 34, height: 34, borderRadius: '50%',
          background: 'var(--accent-soft)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--serif)', fontSize: 15, color: 'var(--ink)', fontStyle: 'var(--display-italic)',
          flexShrink: 0,
        }}>{((profile && profile.name) ? profile.name : '·').charAt(0).toLocaleLowerCase(I18N.lang === 'tr' ? 'tr' : 'en')}</div>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2, flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{(profile && profile.name) ? profile.name : t('Your profile', 'Profilin')}</span>
          <span style={{ fontSize: 10.5, color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile ? t(profile.condition, profile.conditionTr || profile.condition) : ''}</span>
        </div>
        <Icon d={ICONS.cog} size={15} stroke="var(--muted-2)"/>
      </button>

      {/* Language */}
      <LangToggle/>
    </aside>
  );
}

// Selene mark — fine orbit + gradient crescent + sparkle (sidebar size)
/* Perim markası — çizimin kendisi.
   public/mark.png, orijinal fotoğraftan kâğıdı şeffaflaştırılarak üretildi
   (alfa = mürekkep kapsama oranı), bu yüzden her zeminde durur.
   mark-bold.png aynı görüntünün alfası gamma 0.5 ile kalınlaştırılmış hâli:
   40 px altında kalem çizgisi 1 px'in altına düşüp soluklaştığı için kullanılır.
   Vektör sürüm public/favicon.svg içinde (16 px'te raster bulanıklaşıyor). */

function Logo({ size = 28 }) {
  /* İki çizim var: 48px ve üzeri tam detaylı nokta döngüsü, altında
     indirgenmiş sürüm (kesintili halka + kalın kanat). Noktalar küçük
     boyutta okunmuyor, eşik ikon setinin kendi kuralından geliyor. */
  return (
    <img src={size < 48 ? '/mark-bold.png' : '/mark.png'} alt="Perim"
         width={size} height={size} style={{ display: 'block', flexShrink: 0 }}/>
  );
}

// ─── Persistent state (localStorage) ───────────────────────────
const LS_KEY = 'perim.v1';
// Perim adından önceki anahtarlar (yeni → eski), veri kaybolmasın diye okunur.
const LS_KEYS_LEGACY = ['womentu.v1', 'aster.v1'];
/* Depolama sağlığı. Tek kopya tarayıcıda durduğu için sessiz başarısızlık
   kullanıcının günlerce veri girip hepsini kaybetmesi demek; durum burada
   tutulup ekranda banda dönüşür (bkz. StorageBanner). */
const STORAGE = {
  writable: true,   // son yazma başarılı mı
  reason: null,     // 'quota' | 'blocked'
  recovered: null,  // bozuk kaydın yedeklendiği anahtar
  locked: false,    // bozuk kayıt yedeklenemedi: üzerine yazma yasak
  listeners: new Set(),
};
function storagePatch(patch) {
  Object.assign(STORAGE, patch);
  STORAGE.listeners.forEach(fn => fn());
}

function loadState() {
  let raw = null;
  let fromKey = LS_KEY;
  try {
    raw = localStorage.getItem(LS_KEY);
    if (!raw) {
      // Tek seferlik taşıma: eski anahtarların ilk dolu olanını al.
      for (const k of LS_KEYS_LEGACY) {
        const old = localStorage.getItem(k);
        if (old) { raw = old; fromKey = k; break; }
      }
    }
  } catch (e) {
    // localStorage tümden erişilemez (gizli mod, kapalı çerezler).
    storagePatch({ writable: false, reason: 'blocked' });
    return {};
  }
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('beklenmeyen biçim');
    if (fromKey !== LS_KEY) { try { localStorage.setItem(LS_KEY, raw); } catch (e) {} }
    return parsed;
  } catch (e) {
    /* Kayıt bozuk. Boş state ile devam edersek ilk kaydetme efekti tek
       kopyanın üzerine yazar ve veri kalıcı gider; önce ham metni ayrı bir
       anahtara kopyalayıp kullanıcıya haber veriyoruz. */
    // Güne damgalı anahtar: aynı oturumda ikinci kez okunursa (StrictMode)
    // veya aynı gün tekrarlarsa yedek çoğalmaz.
    const backup = LS_KEY + '.bozuk.' + getTodayKey();
    try {
      localStorage.setItem(backup, raw);
      storagePatch({ recovered: backup });
    } catch (e2) {
      // Yedek bile yazılamıyorsa üzerine yazmayı göze alamayız: yazmayı kilitle,
      // böylece bozuk ama belki kurtarılabilir kayıt yerinde kalır.
      storagePatch({ writable: false, reason: 'quota', recovered: null, locked: true });
    }
    return {};
  }
}

// State'i diske yazar; başarısızlığı yutmaz, STORAGE üzerinden bildirir.
function persist(state) {
  if (STORAGE.locked) return false;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
    if (!STORAGE.writable) storagePatch({ writable: true, reason: null });
    return true;
  } catch (e) {
    const quota = e && (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014);
    storagePatch({ writable: false, reason: quota ? 'quota' : 'blocked' });
    return false;
  }
}
/* İşaretli kanama günlerinin en son kesintisiz serisinin ilk günü.
   Tarihler 'YYYY-MM-DD' olduğu için sözlük sırası = zaman sırası. */
function sonKanamaBasi(gunler) {
  const sirali = Object.keys(gunler || {}).filter(k => gunler[k]).sort();
  if (sirali.length === 0) return null;
  const kume = new Set(sirali);
  let bas = sirali[sirali.length - 1];
  for (;;) {
    const d = new Date(bas + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    const onceki = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    if (!kume.has(onceki)) return bas;
    bas = onceki;
  }
}

/* ── Kanama: tek kaynak ────────────────────────────────────────
   Belirtilerdeki kanama (düzenli döngüde "Akış" = flow, perimenopozda
   "Kanama" = cycle) eskiden symptomLog'a yazılıyordu; regl başlangıcı
   (periodStart) ve takvimdeki regl günleri ise periodDays'ten geliyordu.
   Belirtilerden girilen kanama çapayı güncellemiyor, takvime ancak kısmen
   yansıyordu. Artık bu iki anahtarın değeri yalnız periodDays'te (0–3
   yoğunluk; true = yoğunluksuz işaret, "Orta" sayılır — bledOn kuralı).

   Doğum sonrası kanama ("bleeding") BİLEREK dışarıda: lohusa kanaması
   regl değil. periodDays'e yazılsa döngü başlangıcı ondan hesaplanırdı. */
const KANAMA_ANAHTARLARI = ['flow', 'cycle'];

function kanamaDegeri(v) {
  if (v === true) return 2;
  return typeof v === 'number' ? v : null;
}

// Belirti ekranlarının gördüğü günlük kayıt: symptomLog + periodDays'ten kanama.
function gunlukLog(lunara) {
  const out = { ...((lunara && lunara.symptomLog) || {}) };
  for (const [gun, v] of Object.entries((lunara && lunara.periodDays) || {})) {
    const d = kanamaDegeri(v);
    if (d == null) continue;
    const ek = {}; for (const k of KANAMA_ANAHTARLARI) ek[k] = d;
    out[gun] = { ...(out[gun] || {}), ...ek };
  }
  return out;
}

/* Belirtilerden kanama yazmak. 0 ("Yok") açık kayıt olarak kalıyor; yanlış-
   değerli olduğu için kanama sayılmıyor. Çapa kuralı takvime dokunmakla
   (togglePeriodDay) aynı. */
function kanamaAyikla(kayit) {
  const kalan = { ...kayit };
  for (const k of KANAMA_ANAHTARLARI) delete kalan[k];
  return kalan;
}
/* symptomLog'da bu anahtarlar hiç kalmıyor: bledOn periodDays'te işaret yoksa
   onlara geri düşüyor, eski bir "Kanama: Çok" sonradan girilen "Yok"u ezerdi. */
function akisYaz(s, gun, deger) {
  const gunler = { ...(s.periodDays || {}), [gun]: deger };
  const log = { ...(s.symptomLog || {}) };
  if (log[gun]) log[gun] = kanamaAyikla(log[gun]);
  // Kanama puanı girilen gün lekelenme değil (ya da "Yok"): iki kayıt çakışmasın
  const leke = { ...(s.lekeGunleri || {}) };
  delete leke[gun];
  return { ...s, periodDays: gunler, symptomLog: log, lekeGunleri: leke, periodStart: sonKanamaBasi(gunler) || s.periodStart };
}

/* ── Regl mi, lekelenme mi ────────────────────────────────────────
   Takvimde bir güne dokunmak eskiden her zaman "regl günü" demekti: çapa
   işaretli günlerin son serisinin ilk günü olduğu için perimenopozda / BHRT
   altında sık görülen az bir ara kanama döngüyü o günden yeniden başlatıyor,
   sonraki günler menstrüel faza boyanıyordu. Lekelenme artık ayrı tutuluyor
   (lekeGunleri) ve döngüye hiç karışmıyor; bledOn, faz, çapa onu görmüyor.

   tur: 'regl' | 'leke' | null (kaldır). Bir gün ya regl ya lekelenme.
   Çapa her zaman kalan regl günlerinden yeniden hesaplanıyor — yanlışlıkla
   regl işaretlenmiş bir lekelenme düzeltilince çapa önceki gerçek regle
   döner. Hiç regl günü kalmazsa ve çapa tam bu günse çapa bilinmiyor olur
   (eski bir tarihi uydurmaktansa). */
function kanamaTuruYaz(s, gun, tur) {
  const gunler = { ...(s.periodDays || {}) };
  const leke = { ...(s.lekeGunleri || {}) };
  delete leke[gun];
  if (tur === 'regl') { if (!gunler[gun]) gunler[gun] = true; }
  else delete gunler[gun];
  if (tur === 'leke') leke[gun] = true;
  const bas = sonKanamaBasi(gunler);
  const periodStart = bas || (s.periodStart === gun ? null : s.periodStart);
  return { ...s, periodDays: gunler, lekeGunleri: leke, periodStart };
}

/* Eski symptomLog kanama kayıtlarını açılışta bir kez periodDays'e taşı.
   Takvimde o gün zaten bir işaret varsa ona dokunulmuyor. Çapa, takvime
   dokunmakla aynı kurala göre yeniden hesaplanıyor: belirtilerden girilmiş
   kanama takvimdeki son başlangıçtan yeniyse çapa ona kayar. */
function akisTasi(saved) {
  if (!saved || !saved.symptomLog) return saved;
  const gunler = { ...(saved.periodDays || {}) };
  const log = {};
  let degisti = false;
  for (const [gun, kayit] of Object.entries(saved.symptomLog)) {
    if (!kayit || typeof kayit !== 'object') { log[gun] = kayit; continue; }
    const k = KANAMA_ANAHTARLARI.find(a => a in kayit);
    if (k === undefined) { log[gun] = kayit; continue; }
    degisti = true;
    if (!(gun in gunler) && typeof kayit[k] === 'number') gunler[gun] = kayit[k];
    log[gun] = kanamaAyikla(kayit);
  }
  if (!degisti) return saved;
  return { ...saved, periodDays: gunler, symptomLog: log, periodStart: sonKanamaBasi(gunler) || saved.periodStart || null };
}

function useLunara() {
  const [state, setState] = React.useState(() => {
    const saved = akisTasi(loadState());
    return {
      // dose id -> ISO time taken (or false) — legacy, regimen/doseLog is canonical
      doses: saved.doses || {},
      // 'YYYY-MM-DD' -> { symptomKey: 0..3 }
      symptomLog: saved.symptomLog || {},
      // ISO date string of last period start (defaults to today = cycle day 1
      // until the user sets it in onboarding or on the cycle screen)
      // Çapa YOK demek "bilinmiyor" demek. Eskiden bugüne düşüyordu ve
      // kullanıcı hiçbir şey girmemişken uygulama döngünün 1. günü olduğunu
      // iddia ediyordu.
      periodStart: saved.periodStart || null,
      // 'YYYY-MM-DD' -> true  (gerçekleşen kanama günleri; periodStart bunların
      // en son serisinin ilk gününden türetilir)
      periodDays: saved.periodDays || {},
      // 'YYYY-MM-DD' -> true  (lekelenme / ara kanama — döngüyü başlatmaz)
      lekeGunleri: saved.lekeGunleri || {},
      // journal notes [{ id, at, text }]
      notes: saved.notes || [],
      // 'YYYY-MM-DD' -> { stepIdx: true }  (workout step completion)
      workoutLog: saved.workoutLog || {},
      // 'YYYY-MM-DD' -> { long: n, quick: n }  (pelvic-floor / Kegel sets done)
      kegelLog: saved.kegelLog || {},
      // exercise ids the user chose for their own strength routine
      routine: saved.routine || [],
      // 'YYYY-MM-DD' -> { exId: true }  (routine exercises done that day)
      routineDone: saved.routineDone || {},
      // 'YYYY-MM-DD' -> jump count (bone-loading daily jumps)
      jumpLog: saved.jumpLog || {},
      // 'YYYY-MM-DD' -> [{ id, at, text }]  (food journal)
      mealLog: saved.mealLog || {},
      // 'YYYY-MM-DD' -> protein grams eaten (daily counter)
      proteinLog: saved.proteinLog || {},
      // 'YYYY-MM-DD' -> [{ id, at, ml }]  (su içme kaydı)
      waterLog: saved.waterLog || {},
      // user's supplements [{ id, name, dose, when }] — starts empty
      supplements: saved.supplements || [],
      // 'YYYY-MM-DD' -> { suppId: time }  (supplement taken log)
      suppLog: saved.suppLog || {},
      // cyclic medication regimen — each med active on cycle days [startDay..endDay].
      // Starts EMPTY: medication must be entered by the user (or their clinician),
      // never pre-seeded in a health app.
      regimen: {
        cycleLength: 28,
        anchor: saved.periodStart || getTodayKey(),  // date that counts as day 1
        meds: [],
        ...(saved.regimen || {}),
      },
      // 'YYYY-MM-DD' -> { medId: time }  (dose taken log, date-scoped)
      doseLog: saved.doseLog || {},
      // editable user profile + preferences
      profile: {
        name: '',
        condition: '',
        conditionTr: '',
        age: '',
        email: '',
        reminders: true,
        cycleAlerts: true,
        labReminders: true,
        emailUpdates: false,
        ...(saved.profile || {}),
      },
      // life stage (Do..Si) + whether onboarding was completed
      stage: saved.stage || 'perimeno',
      onboarded: saved.onboarded !== undefined ? saved.onboarded : false,
      // TTC (gebe kalma) logs: 'YYYY-MM-DD' -> value
      ttc: { bbt: {}, lh: {}, intimacy: {}, ...(saved.ttc || {}) },
      // Pregnancy (gebelik): due date + logs
      /* dueDate/weightKg burada sabit örnek değerlerdi ('2026-10-08', 68)
         ve dueDate'i yazan hiçbir yer yok. Doktor özeti bunlardan gebelik
         haftası, trimester ve tahmini doğum tarihi üretiyordu: gebelik
         evresini seçen herkes hekimine kendi girmediği bir tarihi
         götürüyordu. Alanlar artık boş başlıyor; özet satırları zaten
         "if (pg.dueDate)" ile korumalı, veri yoksa kurulmuyorlar. */
      pregnancy: {
        dueDate: null,
        weightKg: null,
        kicks: {},               // 'YYYY-MM-DD' -> count
        ...(saved.pregnancy || {}),
      },
      // Postpartum (doğum sonrası): birth date + logs
      /* birthDate de sabit örnekti ve yazanı yok — aynı kusur. */
      postpartum: {
        birthDate: null,
        feeds: {},               // 'YYYY-MM-DD' -> count
        mood: {},                // 'YYYY-MM-DD' -> 1..5
        epds: [],                // EPDS results [{ id, date, score, q10, answers }]
        ...(saved.postpartum || {}),
      },
      /* Menopoz: son regl tarihi.

         Burada sabit bir '2024-03-01' duruyordu ve bu alanı yazan hiçbir
         ekran yok. Doktor özeti "mp.lastPeriod || periodStart" diye
         okuduğu için alan hiçbir zaman boş kalmıyor, takvimden gelen
         gerçek tarihe hiç düşmüyordu: kullanıcı takvimde son adetini
         işaretlese bile hekime giden belgede Mart 2024 ve "30 ay" yazıyordu.
         Klinik olarak da yanlış sinyal — 30 ay adetsizlik postmenopoz demek. */
      menopause: { ...(saved.menopause || {}) },
      // User-entered lab panels: [{ id, date, readings:[{key,name,nameTr,unit,value}] }]
      labPanels: saved.labPanels || [],
      // Son yedek zamanı — yedek hatırlatması bundan hesaplanıyor
      lastExportAt: saved.lastExportAt || null,
      // BHRT titration log: [{ id, date, med, from, to, reason, note }]
      titration: saved.titration || [],
    };
  });
  React.useEffect(() => { persist(state); }, [state]);
  const api = React.useMemo(() => ({
    toggleDose: (id, time) => setState(s => ({
      ...s, doses: { ...s.doses, [id]: s.doses[id] ? false : (time || nowHM()) },
    })),
    logSymptom: (dateKey, key, val) => setState(s => ({
      ...s, symptomLog: { ...s.symptomLog, [dateKey]: { ...(s.symptomLog[dateKey] || {}), [key]: val } },
    })),
    // "Regl bugün başladı" hem çapayı taşır hem o günü kanama olarak işaretler —
    // aksi hâlde takvimde beklenen kanama görünür, gerçekleşen görünmezdi.
    setPeriodStart: (iso) => setState(s => ({
      ...s, periodStart: iso, periodDays: { ...(s.periodDays || {}), [iso]: true },
    })),
    // Takvimde bir günü kanama olarak işaretler/kaldırır. Döngü günü hesabının
    // çapası, işaretli günlerin en son kesintisiz serisinin ilk günüdür: kullanıcı
    // geçmişi düzelttiğinde döngü günü kendiliğinden düzelsin diye türetiliyor.
    setFlow: (dateKey, deger) => setState(s => akisYaz(s, dateKey, deger)),
    kanamaIsaretle: (dateKey, tur) => setState(s => kanamaTuruYaz(s, dateKey, tur)),
    togglePeriodDay: (dateKey) => setState(s => {
      const gunler = { ...(s.periodDays || {}) };
      if (gunler[dateKey]) delete gunler[dateKey]; else gunler[dateKey] = true;
      return { ...s, periodDays: gunler, periodStart: sonKanamaBasi(gunler) || s.periodStart };
    }),
    /* ── Silme ────────────────────────────────────────────────────
       Girilen her şeyin geri alınabilmesi gerekiyor: deneme amaçlı bir
       kayıt yüzünden uygulamayı sıfırlamak zorunda kalmak kabul edilemez.
       Aşağıdakiler eksik olan silme yollarıydı. */
    // Günlük notu sil — eskiden not eklenebiliyordu ama silinemiyordu
    removeNote: (id) => setState(s => ({
      ...s, notes: (s.notes || []).filter(n => n.id !== id),
    })),
    // Bir günün tüm belirti kayıtlarını temizle. logSymptom(…, 0) girdiyi
    // sıfırlıyor ama günü "kayıt var" saymaya devam ediyordu.
    clearSymptomDay: (dateKey) => setState(s => {
      const log = { ...(s.symptomLog || {}) };
      delete log[dateKey];
      return { ...s, symptomLog: log };
    }),
    // Pelvik taban setlerini sıfırla (jumpLog/proteinLog'da karşılığı vardı)
    resetKegel: (dateKey) => setState(s => {
      const log = { ...(s.kegelLog || {}) };
      delete log[dateKey];
      return { ...s, kegelLog: log };
    }),
    // Bir günün alınan doz kayıtlarını temizle
    clearDoseDay: (dateKey) => setState(s => {
      const log = { ...(s.doseLog || {}) };
      delete log[dateKey];
      return { ...s, doseLog: log };
    }),
    // Bir günün hareket adımlarını temizle
    clearWorkoutDay: (dateKey) => setState(s => {
      const log = { ...(s.workoutLog || {}) };
      delete log[dateKey];
      return { ...s, workoutLog: log };
    }),
    // Kendi kurduğun kuvvet rutinini tamamen kaldır
    clearRoutine: () => setState(s => ({ ...s, routine: [], routineDone: {} })),

    addNote: (text) => setState(s => ({
      ...s, notes: [{ id: Date.now(), at: nowHM(), text }, ...s.notes],
    })),
    toggleWorkoutStep: (dateKey, idx) => setState(s => {
      const day = { ...(s.workoutLog[dateKey] || {}) };
      if (day[idx]) delete day[idx]; else day[idx] = true;
      return { ...s, workoutLog: { ...s.workoutLog, [dateKey]: day } };
    }),
    setWorkoutAll: (dateKey, idxList, done) => setState(s => {
      const day = done ? Object.fromEntries(idxList.map(i => [i, true])) : {};
      return { ...s, workoutLog: { ...s.workoutLog, [dateKey]: day } };
    }),
    // Log a completed pelvic-floor (Kegel) set: kind = 'long' | 'quick'
    logKegel: (dateKey, kind) => setState(s => {
      const day = { ...((s.kegelLog || {})[dateKey] || {}) };
      day[kind] = (day[kind] || 0) + 1;
      return { ...s, kegelLog: { ...(s.kegelLog || {}), [dateKey]: day } };
    }),
    // Add/remove an exercise from the user's own routine
    toggleRoutineEx: (id) => setState(s => {
      const cur = s.routine || [];
      return { ...s, routine: cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id] };
    }),
    // Mark a routine exercise done / not done for a given day
    toggleRoutineDone: (dateKey, id) => setState(s => {
      const day = { ...((s.routineDone || {})[dateKey] || {}) };
      if (day[id]) delete day[id]; else day[id] = true;
      return { ...s, routineDone: { ...(s.routineDone || {}), [dateKey]: day } };
    }),
    // Add jumps to a day's count (clamped at 0)
    addJumps: (dateKey, n) => setState(s => {
      const cur = (s.jumpLog || {})[dateKey] || 0;
      return { ...s, jumpLog: { ...(s.jumpLog || {}), [dateKey]: Math.max(0, cur + n) } };
    }),
    resetJumps: (dateKey) => setState(s => {
      const jl = { ...(s.jumpLog || {}) }; delete jl[dateKey];
      return { ...s, jumpLog: jl };
    }),
    /* ── Su kaydı ────────────────────────────────────────────────
       Her yudum bir kayıt: { id, at, ml }. Gün toplamı bunların toplamıdır,
       "kaç kez içtim" ise kayıt sayısıdır — hedef altı kez içmek olduğu için
       ikisini de tutmak gerekiyor. Tek bir sayaç tutsaydık geçmişe dönüp
       "saat 14'te 300 ml içmiştim" diye düzeltmek mümkün olmazdı. */
    addWater: (dateKey, ml, at) => setState(s => {
      const gun = [...((s.waterLog || {})[dateKey] || [])];
      gun.push({ id: 'su-' + Date.now(), at: at || nowHM(), ml: Math.max(1, numOrNull(ml) || 250) });
      gun.sort((a, b) => (a.at < b.at ? -1 : 1));
      return { ...s, waterLog: { ...(s.waterLog || {}), [dateKey]: gun } };
    }),
    removeWater: (dateKey, id) => setState(s => {
      const gun = ((s.waterLog || {})[dateKey] || []).filter(x => x.id !== id);
      const wl = { ...(s.waterLog || {}) };
      if (gun.length) wl[dateKey] = gun; else delete wl[dateKey];
      return { ...s, waterLog: wl };
    }),
    updateWater: (dateKey, id, patch) => setState(s => {
      const gun = ((s.waterLog || {})[dateKey] || []).map(x => {
        if (x.id !== id) return x;
        const n = { ...x };
        if ('ml' in patch) n.ml = Math.max(1, numOrNull(patch.ml) || x.ml);
        if ('at' in patch && patch.at) n.at = patch.at;
        return n;
      });
      gun.sort((a, b) => (a.at < b.at ? -1 : 1));
      return { ...s, waterLog: { ...(s.waterLog || {}), [dateKey]: gun } };
    }),

    // Food journal: add/remove a meal entry for a day
    addMeal: (dateKey, text) => setState(s => {
      const day = [...((s.mealLog || {})[dateKey] || []), { id: 'meal-' + Date.now(), at: nowHM(), text }];
      return { ...s, mealLog: { ...(s.mealLog || {}), [dateKey]: day } };
    }),
    removeMeal: (dateKey, id) => setState(s => {
      const day = ((s.mealLog || {})[dateKey] || []).filter(m => m.id !== id);
      const ml = { ...(s.mealLog || {}) };
      if (day.length) ml[dateKey] = day; else delete ml[dateKey];
      return { ...s, mealLog: ml };
    }),
    // Protein counter: add grams to a day (clamped at 0)
    addProtein: (dateKey, n) => setState(s => {
      const cur = (s.proteinLog || {})[dateKey] || 0;
      return { ...s, proteinLog: { ...(s.proteinLog || {}), [dateKey]: Math.max(0, cur + n) } };
    }),
    resetProtein: (dateKey) => setState(s => {
      const pl = { ...(s.proteinLog || {}) }; delete pl[dateKey];
      return { ...s, proteinLog: pl };
    }),
    toggleSupp: (dateKey, id, time) => setState(s => {
      const day = { ...(s.suppLog[dateKey] || {}) };
      if (day[id]) delete day[id]; else day[id] = time || nowHM();
      return { ...s, suppLog: { ...s.suppLog, [dateKey]: day } };
    }),
    addSupp: (supp) => setState(s => ({
      ...s, supplements: [...s.supplements, { id: 'supp-' + Date.now(), when: 'morning', ...supp }],
    })),
    removeSupp: (id) => setState(s => ({
      ...s, supplements: s.supplements.filter(x => x.id !== id),
    })),
    updateProfile: (patch) => setState(s => ({
      ...s, profile: { ...s.profile, ...patch },
    })),
    setStage: (stage) => setState(s => ({ ...s, stage, onboarded: true })),
    setOnboarded: (v) => setState(s => ({ ...s, onboarded: v })),
    logBBT: (dateKey, temp) => setState(s => ({ ...s, ttc: { ...s.ttc, bbt: { ...s.ttc.bbt, [dateKey]: temp } } })),
    setLH: (dateKey, level) => setState(s => {
      const lh = { ...s.ttc.lh };
      if (lh[dateKey] === level) delete lh[dateKey]; else lh[dateKey] = level;
      return { ...s, ttc: { ...s.ttc, lh } };
    }),
    toggleIntimacy: (dateKey) => setState(s => {
      const im = { ...s.ttc.intimacy };
      if (im[dateKey]) delete im[dateKey]; else im[dateKey] = true;
      return { ...s, ttc: { ...s.ttc, intimacy: im } };
    }),
    markExported: () => setState(s => ({ ...s, lastExportAt: new Date().toISOString() })),
    logWeight: (kg) => setState(s => ({ ...s, pregnancy: { ...s.pregnancy, weightKg: kg } })),
    addKick: (dateKey) => setState(s => ({ ...s, pregnancy: { ...s.pregnancy, kicks: { ...s.pregnancy.kicks, [dateKey]: (s.pregnancy.kicks[dateKey] || 0) + 1 } } })),
    resetKicks: (dateKey) => setState(s => {
      const k = { ...s.pregnancy.kicks }; delete k[dateKey];
      return { ...s, pregnancy: { ...s.pregnancy, kicks: k } };
    }),
    addFeed: (dateKey) => setState(s => ({ ...s, postpartum: { ...s.postpartum, feeds: { ...s.postpartum.feeds, [dateKey]: (s.postpartum.feeds[dateKey] || 0) + 1 } } })),
    resetFeeds: (dateKey) => setState(s => {
      const f = { ...s.postpartum.feeds }; delete f[dateKey];
      return { ...s, postpartum: { ...s.postpartum, feeds: f } };
    }),
    setMood: (dateKey, level) => setState(s => ({ ...s, postpartum: { ...s.postpartum, mood: { ...s.postpartum.mood, [dateKey]: level } } })),
    addEpds: (entry) => setState(s => ({ ...s, postpartum: { ...s.postpartum, epds: [{ id: 'epds-' + Date.now(), ...entry }, ...(s.postpartum.epds || [])] } })),
    removeEpds: (id) => setState(s => ({ ...s, postpartum: { ...s.postpartum, epds: (s.postpartum.epds || []).filter(e => e.id !== id) } })),
    // ── cyclic regimen ──
    addMed: (med) => setState(s => ({
      ...s, regimen: { ...s.regimen, meds: [...s.regimen.meds, {
        id: 'med-' + Date.now(), route: 'oral', when: 'morning', time: '08:00',
        startDay: 1, endDay: s.regimen.cycleLength, ...med,
      }] },
    })),
    updateMed: (id, patch) => setState(s => ({
      ...s, regimen: { ...s.regimen, meds: s.regimen.meds.map(m => m.id === id ? { ...m, ...patch } : m) },
    })),
    removeMed: (id) => setState(s => ({
      ...s, regimen: { ...s.regimen, meds: s.regimen.meds.filter(m => m.id !== id) },
    })),
    setRegimenCycle: (n) => setState(s => ({
      ...s, regimen: { ...s.regimen, cycleLength: Math.max(1, Math.min(60, n)) },
    })),
    setRegimenAnchor: (iso) => setState(s => ({
      ...s, regimen: { ...s.regimen, anchor: iso },
    })),
    toggleMed: (dateKey, id, time, amount, unit) => setState(s => {
      const day = { ...(s.doseLog[dateKey] || {}) };
      if (day[id]) delete day[id];
      else day[id] = { at: time || nowHM(), amount: numOrNull(amount), unit: unit || '' };
      return { ...s, doseLog: { ...s.doseLog, [dateKey]: day } };
    }),
    // Alınan gerçek miktarı sonradan düzeltmek için (reçetedekinden farklı olabilir).
    /* Kaydedilmiş bir dozun ayrıntılarını düzeltir: alınan miktar ve alınma
       saati. Geçmiş bir güne işaret koyarken saat özellikle önemli — kayıt
       anındaki saat, ilacın gerçekten alındığı saat değildir. */
    updateDose: (dateKey, id, patch) => setState(s => {
      const day = { ...(s.doseLog[dateKey] || {}) };
      const cur = doseEntry(day[id]);
      if (!cur) return s;                       // alınmamış doza ayrıntı yazılmaz
      const next = { ...cur };
      if ('amount' in patch) next.amount = numOrNull(patch.amount);
      if ('unit' in patch) next.unit = patch.unit || cur.unit || '';
      if ('at' in patch && patch.at) next.at = patch.at;
      day[id] = next;
      return { ...s, doseLog: { ...s.doseLog, [dateKey]: day } };
    }),
    // ── BHRT titration log ──
    addTitration: (entry) => setState(s => ({
      ...s, titration: [{ id: 'tit-' + Date.now(), ...entry }, ...(s.titration || [])],
    })),
    removeTitration: (id) => setState(s => ({
      ...s, titration: (s.titration || []).filter(x => x.id !== id),
    })),
    // ── lab panels ──
    addLabPanel: (panel) => setState(s => ({
      ...s, labPanels: [{ id: 'lab-' + Date.now(), ...panel }, ...(s.labPanels || [])],
    })),
    removeLabPanel: (id) => setState(s => ({
      ...s, labPanels: (s.labPanels || []).filter(p => p.id !== id),
    })),
  }), []);
  return [state, api];
}
function nowHM() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}
// Doz/zaman etiketi yerelleştirme
const WHEN_TR = { morning: 'sabah', midday: 'öğle', evening: 'akşam', bedtime: 'yatmadan', night: 'gece' };
function whenLabel(w) {
  return (typeof I18N !== 'undefined' && I18N.lang === 'tr') ? (WHEN_TR[w] || w) : w;
}
// Gerçek bugünün tarihi (her yükleme anında)
function getTodayKey() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}
const TODAY_KEY = getTodayKey();
// Gece yarısına sabitli: gün sayan hesaplar (Math.round'lu fark) saat ilerledikçe kaymasın.
const TODAY_DATE = new Date(TODAY_KEY + 'T00:00:00');

// Which regimen cycle day is `today` (1..cycleLength)
function regimenDay(regimen, today = TODAY_DATE) {
  const L = (regimen && regimen.cycleLength) || 28;
  const anchor = new Date(((regimen && regimen.anchor) || getTodayKey()) + 'T00:00:00');
  /* Takvim günü farkı. Saat taşıyan tarih (hatırlatıcının `now`u) önce o
     günün gece yarısına indiriliyor; sonra round — floor değil: yaz saatine
     geçilen gece 23 saat sürer ve floor o günden sonraki her tarihi bir gün
     geri atardı (ileri tarih önizlemesi bu geçişi aşabiliyor). */
  const gun = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const d = Math.round((gun - anchor) / 86400000);
  return ((d % L) + L) % L + 1;
}
// Meds active on a given cycle day (supports wrap-around ranges)
/* Bir ilacın gün aralıkları.
   Eski kayıtlarda tek aralık vardı (startDay/endDay/dose). Yeni kayıtlarda
   med.schedule birden çok aralık taşıyabilir ve her aralığın kendi dozu olur —
   fazına göre değişen doz için (ör. folliküler fazda 0.5 mg, luteal fazda
   0.75 mg estradiol). Okuyan her yer buradan geçsin ki iki biçim de çalışsın. */
function medSchedule(med) {
  if (med && Array.isArray(med.schedule) && med.schedule.length) {
    return med.schedule.map(s => ({
      startDay: s.startDay,
      endDay: s.endDay,
      dose: s.dose != null && s.dose !== '' ? s.dose : med.dose,
    }));
  }
  return [{ startDay: med.startDay, endDay: med.endDay, dose: med.dose }];
}

// Aralık bu günü kapsıyor mu? (döngü sonundan başına sarabilir)
function slotCovers(slot, day) {
  if (slot.startDay <= slot.endDay) return day >= slot.startDay && day <= slot.endDay;
  return day >= slot.startDay || day <= slot.endDay;
}

// O güne düşen aralık; hiçbiri kapsamıyorsa null
function medSlotFor(med, day) {
  return medSchedule(med).find(s => slotCovers(s, day)) || null;
}

function activeMeds(regimen, day) {
  if (!regimen || !regimen.meds) return [];
  const out = [];
  for (const m of regimen.meds) {
    const slot = medSlotFor(m, day);
    // O günün dozu ilacın varsayılanının yerine geçer. startDay/endDay bilerek
    // korunuyor — tüketiciler ilacın bütün aralığını bekliyor olabilir.
    if (slot) out.push({ ...m, dose: slot.dose, slot });
  }
  return out;
}
// Today's active doses + current cycle day
function todaysDoses(lunara, when) {
  if (!lunara || !lunara.regimen) return { meds: [], day: null };
  const day = regimenDay(lunara.regimen, when || TODAY_DATE);
  return { meds: activeMeds(lunara.regimen, day), day };
}

// Date navigator — lets a screen log to any past day. Gelecek yalnızca
// maxDate verilirse açılır (İlaçlar'daki doz önizlemesi); varsayılan bugün.
const dateNavBtn = { width: 28, height: 28, borderRadius: 8, background: 'var(--bone)', color: 'var(--ink-2)', fontSize: 16, lineHeight: 1, boxShadow: 'inset 0 0 0 1px var(--line-soft)' };
function DateNav({ date, onChange, maxDate }) {
  const today = getTodayKey();
  const max = maxDate && maxDate > today ? maxDate : today;
  const isToday = date === today;
  const atMax = date >= max;
  const locale = I18N.lang === 'tr' ? 'tr' : 'en';
  const label = isToday
    ? t('Today', 'Bugün')
    : new Date(date + 'T00:00:00').toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'long' });
  const keyOf = dt => dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
  const shift = n => { const nd = new Date(date + 'T00:00:00'); nd.setDate(nd.getDate() + n); const k = keyOf(nd); if (k <= max) onChange(k); };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <button onClick={() => shift(-1)} style={{ ...dateNavBtn, cursor: 'pointer' }} aria-label="Previous day">‹</button>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 999, background: 'var(--card)', boxShadow: 'inset 0 0 0 1px var(--line)' }}>
        <Icon d={ICONS.clock} size={13} stroke="var(--muted)"/>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap' }}>{label}</span>
        <input type="date" max={max} value={date} onChange={e => e.target.value && e.target.value <= max && onChange(e.target.value)}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} aria-label="Pick a date"/>
      </div>
      <button onClick={() => shift(1)} disabled={atMax} style={{ ...dateNavBtn, opacity: atMax ? 0.35 : 1, cursor: atMax ? 'default' : 'pointer' }} aria-label="Next day">›</button>
      {!isToday && <button onClick={() => onChange(today)} style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, cursor: 'pointer', paddingLeft: 2 }}>{t('Today', 'Bugün')}</button>}
    </div>
  );
}
const numOrNull = v => {
  if (v == null || v === '') return null;
  const n = Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

/* Bir doz kaydı iki biçimde olabilir: eski sürümlerde yalnızca 'HH:MM' metni,
   yenilerde { at, amount, unit }. Okuyan her yer buradan geçsin ki eski
   kayıtlar da çalışsın. Alınmamışsa null. */
function doseEntry(v) {
  if (!v) return null;
  if (typeof v === 'string') return { at: v, amount: null, unit: '' };
  return { at: v.at || '', amount: numOrNull(v.amount), unit: v.unit || '' };
}

// Is a med logged as taken today? → normalize edilmiş kayıt ya da false
function medTaken(lunara, id, dateKey) {
  const k = dateKey || TODAY_KEY;
  const raw = lunara && lunara.doseLog && lunara.doseLog[k] && lunara.doseLog[k][id];
  return doseEntry(raw) || false;
}

function ProgramBar({ idx, total }) {
  return (
    <div style={{ display: 'flex', gap: 3, marginTop: 2 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          flex: 1, height: 4, borderRadius: 4,
          background: i < idx ? 'var(--accent)' : i === idx ? 'var(--accent-soft)' : 'var(--line)',
        }}/>
      ))}
    </div>
  );
}

/* ─── Depolama uyarısı ─────────────────────────────────────────
   Kayıt sessizce başarısız olursa kullanıcı bunu ancak veriler kaybolunca
   fark eder. Durum değişince tüm ekranlarda görünen bir bant çizeriz. */
function StorageBanner() {
  const [, force] = React.useReducer(n => n + 1, 0);
  React.useEffect(() => {
    STORAGE.listeners.add(force);
    /* loadState() App'in useState başlatıcısında, yani bu efektten önce koşar;
       o sırada düşen bildirimi kaçırmamak için abone olur olmaz bir kez oku. */
    force();
    return () => STORAGE.listeners.delete(force);
  }, []);
  if (STORAGE.writable && !STORAGE.recovered) return null;

  const [msg, tone] = !STORAGE.writable
    ? [STORAGE.reason === 'quota'
        ? t('Storage is full — new entries are not being saved. Export your data from Profile, then clear some space.',
            'Depolama dolu — yeni kayıtlar saklanmıyor. Profil\'den verilerini dışa aktarıp yer aç.')
        : t('This browser is blocking storage (private mode?) — nothing you enter will be saved.',
            'Tarayıcı depolamayı engelliyor (gizli mod olabilir) — girdiklerin saklanmayacak.'),
       'crit']
    : [t('Saved data could not be read and was set aside. You are starting from an empty record.',
         'Kayıtlı veri okunamadı ve bir kenara alındı. Boş bir kayıtla başlıyorsun.'),
       'warn'];

  return (
    <div role="alert" className="no-print" style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
      background: tone === 'crit' ? '#7A2E2E' : '#7A5A2E', color: '#FFF6EC',
      padding: '10px 16px', paddingTop: 'max(10px, env(safe-area-inset-top))',
      fontFamily: 'var(--sans)', fontSize: 13, lineHeight: 1.45,
      boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
    }}>{msg}</div>
  );
}

// ─── Top bar ───────────────────────────────────────────────────
function TopBar({ greeting, lunara }) {
  const locale = I18N.lang === 'tr' ? 'tr' : 'en';
  const dateStr = TODAY_DATE
    .toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })
    .toLocaleUpperCase(locale);
  const day = lunara && lunara.periodStart ? cycleDayFrom(lunara.periodStart, TODAY_DATE, (lunara.regimen && lunara.regimen.cycleLength) || 28) : null;
  const name = lunara && lunara.profile && lunara.profile.name;
  const h = new Date().getHours(); // TODAY_DATE gece yarısına sabit; selamlama gerçek saati ister
  const greet = h < 12 ? t('Good morning', 'Günaydın') : h < 18 ? t('Good afternoon', 'İyi günler') : t('Good evening', 'İyi akşamlar');
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '22px 36px 6px',
    }}>
      <div>
        <div className="eyebrow" style={{ marginBottom: 6 }}>
          {dateStr}{day != null ? <> · {t('CYCLE DAY', 'DÖNGÜ GÜNÜ')} {day}</> : null}
        </div>
        <h1 className="serif-display" style={{
          fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 30,
          margin: 0, color: 'var(--ink)',
        }}>
          {greeting || `${greet}${name ? `, ${name}` : ''}.`}
        </h1>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button style={pillBtn}>
          <Icon d={ICONS.search} size={15} />
          <span>{t('Search', 'Ara')}</span>
        </button>
        <button style={{ ...pillBtn, padding: '10px 12px' }} aria-label="Notifications">
          <Icon d={ICONS.bell} size={15} />
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--accent)', marginLeft: -2,
          }}/>
        </button>
      </div>
    </div>
  );
}
const pillBtn = {
  display: 'flex', alignItems: 'center', gap: 8,
  padding: '10px 14px', borderRadius: 999,
  background: 'var(--card)', color: 'var(--ink-2)',
  boxShadow: 'inset 0 0 0 1px var(--line)',
  fontSize: 13, fontWeight: 500,
};

// ─── Primitives ────────────────────────────────────────────────
/* ── Silme düğmesi ────────────────────────────────────────────────
   Silmeler kalıcı ve geri alınamaz (yerel kayıt, sunucu yok), ama eskiden
   tek dokunuşla oluyordu. Bu düğme iki adımlı: ilk dokunuş "Emin misin?"e
   çeviriyor, ikincisi siliyor. Beş saniye dokunulmazsa kendi kendine
   normale dönüyor, böylece yanlışlıkla açık kalmış bir onay ekranda
   asılı kalmıyor.

   variant='ikon'  → satır içinde çöp kutusu (liste öğeleri)
   variant='metin' → yazılı buton (kart altı, tehlikeli toplu silme) */
function SilBtn({ onSil, label, confirmLabel, variant = 'ikon', style }) {
  const [soruyor, setSoruyor] = React.useState(false);
  React.useEffect(() => {
    if (!soruyor) return;
    const z = setTimeout(() => setSoruyor(false), 5000);
    return () => clearTimeout(z);
  }, [soruyor]);

  const ad = label || t('Delete', 'Sil');
  const onay = confirmLabel || t('Tap again to delete', 'Silmek için tekrar dokun');

  if (variant === 'ikon' && !soruyor) {
    return (
      <button onClick={() => setSoruyor(true)} aria-label={ad} title={ad}
        style={{
          width: 30, height: 30, borderRadius: 8, flexShrink: 0, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'transparent', border: 'none', color: 'var(--muted-2)', ...style,
        }}>
        <Icon d={ICONS.trash} size={15} stroke="currentColor"/>
      </button>
    );
  }
  return (
    <button onClick={() => { if (soruyor) { onSil(); setSoruyor(false); } else setSoruyor(true); }}
      aria-label={soruyor ? onay : ad}
      style={{
        display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', flexShrink: 0,
        padding: soruyor ? '6px 11px' : '6px 0', borderRadius: 8, border: 'none',
        background: soruyor ? 'var(--signal-low)' : 'transparent',
        color: soruyor ? 'var(--ivory)' : 'var(--signal-low)',
        fontSize: 12, fontWeight: soruyor ? 700 : 500, fontFamily: 'var(--sans)',
        whiteSpace: 'nowrap', ...style,
      }}>
      <Icon d={ICONS.trash} size={14} stroke="currentColor"/> {soruyor ? onay : ad}
    </button>
  );
}

function Card({ children, style, pad = 24, ...rest }) {
  return (
    <div
      style={{
        background: 'var(--card)',
        borderRadius: 'var(--r-lg)',
        boxShadow: 'var(--shadow-card)',
        border: '1px solid var(--line-soft)',
        padding: pad,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

// Tiny sparkline for symptoms / labs
function Sparkline({ data, color = 'var(--accent)', width = 110, height = 32, dot = true, range }) {
  const lo = range ? range[0] : Math.min(...data);
  const hi = range ? range[1] : Math.max(...data);
  const span = Math.max(0.0001, hi - lo);
  const step = data.length > 1 ? width / (data.length - 1) : 0;
  const pts = data.map((v, i) => [i * step, height - ((v - lo) / span) * (height - 4) - 2]);
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const last = pts[pts.length - 1];
  return (
    <svg className="chart" width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      {dot && last && <circle cx={last[0]} cy={last[1]} r="2.5" fill={color}/>}
    </svg>
  );
}

// Reference-range bar with current value tick
function RangeBar({ value, range, target, height = 8 }) {
  const [lo, hi] = range;
  const span = hi - lo;
  const pad = span * 0.25; // axis pad
  const axisLo = lo - pad;
  const axisHi = hi + pad;
  const axisSpan = axisHi - axisLo;
  const valPct = ((value - axisLo) / axisSpan) * 100;
  const loPct = ((lo - axisLo) / axisSpan) * 100;
  const hiPct = ((hi - axisLo) / axisSpan) * 100;
  const tgtPct = target != null ? ((target - axisLo) / axisSpan) * 100 : null;
  return (
    <div style={{ position: 'relative', height, marginTop: 4 }}>
      {/* full axis */}
      <div style={{ position: 'absolute', inset: 0, borderRadius: 999, background: 'var(--line-soft)' }}/>
      {/* in-range band */}
      <div style={{
        position: 'absolute', top: 0, bottom: 0, left: `${loPct}%`, width: `${hiPct - loPct}%`,
        background: 'var(--accent-soft)', borderRadius: 999, opacity: 0.85,
      }}/>
      {/* target tick */}
      {tgtPct != null && (
        <div style={{ position: 'absolute', top: -2, bottom: -2, left: `${tgtPct}%`, width: 1.5,
                      background: 'var(--ink-2)', opacity: 0.35 }}/>
      )}
      {/* current value pin */}
      <div style={{
        position: 'absolute', top: -3, left: `calc(${valPct}% - 6px)`,
        width: 12, height: height + 6, borderRadius: 4,
        background: 'var(--ink)',
        boxShadow: '0 1px 0 rgba(0,0,0,0.04)',
      }}/>
    </div>
  );
}

// Symptom dot scale (0-3) for 14-day series
function SymptomTrack({ series, color = 'var(--accent)', dotSize = 6, gap = 3 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap, height: 22 }}>
      {series.map((v, i) => (
        <div key={i} style={{
          width: dotSize, height: 4 + (v * 5), borderRadius: dotSize / 2,
          background: v === 0 ? 'var(--line)' : color,
          opacity: v === 0 ? 1 : 0.35 + v * 0.22,
        }}/>
      ))}
    </div>
  );
}

export { sonKanamaBasi, kanamaTuruYaz, KANAMA_ANAHTARLARI, kanamaDegeri, gunlukLog, akisYaz, akisTasi, PATIENT, DOSES_TODAY, SYMPTOMS, LABS, PROVIDER, PROGRAM, Icon, ICONS, navItemsFor, SideRail, Logo, LS_KEY, loadState, useLunara, nowHM, WHEN_TR, whenLabel, getTodayKey, TODAY_KEY, TODAY_DATE, regimenDay, activeMeds, medSchedule, medSlotFor, slotCovers, todaysDoses, medTaken, doseEntry, ProgramBar, TopBar, StorageBanner, DateNav, pillBtn, Card, SilBtn, Sparkline, RangeBar, SymptomTrack, labReadings, labHistory, labCurrent };
