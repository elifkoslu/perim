/* App.jsx — Perim: perimenopause + BHRT companion (single-focus shell) */
/* eslint-disable */
import React from 'react';
import { I18N, useLang, t } from './i18n';
import {
  useLunara, getTodayKey, TODAY_KEY, regimenDay, activeMeds, SideRail, TopBar,
} from './shared';
import { applyStageTheme, OnboardingScreen } from './stages';
import { useIsMobile, MobileShell } from './mobile';
import { PerimHome } from './perim-home';
import { PerimMeds } from './perim-meds';
import { PerimAnalytics } from './perim-analytics';
import { SymptomsScreen } from './screens';
import { MoveScreen } from './nourish';
import { ProfileScreen, PrivacyModal } from './profile';
import { waterSettings, waterDay } from './water';

const BRAND = 'Perim';

export default function App() {
  const [active, setActive] = React.useState('home');
  const [logDate, setLogDate] = React.useState(getTodayKey());
  const [lunara, api] = useLunara();
  const isMobile = useIsMobile();
  const [privacyOpen, setPrivacyOpen] = React.useState(false);
  useLang(); // re-render whole tree on language change

  // Fixed aesthetic + perimeno accent.
  /* Gün dönümü. TODAY_KEY / TODAY_DATE modül yüklenirken bir kez hesaplanıyor;
     telefonda PWA günlerce arka planda açık kalabildiği için uygulama ertesi gün
     hâlâ dünü "bugün" sanar ve kayıtlar yanlış güne yazılır. Bu sabitleri ~30 yer
     doğrudan import ettiğinden en güvenli tazeleme sayfayı yeniden yüklemek;
     veri localStorage'da olduğu için kayıp olmaz. */
  React.useEffect(() => {
    const kontrol = () => {
      if (document.visibilityState !== 'visible') return;
      if (getTodayKey() !== TODAY_KEY) location.reload();
    };
    document.addEventListener('visibilitychange', kontrol);
    window.addEventListener('focus', kontrol);
    const iv = setInterval(kontrol, 60000);
    return () => {
      document.removeEventListener('visibilitychange', kontrol);
      window.removeEventListener('focus', kontrol);
      clearInterval(iv);
    };
  }, []);

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'editorial');
    applyStageTheme('perimeno');
  }, []);

  // Dose reminder: while the app is open, notify at dose times.
  React.useEffect(() => {
    if (!lunara.profile || !lunara.profile.reminders) return;
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    if (!lunara.regimen) return;
    const fired = {};
    const check = () => {
      const now = new Date();
      const day = regimenDay(lunara.regimen, now);
      const meds = activeMeds(lunara.regimen, day);
      const hm = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
      const tk = getTodayKey();
      meds.forEach(m => {
        const taken = lunara.doseLog && lunara.doseLog[tk] && lunara.doseLog[tk][m.id];
        if (m.time === hm && !taken && !fired[m.id + hm]) {
          fired[m.id + hm] = true;
          try {
            new Notification(BRAND, {
              body: (I18N.lang === 'tr' ? 'Doz zamanı: ' : 'Dose due: ') + t(m.name, m.nameTr || m.name) + ' · ' + m.dose,
              icon: '/icon-192.png', tag: 'dose-' + m.id,
            });
          } catch (e) {}
        }
      });
    };
    const iv = setInterval(check, 30000);
    check();
    return () => clearInterval(iv);
  }, [lunara.profile && lunara.profile.reminders, lunara.regimen, lunara.doseLog]);

  /* Su hatırlatması — uygulama açıkken, ayarlanan altı saatte.
     Kapalıyken çalmaz; sunucusuz bir PWA arka planda bildirim zamanlayamaz.
     Kapalı uygulamada da hatırlatma için saatler takvime aktarılabiliyor.
     O saatte zaten içilmişse rahatsız etmiyoruz. */
  React.useEffect(() => {
    if (!lunara.profile || !lunara.profile.reminders) return;
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const ayar = waterSettings(lunara);
    const atilan = {};
    const kontrol = () => {
      const now = new Date();
      const hm = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
      if (!ayar.times.includes(hm) || atilan[hm]) return;
      const gun = waterDay(lunara, getTodayKey());
      // Bu saate kadar beklenen bardak sayısına ulaşıldıysa hatırlatma
      const beklenen = ayar.times.filter(x => x <= hm).length;
      if (gun.count >= beklenen) return;
      atilan[hm] = true;
      try {
        new Notification(BRAND, {
          body: I18N.lang === 'tr' ? 'Su içme zamanı' : 'Time for water',
          icon: '/icon-192.png', tag: 'water',
        });
      } catch (e) {}
    };
    const iv = setInterval(kontrol, 30000);
    kontrol();
    return () => clearInterval(iv);
  }, [lunara.profile, lunara.waterLog]);

  // Daily check-in reminder at the user's chosen time (while the app is open).
  React.useEffect(() => {
    if (!lunara.profile || !lunara.profile.cycleAlerts) return;
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const time = lunara.profile.reminderTime || '09:00';
    let firedDay = null;
    const check = () => {
      const now = new Date();
      const hm = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
      const dayKey = getTodayKey();
      if (hm === time && firedDay !== dayKey) {
        firedDay = dayKey;
        try {
          new Notification(BRAND, {
            body: I18N.lang === 'tr' ? 'Günlük check-in zamanı — nasıl hissediyorsun?' : 'Time for your daily check-in — how do you feel?',
            icon: '/icon-192.png', tag: 'daily-checkin',
          });
        } catch (e) {}
      }
    };
    const iv = setInterval(check, 30000);
    check();
    return () => clearInterval(iv);
  }, [lunara.profile && lunara.profile.cycleAlerts, lunara.profile && lunara.profile.reminderTime]);

  const showOnboarding = !lunara.onboarded || active === 'onboarding';

  const screenEl = (() => {
    switch (active) {
      case 'meds':      return <PerimMeds lunara={lunara} api={api} logDate={logDate} setLogDate={setLogDate} />;
      case 'symptoms':  return <SymptomsScreen lunara={lunara} api={api} logDate={logDate} setLogDate={setLogDate} />;
      case 'move':      return <MoveScreen lunara={lunara} api={api} logDate={logDate} setLogDate={setLogDate} />;
      case 'analytics': return <PerimAnalytics lunara={lunara} api={api} onNav={setActive} />;
      case 'profile':   return <ProfileScreen lunara={lunara} api={api} onNav={setActive} onOpenPrivacy={() => setPrivacyOpen(true)} />;
      default:          return <PerimHome lunara={lunara} api={api} onNav={setActive} />;
    }
  })();

  // ── Mobile shell ──
  if (isMobile) {
    if (showOnboarding) {
      return (
        <div data-screen-label="mobile · onboarding" style={{ position: 'fixed', inset: 0, overflow: 'auto', background: 'var(--ivory)' }}>
          <OnboardingScreen lunara={lunara} api={api} onDone={() => setActive('home')} />
          {privacyOpen && <PrivacyModal onClose={() => setPrivacyOpen(false)} />}
        </div>
      );
    }
    return (
      <div data-screen-label={`mobile · ${active}`} style={{ position: 'fixed', inset: 0 }}>
        <MobileShell active={active} onNav={setActive} profile={lunara.profile} stage={lunara.stage}>
          {screenEl}
        </MobileShell>
        {privacyOpen && <PrivacyModal onClose={() => setPrivacyOpen(false)} />}
      </div>
    );
  }

  // ── Desktop shell ──
  if (showOnboarding) {
    return (
      <div style={{ height: '100vh', background: 'var(--ivory)' }}>
        <div data-screen-label="onboarding" style={{ height: '100%', overflow: 'auto', background: 'var(--ivory)' }}>
          <OnboardingScreen lunara={lunara} api={api} onDone={() => setActive('home')} />
        </div>
        {privacyOpen && <PrivacyModal onClose={() => setPrivacyOpen(false)} />}
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', background: 'var(--ivory)' }}>
      <div data-screen-label={active} style={{
        display: 'flex', height: '100%',
        background: 'var(--ivory)',
        fontFamily: 'var(--sans)', color: 'var(--ink)',
      }}>
        <SideRail active={active} onNav={setActive} profile={lunara.profile} stage={lunara.stage} />
        <div style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
          {active === 'home' && <TopBar lunara={lunara} />}
          <div key={active} className="fade-up">
            {screenEl}
          </div>
        </div>
      </div>
      {privacyOpen && <PrivacyModal onClose={() => setPrivacyOpen(false)} />}
    </div>
  );
}
