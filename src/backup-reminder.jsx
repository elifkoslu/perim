import React from 'react';
import { t } from './i18n';

/* backup-reminder.jsx — yedek almayalı ne kadar olduğunu hatırlatır.

   Perim'in verisi yalnız bu cihazda. navigator.storage.persist() ile
   tarayıcıdan veriyi silmemesini istiyoruz (persist-storage.js) ama bu
   garanti değil: kullanıcı tarayıcı verisini elle silebilir, telefon
   değişebilir, iOS güncellemesi depoyu boşaltabilir. Tek gerçek güvence
   dışa aktarılmış bir dosya.

   Uyarı ancak korunacak bir şey varken çıkıyor — boş bir kayıt için
   yedek istemek gürültüdür. */

const GUN = 86400000;
const ESIK_GUN = 30;

// Yedeklenecek gerçek bir veri var mı
function korunacakVeriVar(lunara) {
  if (!lunara) return false;
  const dolu = (o) => !!o && Object.keys(o).length > 0;
  return dolu(lunara.periodDays) || dolu(lunara.symptomLog) || dolu(lunara.doseLog)
    || ((lunara.labPanels || []).length > 0) || dolu(lunara.workoutLog);
}

/* null → uyarı yok. Aksi halde kaç gün geçtiği (hiç alınmadıysa null gün). */
function yedekDurumu(lunara, now = Date.now()) {
  if (!korunacakVeriVar(lunara)) return null;
  const son = lunara.lastExportAt ? Date.parse(lunara.lastExportAt) : null;
  if (!son || isNaN(son)) return { hicYok: true, gun: null };
  const gun = Math.floor((now - son) / GUN);
  return gun >= ESIK_GUN ? { hicYok: false, gun } : null;
}

function BackupReminder({ lunara, onNav }) {
  const durum = yedekDurumu(lunara);
  if (!durum) return null;

  const mesaj = durum.hicYok
    ? t('Your records live only on this device. Export a copy so a cleared browser or a new phone cannot take them.',
        'Kayıtların yalnızca bu cihazda. Bir kopyasını dışa aktar ki silinen bir tarayıcı ya da yeni bir telefon onları götürmesin.')
    : t(`It has been ${durum.gun} days since your last backup.`,
        `Son yedeğinin üzerinden ${durum.gun} gün geçti.`);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
      padding: '12px 16px', borderRadius: 'var(--r-md)',
      background: 'var(--bone)', boxShadow: 'inset 0 0 0 1px var(--line-soft)',
    }}>
      <span style={{ flex: '1 1 240px', fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.5 }}>{mesaj}</span>
      <button onClick={() => onNav && onNav('profile')} style={{
        padding: '8px 14px', borderRadius: 999, border: '1px solid var(--line)',
        background: 'var(--card)', color: 'var(--ink)', cursor: 'pointer',
        fontFamily: 'var(--sans)', fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap',
      }}>{t('Export now', 'Şimdi yedekle')}</button>
    </div>
  );
}

export { BackupReminder, yedekDurumu, korunacakVeriVar, ESIK_GUN };
