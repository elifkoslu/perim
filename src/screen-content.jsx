import React from 'react';
import { t } from './i18n';
import { LABS, SYMPTOMS } from './shared';

/* screen-content.jsx — Perim · paylaşılan ekranların evreye göre içeriği
   Belirtiler (Symptoms) ve Blog (Library) içeriğini yaşam evresine uyarlar.
   shared.jsx (SYMPTOMS), i18n sonrası yüklenir. */
/* eslint-disable */

// Deterministik 14-günlük seri (görsel geçmiş için)
function pseudoSeries(key) {
  let h = 0; for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  const out = [];
  for (let i = 0; i < 14; i++) { h = (h * 1103515245 + 12345) >>> 0; out.push(h % 4); }
  return out;
}

// Evreye özel belirti setleri (cycle tabanlı evreler base SYMPTOMS kullanır)
const STAGE_SYMPTOMS = {
  pregnancy: [
    ['nausea', 'Nausea', 'Bulantı'], ['fatigue', 'Fatigue', 'Yorgunluk'],
    ['backpain', 'Back pain', 'Bel ağrısı'], ['heartburn', 'Heartburn', 'Mide yanması'],
    ['swelling', 'Swelling', 'Şişlik'], ['mood', 'Mood', 'Ruh hali'],
  ],
  postpartum: [
    ['mood', 'Mood', 'Ruh hali'], ['sleep', 'Sleep', 'Uyku'],
    ['bleeding', 'Bleeding', 'Kanama'], ['pain', 'Pain', 'Ağrı'],
    ['breast', 'Breast / feeding', 'Göğüs / emzirme'], ['energy', 'Energy', 'Enerji'],
  ],
  menopause: [
    ['hotflash', 'Hot flushes', 'Sıcak basması'], ['nightsweat', 'Night sweats', 'Gece terlemesi'],
    ['sleep', 'Sleep', 'Uyku'], ['mood', 'Mood', 'Ruh hali'],
    ['joints', 'Joint aches', 'Eklem ağrısı'], ['fog', 'Brain fog', 'Zihin pusu'],
  ],
  perimeno: [
    ['hotflash', 'Hot flushes', 'Sıcak basması'], ['cycle', 'Bleeding', 'Kanama'],
    ['sleep', 'Sleep', 'Uyku'], ['mood', 'Mood', 'Ruh hali'],
    ['energy', 'Energy', 'Enerji'], ['libido', 'Libido', 'Libido'],
    ['headache', 'Headache', 'Baş ağrısı'],
  ],
};
function symptomsFor(stage) {
  const list = STAGE_SYMPTOMS[stage];
  if (!list) return SYMPTOMS; // cycle/menarche/ttc → base set (with real series)
  return list.map(([key, en, tr]) => ({ key, label: en, labelTr: tr, series: pseudoSeries(key) }));
}

// Evreye özel blog içeriği
const LIBRARY_BY_STAGE = {
  menarche: {
    featured: { tagEn: 'BASICS', tagTr: 'TEMELLER', titleEn: 'Your first periods: what to expect', titleTr: 'İlk reglerin: neler beklenir', readEn: '4 min', readTr: '4 dk', by: 'Perim' },
    articles: [
      ['CYCLE', 'DÖNGÜ', 'What a cycle actually is', 'Döngü aslında nedir', '3 min', '3 dk'],
      ['BODY', 'BEDEN', 'Period products: pads, tampons, cups', 'Regl ürünleri: ped, tampon, kap', '5 min', '5 dk'],
      ['NORMAL', 'NORMAL', 'Is my cycle normal?', 'Döngüm normal mi?', '4 min', '4 dk'],
      ['MOOD', 'RUH HALİ', 'Cramps and mood: why and what helps', 'Kramp ve ruh hali: neden ve ne iyi gelir', '4 min', '4 dk'],
      ['CARE', 'BAKIM', 'Talking to an adult you trust', 'Güvendiğin bir yetişkinle konuşmak', '3 min', '3 dk'],
      ['BASICS', 'TEMELLER', 'Tracking made simple', 'Takip çok kolay', '2 min', '2 dk'],
    ],
  },
  ttc: {
    featured: { tagEn: 'FERTILITY', tagTr: 'DOĞURGANLIK', titleEn: 'Timing intercourse for the fertile window', titleTr: 'Doğurgan pencere için ilişki zamanlaması', readEn: '5 min', readTr: '5 dk', by: 'Dr. Sera Halevi' },
    articles: [
      ['OVULATION', 'OVÜLASYON', 'Reading LH tests and BBT', 'LH testi ve BBT okumak', '6 min', '6 dk'],
      ['NUTRITION', 'BESLENME', 'Foods that support conception', 'Gebe kalmayı destekleyen besinler', '5 min', '5 dk'],
      ['FOLATE', 'FOLAT', 'Why folic acid, and when to start', 'Neden folik asit ve ne zaman başlanır', '3 min', '3 dk'],
      ['STRESS', 'STRES', 'Stress, sleep and your cycle', 'Stres, uyku ve döngün', '4 min', '4 dk'],
      ['WHEN', 'NE ZAMAN', 'When to see a fertility specialist', 'Ne zaman uzmana görünmeli', '5 min', '5 dk'],
      ['PARTNER', 'EŞ', 'Supporting sperm health too', 'Sperm sağlığını da desteklemek', '4 min', '4 dk'],
    ],
  },
  pregnancy: {
    featured: { tagEn: 'SECOND TRIMESTER', tagTr: 'İKİNCİ TRİMESTER', titleEn: 'Week 24: your baby and you', titleTr: '24. hafta: bebeğin ve sen', readEn: '5 min', readTr: '5 dk', by: 'Perim' },
    articles: [
      ['NUTRITION', 'BESLENME', 'Eating well through pregnancy', 'Gebelikte iyi beslenme', '6 min', '6 dk'],
      ['SAFETY', 'GÜVENLİK', 'Foods and activities to avoid', 'Kaçınılacak gıda ve aktiviteler', '5 min', '5 dk'],
      ['MOVEMENT', 'HAREKET', 'Safe exercise by trimester', 'Trimestere göre güvenli egzersiz', '4 min', '4 dk'],
      ['KICKS', 'TEKMELER', 'Counting kicks: a simple guide', 'Tekme sayımı: basit rehber', '3 min', '3 dk'],
      ['BIRTH', 'DOĞUM', 'Preparing your birth plan', 'Doğum planını hazırlamak', '7 min', '7 dk'],
      ['MIND', 'ZİHİN', 'Managing anxiety in pregnancy', 'Gebelikte kaygıyla baş etmek', '5 min', '5 dk'],
    ],
  },
  postpartum: {
    featured: { tagEn: 'FOURTH TRIMESTER', tagTr: 'DÖRDÜNCÜ TRİMESTER', titleEn: 'Recovering after birth, week by week', titleTr: 'Doğum sonrası iyileşme, hafta hafta', readEn: '6 min', readTr: '6 dk', by: 'Perim' },
    articles: [
      ['MOOD', 'RUH HALİ', 'Baby blues vs. postpartum depression', 'Hüzün mü, doğum sonrası depresyon mu', '6 min', '6 dk'],
      ['FEEDING', 'BESLEME', 'Breastfeeding: a gentle start', 'Emzirme: nazik bir başlangıç', '7 min', '7 dk'],
      ['BODY', 'BEDEN', 'Healing your pelvic floor', 'Pelvik tabanı iyileştirmek', '5 min', '5 dk'],
      ['SLEEP', 'UYKU', 'Surviving the newborn nights', 'Yenidoğan gecelerinde ayakta kalmak', '4 min', '4 dk'],
      ['NUTRITION', 'BESLENME', 'Food for recovery and energy', 'İyileşme ve enerji için beslenme', '5 min', '5 dk'],
      ['YOU', 'SEN', 'Asking for and accepting help', 'Yardım istemek ve kabul etmek', '3 min', '3 dk'],
    ],
  },
  menopause: {
    featured: { tagEn: 'MENOPAUSE', tagTr: 'MENOPOZ', titleEn: 'Managing hot flushes and sleep', titleTr: 'Sıcak basması ve uykuyu yönetmek', readEn: '5 min', readTr: '5 dk', by: 'Dr. Sera Halevi' },
    articles: [
      ['HRT', 'HRT', 'Is hormone therapy right for me?', 'Hormon tedavisi bana uygun mu?', '7 min', '7 dk'],
      ['BONES', 'KEMİK', 'Protecting your bones', 'Kemiklerini korumak', '5 min', '5 dk'],
      ['HEART', 'KALP', 'Heart health after menopause', 'Menopoz sonrası kalp sağlığı', '5 min', '5 dk'],
      ['SLEEP', 'UYKU', 'Better sleep through the change', 'Bu dönemde daha iyi uyku', '4 min', '4 dk'],
      ['MIND', 'ZİHİN', 'Mood, memory and the menopause', 'Ruh hali, hafıza ve menopoz', '6 min', '6 dk'],
      ['LIFE', 'YAŞAM', 'Strength and movement that lasts', 'Kalıcı güç ve hareket', '4 min', '4 dk'],
    ],
  },
};

const LIBRARY_DEFAULT = {
  featured: { tagEn: 'PCOS · ENDOCRINOLOGY', tagTr: 'PKOS · ENDOKRİNOLOJİ', titleEn: 'Why SHBG matters more than total testosterone', titleTr: 'Neden SHBG toplam testosterondan daha önemli', readEn: '4 min', readTr: '4 dk', by: 'Dr. Sera Halevi' },
  articles: [
    ['BHRT BASICS', 'BHRT TEMELLERİ', 'Bioidentical vs. synthetic', 'Biyoözdeş vs. sentetik', '6 min', '6 dk'],
    ['PROGESTERONE', 'PROGESTERON', 'Oral, topical, or troche', 'Ağızdan, topikal veya pastil', '5 min', '5 dk'],
    ['CYCLE', 'DÖNGÜ', 'Tracking symptoms across your cycle', 'Döngüde belirti takibi', '3 min', '3 dk'],
    ['LABS', 'TAHLİLLER', 'Reading your hormone panel', 'Hormon panelini okumak', '7 min', '7 dk'],
    ['TESTOSTERONE', 'TESTOSTERON', 'The case for testosterone in women', 'Kadınlarda testosteron', '5 min', '5 dk'],
    ['LIFESTYLE', 'YAŞAM TARZI', 'Sleep, cortisol, and the luteal phase', 'Uyku, kortizol ve luteal faz', '4 min', '4 dk'],
  ],
};

function libraryFor(stage) {
  const d = LIBRARY_BY_STAGE[stage] || LIBRARY_DEFAULT;
  return {
    featured: { tag: t(d.featured.tagEn, d.featured.tagTr), title: t(d.featured.titleEn, d.featured.titleTr), read: t(d.featured.readEn, d.featured.readTr), by: d.featured.by },
    articles: d.articles.map(a => ({ tag: t(a[0], a[1]), title: t(a[2], a[3]), read: t(a[4], a[5]) })),
  };
}

export { pseudoSeries, STAGE_SYMPTOMS, symptomsFor, LIBRARY_BY_STAGE, LIBRARY_DEFAULT, libraryFor };
