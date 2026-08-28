import React from 'react';
import { I18N, t } from './i18n';

/* dict.jsx — Lunara içerik sözlüğü (EN → TR)
   tx(en): aktif dil TR ise sözlükten karşılığı, yoksa İngilizce döner.
   İçerik (egzersiz/beslenme/takviye) verisi yeniden yapılandırılmadan
   render anında çevrilir. i18n.jsx'ten sonra yüklenir. */
/* eslint-disable */

const DICT_TR = {
  // ── Phase prose ──
  'Menstrual': 'Menstrüel', 'Follicular': 'Folliküler', 'Ovulation': 'Ovulasyon', 'Luteal': 'Luteal',
  'Days 1–5': '1.–5. günler', 'Days 6–13': '6.–13. günler', 'Days 14–18': '14.–18. günler', 'Days 19–32': '19.–32. günler',
  'Low': 'Düşük', 'Rising': 'Yükselen', 'Peak': 'Zirve', 'Winding down': 'Yavaşlayan',
  'Rest is productive. Hormones are at their floor — meet the body gently.':
    'Dinlenmek verimlidir. Hormonlar en dipte — bedene nazik davran.',
  'Estrogen climbs — energy, mood, and coordination rise with it. Build and try new things.':
    'Östrojen yükselir — enerji, ruh hali ve koordinasyon onunla artar. İnşa et, yenilikler dene.',
  'The high point — strength, confidence, and verbal recall peak. Use the momentum.':
    'Doruk nokta — güç, özgüven ve sözel hafıza zirvede. Bu ivmeyi kullan.',
  'Progesterone rises, then both hormones fall. Appetite and cravings climb — be kind and steady.':
    'Progesteron yükselir, sonra iki hormon da düşer. İştah ve istek artar — nazik ve istikrarlı ol.',

  // ── Move headlines / session / avoid ──
  'Restorative & gentle': 'Onarıcı & nazik',
  'Build & challenge': 'İnşa et & zorla',
  'Peak performance': 'Zirve performans',
  'Steady & grounding': 'İstikrarlı & topraklayıcı',
  '20–35 min · RPE 2–3 / 10': '20–35 dk · RPE 2–3 / 10',
  '40–55 min · RPE 6–7 / 10': '40–55 dk · RPE 6–7 / 10',
  '35–50 min · RPE 8–9 / 10': '35–50 dk · RPE 8–9 / 10',
  '30–45 min · RPE 4–6 / 10': '30–45 dk · RPE 4–6 / 10',
  'Skip heavy lifting and HIIT if you feel depleted — they can raise cortisol now.':
    'Tükenmiş hissediyorsan ağır kaldırma ve HIIT’i atla — şimdi kortizolü yükseltebilirler.',
  'A good window to push — just keep recovery and sleep on track.':
    'Zorlamak için iyi bir pencere — yeterince toparlanma ve uykuya dikkat et.',
  'Joints are slightly laxer near ovulation — warm up thoroughly to protect knees.':
    'Ovulasyona yakın eklemler biraz daha gevşek — dizleri korumak için iyice ısın.',
  'Late luteal: swap HIIT for steady work — recovery slows and cortisol is sensitive.':
    'Geç luteal: HIIT yerine istikrarlı çalış — toparlanma yavaşlar, kortizol hassastır.',

  // ── Move item names + details ──
  'Walking': 'Yürüyüş',
  '20–30 min, easy pace, outdoors if you can': '20–30 dk, kolay tempo, mümkünse açık havada',
  'Yin / restorative yoga': 'Yin / onarıcı yoga',
  'Hip openers, supported forward folds': 'Kalça açıcılar, destekli öne eğilmeler',
  'Mobility & stretching': 'Mobilite & esneme',
  'Loosen lower back and pelvis': 'Bel ve pelvisi gevşet',
  'Strength training': 'Kuvvet antrenmanı',
  'Progressive overload — muscle responds well now': 'Aşamalı yüklenme — kas şimdi iyi yanıt verir',
  'Cardio & dance': 'Kardiyo & dans',
  'Higher intensity feels easier': 'Yüksek yoğunluk daha kolay gelir',
  'Try something new': 'Yeni bir şey dene',
  'Skill-learning peaks with rising estrogen': 'Beceri öğrenimi yükselen östrojenle zirve yapar',
  'HIIT & sprints': 'HIIT & sprintler',
  'Power output is at its highest': 'Güç çıkışı en yüksek seviyede',
  'Heavy strength': 'Ağır kuvvet',
  'Go for PRs — but warm up well': 'Rekor dene — ama iyice ısın',
  'Group classes': 'Grup dersleri',
  'Sociability peaks — lean into it': 'Sosyallik zirvede — bundan yararlan',
  'Pilates & barre': 'Pilates & barre',
  'Controlled strength without the spike': 'Ani yükselme olmadan kontrollü kuvvet',
  'Moderate strength': 'Orta kuvvet',
  'Keep lifting, lower the volume': 'Kaldırmaya devam et, hacmi düşür',
  'Longer walks / hikes': 'Uzun yürüyüşler / doğa yürüyüşü',
  'Zone-2 cardio supports mood': 'Zone-2 kardiyo ruh halini destekler',

  // ── Plan meta ──
  '25 min · easy': '25 dk · kolay', '20 min · 4 holds': '20 dk · 4 duruş', '10 min · 5 moves': '10 dk · 5 hareket',
  '45 min · 4 lifts': '45 dk · 4 hareket', '30 min · intervals': '30 dk · interval', '45 min · skill': '45 dk · beceri',
  '25 min · sprints': '25 dk · sprint', '50 min · strength': '50 dk · kuvvet', '45 min · class': '45 dk · ders',
  '35 min · 4 blocks': '35 dk · 4 blok', '40 min · lighter': '40 dk · daha hafif', '45 min · zone 2': '45 dk · zone 2',

  // ── Plan step phases ──
  'Walk': 'Yürüyüş', 'Optional add-on': 'İsteğe bağlı ek', 'Reclined butterfly': 'Sırtüstü kelebek',
  'Supported forward fold': 'Destekli öne eğilme', 'Child’s pose': 'Çocuk pozu', 'Legs up the wall': 'Bacaklar duvarda',
  'Cat–cow': 'Kedi–inek', 'Hip circles': 'Kalça çevirme', 'Pelvic tilts': 'Pelvik eğme', 'Figure-4 stretch': '4 esnemesi',
  'Warm-up': 'Isınma', 'Goblet squat': 'Goblet squat', 'Romanian deadlift': 'Romen deadlift',
  'Bench / push-up': 'Bench / şınav', 'Row': 'Kürek çekiş', 'Intervals': 'Intervaller', 'Cool-down': 'Soğuma',
  'Pick a class': 'Bir ders seç', 'Focus': 'Odak', 'Sprints': 'Sprintler', 'Squat or deadlift': 'Squat veya deadlift',
  'Press': 'Press', 'Accessory': 'Yardımcı', 'Spin / bootcamp': 'Spin / bootcamp',
  'Core series': 'Kor serisi', 'Glute bridges': 'Kalça köprüsü', 'Standing barre': 'Ayakta barre', 'Stretch': 'Esneme',
  'Squat': 'Squat', 'Hinge': 'Kalça menteşesi', 'Upper body': 'Üst vücut', 'Steady walk / hike': 'İstikrarlı yürüyüş',
  'Optional incline': 'İsteğe bağlı eğim',

  // ── Plan step subs ──
  'Conversational pace, nose-breathing': 'Sohbet temposu, burundan nefes',
  'Gentle uphill or stairs if energy allows': 'Enerji elverirse hafif yokuş veya merdiven',
  'Pillow under knees': 'Dizlerin altına yastık', 'Bolster on thighs': 'Uyluklara destek',
  'Wide knees, breathe into low back': 'Geniş dizler, bele doğru nefes', 'Eases cramps & swelling': 'Kramp ve şişliği azaltır',
  'Slow, with breath': 'Yavaş, nefesle', 'Standing or all-fours': 'Ayakta veya dört ayak',
  'Releases low back': 'Beli rahatlatır', 'Glutes & piriformis': 'Kalça & piriformis',
  'Bike + banded glute work': 'Bisiklet + bantlı kalça çalışması', '90 s rest, add load weekly': '90 sn dinlenme, haftalık yük ekle',
  'Hinge, controlled tempo': 'Menteşe, kontrollü tempo', 'Full range': 'Tam hareket açıklığı',
  'Squeeze shoulder blades': 'Kürek kemiklerini sık', 'Build to moderate': 'Ortaya kadar yüksel',
  'RPE 7 on hard': 'Zorlu kısımda RPE 7', 'Easy pace + breathe': 'Kolay tempo + nefes',
  'Climbing, boxing, dance — coordination is high now': 'Tırmanış, boks, dans — koordinasyon şimdi yüksek',
  'Estrogen aids motor learning this week': 'Östrojen bu hafta motor öğrenmeye yardımcı olur',
  'Thorough — joints are laxer now': 'Kapsamlı — eklemler şimdi daha gevşek',
  '90 s walk between': 'Aralarda 90 sn yürüyüş', 'Easy + mobility': 'Kolay + mobilite',
  'Ramp-up sets, light → heavy': 'Artan setler, hafif → ağır', 'Heavy, 2–3 min rest — PR window': 'Ağır, 2–3 dk dinlenme — rekor penceresi',
  'Strict form': 'Sıkı form', 'Lunges, pull-ups': 'Lunge, barfiks', 'Push intensity — recovery is good now': 'Yoğunluğu artır — toparlanma şimdi iyi',
  'Protect knees & ankles': 'Diz ve bilekleri koru', 'Dead bugs, bird-dogs': 'Dead bug, bird-dog',
  'Slow tempo': 'Yavaş tempo', 'Small pulses, legs': 'Küçük titreşimler, bacaklar', 'Hip flexors & hamstrings': 'Kalça fleksörleri & arka bacak',
  'Easy cardio + mobility': 'Kolay kardiyo + mobilite', '~70% of peak-week load': 'Zirve hafta yükünün ~%70’i',
  'Controlled': 'Kontrollü', 'Push + pull': 'İt + çek', 'Can hold a conversation': 'Sohbet edebilirsin',
  'Lifts mood, gentle on cortisol': 'Ruh halini yükseltir, kortizole nazik',
  // wordy specs
  '20–30 min': '20–30 dk', '5 min': '5 dk', '3 min hold': '3 dk duruş', '3 min': '3 dk', '2 min': '2 dk',
  '10 reps': '10 tekrar', '8 each way': 'her yöne 8', '12 reps': '12 tekrar', '45 s each side': 'her tarafa 45 sn',
  '6 min': '6 dk', '8 min': '8 dk', '10 min': '10 dk', '1 session': '1 oturum', 'technique': 'teknik',
  '6 × 20 s all-out': '6 × 20 sn tam güç', 'don’t skip': 'atlama', 'rolling hills': 'engebeli tepeler', '40–45 min': '40–45 dk',

  // ── Eat headlines / items / notes ──
  'Replenish iron & warmth': 'Demir & sıcaklık yenile',
  'Fresh, light & fermented': 'Taze, hafif & fermente',
  'Anti-inflammatory & fibre': 'Antiinflamatuar & lif',
  'Stabilise blood sugar & mood': 'Kan şekerini & ruh halini dengele',
  'Iron-rich foods': 'Demirden zengin gıdalar', 'Lentils, grass-fed red meat, spinach': 'Mercimek, otla beslenmiş kırmızı et, ıspanak',
  'Warm, cooked meals': 'Sıcak, pişmiş yemekler', 'Soups, stews, ginger, bone broth': 'Çorbalar, güveçler, zencefil, kemik suyu',
  'Vitamin C pairing': 'C vitamini eşliği', 'Citrus or peppers to absorb iron': 'Demir emilimi için narenciye veya biber',
  'Magnesium': 'Magnezyum', 'Dark chocolate, pumpkin seeds — eases cramps': 'Bitter çikolata, kabak çekirdeği — krampları azaltır',
  'Lean proteins': 'Yağsız proteinler', 'Eggs, chicken, fish to fuel building': 'Yumurta, tavuk, balık — inşa için yakıt',
  'Fermented foods': 'Fermente gıdalar', 'Sauerkraut, kimchi, yogurt — gut + estrogen': 'Lahana turşusu, kimchi, yoğurt — bağırsak + östrojen',
  'Light fresh produce': 'Hafif taze sebze-meyve', 'Sprouts, leafy greens, berries': 'Filizler, yeşil yapraklılar, kırmızı meyveler',
  'Complex carbs': 'Kompleks karbonhidratlar', 'Oats, quinoa for steady energy': 'Yulaf, kinoa — dengeli enerji',
  'Colourful vegetables': 'Renkli sebzeler', 'Cruciferous: broccoli, cauliflower — clears estrogen': 'Turpgiller: brokoli, karnabahar — östrojeni temizler',
  'Antioxidants': 'Antioksidanlar', 'Berries, leafy greens, turmeric': 'Kırmızı meyveler, yeşillikler, zerdeçal',
  'Light proteins': 'Hafif proteinler', 'Fish, tofu — easier digestion at peak': 'Balık, tofu — zirvede daha kolay sindirim',
  'Hydration + electrolytes': 'Sıvı + elektrolit', 'You sweat more at this intensity': 'Bu yoğunlukta daha çok terlersin',
  'Sweet potato, squash, brown rice — curbs cravings': 'Tatlı patates, kabak, esmer pirinç — istekleri dizginler',
  'Magnesium & B6': 'Magnezyum & B6', 'Leafy greens, bananas — eases PMS': 'Yeşillikler, muz — PMS’i azaltır',
  'Healthy fats': 'Sağlıklı yağlar', 'Avocado, nuts, olive oil for satiety': 'Avokado, kuruyemiş, zeytinyağı — tokluk',
  'Limit caffeine & salt': 'Kafein & tuzu sınırla', 'Eases bloating and tender breasts': 'Şişkinlik ve göğüs hassasiyetini azaltır',
  'For PCOS: keep blood sugar steady — pair any carbs with protein and fat.':
    'PKOS için: kan şekerini dengede tut — karbonhidratları protein ve yağla birlikte al.',
  'For PCOS: prioritise low-glycaemic carbs to keep insulin even as appetite returns.':
    'PKOS için: iştah dönerken insülini dengede tutmak için düşük glisemik karbonhidratlara öncelik ver.',
  'For PCOS: cruciferous veg supports estrogen metabolism — aim for a serving daily.':
    'PKOS için: turpgiller östrojen metabolizmasını destekler — günde bir porsiyon hedefle.',
  'For PCOS: this is the highest-craving phase — front-load protein and fibre to blunt insulin swings.':
    'PKOS için: bu en yüksek istek fazı — insülin dalgalanmasını azaltmak için protein ve lifi öne al.',

  // ── Nourish UI ──
  'Nourish & move': 'Beslenme ve hareket', 'Movement': 'Hareket', 'Nutrition': 'Beslenme',
  'General guidance, not medical advice. Your care team tailors this to you.':
    'Genel rehberlik, tıbbi tavsiye değildir. Destek ekibin bunu sana göre uyarlar.',
  'Today\'s movement': 'Bugünün hareketi', 'Mark all complete': 'Tümünü tamamla', 'Completed today': 'Bugün tamamlandı',
  'Full plan': 'Tam plan',

  // ── Seed cycling ──
  'Seed cycling': 'Tohum döngüsü',
  'First half · menstrual + follicular': 'İlk yarı · menstrüel + folliküler',
  'Second half · ovulation + luteal': 'İkinci yarı · ovulasyon + luteal',
  'Days 1–14 (your menstrual & follicular phases)': '1.–14. günler (menstrüel & folliküler fazların)',
  'Days 15–28+ (your ovulation & luteal phases)': '15.–28.+ günler (ovulasyon & luteal fazların)',
  'Lignans in flax gently bind excess estrogen; zinc in pumpkin seeds supports the follicular build toward ovulation.':
    'Ketendeki lignanlar fazla östrojeni nazikçe bağlar; kabak çekirdeğindeki çinko ovulasyona doğru folliküler inşayı destekler.',
  'Lignans in sesame and vitamin E in sunflower support progesterone through the luteal phase.':
    'Susamdaki lignanlar ve ayçekirdeğindeki E vitamini luteal faz boyunca progesteronu destekler.',
  'Flaxseed': 'Keten tohumu', 'Pumpkin seeds': 'Kabak çekirdeği', 'Sesame seeds': 'Susam', 'Sunflower seeds': 'Ayçekirdeği',
  '1 tbsp ground, daily': 'günde 1 yk öğütülmüş', '1 tbsp, daily': 'günde 1 yk',
  'Lignans → estrogen balance': 'Lignan → östrojen dengesi', 'Zinc → follicle & progesterone prep': 'Çinko → folikül & progesteron hazırlığı',
  'Lignans + zinc → progesterone': 'Lignan + çinko → progesteron', 'Vitamin E + selenium → luteal support': 'E vitamini + selenyum → luteal destek',

  // ── Supplements ──
  'Supplements': 'Takviyeler', 'Suggested': 'Önerilen',
  'Common support for where you are in your cycle. Tap + to add to your list.':
    'Döngüdeki yerine göre yaygın destek. Listene eklemek için + simgesine dokun.',
  'No supplements yet — add what you take below.': 'Henüz takviye yok — aşağıdan aldıklarını ekle.',
  'Supplement name': 'Takviye adı', 'Dose': 'Doz', 'Cancel': 'İptal', 'Add': 'Ekle', 'Add a supplement': 'Takviye ekle',
  'General guidance — confirm doses with your care team.': 'Genel rehberlik — dozları destek ekibinle doğrula.',
  'Creatine monohydrate': 'Kreatin monohidrat', 'Collagen peptides': 'Kolajen peptidi',
  'Iron (bisglycinate)': 'Demir (bisglisinat)', 'Replaces what is lost with bleeding; gentle on the stomach': 'Kanamayla kaybedileni yerine koyar; mideye naziktir',
  'Magnesium glycinate': 'Magnezyum glisinat', 'Eases cramps and supports sleep': 'Krampları azaltır ve uykuyu destekler',
  'Omega-3 (EPA/DHA)': 'Omega-3 (EPA/DHA)', 'Anti-inflammatory — calms period pain': 'Antiinflamatuar — regl ağrısını yatıştırır',
  'B-complex': 'B-kompleks', 'Supports rising energy and estrogen metabolism': 'Yükselen enerjiyi ve östrojen metabolizmasını destekler',
  'Myo-inositol': 'Myo-inositol', 'Improves insulin sensitivity — key for PCOS': 'İnsülin duyarlılığını artırır — PKOS için kilit',
  'Vitamin D3 + K2': 'D3 + K2 vitamini', 'Hormone synthesis and follicle health': 'Hormon sentezi ve folikül sağlığı',
  'Zinc': 'Çinko', 'Supports ovulation and healthy progesterone': 'Ovulasyonu ve sağlıklı progesteronu destekler',
  'Vitamin E': 'E vitamini', 'Antioxidant for egg quality': 'Yumurta kalitesi için antioksidan',
  'Counters the slight cortisol rise at peak': 'Zirvedeki hafif kortizol yükselişini dengeler',
  'Vitamin B6': 'B6 vitamini', 'Supports progesterone and serotonin': 'Progesteron ve serotonini destekler',
  'Calcium': 'Kalsiyum', 'Shown to reduce luteal-phase symptoms': 'Luteal faz belirtilerini azalttığı gösterildi',
  'Eases PMS, bloating and mood dips': 'PMS, şişkinlik ve ruh hali düşüşlerini azaltır',
  'Steadies blood sugar through cravings': 'İstekler boyunca kan şekerini dengeler',

  // when options (capitalized form for the add-form buttons handled separately)
  'morning': 'sabah', 'midday': 'öğle', 'evening': 'akşam', 'bedtime': 'yatmadan',
};

function tx(en) {
  if (typeof I18N === 'undefined' || I18N.lang !== 'tr') return en;
  return DICT_TR[en] != null ? DICT_TR[en] : en;
}

export { DICT_TR, tx };
