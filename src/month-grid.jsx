import React from 'react';
import { I18N, t } from './i18n';
import { TODAY_DATE } from './shared';

/* month-grid.jsx — takvim görünümlerinin ortak ay matematiği ve gezinmesi.

   Uygulamada birden çok aylık görünüm var (rejim, belirti, döngü, uyum) ve her
   biri kendi ay hesabını taşıyordu. Aynı aritmetiği dörde çıkarmak, ileride
   birinde düzeltilen bir kenar durumunun diğerlerinde kalmasına yol açar —
   bu oturumda sabit döngü uzunluğunun üç ayrı yerde sızmış olması gibi.

   Hafta pazartesi başlar (Türkiye'de ve Avrupa'da beklenen düzen). */
/* eslint-disable */

const AYLAR_TR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
                  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const AYLAR_EN = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'];
const GUNLER_TR = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'];
const GUNLER_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const anahtar = (y, m, d) =>
  y + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');

/* Görüntülenen ayı yönetir ve o ayın hücrelerini üretir.
   → { view, go, isCurrentMonth, monthLabel, weekdays, cells, todayKey }
   cells: ayın başındaki boşluklar için null, sonra { d, date, key, isToday, isFuture } */
function useMonthView() {
  const today = new Date(TODAY_DATE);
  const [view, setView] = React.useState({ y: today.getFullYear(), m: today.getMonth() });

  const go = (delta) => setView(v => {
    const d = new Date(v.y, v.m + delta, 1);
    return { y: d.getFullYear(), m: d.getMonth() };
  });

  const isCurrentMonth = view.y === today.getFullYear() && view.m === today.getMonth();
  const todayKey = anahtar(today.getFullYear(), today.getMonth(), today.getDate());

  const first = new Date(view.y, view.m, 1);
  const bosluk = (first.getDay() + 6) % 7;          // pazartesi ilk sütun
  const gunSayisi = new Date(view.y, view.m + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < bosluk; i++) cells.push(null);
  for (let d = 1; d <= gunSayisi; d++) {
    const date = new Date(view.y, view.m, d);
    const key = anahtar(view.y, view.m, d);
    cells.push({ d, date, key, isToday: key === todayKey, isFuture: date > today });
  }

  return {
    view, go, isCurrentMonth, todayKey, cells, daysInMonth: gunSayisi,
    monthLabel: (I18N.lang === 'tr' ? AYLAR_TR : AYLAR_EN)[view.m] + ' ' + view.y,
    weekdays: I18N.lang === 'tr' ? GUNLER_TR : GUNLER_EN,
  };
}

const navBtn = {
  width: 26, height: 26, borderRadius: 8, fontSize: 15, lineHeight: 1,
  color: 'var(--ink-2)', background: 'var(--bone)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
};

/* Ay başlığı + ileri/geri. İleri, içinde bulunulan ayda kapalı: gelecek günün
   verisi olamaz, açık bırakmak boş aylarda gezinmeye davet olurdu. */
function MonthNav({ label, onPrev, onNext, atCurrent }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <button onClick={onPrev} style={{ ...navBtn, cursor: 'pointer' }}
        aria-label={t('Previous month', 'Önceki ay')}>‹</button>
      <span style={{ fontSize: 12.5, fontWeight: 600, minWidth: 108, textAlign: 'center' }}>{label}</span>
      <button onClick={onNext} disabled={atCurrent}
        aria-label={t('Next month', 'Sonraki ay')}
        style={{ ...navBtn, opacity: atCurrent ? 0.3 : 1, cursor: atCurrent ? 'default' : 'pointer' }}>›</button>
    </div>
  );
}

// Pt–Pz başlık satırı
function WeekdayRow({ weekdays }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
      {weekdays.map(g => (
        <div key={g} style={{ textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--muted-2)' }}>{g}</div>
      ))}
    </div>
  );
}

export { useMonthView, MonthNav, WeekdayRow, anahtar, AYLAR_TR, AYLAR_EN };
