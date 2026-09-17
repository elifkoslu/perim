import React from 'react';
import { tx } from './dict';
import { I18N, t } from './i18n';
import { PHASE_TINT, ScreenHead, cycleDayFrom, cycleLenOf, phaseBounds, phaseLabel, phaseOf, phaseRange, seedRange } from './screens';
import { Card, DateNav, ICONS, Icon, TODAY_DATE, TODAY_KEY, getTodayKey } from './shared';
import { WaterCard } from './water';

/* nourish.jsx — Lunara · phase-based movement & nutrition guidance
   Reads the current cycle phase and tailors recommendations.
   Depends on screens.jsx (cycleDayFrom, phaseOf, PHASE_TINT). */
/* eslint-disable */

const PHASE_GUIDE = {
  menstrual: {
    label: 'Menstrual',
    range: 'Days 1–5',
    energy: 'Low',
    tagline: 'Rest is productive. Hormones are at their floor — meet the body gently.',
    move: {
      headline: 'Restorative & gentle',
      session: '20–35 min · RPE 2–3 / 10',
      items: [
        { name: 'Walking', detail: '20–30 min, easy pace, outdoors if you can', icon: 'walk',
          plan: { meta: '25 min · easy', steps: [
            { phase: 'Walk', spec: '20–30 min', sub: 'Conversational pace, nose-breathing' },
            { phase: 'Optional add-on', spec: '5 min', sub: 'Gentle uphill or stairs if energy allows' },
          ] } },
        { name: 'Yin / restorative yoga', detail: 'Hip openers, supported forward folds', icon: 'yoga',
          plan: { meta: '20 min · 4 holds', steps: [
            { phase: 'Reclined butterfly', spec: '3 min hold', sub: 'Pillow under knees' },
            { phase: 'Supported forward fold', spec: '3 min', sub: 'Bolster on thighs' },
            { phase: 'Child’s pose', spec: '2 min', sub: 'Wide knees, breathe into low back' },
            { phase: 'Legs up the wall', spec: '5 min', sub: 'Eases cramps & swelling' },
          ] } },
        { name: 'Mobility & stretching', detail: 'Loosen lower back and pelvis', icon: 'stretch',
          plan: { meta: '10 min · 5 moves', steps: [
            { phase: 'Cat–cow', spec: '10 reps', sub: 'Slow, with breath' },
            { phase: 'Hip circles', spec: '8 each way', sub: 'Standing or all-fours' },
            { phase: 'Pelvic tilts', spec: '12 reps', sub: 'Releases low back' },
            { phase: 'Figure-4 stretch', spec: '45 s each side', sub: 'Glutes & piriformis' },
          ] } },
      ],
      avoid: 'Skip heavy lifting and HIIT if you feel depleted — they can raise cortisol now.',
    },
    eat: {
      headline: 'Replenish iron & warmth',
      items: [
        { name: 'Iron-rich foods', detail: 'Lentils, grass-fed red meat, spinach', tag: 'IRON' },
        { name: 'Warm, cooked meals', detail: 'Soups, stews, ginger, bone broth', tag: 'WARMTH' },
        { name: 'Vitamin C pairing', detail: 'Citrus or peppers to absorb iron', tag: 'ABSORB' },
        { name: 'Magnesium', detail: 'Dark chocolate, pumpkin seeds — eases cramps', tag: 'MG' },
      ],
      note: 'For PCOS: keep blood sugar steady — pair any carbs with protein and fat.',
    },
  },
  follicular: {
    label: 'Follicular',
    range: 'Days 6–13',
    energy: 'Rising',
    tagline: 'Estrogen climbs — energy, mood, and coordination rise with it. Build and try new things.',
    move: {
      headline: 'Build & challenge',
      session: '40–55 min · RPE 6–7 / 10',
      items: [
        { name: 'Strength training', detail: 'Progressive overload — muscle responds well now', icon: 'lift',
          plan: { meta: '45 min · 4 lifts', steps: [
            { phase: 'Warm-up', spec: '6 min', sub: 'Bike + banded glute work' },
            { phase: 'Goblet squat', spec: '4 × 8–10', sub: '90 s rest, add load weekly' },
            { phase: 'Romanian deadlift', spec: '4 × 8', sub: 'Hinge, controlled tempo' },
            { phase: 'Bench / push-up', spec: '3 × 10', sub: 'Full range' },
            { phase: 'Row', spec: '3 × 12', sub: 'Squeeze shoulder blades' },
          ] } },
        { name: 'Cardio & dance', detail: 'Higher intensity feels easier', icon: 'run',
          plan: { meta: '30 min · intervals', steps: [
            { phase: 'Warm-up', spec: '5 min', sub: 'Build to moderate' },
            { phase: 'Intervals', spec: '8 × (1 min hard / 1 min easy)', sub: 'RPE 7 on hard' },
            { phase: 'Cool-down', spec: '5 min', sub: 'Easy pace + breathe' },
          ] } },
        { name: 'Try something new', detail: 'Skill-learning peaks with rising estrogen', icon: 'spark',
          plan: { meta: '45 min · skill', steps: [
            { phase: 'Pick a class', spec: '1 session', sub: 'Climbing, boxing, dance — coordination is high now' },
            { phase: 'Focus', spec: 'technique', sub: 'Estrogen aids motor learning this week' },
          ] } },
      ],
      avoid: 'A good window to push — just keep recovery and sleep on track.',
    },
    eat: {
      headline: 'Fresh, light & fermented',
      items: [
        { name: 'Lean proteins', detail: 'Eggs, chicken, fish to fuel building', tag: 'PROTEIN' },
        { name: 'Fermented foods', detail: 'Sauerkraut, kimchi, yogurt — gut + estrogen', tag: 'GUT' },
        { name: 'Light fresh produce', detail: 'Sprouts, leafy greens, berries', tag: 'FRESH' },
        { name: 'Complex carbs', detail: 'Oats, quinoa for steady energy', tag: 'CARB' },
      ],
      note: 'For PCOS: prioritise low-glycaemic carbs to keep insulin even as appetite returns.',
    },
  },
  ovulation: {
    label: 'Ovulation',
    range: 'Days 14–18',
    energy: 'Peak',
    tagline: 'The high point — strength, confidence, and verbal recall peak. Use the momentum.',
    move: {
      headline: 'Peak performance',
      session: '35–50 min · RPE 8–9 / 10',
      items: [
        { name: 'HIIT & sprints', detail: 'Power output is at its highest', icon: 'run',
          plan: { meta: '25 min · sprints', steps: [
            { phase: 'Warm-up', spec: '8 min', sub: 'Thorough — joints are laxer now' },
            { phase: 'Sprints', spec: '6 × 20 s all-out', sub: '90 s walk between' },
            { phase: 'Cool-down', spec: '5 min', sub: 'Easy + mobility' },
          ] } },
        { name: 'Heavy strength', detail: 'Go for PRs — but warm up well', icon: 'lift',
          plan: { meta: '50 min · strength', steps: [
            { phase: 'Warm-up', spec: '10 min', sub: 'Ramp-up sets, light → heavy' },
            { phase: 'Squat or deadlift', spec: '5 × 3–5', sub: 'Heavy, 2–3 min rest — PR window' },
            { phase: 'Press', spec: '4 × 5', sub: 'Strict form' },
            { phase: 'Accessory', spec: '3 × 8', sub: 'Lunges, pull-ups' },
          ] } },
        { name: 'Group classes', detail: 'Sociability peaks — lean into it', icon: 'spark',
          plan: { meta: '45 min · class', steps: [
            { phase: 'Spin / bootcamp', spec: '1 session', sub: 'Push intensity — recovery is good now' },
            { phase: 'Warm-up', spec: 'don’t skip', sub: 'Protect knees & ankles' },
          ] } },
      ],
      avoid: 'Joints are slightly laxer near ovulation — warm up thoroughly to protect knees.',
    },
    eat: {
      headline: 'Anti-inflammatory & fibre',
      items: [
        { name: 'Colourful vegetables', detail: 'Cruciferous: broccoli, cauliflower — clears estrogen', tag: 'FIBRE' },
        { name: 'Antioxidants', detail: 'Berries, leafy greens, turmeric', tag: 'ANTIOX' },
        { name: 'Light proteins', detail: 'Fish, tofu — easier digestion at peak', tag: 'PROTEIN' },
        { name: 'Hydration + electrolytes', detail: 'You sweat more at this intensity', tag: 'HYDRATE' },
      ],
      note: 'For PCOS: cruciferous veg supports estrogen metabolism — aim for a serving daily.',
    },
  },
  luteal: {
    label: 'Luteal',
    range: 'Days 19–32',
    energy: 'Winding down',
    tagline: 'Progesterone rises, then both hormones fall. Appetite and cravings climb — be kind and steady.',
    move: {
      headline: 'Steady & grounding',
      session: '30–45 min · RPE 4–6 / 10',
      items: [
        { name: 'Pilates & barre', detail: 'Controlled strength without the spike', icon: 'yoga',
          plan: { meta: '35 min · 4 blocks', steps: [
            { phase: 'Core series', spec: '3 × 12', sub: 'Dead bugs, bird-dogs' },
            { phase: 'Glute bridges', spec: '3 × 15', sub: 'Slow tempo' },
            { phase: 'Standing barre', spec: '2 × 20', sub: 'Small pulses, legs' },
            { phase: 'Stretch', spec: '5 min', sub: 'Hip flexors & hamstrings' },
          ] } },
        { name: 'Moderate strength', detail: 'Keep lifting, lower the volume', icon: 'lift',
          plan: { meta: '40 min · lighter', steps: [
            { phase: 'Warm-up', spec: '6 min', sub: 'Easy cardio + mobility' },
            { phase: 'Squat', spec: '3 × 10', sub: '~70% of peak-week load' },
            { phase: 'Hinge', spec: '3 × 10', sub: 'Controlled' },
            { phase: 'Upper body', spec: '2 × 12', sub: 'Push + pull' },
          ] } },
        { name: 'Longer walks / hikes', detail: 'Zone-2 cardio supports mood', icon: 'walk',
          plan: { meta: '45 min · zone 2', steps: [
            { phase: 'Steady walk / hike', spec: '40–45 min', sub: 'Can hold a conversation' },
            { phase: 'Optional incline', spec: 'rolling hills', sub: 'Lifts mood, gentle on cortisol' },
          ] } },
      ],
      avoid: 'Late luteal: swap HIIT for steady work — recovery slows and cortisol is sensitive.',
    },
    eat: {
      headline: 'Stabilise blood sugar & mood',
      items: [
        { name: 'Complex carbs', detail: 'Sweet potato, squash, brown rice — curbs cravings', tag: 'CARB' },
        { name: 'Magnesium & B6', detail: 'Leafy greens, bananas — eases PMS', tag: 'PMS' },
        { name: 'Healthy fats', detail: 'Avocado, nuts, olive oil for satiety', tag: 'FAT' },
        { name: 'Limit caffeine & salt', detail: 'Eases bloating and tender breasts', tag: 'EASE' },
      ],
      note: 'For PCOS: this is the highest-craving phase — front-load protein and fibre to blunt insulin swings.',
    },
  },
};

// Small glyphs for movement items
const MOVE_ICON = {
  walk: 'M13 4a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM11 9l-2 4 2 2v5M11 9l3 1 2 3M11 9l-3 2',
  run: 'M13 4a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM9 21l3-5-2-3 4-2 2 3 2 1M10 13l-1-3 4-1',
  lift: 'M4 9v6M7 7v10M17 7v10M20 9v6M7 12h10',
  yoga: 'M12 4a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM12 8v6M12 14l-5 5M12 14l5 5M7 11h10',
  stretch: 'M12 4a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM12 8v5l4 3M12 13l-4 3M9 20h6',
  spark: 'M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6',
};

/* ════════════════ STRENGTH (perimenopause priority) ════════════════ */
/* Movement library — SUGGESTIONS. The user picks which of these go into her
   own routine (api.toggleRoutineEx); nothing is prescribed. Grouped by the
   five patterns that a well-rounded perimenopause strength week should cover. */
const PATTERNS = [
  { key: 'squat', en: 'Squat', tr: 'Çömelme', why: { en: 'legs & glutes', tr: 'bacak & kalça' } },
  { key: 'hinge', en: 'Hinge', tr: 'Menteşe', why: { en: 'posterior chain', tr: 'arka zincir' } },
  { key: 'push',  en: 'Push',  tr: 'İtme',    why: { en: 'chest & shoulders', tr: 'göğüs & omuz' } },
  { key: 'pull',  en: 'Pull',  tr: 'Çekme',   why: { en: 'back & posture', tr: 'sırt & duruş' } },
  { key: 'carry', en: 'Carry', tr: 'Taşıma',  why: { en: 'core & grip', tr: 'kor & kavrama' } },
];

const EXERCISE_LIBRARY = [
  // squat
  { id: 'goblet-squat', pattern: 'squat', en: 'Goblet squat', tr: 'Goblet çömelme', spec: '3 × 8–10', cue: { en: 'Hold weight at chest, sit between hips', tr: 'Ağırlığı göğüste tut, kalçalar arasına otur' } },
  { id: 'back-squat', pattern: 'squat', en: 'Back / front squat', tr: 'Bar çömelme', spec: '4 × 6', cue: { en: 'Heavier, 2–3 min rest', tr: 'Daha ağır, 2–3 dk dinlen' } },
  { id: 'split-squat', pattern: 'squat', en: 'Bulgarian split squat', tr: 'Bulgar split çömelme', spec: '3 × 8 / bacak', cue: { en: 'Single-leg, great for balance', tr: 'Tek bacak, denge için birebir' } },
  { id: 'wall-sit', pattern: 'squat', en: 'Wall sit', tr: 'Duvar oturuşu', spec: '3 × 30–45 s', cue: { en: 'No equipment, isometric', tr: 'Ekipmansız, izometrik' } },
  // hinge
  { id: 'rdl', pattern: 'hinge', en: 'Romanian deadlift', tr: 'Romen deadlift', spec: '3 × 8', cue: { en: 'Hips back, soft knees, flat back', tr: 'Kalça geri, dizler yumuşak, düz sırt' } },
  { id: 'deadlift', pattern: 'hinge', en: 'Deadlift', tr: 'Deadlift', spec: '3 × 5', cue: { en: 'Brace hard, drive floor away', tr: 'Karnı sıkıştır, yeri it' } },
  { id: 'hip-thrust', pattern: 'hinge', en: 'Glute bridge / hip thrust', tr: 'Kalça köprüsü', spec: '3 × 12', cue: { en: 'Squeeze glutes at the top', tr: 'Tepede kalçayı sık' } },
  { id: 'kettlebell-swing', pattern: 'hinge', en: 'Kettlebell swing', tr: 'Kettlebell salınım', spec: '4 × 15', cue: { en: 'Explosive hips, not a squat', tr: 'Patlayıcı kalça, çömelme değil' } },
  // push
  { id: 'pushup', pattern: 'push', en: 'Push-up', tr: 'Şınav', spec: '3 × 8–10', cue: { en: 'On knees or incline to scale', tr: 'Diz üstü veya eğimli başla' } },
  { id: 'bench', pattern: 'push', en: 'Bench / floor press', tr: 'Bench press', spec: '3 × 8–10', cue: { en: 'Full range, control down', tr: 'Tam açıklık, inişi kontrol et' } },
  { id: 'ohp', pattern: 'push', en: 'Overhead press', tr: 'Omuz press', spec: '3 × 10', cue: { en: 'Strict, no back arch', tr: 'Sıkı form, bel kamburu yok' } },
  { id: 'incline-db', pattern: 'push', en: 'Incline dumbbell press', tr: 'Eğimli dumbbell press', spec: '3 × 10', cue: { en: 'Upper chest & shoulders', tr: 'Üst göğüs & omuz' } },
  // pull
  { id: 'row', pattern: 'pull', en: 'Dumbbell row', tr: 'Dumbbell kürek', spec: '3 × 10', cue: { en: 'Squeeze shoulder blades', tr: 'Kürek kemiklerini sık' } },
  { id: 'lat-pulldown', pattern: 'pull', en: 'Lat pulldown / pull-up', tr: 'Lat çekiş / barfiks', spec: '3 × 10', cue: { en: 'Assisted if needed', tr: 'Gerekirse destekli' } },
  { id: 'face-pull', pattern: 'pull', en: 'Band face pull', tr: 'Bant face pull', spec: '3 × 15', cue: { en: 'Great for posture', tr: 'Duruş için birebir' } },
  // carry
  { id: 'farmer', pattern: 'carry', en: 'Farmer carry', tr: 'Farmer taşıma', spec: '3 × 30 m', cue: { en: 'Heavy, tall posture, grip + core', tr: 'Ağır, dik duruş, kavrama + kor' } },
  { id: 'suitcase', pattern: 'carry', en: 'Suitcase carry', tr: 'Bavul taşıma', spec: '3 × 20 m / taraf', cue: { en: 'One side — anti-tilt core', tr: 'Tek taraf — yana eğilmeye direnç' } },
  // core (bonus, not one of the 5 but useful)
  { id: 'plank', pattern: 'carry', en: 'Plank', tr: 'Plank', spec: '3 × 30 s', cue: { en: 'Ribs down, breathe', tr: 'Kaburgalar aşağıda, nefes al' } },
];

/* The short essentials — a few high-value moves you can tick off daily.
   Bodyweight-friendly so there's no equipment barrier; one per pattern + core. */
const ESSENTIALS = [
  { id: 'ess-squat', en: 'Squat', tr: 'Çömelme', spec: { en: '2–3 × 10', tr: '2–3 × 10' }, cue: { en: 'Bodyweight or holding a weight', tr: 'Kendi ağırlığın veya elinde ağırlıkla' } },
  { id: 'ess-hinge', en: 'Glute bridge', tr: 'Kalça köprüsü', spec: { en: '2–3 × 12', tr: '2–3 × 12' }, cue: { en: 'Squeeze glutes at the top', tr: 'Tepede kalçayı sık' } },
  { id: 'ess-push', en: 'Push-up', tr: 'Şınav', spec: { en: '2–3 × 8', tr: '2–3 × 8' }, cue: { en: 'On knees or against a wall to start', tr: 'Diz üstü veya duvara karşı başla' } },
  { id: 'ess-pull', en: 'Row', tr: 'Kürek çekme', spec: { en: '2–3 × 12', tr: '2–3 × 12' }, cue: { en: 'Band or a dumbbell / water bottle', tr: 'Bant ya da dumbbell / su şişesi' } },
  { id: 'ess-carry', en: 'Carry', tr: 'Ağırlık taşıma', spec: { en: '2–3 × 20 m', tr: '2–3 × 20 m' }, cue: { en: 'Something heavy, walk tall', tr: 'Ağır bir şey tut, dik yürü' } },
  { id: 'ess-core', en: 'Plank', tr: 'Plank', spec: { en: '2–3 × 30 s', tr: '2–3 × 30 sn' }, cue: { en: 'Ribs down, breathe', tr: 'Kaburgalar aşağıda, nefes al' } },
];

function StrengthFocus({ lunara, api, dk = TODAY_KEY }) {
  const doneToday = (lunara.routineDone || {})[dk] || {};
  const doneCount = ESSENTIALS.filter(e => doneToday[e.id]).length;
  const [showMore, setShowMore] = React.useState(false);

  // Optional custom picks from the fuller library (kept behind "more")
  const routine = lunara.routine || [];
  const inRoutine = id => routine.includes(id);
  const chosen = routine.map(id => EXERCISE_LIBRARY.find(e => e.id === id)).filter(Boolean);
  const [openPat, setOpenPat] = React.useState('squat');

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <span style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--bone)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon d={MOVE_ICON.lift} size={17} stroke="var(--accent)"/>
        </span>
        <div className="eyebrow">{t('PERIMENOPAUSE PRIORITY', 'PERİMENOPOZDA ÖNCELİK')}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <h3 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 25, margin: '6px 0 8px', letterSpacing: '-0.01em' }}>{t('Strength', 'Kuvvet')}</h3>
        <span style={{ fontSize: 11.5, fontFamily: 'var(--mono)', color: doneCount ? 'var(--accent)' : 'var(--muted)' }}>{doneCount}/{ESSENTIALS.length} {t('done today', 'bugün yapıldı')}</span>
      </div>
      <p style={{ fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.6, margin: '0 0 16px', maxWidth: 620 }}>
        {t('You don’t need hours. A few key moves, 2–3 times a week, protect muscle and bone as estrogen falls. Pick what fits your day and tick it off.',
           'Saatlerce gerekmez. Birkaç temel hareket, haftada 2–3 kez — östrojen düşerken kası ve kemiği korur. Gününe uyanı yap, işaretle.')}
      </p>

      {/* Essentials checklist — the short, everyday list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {ESSENTIALS.map(e => {
          const done = !!doneToday[e.id];
          return (
            <button key={e.id} onClick={() => api.toggleRoutineDone(dk, e.id)}
              aria-label={done ? t('Mark not done', 'Yapılmadı işaretle') : t('Mark done', 'Yapıldı işaretle')}
              style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 12, alignItems: 'center', padding: '11px 12px', width: '100%', textAlign: 'left', cursor: 'pointer',
                borderRadius: 10, background: done ? 'var(--accent-soft)' : 'var(--bone)', boxShadow: done ? 'inset 0 0 0 1px var(--accent)' : 'none' }}>
              <span style={{ width: 26, height: 26, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: done ? 'var(--accent)' : 'transparent', boxShadow: done ? 'none' : 'inset 0 0 0 1.5px var(--line)' }}>
                {done && <Icon d={ICONS.check} size={14} stroke="var(--ivory)" sw={2.4}/>}
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: done ? 'var(--muted)' : 'var(--ink)', textDecoration: done ? 'line-through var(--muted-2)' : 'none' }}>{t(e.en, e.tr)}</div>
                <div style={{ fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.4 }}>{t(e.cue.en, e.cue.tr)}</div>
              </div>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--ink-2)', whiteSpace: 'nowrap' }}>{t(e.spec.en, e.spec.tr)}</span>
            </button>
          );
        })}
      </div>

      {/* Chosen extras from the library, if any — same daily tick */}
      {chosen.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
          {chosen.map(e => {
            const done = !!doneToday[e.id];
            return (
              <div key={e.id} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', gap: 10, alignItems: 'center', padding: '10px 12px', borderRadius: 10,
                background: done ? 'var(--accent-soft)' : 'var(--card)', boxShadow: done ? 'inset 0 0 0 1px var(--accent)' : 'inset 0 0 0 1px var(--line-soft)' }}>
                <button onClick={() => api.toggleRoutineDone(dk, e.id)} aria-label={done ? t('Mark not done', 'Yapılmadı işaretle') : t('Mark done', 'Yapıldı işaretle')}
                  style={{ width: 26, height: 26, borderRadius: 8, flexShrink: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: done ? 'var(--accent)' : 'transparent', boxShadow: done ? 'none' : 'inset 0 0 0 1.5px var(--line)' }}>
                  {done && <Icon d={ICONS.check} size={14} stroke="var(--ivory)" sw={2.4}/>}
                </button>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: done ? 'var(--muted)' : 'var(--ink)', textDecoration: done ? 'line-through var(--muted-2)' : 'none' }}>{t(e.en, e.tr)}</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-2)', whiteSpace: 'nowrap' }}>{e.spec}</span>
                <button onClick={() => api.toggleRoutineEx(e.id)} aria-label={t('Remove', 'Çıkar')}
                  style={{ width: 24, height: 24, borderRadius: 7, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon d="M6 6l12 12M18 6L6 18" size={13} stroke="var(--muted)" sw={1.8}/>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Optional: fuller library, collapsed by default so the screen stays short */}
      <button onClick={() => setShowMore(s => !s)}
        style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', cursor: 'pointer', fontSize: 12.5, color: 'var(--muted)', fontFamily: 'var(--sans)' }}>
        <Icon d={showMore ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'} size={14} stroke="var(--muted)"/>
        {t('More exercises (optional)', 'Daha fazla hareket (opsiyonel)')}
      </button>
      {showMore && (
        <div className="fade-up" style={{ marginTop: 10, display: 'flex', flexDirection: 'column' }}>
          {PATTERNS.map((p, i) => {
            const on = openPat === p.key;
            const exs = EXERCISE_LIBRARY.filter(e => e.pattern === p.key);
            return (
              <div key={p.key} style={{ borderBottom: i < PATTERNS.length - 1 ? '1px solid var(--line-soft)' : 'none' }}>
                <button onClick={() => setOpenPat(on ? '' : p.key)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0', width: '100%', textAlign: 'left', background: 'transparent', cursor: 'pointer' }}>
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{t(p.en, p.tr)}</span>
                  <span style={{ fontSize: 10.5, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>{t(p.why.en, p.why.tr)}</span>
                  <Icon d={on ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'} size={15} stroke="var(--muted)"/>
                </button>
                {on && (
                  <div className="fade-up" style={{ padding: '2px 0 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {exs.map(e => {
                      const added = inRoutine(e.id);
                      return (
                        <button key={e.id} onClick={() => api.toggleRoutineEx(e.id)}
                          style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 12, alignItems: 'center', padding: '10px 12px', width: '100%', textAlign: 'left', cursor: 'pointer',
                            borderRadius: 10, background: added ? 'var(--accent-soft)' : 'var(--bone)', boxShadow: added ? 'inset 0 0 0 1px var(--accent)' : 'none' }}>
                          <span style={{ width: 22, height: 22, borderRadius: 7, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: added ? 'var(--accent)' : 'transparent', boxShadow: added ? 'none' : 'inset 0 0 0 1.5px var(--line)' }}>
                            {added && <Icon d={ICONS.check} size={13} stroke="var(--ivory)" sw={2.2}/>}
                          </span>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{t(e.en, e.tr)}</div>
                            <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.4 }}>{t(e.cue.en, e.cue.tr)}</div>
                          </div>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--ink-2)', whiteSpace: 'nowrap' }}>{e.spec}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

/* ════════════════ KEGEL / pelvic-floor trainer ════════════════ */
const KEGEL_ROUTINES = {
  long:  { key: 'long',  labelEn: 'Long holds',   labelTr: 'Uzun tutuşlar',   reps: 8,  squeeze: 5, release: 5, descEn: 'endurance', descTr: 'dayanıklılık' },
  quick: { key: 'quick', labelEn: 'Quick flicks', labelTr: 'Hızlı kasılmalar', reps: 12, squeeze: 1, release: 2, descEn: 'fast response', descTr: 'hızlı tepki' },
};

function kegelStreak(kegelLog) {
  const key = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const has = k => kegelLog[k] && ((kegelLog[k].long || 0) + (kegelLog[k].quick || 0)) > 0;
  const d = new Date(TODAY_DATE);
  if (!has(key(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (has(key(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

function KegelTrainer({ lunara, api, dk = TODAY_KEY }) {
  const [run, setRun] = React.useState(null);
  const [seq, setSeq] = React.useState([]);
  const [idx, setIdx] = React.useState(0);
  const [left, setLeft] = React.useState(0);
  const [saved, setSaved] = React.useState('');

  React.useEffect(() => {
    if (!run) return;
    if (idx >= seq.length) {
      if (api && api.logKegel) api.logKegel(dk, run.key);
      setSaved(run.key);
      setRun(null);
      const to = setTimeout(() => setSaved(''), 2600);
      return () => clearTimeout(to);
    }
    setLeft(seq[idx].dur);
    const iv = setInterval(() => {
      setLeft(l => { if (l <= 1) { clearInterval(iv); setIdx(i => i + 1); return 0; } return l - 1; });
    }, 1000);
    return () => clearInterval(iv);
  }, [run, idx, seq]);

  const start = (r) => {
    const s = [];
    for (let i = 0; i < r.reps; i++) { s.push({ phase: 'squeeze', dur: r.squeeze }); s.push({ phase: 'release', dur: r.release }); }
    setSeq(s); setIdx(0); setRun(r);
  };
  const stop = () => { setRun(null); setSeq([]); setIdx(0); };

  const kl = lunara.kegelLog || {};
  const todayK = kl[dk] || {};
  const todayTotal = (todayK.long || 0) + (todayK.quick || 0);
  const streak = kegelStreak(kl);

  const phase = run && seq[idx] ? seq[idx].phase : null;
  const rep = run ? Math.floor(idx / 2) + 1 : 0;
  const scale = phase === 'squeeze' ? 1 : 0.55;

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--bone)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon d={ICONS.heart} size={16} stroke="var(--accent)"/>
          </span>
          <div className="eyebrow">{t('Pelvic floor · Kegel', 'Pelvik taban · Kegel')}</div>
        </div>
        <div style={{ display: 'flex', gap: 14, alignItems: 'baseline' }}>
          <span style={{ fontSize: 11.5, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>{t('today', 'bugün')}: {todayTotal}</span>
          {streak >= 2 && <span style={{ fontSize: 11.5, color: 'var(--accent)', fontFamily: 'var(--mono)' }}>{streak} {t('day streak', 'gün seri')}</span>}
        </div>
      </div>

      {!run ? (
        <>
          <p style={{ fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.6, margin: '10px 0 4px', maxWidth: 620 }}>
            {t('These muscles weaken as estrogen drops. Training them reduces leaks, lowers prolapse risk, and supports core strength and intimacy. A couple of sets a day is enough — consistency is what counts.',
               'Bu kaslar östrojen düştükçe zayıflar. Onları çalıştırmak idrar kaçırmayı azaltır, sarkma riskini düşürür, kor gücünü ve cinsel işlevi destekler. Günde birkaç set yeterli — düzen esastır.')}
          </p>
          <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5, margin: '0 0 16px', fontStyle: 'italic' }}>
            {t('How: don’t hold your breath. Lift “as if stopping the flow of urine” — without squeezing belly, glutes or thighs — then fully release.',
               'Nasıl: nefesini tutma. Karın, kalça ve bacakları kasmadan, “idrarı tutar gibi” içeri-yukarı sık, sonra tamamen bırak.')}
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {Object.values(KEGEL_ROUTINES).map(r => (
              <button key={r.key} onClick={() => start(r)} style={{
                flex: '1 1 200px', textAlign: 'left', cursor: 'pointer', padding: '14px 16px', borderRadius: 14,
                background: 'var(--bone)', boxShadow: 'inset 0 0 0 1px var(--line-soft)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>{t(r.labelEn, r.labelTr)}</span>
                  <Icon d="M8 5v14l11-7z" size={15} stroke="none" fill="var(--accent)"/>
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--muted)', fontFamily: 'var(--mono)', marginTop: 4 }}>
                  {r.reps} × ({r.squeeze}{t('s hold','sn sık')} / {r.release}{t('s rest','sn bırak')}) · {t(r.descEn, r.descTr)}
                </div>
              </button>
            ))}
          </div>
          {saved && (
            <div className="fade-up" style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--signal-good)', fontFamily: 'var(--serif)', fontStyle: 'italic' }}>
              <Icon d={ICONS.check} size={14} stroke="var(--signal-good)" sw={2}/> {t('Set logged ✓', 'Set kaydedildi ✓')}
            </div>
          )}
        </>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '18px 0 8px' }}>
          <div style={{ width: 180, height: 180, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid var(--line-soft)' }}/>
            <div style={{
              width: 150, height: 150, borderRadius: '50%',
              background: phase === 'squeeze' ? 'var(--accent)' : 'var(--accent-soft)',
              transform: `scale(${scale})`, transition: `transform ${seq[idx] ? seq[idx].dur : 0.4}s ease-in-out, background 0.4s ease`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontFamily: 'var(--serif)', fontSize: 44, color: 'var(--ivory)' }}>{left}</span>
            </div>
          </div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 28, color: 'var(--ink)', marginBottom: 4 }}>
            {phase === 'squeeze' ? t('Squeeze', 'Sık') : t('Release', 'Bırak')}
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--muted)', fontFamily: 'var(--mono)', marginBottom: 18 }}>
            {t('rep', 'tekrar')} {rep} / {run.reps}
          </div>
          <button onClick={stop} style={{
            padding: '10px 22px', borderRadius: 999, cursor: 'pointer',
            border: '1px solid var(--line)', background: 'transparent', color: 'var(--ink-2)', fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 600,
          }}>{t('Stop', 'Durdur')}</button>
        </div>
      )}
    </Card>
  );
}

/* ════════════════ Daily jumps — bone loading ════════════════ */
const JUMP_GOAL = 100;
function jumpStreak(jumpLog) {
  const key = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const has = k => (jumpLog[k] || 0) >= JUMP_GOAL;
  const d = new Date(TODAY_DATE);
  if (!has(key(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (has(key(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

function JumpTrainer({ lunara, api, dk = TODAY_KEY }) {
  const jl = lunara.jumpLog || {};
  const count = jl[dk] || 0;
  const pct = Math.min(1, count / JUMP_GOAL);
  const done = count >= JUMP_GOAL;
  const streak = jumpStreak(jl);
  const R = 52, C = 2 * Math.PI * R;

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--bone)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon d={ICONS.arrowUp} size={16} stroke="var(--accent)" sw={2}/>
          </span>
          <div className="eyebrow">{t('Daily jumps · bone loading', 'Günlük zıplama · kemik yüklemesi')}</div>
        </div>
        {streak >= 2 && <span style={{ fontSize: 11.5, color: 'var(--accent)', fontFamily: 'var(--mono)' }}>{streak} {t('day streak', 'gün seri')}</span>}
      </div>

      <p style={{ fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.6, margin: '10px 0 4px', maxWidth: 620 }}>
        {t('Jumping is impact your bones respond to — the quick loading signals them to hold density, which matters most as estrogen falls. Aim for 100 jumps a day, in any sets you like.',
           'Zıplama, kemiklerin yanıt verdiği bir darbedir — bu ani yüklenme onlara yoğunluğu koruma sinyali verir; östrojen düştükçe en çok bu önemli. Günde 100 zıplama hedefle, istediğin setlerde böl.')}
      </p>
      <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5, margin: '0 0 16px', fontStyle: 'italic' }}>
        {t('Land soft through the whole foot, knees slightly bent. Skip if you have osteoporosis, a fracture, or pelvic-floor symptoms — ask your doctor first.',
           'Ayağın tümüne yumuşak in, dizler hafif bükük. Osteoporoz, kırık ya da pelvik taban şikâyetin varsa yapma — önce doktoruna sor.')}
      </p>

      <div style={{ display: 'flex', gap: 22, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* progress ring */}
        <div style={{ position: 'relative', width: 124, height: 124, flexShrink: 0 }}>
          <svg width="124" height="124" viewBox="0 0 124 124">
            <circle cx="62" cy="62" r={R} fill="none" stroke="var(--bone)" strokeWidth="10"/>
            <circle cx="62" cy="62" r={R} fill="none" stroke={done ? 'var(--signal-good)' : 'var(--accent)'} strokeWidth="10"
              strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - pct)}
              transform="rotate(-90 62 62)" style={{ transition: 'stroke-dashoffset 400ms ease' }}/>
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'var(--serif)', fontSize: 30, color: 'var(--ink)', lineHeight: 1 }}>{count}</span>
            <span style={{ fontSize: 10.5, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>/ {JUMP_GOAL}</span>
          </div>
        </div>

        {/* controls */}
        <div style={{ flex: '1 1 240px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[10, 25, 50].map(n => (
              <button key={n} onClick={() => api.addJumps(dk, n)}
                style={{ flex: '1 1 70px', padding: '13px 0', borderRadius: 12, cursor: 'pointer', background: 'var(--accent)', color: 'var(--ivory)', fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 600 }}>
                +{n}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={() => api.addJumps(dk, -10)} disabled={count === 0}
              style={{ padding: '9px 14px', borderRadius: 10, cursor: count === 0 ? 'default' : 'pointer', background: 'transparent', boxShadow: 'inset 0 0 0 1px var(--line)', color: 'var(--ink-2)', fontSize: 13, fontWeight: 600, opacity: count === 0 ? 0.4 : 1 }}>
              −10
            </button>
            {count > 0 && (
              <button onClick={() => api.resetJumps(dk)}
                style={{ padding: '9px 14px', borderRadius: 10, cursor: 'pointer', background: 'transparent', color: 'var(--muted)', fontSize: 12 }}>
                {t('Reset', 'Sıfırla')}
              </button>
            )}
            {done && (
              <span className="fade-up" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--signal-good)', fontFamily: 'var(--serif)', fontStyle: 'italic' }}>
                <Icon d={ICONS.check} size={14} stroke="var(--signal-good)" sw={2}/> {t('Goal reached ✓', 'Hedefe ulaşıldı ✓')}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

/* Cycle-phase selector + intro band — shared by Movement and Nutrition screens */
function PhaseGuideHeader({ sel, setSel, live, cycleLength }) {
  return (
    <>
      <div className="mb-phasesel" style={{ display: 'flex', gap: 10 }}>
        {Object.entries(PHASE_GUIDE).map(([k, p]) => {
          const on = k === sel;
          const isLive = k === live;
          return (
            <button key={k} onClick={() => setSel(k)}
              style={{
                flex: 1, textAlign: 'left', cursor: 'pointer',
                padding: '14px 16px', borderRadius: 14,
                background: on ? 'var(--card)' : 'var(--bone)',
                boxShadow: on ? 'var(--shadow-soft)' : 'none',
                border: `1px solid ${on ? 'var(--line)' : 'transparent'}`,
                borderTop: `3px solid ${on ? PHASE_TINT[k] : 'transparent'}`,
                transition: 'all 160ms ease',
              }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: PHASE_TINT[k] }}/>
                <span style={{ fontSize: 13.5, fontWeight: on ? 700 : 500, color: on ? 'var(--ink)' : 'var(--ink-2)' }}>{tx(p.label)}</span>
                {isLive && <span style={{ fontSize: 9, fontFamily: 'var(--mono)', letterSpacing: '0.08em', color: 'var(--accent)', marginLeft: 'auto' }}>● {t('NOW','ŞİMDİ')}</span>}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>{phaseRange(k, cycleLength)} · {tx(p.energy)} {t('energy','enerji')}</div>
            </button>
          );
        })}
      </div>
      <Card pad={0} style={{ overflow: 'hidden', display: 'grid', gridTemplateColumns: 'auto 1fr' }}>
        <div style={{ width: 8, background: PHASE_TINT[sel] }}/>
        <div style={{ padding: '22px 28px' }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>{tx(PHASE_GUIDE[sel].label)} · {phaseRange(sel, cycleLength)}</div>
          <p style={{ fontFamily: 'var(--serif)', fontSize: 21, lineHeight: 1.4, margin: 0, color: 'var(--ink)', textWrap: 'pretty', fontStyle: 'italic' }}>
            {tx(PHASE_GUIDE[sel].tagline)}
          </p>
        </div>
      </Card>
    </>
  );
}

function GuidanceFootnote() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', color: 'var(--muted-2)', fontSize: 11.5 }}>
      <Icon d={ICONS.heart} size={13} stroke="var(--muted-2)"/>
      <span style={{ fontStyle: 'italic', fontFamily: 'var(--serif)' }}>{t('General guidance, not medical advice. Your care team tailors this to you.', 'Genel rehberlik, tıbbi tavsiye değildir. Bakım ekibin bunu sana göre uyarlar.')}</span>
    </div>
  );
}

/* ═══════════ MOVEMENT screen — strength, pelvic floor, bone + cycle-move ═══════════ */
function MoveScreen({ lunara, api, logDate, setLogDate }) {
  /* Ekran tarih almıyordu ve içindeki her kayıt TODAY_KEY'e sabitti:
     rutin egzersizler, Kegel, zıplama. Dünkü antrenmanı bugün girmek
     mümkün değildi. Belirtiler ve İlaçlar'daki gibi bir tarih değiştirici
     var artık; faz rehberi de seçilen güne göre. Seriler (streak) bugüne
     çıpalı kalıyor — onlar istatistik, kayıt değil. */
  const dk = logDate || TODAY_KEY;
  const today = new Date(dk + 'T00:00:00');
  const isToday = dk === TODAY_KEY;
  const day = cycleDayFrom(lunara.periodStart, today, cycleLenOf(lunara));
  // Çapa yoksa "şimdi buradasın" işareti konmaz; içerik yine gezilebilir olsun
  // diye seçili faz menstrüelden başlar.
  const livePh = phaseOf(day, cycleLenOf(lunara));
  const live = livePh ? livePh.key : null;
  const [sel, setSel] = React.useState(live || 'menstrual');
  const g = PHASE_GUIDE[sel];
  const tint = PHASE_TINT[sel];
  const [openPlan, setOpenPlan] = React.useState(0);
  React.useEffect(() => { setOpenPlan(0); }, [sel]);

  return (
    <div style={{ padding: '18px 36px 48px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Diğer ekranlardaki ile aynı sıkıştırma: başlık ~180 px yiyordu ve
          alt bar zaten hangi bölümde olduğunu söylüyor. Ayrıca bar
          "Hareketler" derken başlık "Hareket" diyordu. */}
      <div className="eyebrow" style={{ marginBottom: 2 }}>
        {t('STRENGTH · PELVIC FLOOR · BONE', 'KUVVET · PELVİK TABAN · KEMİK')}
      </div>
      {setLogDate && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <DateNav date={dk} onChange={setLogDate}/>
          <span style={{ fontSize: 12, color: 'var(--muted)', fontStyle: 'italic', fontFamily: 'var(--serif)' }}>
            {isToday ? t('Log for another day too', 'Başka bir gün için de kaydedebilirsin') : t('Logging a past day', 'Geçmiş bir güne kaydediyorsun')}
          </span>
        </div>
      )}

      {/* Perimenopause priorities — order: bone loading, pelvic floor, strength */}
      <JumpTrainer lunara={lunara} api={api} dk={dk}/>
      <KegelTrainer lunara={lunara} api={api} dk={dk}/>
      <StrengthFocus lunara={lunara} api={api} dk={dk}/>

      {/* Cycle-phase movement guidance (secondary — for the days you do cycle) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0 -4px' }}>
        <div style={{ height: 1, flex: 1, background: 'var(--line-soft)' }}/>
        <span className="eyebrow" style={{ color: 'var(--muted-2)' }}>{t('If you’re cycling · day ' + day, 'Döngün varsa · ' + day + '. gün')}</span>
        <div style={{ height: 1, flex: 1, background: 'var(--line-soft)' }}/>
      </div>

      <ReferansBolum
        ozet={t(`Today: ${tx(g.move.headline)}.`, `Bugün: ${tx(g.move.headline)}.`)}
        acKapaEtiketi={t('See the full phase guide', 'Tüm faz rehberini gör')}>
        <PhaseGuideHeader sel={sel} setSel={setSel} live={live} cycleLength={cycleLenOf(lunara)}/>

        {/* MOVE column (full width now) */}
        <div>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <span style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--bone)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon d={ICONS.pulse} size={16} stroke="var(--accent)"/>
              </span>
              <div className="eyebrow">{t('Movement','Hareket')}</div>
            </div>
            <h3 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 23, margin: '6px 0 4px', letterSpacing: '-0.01em' }}>{tx(g.move.headline)}</h3>
            {g.move.session && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 16 }}>
                <Icon d={ICONS.clock} size={13} stroke="var(--muted)"/>
                <span style={{ fontSize: 11.5, color: 'var(--muted)', fontFamily: 'var(--mono)', letterSpacing: '0.03em' }}>{tx(g.move.session)}</span>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {g.move.items.map((it, i) => {
                const open = openPlan === i;
                return (
                  <div key={i} style={{ borderBottom: i < g.move.items.length - 1 ? '1px solid var(--line-soft)' : 'none' }}>
                    <button onClick={() => setOpenPlan(open ? -1 : i)}
                      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 0', width: '100%', textAlign: 'left', background: 'transparent', cursor: 'pointer' }}>
                      <span style={{ width: 40, height: 40, borderRadius: 12, background: tint + '33', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon d={MOVE_ICON[it.icon]} size={19} stroke="var(--ink)" sw={1.5}/>
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--ink)' }}>{tx(it.name)}</div>
                        <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.4 }}>{tx(it.detail)}</div>
                      </div>
                      {it.plan && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          <span style={{ fontSize: 10.5, color: 'var(--accent)', fontFamily: 'var(--mono)', letterSpacing: '0.03em' }}>{tx(it.plan.meta)}</span>
                          <Icon d={open ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'} size={15} stroke="var(--muted)"/>
                        </div>
                      )}
                    </button>
                    {it.plan && open && (
                      <div className="fade-up" style={{ padding: '4px 0 16px 54px', display: 'flex', flexDirection: 'column', gap: 0 }}>
                        {it.plan.steps.map((s, j) => (
                          <div key={j} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'baseline', padding: '9px 0', borderBottom: j < it.plan.steps.length - 1 ? '1px solid var(--line-soft)' : 'none' }}>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{tx(s.phase)}</div>
                              <div style={{ fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.4 }}>{tx(s.sub)}</div>
                            </div>
                            <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink-2)', background: 'var(--bone)', padding: '4px 9px', borderRadius: 7, whiteSpace: 'nowrap' }}>{tx(s.spec)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 14, padding: '12px 14px', borderRadius: 12, background: 'var(--bone)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <Icon d={ICONS.spark} size={15} stroke="var(--accent)" sw={1.6}/>
              <span style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.5 }}>{tx(g.move.avoid)}</span>
            </div>
          </Card>
        </div>
      </ReferansBolum>

      <GuidanceFootnote/>
    </div>
  );
}

/* Protein target + daily counter. Perimenopause/menopause needs more protein
   (~1.2–1.6 g/kg) to fight sarcopenia; muscle synthesis is best at 25–30 g/meal.
   Target auto-computed from profile weight; falls back to a general range. */
function ProteinTracker({ lunara, api }) {
  const weight = lunara.profile && lunara.profile.weight;
  // 1.4 g/kg midpoint of the 1.2–1.6 evidence range; rounded to nearest 5
  const target = weight ? Math.round((weight * 1.4) / 5) * 5 : 100;
  const rangeLo = weight ? Math.round(weight * 1.2) : 90;
  const rangeHi = weight ? Math.round(weight * 1.6) : 110;
  const eaten = (lunara.proteinLog || {})[TODAY_KEY] || 0;
  const pct = Math.min(1, eaten / target);
  const done = eaten >= target;

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--bone)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon d={MOVE_ICON.lift} size={16} stroke="var(--accent)"/>
          </span>
          <div className="eyebrow">{t('Protein today', 'Bugün protein')}</div>
        </div>
        <span style={{ fontSize: 11.5, fontFamily: 'var(--mono)', color: 'var(--muted)' }}>
          {t('target', 'hedef')} {rangeLo}–{rangeHi} g
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '8px 0 10px' }}>
        <span style={{ fontFamily: 'var(--serif)', fontSize: 30, color: done ? 'var(--signal-good)' : 'var(--ink)' }}>{eaten}</span>
        <span style={{ fontSize: 13, color: 'var(--muted)' }}>/ {target} g</span>
        {done && <span style={{ marginLeft: 'auto', fontSize: 12.5, color: 'var(--signal-good)', fontFamily: 'var(--serif)', fontStyle: 'italic' }}>{t('Goal reached ✓', 'Hedefe ulaşıldı ✓')}</span>}
      </div>
      {/* progress bar */}
      <div style={{ height: 8, borderRadius: 6, background: 'var(--bone)', overflow: 'hidden', marginBottom: 14 }}>
        <div style={{ height: '100%', width: `${pct * 100}%`, borderRadius: 6, background: done ? 'var(--signal-good)' : 'var(--accent)', transition: 'width 300ms ease' }}/>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {[10, 25, 30].map(n => (
          <button key={n} onClick={() => api.addProtein(TODAY_KEY, n)}
            style={{ flex: '1 1 60px', padding: '11px 0', borderRadius: 11, cursor: 'pointer', background: 'var(--accent)', color: 'var(--ivory)', fontSize: 13.5, fontWeight: 600 }}>
            +{n} g
          </button>
        ))}
        <button onClick={() => api.addProtein(TODAY_KEY, -10)} disabled={eaten === 0}
          style={{ padding: '9px 13px', borderRadius: 10, cursor: eaten === 0 ? 'default' : 'pointer', background: 'transparent', boxShadow: 'inset 0 0 0 1px var(--line)', color: 'var(--ink-2)', fontSize: 13, fontWeight: 600, opacity: eaten === 0 ? 0.4 : 1 }}>
          −10
        </button>
        {eaten > 0 && (
          <button onClick={() => api.resetProtein(TODAY_KEY)} style={{ padding: '9px 10px', borderRadius: 10, cursor: 'pointer', background: 'transparent', color: 'var(--muted)', fontSize: 12 }}>
            {t('Reset', 'Sıfırla')}
          </button>
        )}
      </div>

      <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5, margin: '14px 0 0', fontStyle: 'italic', fontFamily: 'var(--serif)' }}>
        {weight
          ? t('Aim for 25–30 g per meal to protect muscle. Pair with strength training.',
              'Kası korumak için öğün başına 25–30 g hedefle. Kuvvet antrenmanıyla birleştir.')
          : t('Add your weight in Profile for a personal target. General aim: 25–30 g per meal.',
              'Kişisel hedef için Profil’den kilonu ekle. Genel hedef: öğün başına 25–30 g.')}
      </p>
    </Card>
  );
}

/* Food journal — free-text meals, back-datable like every other log */
function MealLog({ lunara, api, dk, setDk }) {
  const [text, setText] = React.useState('');
  const isToday = dk === getTodayKey();
  const entries = (lunara.mealLog || {})[dk] || [];
  const add = () => { const v = text.trim(); if (v) { api.addMeal(dk, v); setText(''); } };

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--bone)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon d={ICONS.book} size={16} stroke="var(--accent)"/>
          </span>
          <div>
            <div className="eyebrow">{t('Food journal', 'Yemek günlüğü')}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{t('Note what you ate — any day', 'Ne yediğini not et — herhangi bir gün')}</div>
          </div>
        </div>
        <DateNav date={dk} onChange={setDk}/>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <input value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') add(); }}
          aria-label={t('What you ate', 'Ne yedin')}
          placeholder={t('e.g. Greek yogurt, walnuts, berries', 'ör. yoğurt, ceviz, yaban mersini')}
          style={{ flex: 1, border: '1px solid var(--line)', borderRadius: 12, padding: '12px 14px', fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--ink)', background: 'var(--ivory)', outline: 'none', boxSizing: 'border-box' }}/>
        <button onClick={add} disabled={!text.trim()}
          style={{ padding: '0 18px', borderRadius: 12, cursor: text.trim() ? 'pointer' : 'default', background: 'var(--accent)', color: 'var(--ivory)', fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 600, opacity: text.trim() ? 1 : 0.5, display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <Icon d={ICONS.plus} size={14} stroke="var(--ivory)" sw={2.2}/> {t('Add', 'Ekle')}
        </button>
      </div>

      {entries.length > 0 ? (
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {entries.map(m => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--line-soft)' }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--muted-2)', width: 42, flexShrink: 0 }}>{m.at}</span>
              <span style={{ flex: 1, fontSize: 13.5, color: 'var(--ink)' }}>{m.text}</span>
              <button onClick={() => api.removeMeal(dk, m.id)} aria-label={t('Remove', 'Sil')}
                style={{ width: 24, height: 24, borderRadius: 7, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon d="M6 6l12 12M18 6L6 18" size={13} stroke="var(--muted)" sw={1.8}/>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ marginTop: 14, fontSize: 12.5, color: 'var(--muted)', fontStyle: 'italic', fontFamily: 'var(--serif)' }}>
          {isToday ? t('Nothing logged yet today.', 'Bugün henüz bir şey girilmedi.') : t('Nothing logged this day.', 'Bu gün için kayıt yok.')}
        </div>
      )}
    </Card>
  );
}

/* ═══════════ NUTRITION screen — cycle-phase eating + seed cycling ═══════════ */
function NourishScreen({ lunara, api }) {
  const today = TODAY_DATE;
  const day = cycleDayFrom(lunara.periodStart, today, cycleLenOf(lunara));
  // Çapa yoksa "şimdi buradasın" işareti konmaz; içerik yine gezilebilir olsun
  // diye seçili faz menstrüelden başlar.
  const livePh = phaseOf(day, cycleLenOf(lunara));
  const live = livePh ? livePh.key : null;
  const [sel, setSel] = React.useState(live || 'menstrual');
  /* Su ve yemek günlüğü aynı tarihi paylaşır: ekranda tek bir tarih seçici
     olsun, "dün" derken ikisi birden geçmişe gitsin. */
  const [dk, setDk] = React.useState(getTodayKey());
  const g = PHASE_GUIDE[sel];
  const tint = PHASE_TINT[sel];

  return (
    <div style={{ padding: '18px 36px 48px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <ScreenHead eyebrow={t('CYCLE-PHASE NUTRITION', 'DÖNGÜ FAZINA GÖRE BESLENME')} title={t('Nutrition', 'Beslenme')}
        right={<span style={{ fontSize: 12.5, color: 'var(--muted)', fontStyle: 'italic', fontFamily: 'var(--serif)' }}>
          {t('Built for perimenopause', 'Perimenopoza göre')}
        </span>} />

      {/* Protein target + counter, then the food journal */}
      <ProteinTracker lunara={lunara} api={api}/>
      <WaterCard lunara={lunara} api={api} dateKey={dk}/>
      <MealLog lunara={lunara} api={api} dk={dk} setDk={setDk}/>

      <ReferansBolum
        ozet={t(`Today: ${tx(g.eat.headline)}.`, `Bugün: ${tx(g.eat.headline)}.`)}
        acKapaEtiketi={t('See the full phase guide', 'Tüm faz rehberini gör')}>
        <PhaseGuideHeader sel={sel} setSel={setSel} live={live} cycleLength={cycleLenOf(lunara)}/>

        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--bone)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon d={ICONS.leaf} size={16} stroke="var(--accent)"/>
            </span>
            <div className="eyebrow">{t('What to eat this phase','Bu fazda ne yenir')}</div>
          </div>
          <h3 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 23, margin: '6px 0 18px', letterSpacing: '-0.01em' }}>{tx(g.eat.headline)}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 24px' }} className="mb-stack">
            {g.eat.items.map((it, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span style={{ fontSize: 9, fontFamily: 'var(--mono)', letterSpacing: '0.04em', color: 'var(--ink-2)', background: tint + '33', padding: '4px 7px', borderRadius: 6, minWidth: 52, textAlign: 'center', marginTop: 1 }}>{it.tag}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{tx(it.name)}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.4 }}>{tx(it.detail)}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, padding: '12px 14px', borderRadius: 12, background: 'var(--accent-soft)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <Icon d={ICONS.drop} size={15} stroke="var(--ink-2)" sw={1.6}/>
            <span style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.5 }}>{tx(g.eat.note)}</span>
          </div>
        </Card>

        {/* Seed cycling — its own card now that nutrition has room */}
        <Card>
          <SeedCycle phaseKey={sel} liveKey={live} tint={tint} standalone cycleLength={cycleLenOf(lunara)}/>
        </Card>
      </ReferansBolum>

      <GuidanceFootnote/>
    </div>
  );
}



/* ── Seed cycling: flax+pumpkin (first half) · sesame+sunflower (second half) ──
   All fields bilingual {en, tr}; SeedCycle renders them with a local t() helper. */
const SEED_CYCLE = {
  first: {
    label: { en: 'First half · menstrual + follicular', tr: 'İlk yarı · menstrüel + foliküler' },
    when: { en: 'Cycle days 1–14', tr: 'Döngünün 1.–14. günleri' },
    why: { en: 'In the follicular phase the body needs more estrogen to build the endometrium (uterine lining). Flax lignans and pumpkin-seed zinc support this first half.',
           tr: 'Foliküler fazda endometriyumun (rahim çeperinin) oluşması için daha fazla östrojene ihtiyaç duyarız. Keten lignanları ve kabak çekirdeğindeki çinko bu ilk yarıyı destekler.' },
    seeds: [
      { name: { en: 'Flaxseed', tr: 'Keten tohumu' }, dose: { en: '1 tbsp ground, daily', tr: 'Günde 1 yemek kaşığı, çekilmiş' }, note: { en: 'Lignans → estrogen support', tr: 'Lignanlar → östrojen desteği' }, hue: 'oklch(0.62 0.07 70)' },
      { name: { en: 'Pumpkin seeds', tr: 'Kabak çekirdeği' }, dose: { en: '1 tbsp ground, daily', tr: 'Günde 1 yemek kaşığı, çekilmiş' }, note: { en: 'Zinc → follicular build', tr: 'Çinko → foliküler gelişim' }, hue: 'oklch(0.55 0.08 145)' },
    ],
  },
  second: {
    label: { en: 'Second half · luteal', tr: 'İkinci yarı · luteal' },
    when: { en: 'Cycle days 15–28', tr: 'Döngünün 15.–28. günleri' },
    why: { en: 'In the luteal phase the corpus luteum starts releasing progesterone — the hormone that begins preparing the uterus for implantation. Sesame and sunflower support this second half.',
           tr: 'Luteal fazda corpus luteum, progesteron salgılamaya başlar. Bu seks hormonu, implantasyon için rahmi hazırlamaya başlar. Susam ve ay çekirdeği bu ikinci yarıyı destekler.' },
    seeds: [
      { name: { en: 'Sesame seeds', tr: 'Susam' }, dose: { en: '1 tbsp ground, daily', tr: 'Günde 1 yemek kaşığı, çekilmiş' }, note: { en: 'Lignans + zinc → progesterone', tr: 'Lignanlar + çinko → progesteron' }, hue: 'oklch(0.60 0.04 60)' },
      { name: { en: 'Sunflower seeds', tr: 'Ay çekirdeği' }, dose: { en: '1 tbsp ground, daily', tr: 'Günde 1 yemek kaşığı, çekilmiş' }, note: { en: 'Vitamin E + selenium → luteal support', tr: 'E vitamini + selenyum → luteal destek' }, hue: 'oklch(0.72 0.10 85)' },
    ],
  },
};

function SeedCycle({ phaseKey, liveKey, tint, standalone, cycleLength }) {
  const half = (phaseKey === 'menstrual' || phaseKey === 'follicular') ? 'first' : 'second';
  /* Aralıklar sabit metin değil, döngü uzunluğundan türüyor: protokol
     ovülasyona bağlı, ve ovülasyon 28 günlük olmayan döngülerde kayar. */
  const b = phaseBounds(cycleLength);
  const g = SEED_CYCLE[half];
  const liveHalf = (liveKey === 'menstrual' || liveKey === 'follicular') ? 'first' : 'second';
  const tb = x => t(x.en, x.tr);   // bilingual field helper
  return (
    <div style={standalone ? {} : { marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--line-soft)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--bone)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon d={ICONS.leaf} size={16} stroke="var(--accent)"/>
          </span>
          <div className="eyebrow">{t('Seed cycling','Tohum döngüsü')}</div>
        </div>
        {half === liveHalf && <span style={{ fontSize: 9, fontFamily: 'var(--mono)', letterSpacing: '0.08em', color: 'var(--accent)' }}>● {t('NOW','ŞİMDİ')}</span>}
      </div>
      <h3 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 23, margin: '8px 0 4px', letterSpacing: '-0.01em' }}>{tb(g.label)}</h3>
      <div style={{ fontSize: 11.5, color: 'var(--muted)', fontFamily: 'var(--mono)', marginBottom: 16 }}>{seedRange(half, cycleLength)}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }} className="mb-stack">
        {g.seeds.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, background: 'var(--bone)' }}>
            <span style={{ width: 38, height: 38, borderRadius: '50%', background: s.hue, flexShrink: 0, boxShadow: 'inset 0 0 0 1px rgba(42,24,16,0.12)' }}/>
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontFamily: 'var(--serif)', fontSize: 17 }}>{tb(s.name)}</span>
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-2)', fontFamily: 'var(--mono)' }}>{tb(s.dose)}</div>
              <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>{tb(s.note)}</div>
            </div>
          </div>
        ))}
      </div>
      <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 14.5, lineHeight: 1.55, color: 'var(--ink-2)', margin: 0 }}>{tb(g.why)}</p>
      {/* whole-cycle timeline */}
      <div style={{ display: 'flex', gap: 6, marginTop: 16 }}>
        {/* Çubuk genişlikleri gerçek bölünmeyi yansıtıyor: 35 günlük bir
            döngüde ilk yarı 21 gün, yani şeridin %60'ı. */}
        <div style={{ flex: b.ov }}>
          <div style={{ height: 6, borderRadius: 6, background: half === 'first' ? 'var(--accent)' : 'var(--line)' }}/>
          <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--mono)', marginTop: 6 }}>
            {t('FLAX + PUMPKIN', 'KETEN + KABAK')} · {t(`D1–${b.ov}`, `G1–${b.ov}`)}
          </div>
        </div>
        <div style={{ flex: b.L - b.ov }}>
          <div style={{ height: 6, borderRadius: 6, background: half === 'second' ? 'var(--accent)' : 'var(--line)' }}/>
          <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--mono)', marginTop: 6, textAlign: 'right' }}>{t('SESAME + SUNFLOWER', 'SUSAM + AY ÇEK.')} · {t(`D${b.ov + 1}–${b.L}`, `G${b.ov + 1}–${b.L}`)}</div>
        </div>
      </div>
    </div>
  );
}
/* Kullanıcının kendi seçtiği güç hareketleri — Hareket ekranında rutine
   eklediği ESSENTIALS kayıtları. Faz önerisinden ayrı bir günlüktür
   (routineDone), o yüzden kendi işaret listesi var. */
function RoutineBlock({ lunara, api }) {
  const rutin = (lunara.routine || []).map(id => ESSENTIALS.find(e => e.id === id)).filter(Boolean);
  const done = (lunara.routineDone || {})[TODAY_KEY] || {};
  const n = rutin.filter(e => done[e.id]).length;
  if (!rutin.length) return null;

  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
        <div className="eyebrow">{t('Your routine', 'Rutinin')}</div>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--muted)' }}>{n}/{rutin.length}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {rutin.map((e, i) => {
          const on = !!done[e.id];
          return (
            <button key={e.id} onClick={() => api.toggleRoutineDone(TODAY_KEY, e.id)}
              aria-pressed={on}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', width: '100%', textAlign: 'left', background: 'transparent', cursor: 'pointer', borderBottom: i < rutin.length - 1 ? '1px solid var(--line-soft)' : 'none' }}>
              <span style={{
                width: 22, height: 22, borderRadius: 7, flexShrink: 0,
                background: on ? 'var(--accent)' : 'transparent',
                boxShadow: on ? 'none' : 'inset 0 0 0 1.5px var(--line)',
                color: 'var(--ivory)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 140ms ease',
              }}>
                {on && <Icon d={ICONS.check} size={13} sw={2.5}/>}
              </span>
              <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: on ? 'var(--muted)' : 'var(--ink)', textDecoration: on ? 'line-through' : 'none' }}>
                {t(e.en, e.tr)}
              </span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--ink-2)', background: 'var(--bone)', padding: '4px 9px', borderRadius: 7, whiteSpace: 'nowrap' }}>{t(e.spec.en, e.spec.tr)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* Referans içeriği için katlanır kabuk. Beslenme ekranı telefonda dokuz kart
   ve 251 kelimeyle açılıyordu, Hareket 369 kelimeyle. İkisi de ayda bir
   okunacak içerik; her gün açılan ekranın onları bir makale gibi karşılaması
   gerekmiyor. Artık tek satırlık bir özetle açılıp istendiğinde genişliyorlar. */
function ReferansBolum({ ozet, acKapaEtiketi, children }) {
  const [acik, setAcik] = React.useState(false);
  return (
    <div>
      <button onClick={() => setAcik(v => !v)} aria-expanded={acik}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 14, padding: '15px 18px', borderRadius: 'var(--r-md)', cursor: 'pointer',
          background: 'var(--bone)', border: 'none', textAlign: 'left',
        }}>
        <span style={{ fontFamily: 'var(--serif)', fontSize: 16, lineHeight: 1.45, color: 'var(--ink)' }}>{ozet}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', whiteSpace: 'nowrap', fontFamily: 'var(--sans)' }}>
          {acik ? t('Hide', 'Gizle') : acKapaEtiketi}
        </span>
      </button>
      {acik && <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 20 }}>{children}</div>}
    </div>
  );
}

function TodayWorkoutCard({ lunara, api, onNav }) {
  const today = TODAY_DATE;
  const day = cycleDayFrom(lunara.periodStart, today, cycleLenOf(lunara));
  const ph = phaseOf(day, cycleLenOf(lunara));
  // Faz bilinmiyorsa genel bir öneri gösterilir ama "şu fazdasın" denmez
  const phKey = ph ? ph.key : 'follicular';
  const g = PHASE_GUIDE[phKey];
  const tint = PHASE_TINT[phKey];
  const primary = g.move.items[0];
  const steps = primary.plan ? primary.plan.steps : [];
  const log = lunara.workoutLog[TODAY_KEY] || {};
  const doneCount = steps.filter((_, i) => log[i]).length;
  const allDone = steps.length > 0 && doneCount === steps.length;
  // Rutin kurulduysa üstte o durur; faz önerisi altında ikincil kalır.
  const rutinVar = ((lunara.routine || []).length > 0);

  return (
    <Card style={{ display: 'flex', flexDirection: 'column' }}>
      {rutinVar && (
        <>
          <div className="eyebrow" style={{ marginBottom: 12 }}>{t("Today's movement", 'Bugünün hareketi')}</div>
          <RoutineBlock lunara={lunara} api={api}/>
          <div style={{ borderTop: '1px solid var(--line-soft)', paddingTop: 16, marginBottom: 4 }}/>
        </>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 4 }}>
            {rutinVar
              ? t('Suggested for this phase', 'Bu faz için öneri')
              : t("Today's movement", 'Bugünün hareketi')}{ph ? <> · {phaseLabel(ph).toLocaleLowerCase(I18N.lang==='tr'?'tr':'en')} {t('phase','fazı')}</> : null}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{ fontFamily: 'var(--serif)', fontSize: 22, letterSpacing: '-0.01em' }}>{tx(primary.name)}</span>
            {primary.plan && <span style={{ fontSize: 11.5, color: 'var(--accent)', fontFamily: 'var(--mono)' }}>{tx(primary.plan.meta)}</span>}
          </div>
        </div>
        <span style={{ width: 44, height: 44, borderRadius: 13, background: tint + '33', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon d={MOVE_ICON[primary.icon]} size={21} stroke="var(--ink)" sw={1.5}/>
        </span>
      </div>

      {/* progress */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ flex: 1, height: 6, borderRadius: 6, background: 'var(--line-soft)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${steps.length ? (doneCount/steps.length)*100 : 0}%`, background: 'var(--accent)', borderRadius: 6, transition: 'width 220ms ease' }}/>
        </div>
        <span style={{ fontSize: 11.5, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>{doneCount}/{steps.length}</span>
      </div>

      {/* steps — checkable */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        {steps.map((s, i) => {
          const on = !!log[i];
          return (
            <button key={i} onClick={() => api.toggleWorkoutStep(TODAY_KEY, i)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', width: '100%', textAlign: 'left', background: 'transparent', cursor: 'pointer', borderBottom: i < steps.length - 1 ? '1px solid var(--line-soft)' : 'none' }}>
              <span style={{
                width: 22, height: 22, borderRadius: 7, flexShrink: 0,
                background: on ? 'var(--accent)' : 'transparent',
                boxShadow: on ? 'none' : 'inset 0 0 0 1.5px var(--line)',
                color: 'var(--ivory)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 140ms ease',
              }}>
                {on && <Icon d={ICONS.check} size={13} sw={2.5}/>}
              </span>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: on ? 'var(--muted)' : 'var(--ink)', textDecoration: on ? 'line-through' : 'none' }}>{tx(s.phase)}</span>
                <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 8 }}>{tx(s.sub)}</span>
              </div>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--ink-2)', background: 'var(--bone)', padding: '4px 9px', borderRadius: 7, whiteSpace: 'nowrap' }}>{tx(s.spec)}</span>
            </button>
          );
        })}
      </div>

      {/* footer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--line-soft)' }}>
        <button onClick={() => api.setWorkoutAll(TODAY_KEY, steps.map((_, i) => i), !allDone)}
          style={{
            padding: '10px 16px', borderRadius: 999, fontSize: 13, fontWeight: 600,
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: allDone ? 'var(--accent-soft)' : 'var(--ink)',
            color: allDone ? 'var(--ink)' : 'var(--ivory)', cursor: 'pointer',
          }}>
          <Icon d={ICONS.check} size={14} sw={2}/> {allDone ? t('Completed today','Bugün tamamlandı') : t('Mark all complete','Tümünü tamamla')}
        </button>
        {onNav && (
          <button onClick={() => onNav('move')} style={{ fontSize: 12.5, color: 'var(--muted)', display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
            {t('Full plan','Tam plan')} <Icon d={ICONS.arrow} size={12}/>
          </button>
        )}
      </div>
    </Card>
  );
}

export { PHASE_GUIDE, MOVE_ICON, MoveScreen, NourishScreen, SEED_CYCLE, SeedCycle, TodayWorkoutCard,
         ProteinTracker, MealLog, KegelTrainer, JumpTrainer, StrengthFocus, RoutineBlock, GuidanceFootnote };
