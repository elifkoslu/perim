import React from 'react';
import { I18N, t, useLang } from './i18n';
import { Btn, ScreenHead, wrap } from './screens';
import { Card, ICONS, Icon, LS_KEY, SilBtn } from './shared';
import { STAGES, stageName } from './stages';
import { bildirimGoster } from './notify';

/* profile.jsx — Perim profil & ayarlar ekranı */
/* eslint-disable */

/* ─── Yedek dosyası doğrulama ─────────────────────────────────────
   İçe aktarılan dosya dış kaynaklı: geçerli JSON olması içeriğinin doğru
   biçimde olduğunu göstermez. Yanlış tipteki bir alan (ör. dizi beklenen
   regimen.meds'in metin olması) ilgili ekran çizilirken uygulamayı tümden
   çökertir; kayıt localStorage'a yazıldığı için yeniden yükleme de kurtarmaz.
   Bu yüzden yalnızca tanınan anahtarlar, yalnızca doğru tipteyse alınır;
   gerisi sessizce atılır. */
const nesneMi = v => v != null && typeof v === 'object' && !Array.isArray(v);
const diziMi = Array.isArray;
const metinMi = v => typeof v === 'string';

const YEDEK_SEMASI = {
  onboarded:   v => typeof v === 'boolean',
  stage:       metinMi,
  periodStart: metinMi,
  periodDays:  nesneMi,
  doses:       nesneMi,
  symptomLog:  nesneMi,
  notes:       diziMi,
  workoutLog:  nesneMi,
  kegelLog:    nesneMi,
  routine:     diziMi,
  routineDone: nesneMi,
  jumpLog:     nesneMi,
  mealLog:     nesneMi,
  proteinLog:  nesneMi,
  supplements: diziMi,
  suppLog:     nesneMi,
  doseLog:     nesneMi,
  profile:     nesneMi,
  ttc:         nesneMi,
  pregnancy:   nesneMi,
  postpartum:  nesneMi,
  menopause:   nesneMi,
  labPanels:   diziMi,
  // Yedek alma zamanı da geri yüklensin: yoksa yedekten dönen kullanıcıya
  // "hiç yedek almamışsın" uyarısı çıkar, oysa elindeki dosya yedeğin ta kendisi
  lastExportAt: metinMi,
  titration:   diziMi,
  // meds dizi olmalı: activeMeds ve regimen ekranı doğrudan üzerinde döner
  regimen:     v => nesneMi(v) && (v.meds === undefined || diziMi(v.meds)),
};

// Tanınan ve tipi tutan alanları döndürür; hiçbiri yoksa null (dosya reddedilir).
function temizleYedek(ham) {
  if (!nesneMi(ham)) return null;
  const temiz = {};
  let tutan = 0;
  for (const anahtar of Object.keys(YEDEK_SEMASI)) {
    if (!Object.prototype.hasOwnProperty.call(ham, anahtar)) continue;
    if (!YEDEK_SEMASI[anahtar](ham[anahtar])) continue;
    temiz[anahtar] = ham[anahtar];
    tutan++;
  }
  return tutan > 0 ? temiz : null;
}

/* ── Girdilerim ───────────────────────────────────────────────────
   Girilen her şeyin nerede olduğunu ve nasıl silineceğini bilmek zordu:
   ilaç rejimde, takviye Takviyeler'de, tahlil Tahliller'de, not Belirtiler'de.
   Bu kart hepsini tek yerde sayıyor ve kategori kategori temizliyor.
   Tek tek silme kendi ekranlarında duruyor; burası toplu temizlik için. */
function MyEntries({ lunara, api }) {
  useLang();
  const say = (o) => Object.keys(o || {}).length;
  const gruplar = [
    { k: 'meds',    n: ((lunara.regimen && lunara.regimen.meds) || []).length,
      en: 'Medications', tr: 'İlaçlar',
      sil: () => ((lunara.regimen && lunara.regimen.meds) || []).forEach(m => api.removeMed(m.id)) },
    { k: 'supps',   n: (lunara.supplements || []).length,
      en: 'Supplements', tr: 'Takviyeler',
      sil: () => (lunara.supplements || []).forEach(x => api.removeSupp(x.id)) },
    { k: 'routine', n: (lunara.routine || []).length,
      en: 'Strength routine', tr: 'Kuvvet rutini',
      sil: () => api.clearRoutine() },
    { k: 'labs',    n: (lunara.labPanels || []).length,
      en: 'Lab panels', tr: 'Tahlil panelleri',
      sil: () => (lunara.labPanels || []).forEach(x => api.removeLabPanel(x.id)) },
    { k: 'titr',    n: (lunara.titration || []).length,
      en: 'Titration log', tr: 'Titrasyon günlüğü',
      sil: () => (lunara.titration || []).forEach(x => api.removeTitration(x.id)) },
    { k: 'notes',   n: (lunara.notes || []).length,
      en: 'Notes', tr: 'Notlar',
      sil: () => (lunara.notes || []).forEach(x => api.removeNote(x.id)) },
    { k: 'symp',    n: say(lunara.symptomLog), birim: { en: 'days', tr: 'gün' },
      en: 'Symptom entries', tr: 'Belirti kayıtları',
      sil: () => Object.keys(lunara.symptomLog || {}).forEach(d => api.clearSymptomDay(d)) },
    { k: 'dose',    n: say(lunara.doseLog), birim: { en: 'days', tr: 'gün' },
      en: 'Doses taken', tr: 'Alınan dozlar',
      sil: () => Object.keys(lunara.doseLog || {}).forEach(d => api.clearDoseDay(d)) },
    { k: 'work',    n: say(lunara.workoutLog), birim: { en: 'days', tr: 'gün' },
      en: 'Movement log', tr: 'Hareket kaydı',
      sil: () => Object.keys(lunara.workoutLog || {}).forEach(d => api.clearWorkoutDay(d)) },
    { k: 'kegel',   n: say(lunara.kegelLog), birim: { en: 'days', tr: 'gün' },
      en: 'Pelvic floor sets', tr: 'Pelvik taban setleri',
      sil: () => Object.keys(lunara.kegelLog || {}).forEach(d => api.resetKegel(d)) },
    { k: 'bleed',   n: say(lunara.periodDays), birim: { en: 'days', tr: 'gün' },
      en: 'Bleeding days', tr: 'Kanama günleri',
      sil: () => Object.keys(lunara.periodDays || {}).forEach(d => api.togglePeriodDay(d)) },
  ].filter(g => g.n > 0);

  return (
    <Card>
      <div className="eyebrow" style={{ marginBottom: 6 }}>{t('My entries', 'Girdilerim')}</div>
      <p style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5, margin: '0 0 14px' }}>
        {gruplar.length === 0
          ? t('Nothing saved yet. Anything you enter will show up here and can be deleted from this list.',
              'Henüz kayıt yok. Girdiğin her şey burada görünür ve buradan silinebilir.')
          : t('Everything you have entered, and where to clear it. Deleting is permanent — export first if you want a copy.',
              'Girdiğin her şey ve nereden temizleneceği. Silme kalıcıdır — kopya istiyorsan önce dışa aktar.')}
      </p>
      {gruplar.map((g, i) => (
        <div key={g.k} style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0',
          borderTop: i === 0 ? 'none' : '1px solid var(--line-soft)',
        }}>
          <span style={{ flex: 1, fontSize: 14, color: 'var(--ink)' }}>{t(g.en, g.tr)}</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>
            {g.n}{g.birim ? ' ' + t(g.birim.en, g.birim.tr) : ''}
          </span>
          <SilBtn variant="metin" onSil={g.sil}
            label={t('Clear', 'Temizle')}
            confirmLabel={t('Delete all', 'Hepsini sil')}/>
        </div>
      ))}
    </Card>
  );
}

function ProfileScreen({ lunara, api, onNav, onOpenPrivacy }) {
  const p = lunara.profile;
  const [draft, setDraft] = React.useState(p);
  const [editing, setEditing] = React.useState(false);
  const [showPrivacy, setShowPrivacy] = React.useState(false);
  const [confirmWipe, setConfirmWipe] = React.useState(false);
  const [importReq, setImportReq] = React.useState(null); // {data,name,days,panels,notes} | {error:true}
  const importRef = React.useRef(null);

  // Yedek JSON'u oku, Perim verisi olduğunu doğrula, onaya sun
  const pickImport = async (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!f) return;
    try {
      const ham = JSON.parse(await f.text());
      const data = temizleYedek(ham);
      if (!data) throw new Error('not-perim');
      setImportReq({
        data,
        name: (data.profile && data.profile.name) || '',
        days: Object.keys(data.symptomLog || {}).length,
        panels: (data.labPanels || []).length,
        notes: (data.notes || []).length,
      });
    } catch (err) {
      setImportReq({ error: true });
    }
  };
  const applyImport = () => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(importReq.data)); } catch (e) {}
    window.location.reload();
  };
  const lang = useLang();
  const openPrivacy = onOpenPrivacy || (() => setShowPrivacy(true));

  // keep draft in sync if profile changes elsewhere
  React.useEffect(() => { setDraft(lunara.profile); }, [lunara.profile]);

  const save = () => { api.updateProfile(draft); setEditing(false); };
  const cancel = () => { setDraft(p); setEditing(false); };

  const fieldWrap = wrap; // shared screen padding

  return (
    <div style={fieldWrap}>
      <ScreenHead eyebrow={t('ACCOUNT', 'HESAP')} title={t('Profile & settings', 'Profil & ayarlar')} />

      <div className="mb-stack" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
        {/* ── Identity card ── */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 22 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'var(--accent-soft)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--serif)', fontStyle: 'var(--display-italic)', fontSize: 30, color: 'var(--ink)',
            }}>{(p.name || '·').charAt(0).toLocaleLowerCase(lang === 'tr' ? 'tr' : 'en')}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 26, letterSpacing: '-0.01em' }}>{p.name}</div>
              <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>
                {STAGES[lunara.stage] ? `${STAGES[lunara.stage].note} · ${stageName(lunara.stage)}` : ''}
              </div>
            </div>
            {!editing && (
              <Btn onClick={() => setEditing(true)}>{t('Edit', 'Düzenle')}</Btn>
            )}
          </div>

          {editing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field label={t('Name', 'Ad')} value={draft.name}
                onChange={v => setDraft({ ...draft, name: v })}/>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label={t('Age', 'Yaş')} value={String(draft.age ?? '')} type="number"
                  onChange={v => setDraft({ ...draft, age: v.replace(/\D/g, '') })}/>
                <Field label={t('Weight (kg)', 'Kilo (kg)')} value={String(draft.weight ?? '')} type="number"
                  onChange={v => setDraft({ ...draft, weight: v.replace(/\D/g, '') ? parseInt(v.replace(/\D/g, ''), 10) : undefined })}/>
              </div>
              <Field label={t('Email', 'E-posta')} value={draft.email || ''} type="email"
                onChange={v => setDraft({ ...draft, email: v })}/>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <Btn primary onClick={save}>{t('Save changes', 'Değişiklikleri kaydet')}</Btn>
                <Btn onClick={cancel}>{t('Cancel', 'İptal')}</Btn>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <InfoRow label={t('Age', 'Yaş')} value={p.age ? `${p.age}` : '—'}/>
              <InfoRow label={t('Weight', 'Kilo')} value={p.weight ? `${p.weight} kg` : '—'}/>
              <InfoRow label={t('Email', 'E-posta')} value={p.email || '—'}/>
              <InfoRow label={t('Life stage', 'Yaşam evresi')}
                value={`${STAGES[lunara.stage] ? STAGES[lunara.stage].note + ' · ' : ''}${stageName(lunara.stage)}`}
                action={t('Change', 'Değiştir')}
                onAction={() => { api.setOnboarded(false); onNav('onboarding'); }} last/>
            </div>
          )}
        </Card>

        {/* ── Right column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Language */}
          <Card>
            <div className="eyebrow" style={{ marginBottom: 14 }}>{t('Language', 'Dil')}</div>
            <div style={{ display: 'flex', gap: 10 }}>
              {[{ k: 'en', label: 'English' }, { k: 'tr', label: 'Türkçe' }].map(o => {
                const on = o.k === lang;
                return (
                  <button key={o.k} onClick={() => I18N.set(o.k)}
                    style={{
                      flex: 1, padding: '12px 0', borderRadius: 12,
                      fontSize: 14, fontWeight: on ? 700 : 500, cursor: 'pointer',
                      background: on ? 'var(--ink)' : 'var(--bone)',
                      color: on ? 'var(--ivory)' : 'var(--ink-2)',
                      boxShadow: on ? 'none' : 'inset 0 0 0 1px var(--line-soft)',
                      transition: 'all 140ms ease',
                    }}>{o.label}</button>
                );
              })}
            </div>
          </Card>

          {/* Notifications & reminders */}
          <NotificationSettings lunara={lunara} api={api}/>

          {/* Girilen her şeyin tek yerden görünüp silinebildiği yer */}
          <MyEntries lunara={lunara} api={api}/>

          {/* Data & account */}
          <Card>
            <div className="eyebrow" style={{ marginBottom: 12 }}>{t('Data & account', 'Veri & hesap')}</div>
            <ActionRow icon={ICONS.vial} label={t('Export my data', 'Verilerimi dışa aktar')}
              onClick={() => { exportData(lunara); if (api && api.markExported) api.markExported(); }}/>
            {/* Kullanılan fontlar ve kütüphanelerin lisansları. OFL, metnin
                dağıtıma eşlik etmesini şart koşuyor; dosyalar public/lisanslar
                altında ve buradan ulaşılabiliyor. */}
            <ActionRow icon={ICONS.book} label={t('Licences & credits', 'Lisanslar & künye')}
              onClick={() => window.open('/lisanslar/KUNYE.txt', '_blank', 'noopener,noreferrer')}/>
            <ActionRow icon={ICONS.arrowDown} label={t('Import data file', 'Veri dosyasını içe aktar')}
              onClick={() => importRef.current && importRef.current.click()}/>
            <input ref={importRef} type="file" aria-label={t('Import data file', 'Veri dosyasını içe aktar')} accept="application/json,.json" onChange={pickImport} style={{ display: 'none' }}/>
            {importReq && importReq.error && (
              <div className="fade-up" style={{ margin: '4px 0 10px', padding: '12px 14px', borderRadius: 12, background: 'oklch(0.94 0.03 25)', border: '1px solid oklch(0.85 0.05 25)' }}>
                <p style={{ fontSize: 12.5, color: 'var(--ink)', margin: '0 0 10px', lineHeight: 1.5 }}>
                  {t('This doesn’t look like a Perim backup file. Choose the JSON you downloaded with “Export my data”.',
                     'Bu bir Perim yedek dosyasına benzemiyor. “Verilerimi dışa aktar” ile indirdiğin JSON’u seç.')}
                </p>
                <button onClick={() => setImportReq(null)} style={{ fontSize: 12.5, color: 'var(--ink-2)', fontWeight: 600, cursor: 'pointer' }}>{t('OK', 'Tamam')}</button>
              </div>
            )}
            {importReq && !importReq.error && (
              <div className="fade-up" style={{ margin: '4px 0 10px', padding: '14px 16px', borderRadius: 12, background: 'var(--bone)', border: '1px solid var(--line)' }}>
                <p style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.55, margin: '0 0 6px', fontWeight: 500 }}>
                  {t('Backup found', 'Yedek bulundu')}{importReq.name ? ` — ${importReq.name}` : ''}:
                  {' '}{importReq.days} {t('symptom days', 'belirti günü')} · {importReq.panels} {t('lab panels', 'tahlil paneli')} · {importReq.notes} {t('notes', 'not')}
                </p>
                <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5, margin: '0 0 12px' }}>
                  {t('Importing REPLACES everything currently on this device. Export first if you want to keep the current data.',
                     'İçe aktarma, bu cihazdaki mevcut verilerin YERİNE geçer. Mevcut veriyi saklamak istiyorsan önce dışa aktar.')}
                </p>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={applyImport} style={{
                    flex: 1, padding: '11px 0', borderRadius: 999, border: 'none', cursor: 'pointer',
                    background: 'var(--ink)', color: 'var(--ivory)', fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 600,
                  }}>{t('Import & replace', 'İçe aktar, değiştir')}</button>
                  <button onClick={() => setImportReq(null)} style={{
                    flex: 1, padding: '11px 0', borderRadius: 999, cursor: 'pointer',
                    border: '1px solid var(--line)', background: 'transparent', color: 'var(--ink-2)', fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 600,
                  }}>{t('Cancel', 'Vazgeç')}</button>
                </div>
              </div>
            )}
            <ActionRow icon={ICONS.book} label={t('Privacy & terms', 'Gizlilik & koşullar')} onClick={openPrivacy}/>
            <ActionRow icon={TRASH_ICON} label={t('Delete all my data', 'Tüm verilerimi sil')} danger
              onClick={() => setConfirmWipe(true)} last/>
            {confirmWipe && (
              <div className="fade-up" style={{ marginTop: 4, padding: '14px 16px', borderRadius: 12, background: 'oklch(0.94 0.03 25)', border: '1px solid oklch(0.85 0.05 25)' }}>
                <p style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.5, margin: '0 0 12px', fontWeight: 500 }}>
                  {t('This permanently deletes everything on this device — cycles, symptoms, doses, notes. It cannot be undone. Export first if you want a copy.',
                     'Bu, bu cihazdaki her şeyi kalıcı olarak siler — döngüler, belirtiler, dozlar, notlar. Geri alınamaz. Kopya istiyorsan önce dışa aktar.')}
                </p>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={wipeAllData} style={{
                    flex: 1, padding: '11px 0', borderRadius: 999, border: 'none', cursor: 'pointer',
                    background: 'var(--signal-low)', color: 'var(--ivory)', fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 600,
                  }}>{t('Yes, delete everything', 'Evet, her şeyi sil')}</button>
                  <button onClick={() => setConfirmWipe(false)} style={{
                    flex: 1, padding: '11px 0', borderRadius: 999, cursor: 'pointer',
                    border: '1px solid var(--line)', background: 'transparent', color: 'var(--ink-2)', fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 600,
                  }}>{t('Cancel', 'Vazgeç')}</button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      <div style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--muted-2)', fontFamily: 'var(--mono)', letterSpacing: '0.04em', marginTop: 4 }}>
        WOMENTUM · v1.0 · {t('your data stays on this device', 'verilerin bu cihazda kalır')}
      </div>

      {showPrivacy && <PrivacyModal onClose={() => setShowPrivacy(false)}/>}
    </div>
  );
}

// Notifications & reminders — permission status, enable/test, toggles, daily time.
function NotificationSettings({ lunara, api }) {
  const lang = useLang();
  const p = lunara.profile;
  const supported = typeof window !== 'undefined' && 'Notification' in window;
  const [perm, setPerm] = React.useState(supported ? Notification.permission : 'unsupported');
  const granted = perm === 'granted';
  const reminderTime = p.reminderTime || '09:00';

  const enable = async () => {
    if (!supported) return;
    try {
      const r = await Notification.requestPermission();
      setPerm(r);
      if (r === 'granted') {
        api.updateProfile({ reminders: true });
        bildirimGoster('Perim', { body: lang === 'tr' ? 'Hatırlatıcılar açıldı 🌙' : 'Reminders are on 🌙', icon: '/icon-192.png' });
      }
    } catch (e) {}
  };
  const test = () => {
    if (granted) try { bildirimGoster('Perim', { body: lang === 'tr' ? 'Bu bir test bildirimidir 🔔' : 'This is a test notification 🔔', icon: '/icon-192.png' }); } catch (e) {}
  };

  const status = !supported
    ? { color: 'var(--muted)', label: t('Not supported on this browser', 'Bu tarayıcıda desteklenmiyor') }
    : granted
      ? { color: 'var(--signal-good)', label: t('Notifications on', 'Bildirimler açık') }
      : perm === 'denied'
        ? { color: 'var(--signal-low)', label: t('Blocked in browser settings', 'Tarayıcı ayarlarında engelli') }
        : { color: 'var(--muted)', label: t('Not enabled yet', 'Henüz etkin değil') };

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div className="eyebrow">{t('Notifications & reminders', 'Bildirimler & hatırlatıcılar')}</div>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: status.color, fontFamily: 'var(--mono)' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: status.color }}/>{status.label}
        </span>
      </div>

      {/* Permission action */}
      {supported && !granted && perm !== 'denied' && (
        <button onClick={enable} style={{
          width: '100%', padding: '12px 0', borderRadius: 12, marginBottom: 14, border: 'none', cursor: 'pointer',
          background: 'var(--ink)', color: 'var(--ivory)', fontFamily: 'var(--sans)', fontSize: 13.5, fontWeight: 600,
        }}>{t('Enable notifications', 'Bildirimleri etkinleştir')}</button>
      )}
      {perm === 'denied' && (
        <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5, margin: '0 0 14px' }}>
          {t('Notifications are blocked. Allow them for Perim in your browser or phone settings, then reload.',
             'Bildirimler engelli. Tarayıcı veya telefon ayarlarından Perim’a izin verip sayfayı yenile.')}
        </p>
      )}
      {granted && (
        <button onClick={test} style={{
          fontSize: 12.5, color: 'var(--accent)', fontWeight: 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12,
        }}>
          <Icon d={ICONS.bell} size={13} stroke="var(--accent)"/> {t('Send a test notification', 'Test bildirimi gönder')}
        </button>
      )}

      {/* Reminder preferences */}
      <div style={{ opacity: granted ? 1 : 0.5, pointerEvents: granted ? 'auto' : 'none' }}>
        <Toggle label={t('Dose reminders', 'Doz hatırlatıcıları')}
          sub={t('Nudge me when a dose is due', 'Doz zamanı geldiğinde uyar')}
          on={p.reminders} onToggle={() => api.updateProfile({ reminders: !p.reminders })}/>
        <Toggle label={t('Daily check-in', 'Günlük check-in')}
          sub={t('A gentle daily reminder to log how you feel', 'Nasıl hissettiğini kaydetmen için nazik günlük hatırlatma')}
          on={p.cycleAlerts} onToggle={() => api.updateProfile({ cycleAlerts: !p.cycleAlerts })}/>
        <Toggle label={t('Lab reminders', 'Tahlil hatırlatıcıları')}
          sub={t('Upcoming blood draws', 'Yaklaşan kan tahlilleri')}
          on={p.labReminders} onToggle={() => api.updateProfile({ labReminders: !p.labReminders })}/>

        {/* Daily reminder time */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '13px 0' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--ink)' }}>{t('Daily reminder time', 'Günlük hatırlatma saati')}</div>
            <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 1 }}>{t('When the daily check-in fires', 'Günlük check-in’in tetiklendiği saat')}</div>
          </div>
          <input type="time" value={reminderTime} aria-label={t('Daily reminder time', 'Günlük hatırlatma saati')} onChange={e => api.updateProfile({ reminderTime: e.target.value })}
            style={{
              border: '1px solid var(--line)', borderRadius: 10, padding: '9px 11px',
              fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--ink)', background: 'var(--ivory)', outline: 'none',
            }}/>
        </div>
      </div>

      <p style={{ fontSize: 11, color: 'var(--muted-2)', lineHeight: 1.5, margin: '8px 0 0', fontStyle: 'italic' }}>
        {t('Reminders fire while Perim is open. Background push needs an account and is coming later.',
           'Hatırlatıcılar Perim açıkken çalışır. Arka plan bildirimi için hesap gerekir; ileride eklenecek.')}
      </p>
    </Card>
  );
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span className="eyebrow">{label}</span>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        style={{
          border: '1px solid var(--line)', borderRadius: 10, padding: '11px 13px',
          fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--ink)',
          background: 'var(--ivory)', outline: 'none', width: '100%', boxSizing: 'border-box',
        }}/>
    </label>
  );
}

function InfoRow({ label, value, last, action, onAction }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '13px 0', borderBottom: last ? 'none' : '1px solid var(--line-soft)',
    }}>
      <span style={{ fontSize: 13, color: 'var(--muted)' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 13.5, color: 'var(--ink)', fontWeight: 500, textAlign: 'right', maxWidth: '60%' }}>{value}</span>
        {action && <button onClick={onAction} style={{
          fontSize: 12, color: 'var(--accent)', fontWeight: 600, cursor: 'pointer',
          padding: '4px 10px', borderRadius: 999, background: 'var(--accent-soft)',
        }}>{action}</button>}
      </div>
    </div>
  );
}

function Toggle({ label, sub, on, onToggle, last }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '13px 0', borderBottom: last ? 'none' : '1px solid var(--line-soft)',
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--ink)' }}>{label}</div>
        {sub && <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 1 }}>{sub}</div>}
      </div>
      <button onClick={onToggle} aria-pressed={on} aria-label={label} style={{
        width: 44, height: 26, borderRadius: 999, flexShrink: 0, cursor: 'pointer',
        background: on ? 'var(--accent)' : 'var(--line)',
        position: 'relative', transition: 'background 180ms ease',
      }}>
        <span style={{
          position: 'absolute', top: 3, left: on ? 21 : 3,
          width: 20, height: 20, borderRadius: '50%', background: 'var(--card)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 180ms ease',
        }}/>
      </button>
    </div>
  );
}

function ActionRow({ icon, label, onClick, danger, last }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left',
      padding: '13px 0', borderBottom: last ? 'none' : '1px solid var(--line-soft)',
      background: 'transparent', cursor: 'pointer',
      color: danger ? 'var(--signal-low)' : 'var(--ink)',
    }}>
      <span style={{
        width: 34, height: 34, borderRadius: 10, background: 'var(--bone)', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: danger ? 'var(--signal-low)' : 'var(--ink-2)',
      }}>
        <Icon d={icon} size={16}/>
      </span>
      <span style={{ flex: 1, fontSize: 13.5, fontWeight: 500 }}>{label}</span>
      <Icon d={ICONS.arrow} size={14} stroke="var(--muted-2)"/>
    </button>
  );
}

// Bildirim izni iste + toggle'ı kaydet
async function toggleNotifications(key, value, api) {
  if (value && 'Notification' in window) {
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        // izin verilmedi — yine de tercihi kaydet ama bilgilendir
        api.updateProfile({ [key]: false });
        alert(I18N.lang === 'tr'
          ? 'Bildirim izni verilmedi. Telefon ayarlarından Perim için bildirimlere izin verebilirsin.'
          : 'Notification permission denied. You can enable it for Perim in your phone settings.');
        return;
      }
      // izin verildi — örnek bir doğrulama bildirimi gönder
      bildirimGoster('Perim', {
        body: I18N.lang === 'tr' ? 'Hatırlatıcılar açıldı 🌙' : 'Reminders are on 🌙',
        icon: 'icon-192.png',
      });
    } catch (e) {}
  }
  api.updateProfile({ [key]: value });
}

const TRASH_ICON = 'M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z';

// KVKK erasure right: wipe everything stored on this device, then restart.
function wipeAllData() {
  try { localStorage.removeItem(LS_KEY); } catch (e) {}
  window.location.reload();
}

// Download the user's logged data as JSON
function exportData(lunara) {
  try {
    const blob = new Blob([JSON.stringify(lunara, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'lunara-data.json';
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (e) {}
}

/* ── KVKK / Gizlilik & Koşullar Modalı ─────────────────────── */
function PrivacyModal({ onClose }) {
  useLang();
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(42,24,16,0.55)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--card)', borderRadius: 22,
        boxShadow: '0 24px 64px -20px rgba(0,0,0,0.4)',
        border: '1px solid var(--line-soft)',
        width: '100%', maxWidth: 620, maxHeight: '80vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 28px 16px', borderBottom: '1px solid var(--line-soft)' }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 4 }}>KVKK · {t('PRIVACY & TERMS', 'GİZLİLİK & KOŞULLAR')}</div>
            <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 24, margin: 0, letterSpacing: '-0.01em' }}>
              {t('Your data, your rights', 'Verilerin, haklarını')}
            </h2>
          </div>
          <button onClick={onClose} style={{
            width: 36, height: 36, borderRadius: '50%', background: 'var(--bone)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            color: 'var(--ink-2)', fontSize: 18, fontWeight: 300,
          }}>×</button>
        </div>

        {/* Content */}
        <div style={{ overflowY: 'auto', padding: '22px 28px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* KVKK vurgusu */}
          <div style={{ padding: '14px 18px', borderRadius: 12, background: 'var(--bone)', border: '1px solid var(--line-soft)' }}>
            <div className="eyebrow" style={{ marginBottom: 8, color: 'var(--accent)' }}>KVKK — 6698 SAYILI KANUN</div>
            <p style={{ fontFamily: 'var(--serif)', fontSize: 15, lineHeight: 1.55, color: 'var(--ink-2)', margin: 0 }}>
              {t(
                'Perim processes your health data in accordance with Turkish Law No. 6698 on Protection of Personal Data (KVKK) and EU GDPR.',
                'Perim, sağlık verilerini 6698 Sayılı Kişisel Verilerin Korunması Kanunu (KVKK) ve AB GDPR kapsamında işlemektedir.'
              )}
            </p>
          </div>

          <PrivSection title={t('What data we collect', 'Hangi verileri topluyoruz')} items={[
            t('Cycle and symptom logs you enter manually', 'Manuel girdiğin döngü ve belirti kayıtları'),
            t('Dose and supplement records', 'Doz ve takviye kayıtları'),
            t('Profile info (name, age — optional)', 'Profil bilgileri (isim, yaş — isteğe bağlı)'),
            t('Language and display preferences', 'Dil ve görüntüleme tercihleri'),
          ]}/>

          <PrivSection title={t('Where your data lives', 'Veriler nerede saklanır')} items={[
            t('All data is stored locally on your device only (localStorage)', 'Tüm veriler yalnızca cihazında saklanır (localStorage)'),
            t('Nothing is sent to our servers — we have no account system', 'Sunucularımıza hiçbir şey gönderilmez — hesap sistemimiz yoktur'),
            t('AI chat messages go to Anthropic\'s API only when you send a message; no logs are kept by Perim', 'AI sohbet mesajları yalnızca mesaj gönderdiğinde Anthropic API\'ye iletilir; Perim kayıt tutmaz'),
          ]}/>

          <PrivSection title={t('Your KVKK rights', 'KVKK kapsamındaki haklarınız')} items={[
            t('Right to know whether your data is processed (Article 11/a)', 'Verilerinin işlenip işlenmediğini öğrenme hakkı (Md. 11/a)'),
            t('Right to request information about processing (Article 11/b)', 'İşleme ile ilgili bilgi talep etme hakkı (Md. 11/b)'),
            t('Right to request erasure — use "Export & delete my data" in settings', 'Silinmesini talep etme hakkı — ayarlarda "Verilerimi dışa aktar" kullan'),
            t('Right to object to processing (Article 11/e)', 'İşlemeye itiraz etme hakkı (Md. 11/e)'),
          ]}/>

          <PrivSection title={t('Health data (special category)', 'Sağlık verileri (özel kategori)')} items={[
            t('Health and reproductive data is classified as "special category personal data" under KVKK Article 6', 'Sağlık ve üreme verileri KVKK Md. 6 uyarınca "özel nitelikli kişisel veri" sayılır'),
            t('Your explicit consent is required — by using Perim you consent to local processing of your health data', 'Açık rızan gereklidir — Perim\'yu kullanarak sağlık verilerinin yerel işlenmesine onay vermiş sayılırsın'),
            t('No data is shared with third parties', 'Hiçbir veri üçüncü taraflarla paylaşılmaz'),
          ]}/>

          <PrivSection title={t('Cookies & tracking', 'Çerezler & izleme')} items={[
            t('Perim uses no cookies, no analytics, no advertising trackers', 'Perim çerez, analitik veya reklam izleyici kullanmaz'),
            t('The only external connection is Google Fonts (font loading on first use)', 'Tek harici bağlantı ilk kullanımda yazı tipi yükleyen Google Fonts\'tur'),
          ]}/>

          <div style={{ paddingTop: 16, borderTop: '1px solid var(--line-soft)', fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.6, fontFamily: 'var(--serif)', fontStyle: 'italic' }}>
            {t(
              'Last updated: June 2026. This is a prototype application. For questions about your data, contact: privacy@lunara.app',
              'Son güncelleme: Haziran 2026. Bu bir prototip uygulamadır. Verileriniz hakkında sorularınız için: privacy@lunara.app'
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 28px', borderTop: '1px solid var(--line-soft)', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{
            padding: '11px 24px', borderRadius: 999,
            background: 'var(--ink)', color: 'var(--ivory)',
            fontSize: 13.5, fontWeight: 600, cursor: 'pointer', border: 'none',
          }}>{t('I understand', 'Anladım')}</button>
        </div>
      </div>
    </div>
  );
}

function PrivSection({ title, items }) {
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>{title}</div>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map((item, i) => (
          <li key={i} style={{ display: 'flex', gap: 10, fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.5 }}>
            <span style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 2 }}>·</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export { temizleYedek, ProfileScreen, Field, InfoRow, Toggle, ActionRow, toggleNotifications, exportData, PrivacyModal, PrivSection };
