import React from 'react';
import { I18N, t, useLang } from './i18n';
import { Btn, cycleDayFrom, phaseOf, wrap } from './screens';
import { ICONS, Icon, Logo } from './shared';

/* stages.jsx — Lunara yaşam evresi katmanı
   7 evre = gamın 7 notası (Do..Si). Hafif kat: her evrenin notası + rengi + tonu.
   Yükselen gam = hayat yolculuğu; oktav (Do′) = nesil yenilenmesi.
   shared.jsx, i18n.jsx, screens.jsx (cycleDayFrom, phaseOf, Btn, wrap) sonrası yüklenir. */
/* eslint-disable */

const STAGES = {
  menarche: {
    note: 'Do', order: 0, available: true,
    en: 'First cycles', tr: 'İlk dönemler',
    toneEn: 'Awareness', toneTr: 'Farkındalık',
    descEn: 'Getting to know your body and its new rhythm.',
    descTr: 'Bedenini ve yeni ritmini tanımaya başlamak.',
    accent: 'oklch(0.58 0.10 155)', accentSoft: 'oklch(0.88 0.05 155)',
    nav: ['home', 'cycle', 'symptoms', 'nourish'],
  },
  cycle: {
    note: 'Re', order: 1, available: true,
    en: 'Cycle tracking', tr: 'Döngü takibi',
    toneEn: 'Balance', toneTr: 'Denge',
    descEn: 'Knowing your cycle, symptoms and rhythm.',
    descTr: 'Döngünü, belirtilerini ve ritmini tanımak.',
    accent: null, accentSoft: null, // mevcut estetik paleti yönetir (maroon)
    nav: ['home', 'symptoms', 'cycle', 'nourish', 'care'],
  },
  ttc: {
    note: 'Mi', order: 2, available: true,
    en: 'Preparing', tr: 'Hazırlık',
    toneEn: 'Hope', toneTr: 'Umut',
    descEn: 'Fertile window, ovulation and timing.',
    descTr: 'Doğurgan pencere, ovülasyon ve zamanlama.',
    accent: 'oklch(0.64 0.12 52)', accentSoft: 'oklch(0.87 0.07 55)',
    nav: ['home', 'cycle', 'symptoms', 'nourish', 'care'],
  },
  pregnancy: {
    note: 'Fa', order: 3, available: true,
    en: 'Pregnancy', tr: 'Gebelik',
    toneEn: 'Nourishing', toneTr: 'Besleyici',
    descEn: 'Week by week, for you and your baby.',
    descTr: 'Hafta hafta, sen ve bebeğin için.',
    accent: 'oklch(0.56 0.10 8)', accentSoft: 'oklch(0.86 0.06 14)',
    nav: ['home', 'symptoms', 'nourish', 'care'],
  },
  postpartum: {
    note: 'Sol', order: 4, available: true,
    en: 'Postpartum', tr: 'Doğum sonrası',
    toneEn: 'Restoring', toneTr: 'Onarıcı',
    descEn: 'Recovery, mood and feeding in the fourth trimester.',
    descTr: 'İyileşme, ruh hali ve emzirme.',
    accent: 'oklch(0.58 0.07 205)', accentSoft: 'oklch(0.86 0.04 205)',
    nav: ['home', 'symptoms', 'nourish', 'care'],
  },
  perimeno: {
    note: 'La', order: 5, available: true,
    en: 'Perimenopause', tr: 'Perimenopoz',
    toneEn: 'Maturity', toneTr: 'Olgunluk',
    descEn: 'Shifting cycles, symptoms and hormone support (BHRT).',
    descTr: 'Değişen döngüler, belirtiler ve hormon desteği (BHRT).',
    accent: null, accentSoft: null, // marka paleti (:root) yönetir — mürekkep moru
    nav: ['home', 'symptoms', 'doses', 'cycle', 'move', 'nourish', 'labs', 'care'],
  },
  menopause: {
    note: 'Si', order: 6, available: true,
    en: 'Menopause', tr: 'Menopoz',
    toneEn: 'Wisdom', toneTr: 'Bilgelik',
    descEn: 'Symptom care, bone and heart health.',
    descTr: 'Belirti yönetimi, kemik ve kalp sağlığı.',
    accent: 'oklch(0.50 0.10 300)', accentSoft: 'oklch(0.84 0.05 300)',
    nav: ['home', 'symptoms', 'doses', 'nourish', 'labs', 'care'],
  },
};
const STAGE_ORDER = Object.keys(STAGES).sort((a, b) => STAGES[a].order - STAGES[b].order);

function stageName(key) {
  const s = STAGES[key]; if (!s) return '';
  return t(s.en, s.tr);
}

// Apply per-stage accent to document root (inline beats data-theme rules).
// 'cycle' clears overrides so the aesthetic switcher (editorial/clinical/...) governs.
function applyStageTheme(key) {
  const s = STAGES[key];
  const root = document.documentElement;
  if (s && s.accent) {
    root.style.setProperty('--accent', s.accent);
    root.style.setProperty('--accent-soft', s.accentSoft);
  } else {
    root.style.removeProperty('--accent');
    root.style.removeProperty('--accent-soft');
  }
}

// ─── Small note + color marker ─────────────────────────────────
function NoteGlyph({ color = 'currentColor', size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="8" cy="18" r="3.2" fill={color}/>
      <path d="M11.2 18V5l8 -2v11" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="16" cy="14" r="3.2" fill={color}/>
    </svg>
  );
}

function StageBadge({ stage, withName }) {
  const s = STAGES[stage]; if (!s) return null;
  const color = s.accent || 'var(--accent)';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.04em',
      color: 'var(--ink-2)',
    }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }}/>
      <span style={{ fontStyle: 'italic', fontFamily: 'var(--serif)', fontSize: 13 }}>{s.note}</span>
      {withName && <span>· {stageName(stage)}</span>}
    </span>
  );
}

// ─── Sidebar stage chip (replaces program chip) ────────────────
function StageChip({ stage, onNav }) {
  useLang();
  const s = STAGES[stage] || STAGES.cycle;
  const color = s.accent || 'var(--accent)';
  return (
    <button onClick={() => onNav && onNav('onboarding')} style={{
      padding: '12px 12px', width: '100%', textAlign: 'left', cursor: 'pointer',
      background: 'var(--card)', borderRadius: 12,
      boxShadow: 'inset 0 0 0 1px var(--line-soft)',
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="eyebrow-mono" style={{ fontSize: 9.5 }}>{t('LIFE STAGE', 'YAŞAM EVRESİ')}</span>
        <span style={{ fontSize: 10.5, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
          {t('change', 'değiştir')} <Icon d={ICONS.arrow} size={11} stroke="var(--muted)"/>
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{
          width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
          background: color, color: 'var(--ivory)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 14,
        }}>{s.note}</span>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2, minWidth: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{stageName(stage)}</span>
          <span style={{ fontSize: 10.5, color: 'var(--muted)' }}>{t(s.toneEn, s.toneTr)}</span>
        </div>
      </div>
    </button>
  );
}

// ═══════════════ ONBOARDING — "life scale" selector ═══════════════
function OnboardingScreen({ lunara, api, onDone }) {
  useLang();
  const [name, setName] = React.useState((lunara.profile && lunara.profile.name) || '');
  const [age, setAge] = React.useState((lunara.profile && lunara.profile.age) || '');
  const [weight, setWeight] = React.useState((lunara.profile && lunara.profile.weight) || '');
  const [periodStart, setPeriodStart] = React.useState('');
  const [cycleLen, setCycleLen] = React.useState(28);
  const [bhrt, setBhrt] = React.useState((lunara.profile && lunara.profile.bhrtStatus) || '');
  // Yaş, kilo ve BHRT durumu ilk ekranda zorunlu görünüyordu ve hiçbirinin
  // niye sorulduğu yazmıyordu; kilit soru olan son regl tarihi ise en altta
  // kalıyordu. Artık tek asıl soru üstte, gerisi katlanmış.
  const [detay, setDetay] = React.useState(false);
  const lang = I18N.lang;
  const todayMax = new Date().toISOString().slice(0, 10);

  const inputStyle = {
    border: '1px solid var(--line)', borderRadius: 12, padding: '13px 15px',
    fontFamily: 'var(--sans)', fontSize: 15, color: 'var(--ink)',
    background: 'var(--card)', outline: 'none', width: '100%', boxSizing: 'border-box',
  };

  const BHRT_OPTS = [
    { k: 'on',     en: 'Yes, I use it',   tr: 'Evet, kullanıyorum' },
    { k: 'exploring', en: 'Exploring it', tr: 'Değerlendiriyorum' },
    { k: 'no',     en: 'Not yet',         tr: 'Henüz değil' },
  ];

  const finish = () => {
    const patch = { name: name.trim(), age };
    if (weight) patch.weight = parseInt(weight, 10) || undefined;
    if (bhrt) patch.bhrtStatus = bhrt;
    if (api.updateProfile) api.updateProfile(patch);
    if (periodStart) {
      if (api.setPeriodStart) api.setPeriodStart(periodStart);
      if (api.setRegimenAnchor) api.setRegimenAnchor(periodStart);
    }
    if (cycleLen && api.setRegimenCycle) api.setRegimenCycle(parseInt(cycleLen, 10) || 28);
    api.setStage('perimeno');
    onDone && onDone();
  };

  return (
    <div style={{
      minHeight: '100%', background: 'var(--ivory)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '48px 24px 60px',
    }}>
      <div style={{ width: '100%', maxWidth: 560 }}>
        {/* Language toggle */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 28 }}>
          <div style={{ display: 'flex', gap: 6, padding: 4, borderRadius: 999, background: 'var(--bone)', boxShadow: 'inset 0 0 0 1px var(--line-soft)' }}>
            {[{ k: 'tr', label: 'Türkçe' }, { k: 'en', label: 'English' }].map(o => {
              const on = o.k === lang;
              return (
                <button key={o.k} onClick={() => I18N.set(o.k)}
                  style={{
                    padding: '7px 14px', borderRadius: 999, fontSize: 12.5, fontWeight: on ? 700 : 500,
                    background: on ? 'var(--ink)' : 'transparent',
                    color: on ? 'var(--ivory)' : 'var(--muted)',
                    border: 'none', cursor: 'pointer', transition: 'all 140ms ease',
                  }}>{o.label}</button>
              );
            })}
          </div>
        </div>

        {/* Heading */}
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}><Logo size={54}/></div>
          <h1 className="serif-display" style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 38, margin: '0 0 12px', letterSpacing: '-0.02em' }}>
            {t('Your perimenopause, in focus.', 'Perimenopoz yolculuğun, odakta.')}
          </h1>
          <p style={{ fontFamily: 'var(--serif)', fontSize: 17, lineHeight: 1.5, color: 'var(--ink-2)', margin: '0 auto', maxWidth: 460 }}>
            {t('Perim helps you track symptoms, hormone therapy (BHRT) and labs — and see how they move together over time.',
               'Perim; belirtilerini, hormon tedavini (BHRT) ve tahlillerini takip etmene ve bunların zaman içinde nasıl birlikte değiştiğini görmene yardım eder.')}
          </p>
          {/* İki uygulama aynı kod tabanından çıkıyor ve birbirine çok benziyor;
              kuran kişinin hangisini elinde tuttuğunu bilmesi gerekiyor. */}
          <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: '12px auto 0', maxWidth: 460, lineHeight: 1.5 }}>
            {t('Tracking a regular cycle, pregnancy or postpartum instead? Lunara is the app for those.',
               'Düzenli döngü, gebelik ya da doğum sonrası mı takip ediyorsun? Onlar için Lunara var.')}
          </p>
        </div>

        {/* Asıl soru: döngü çapası. Uygulamadaki her tahmin buradan çıkıyor,
            o yüzden ilk ve tek zorunlu görünen alan bu. */}
        <div style={{ margin: '0 0 22px', padding: '18px 20px', borderRadius: 16, background: 'var(--card)', boxShadow: 'inset 0 0 0 1px var(--line-soft)' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span className="eyebrow">{t('First day of your last period', 'Son reglinin ilk günü')}</span>
            <input type="date" max={todayMax} value={periodStart} onChange={e => setPeriodStart(e.target.value)} style={inputStyle}/>
          </label>
          <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: '9px 0 0', lineHeight: 1.5 }}>
            {t('Everything else follows from this — your cycle day, phase and when bleeding is expected. Don’t know it? Skip; you can mark it on the calendar later.',
               'Döngü günün, fazın ve kanamanın ne zaman beklendiği hep bundan çıkıyor. Bilmiyorsan geç — sonra takvimden işaretleyebilirsin.')}
          </p>
        </div>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: '0 0 20px' }}>
          <span className="eyebrow">{t('Your name (optional)', 'Adın (isteğe bağlı)')}</span>
          <input value={name} onChange={e => setName(e.target.value)}
            placeholder={t('What should we call you?', 'Sana nasıl hitap edelim?')} style={inputStyle}/>
        </label>

        {/* Geri kalanı katlanmış: hiçbiri uygulamayı kullanmaya başlamak için
            gerekli değil, hepsi Profil'den de girilebiliyor. */}
        <button onClick={() => setDetay(v => !v)} aria-expanded={detay} style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '13px 4px', background: 'transparent', border: 'none', cursor: 'pointer',
          borderTop: '1px solid var(--line-soft)', borderBottom: detay ? 'none' : '1px solid var(--line-soft)',
          fontSize: 13.5, color: 'var(--ink-2)', fontWeight: 600, fontFamily: 'var(--sans)',
        }}>
          {t('A few more details (optional)', 'Birkaç ayrıntı daha (isteğe bağlı)')}
          <span style={{ fontSize: 15, color: 'var(--muted)' }}>{detay ? '−' : '+'}</span>
        </button>

        {detay && (
          <div style={{ padding: '18px 0 4px', borderBottom: '1px solid var(--line-soft)', marginBottom: 4 }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
              <label style={{ flex: '1 1 100px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span className="eyebrow">{t('Age', 'Yaş')}</span>
                <input value={age} onChange={e => setAge(e.target.value.replace(/\D/g, '').slice(0, 3))} inputMode="numeric"
                  placeholder="—" style={inputStyle}/>
              </label>
              <label style={{ flex: '1 1 110px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span className="eyebrow">{t('Weight (kg)', 'Kilo (kg)')}</span>
                <input value={weight} onChange={e => setWeight(e.target.value.replace(/\D/g, '').slice(0, 3))} inputMode="numeric"
                  placeholder={t('optional', 'isteğe bağlı')} style={inputStyle}/>
              </label>
              <label style={{ flex: '1 1 130px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span className="eyebrow">{t('Cycle length (days)', 'Döngü uzunluğu (gün)')}</span>
                <input value={cycleLen} onChange={e => setCycleLen(e.target.value.replace(/\D/g, '').slice(0, 2))} inputMode="numeric" placeholder="28" style={inputStyle}/>
              </label>
            </div>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 18px', lineHeight: 1.5 }}>
              {t('Weight is only used for your daily protein target; cycle length sets where the phases fall. In perimenopause cycles are often irregular — that’s expected.',
                 'Kilo yalnızca günlük protein hedefin için kullanılıyor; döngü uzunluğu fazların nereye düştüğünü belirliyor. Perimenopozda döngüler çoğu zaman düzensizdir — bu beklenen bir şey.')}
            </p>

            <span className="eyebrow" style={{ display: 'block', marginBottom: 8 }}>{t('Hormone therapy (BHRT)', 'Hormon tedavisi (BHRT)')}</span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {BHRT_OPTS.map(o => {
                const on = bhrt === o.k;
                return (
                  <button key={o.k} onClick={() => setBhrt(on ? '' : o.k)} style={{
                    flex: '1 1 120px', padding: '11px 10px', borderRadius: 12, cursor: 'pointer', fontSize: 13.5, fontWeight: on ? 600 : 500,
                    background: on ? 'var(--accent)' : 'var(--card)', color: on ? 'var(--ivory)' : 'var(--ink-2)',
                    boxShadow: on ? 'none' : 'inset 0 0 0 1px var(--line-soft)', transition: 'all 140ms ease',
                  }}>{t(o.en, o.tr)}</button>
                );
              })}
            </div>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: '9px 0 0', lineHeight: 1.5 }}>
              {t('This only decides whether the Doses screen appears. You can change it anytime.',
                 'Bu yalnızca Dozlar ekranının görünüp görünmeyeceğini belirliyor. İstediğin zaman değiştirebilirsin.')}
            </p>
          </div>
        )}

        {/* Continue */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button onClick={finish} style={{
            padding: '14px 32px', borderRadius: 999, border: 'none',
            background: 'var(--ink)', color: 'var(--ivory)', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            {t('Begin', 'Başla')} <Icon d={ICONS.arrow} size={15} sw={2}/>
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--muted-2)', lineHeight: 1.5, margin: '22px 0 0', fontStyle: 'italic' }}>
          {t('Guidance and tracking — not medical advice. Your data stays on this device.',
             'Rehberlik ve takip — tıbbi tavsiye değil. Verilerin bu cihazda kalır.')}
        </p>
      </div>
    </div>
  );
}

export { STAGES, STAGE_ORDER, stageName, applyStageTheme, NoteGlyph, StageBadge, StageChip, OnboardingScreen };
