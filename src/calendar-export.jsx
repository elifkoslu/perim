import { t } from './i18n';
import { activeMeds } from './shared';

/* calendar-export.jsx — rejimi telefonun takvimine alarmlı etkinlik olarak aktarır.

   NEDEN TAKVİM. Sunucusuz bir PWA, kapalıyken bildirim zamanlayamaz: tarayıcıda
   arka planda zamanlanmış bildirimin tek gerçek yolu Web Push'tur ve o bir sunucu
   ister — yani rejim saatlerinin cihazdan çıkması gerekir. Uygulamanın sözü bunun
   tersi. Telefonun kendi takvimi ise alarmı uygulama kapalıyken de çalar, hem
   iOS'ta hem Android'de, hiçbir sunucu olmadan.

   NEDEN İLAÇ ADI YAZMIYORUZ. Kullanıcının takvimi iCloud/Google ile senkronlanıyor
   olabilir; etkinlik başlığına ilaç adı ve doz yazmak sağlık bilgisini cihazdan
   çıkarır. Alarm yalnızca "doz zamanı" der, ne alınacağı uygulamada durur.

   ÇAPA KAYMASI. Etkinlikler döngü çapasına (regimen.anchor) göre kurulur. Gerçek
   döngü uzunluğu perimenopozda oynadığı için seri sonsuza kadar gitmez — sınırlı
   sayıda tekrardan sonra biter ve kullanıcıya yeniden aktarması söylenir. */
/* eslint-disable */

const CYCLE_COUNT = 6;          // yaklaşık 6 döngü ≈ 6 ay
const PRODID = '-//Perim//Regimen//TR';

const pad = n => String(n).padStart(2, '0');

// Yerel (kayan) zaman damgası: TZID yok, Z yok — takvim uygulaması cihazın
// saatine göre yorumlar. Doz alarmı için istediğimiz tam olarak bu.
function localStamp(d, hhmm) {
  const [h, m] = String(hhmm || '08:00').split(':');
  return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate())
       + 'T' + pad(Number(h) || 0) + pad(Number(m) || 0) + '00';
}
function utcStamp(d) {
  return d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate())
       + 'T' + pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + pad(d.getUTCSeconds()) + 'Z';
}

// iCalendar metin kaçışı
const esc = s => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

// 75 oktetten uzun satırlar katlanmalı (RFC 5545)
function fold(line) {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const out = [];
  let cur = '';
  for (const ch of line) {
    const next = cur + ch;
    if (new TextEncoder().encode(next).length > 73) { out.push(cur); cur = ' ' + ch; }
    else cur = next;
  }
  if (cur) out.push(cur);
  return out.join('\r\n');
}

/* Döngü gününün bugünden sonraki ilk takvim tarihi.
   anchor = döngünün 1. günü sayılan tarih. */
function nextDateForCycleDay(anchorIso, cycleLength, cycleDay) {
  const anchor = new Date((anchorIso || '') + 'T00:00:00');
  if (isNaN(anchor.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(anchor);
  d.setDate(d.getDate() + (cycleDay - 1));
  while (d < today) d.setDate(d.getDate() + cycleLength);
  return d;
}

/* Rejimi, "saat → o saatte doz olan döngü günleri" haritasına çevirir.
   İlaç adı taşımadığımız için aynı saatteki ilaçlar tek alarmda birleşir —
   yoksa 08:00'de iki özdeş "doz zamanı" bildirimi çıkardı. */
function timeMap(regimen) {
  const L = regimen.cycleLength;
  const map = new Map();
  for (let day = 1; day <= L; day++) {
    for (const m of activeMeds(regimen, day)) {
      const hm = m.time || '08:00';
      if (!map.has(hm)) map.set(hm, new Set());
      map.get(hm).add(day);
    }
  }
  return map;
}

/* Su hatırlatmaları: her gün aynı saatlerde, döngüden bağımsız.
   Etkinlikte yine ilaç/sağlık ayrıntısı yok — yalnızca "su iç". */
function waterEvents(times, stamp, vevent, t) {
  if (!Array.isArray(times) || !times.length) return 0;
  const baslik = t('Perim · water', 'Perim · su');
  let n = 0;
  for (const hm of times) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    const [sh, sm] = hm.split(':').map(Number);
    const simdi = new Date();
    if (simdi.getHours() > (sh || 0) || (simdi.getHours() === (sh || 0) && simdi.getMinutes() >= (sm || 0))) {
      d.setDate(d.getDate() + 1);
    }
    vevent(localStamp(d, hm), `FREQ=DAILY;COUNT=${28 * CYCLE_COUNT}`,
           `wm-su-${hm.replace(':', '')}-${stamp}@perim`, baslik);
    n++;
  }
  return n;
}

function buildIcs(regimen, waterTimes) {
  /* regimen null olabilir: ilaç planı olmayan bir kullanıcı (menarş, gebelik
     planlama…) yalnızca su saatlerini aktarıyor. Eskiden ilk satır
     regimen.cycleLength okuyordu ve bu çağrı try bloğunun dışındaydı. */
  const reg = regimen || { cycleLength: 28, meds: [] };
  const L = reg.cycleLength;
  const map = timeMap(reg);
  if (!map.size && !(waterTimes && waterTimes.length)) return null;

  const stamp = utcStamp(new Date());
  const baslik = t('Perim · dose time', 'Perim · doz zamanı');
  const aciklama = t('Open Perim to see what is due and log it.',
                     'Ne alacağını görmek ve kaydetmek için Perim’u aç.');

  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:' + PRODID,
    'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
  ];
  let n = 0;

  const vevent = (dtstart, rrule, uid, ozelBaslik) => {
    const bas = ozelBaslik || baslik;
    lines.push('BEGIN:VEVENT');
    lines.push('UID:' + uid);
    lines.push('DTSTAMP:' + stamp);
    lines.push('DTSTART:' + dtstart);
    lines.push('DURATION:PT15M');
    lines.push('RRULE:' + rrule);
    lines.push(fold('SUMMARY:' + esc(bas)));
    lines.push(fold('DESCRIPTION:' + esc(aciklama)));
    lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', fold('DESCRIPTION:' + esc(bas)), 'TRIGGER;RELATED=START:PT0S', 'END:VALARM');
    lines.push('END:VEVENT');
  };

  for (const [hm, gunSet] of map) {
    const gunler = [...gunSet].sort((a, b) => a - b);
    if (gunler.length === L) {
      /* Her gün alınıyor → günlük tekrar, döngüden bağımsız. Başlangıç bugün
         (saati geçtiyse yarın); bir sonraki döngü başını beklemek serinin
         haftalarca sonra başlamasına yol açıyordu. */
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      const [sh, sm] = hm.split(':').map(Number);
      const bugunSaat = new Date();
      if (bugunSaat.getHours() > (sh || 0) || (bugunSaat.getHours() === (sh || 0) && bugunSaat.getMinutes() >= (sm || 0))) {
        d.setDate(d.getDate() + 1);
      }
      vevent(localStamp(d, hm), `FREQ=DAILY;COUNT=${L * CYCLE_COUNT}`, `wm-${hm.replace(':', '')}-all-${stamp}@perim`);
      n++;
      continue;
    }
    // Aksi halde her döngü günü için ayrı seri: döngü uzunluğunda tekrarlar
    for (const gun of gunler) {
      const d = nextDateForCycleDay(regimen.anchor, L, gun);
      if (!d) continue;
      vevent(localStamp(d, hm), `FREQ=DAILY;INTERVAL=${L};COUNT=${CYCLE_COUNT}`, `wm-${hm.replace(':', '')}-d${gun}-${stamp}@perim`);
      n++;
    }
  }

  const suSayisi = waterEvents(waterTimes, stamp, vevent, t);
  n += suSayisi;

  lines.push('END:VCALENDAR');
  return { ics: lines.join('\r\n') + '\r\n', eventCount: n, timeCount: map.size, waterCount: suSayisi };
}

const DOSYA_ADI = 'perim-doz-alarmlari.ics';

function indir(ics) {
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = DOSYA_ADI;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* Telefonda paylaşım sayfası, indirmekten çok daha iyi çalışıyor: Android'de
   blob indirmesi çoğu zaman "indirildi" deyip bırakıyor, kullanıcının dosyayı
   İndirilenler'den bulup açması gerekiyor. Paylaşım sayfasında Takvim doğrudan
   seçenek olarak çıkar. Masaüstünde ve desteklemeyen tarayıcılarda indirmeye
   düşüyoruz. share() kullanıcı hareketi ister — dosyayı senkron kurup hemen
   çağırıyoruz ki hareket geçerliliğini yitirmesin. */
async function exportRegimenIcs(lunara, waterTimes) {
  const regimen = lunara && lunara.regimen;
  if ((!regimen || !regimen.meds || !regimen.meds.length) && !(waterTimes && waterTimes.length)) return null;
  const built = buildIcs(regimen, waterTimes);
  if (!built) return null;
  return paylasVeyaIndir(built);
}

/* Yalnızca su hatırlatmaları. Su kartından çağrılıyor: dışa aktarma
   eskiden yalnız Dozlar ekranındaydı ve menarş, gebelik planlama, gebelik,
   doğum sonrası evrelerinin menüsünde Dozlar yok — bu evrelerde
   uygulama kapalıyken çalışan hiçbir hatırlatma yolu kalmıyordu. */
async function exportWaterIcs(waterTimes) {
  if (!waterTimes || !waterTimes.length) return null;
  const built = buildIcs(null, waterTimes);
  if (!built) return null;
  return paylasVeyaIndir(built);
}

async function paylasVeyaIndir(built) {
  try {
    if (typeof File === 'function' && navigator.canShare) {
      const file = new File([built.ics], DOSYA_ADI, { type: 'text/calendar' });
      if (navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file] });
          return { ...built, yol: 'share' };
        } catch (e) {
          // Kullanıcı vazgeçtiyse sessizce çık; başka hatada indirmeye düş.
          if (e && e.name === 'AbortError') return { ...built, yol: 'iptal' };
        }
      }
    }
    indir(built.ics);
    return { ...built, yol: 'indir' };
  } catch (e) { return null; }
}

export { exportRegimenIcs, exportWaterIcs, buildIcs, CYCLE_COUNT };
