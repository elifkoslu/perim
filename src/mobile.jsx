import React from 'react';
import { t } from './i18n';
import { ICONS, Icon, Logo, navItemsFor } from './shared';

/* mobile.jsx — Perim responsive mobile shell (bottom tabs + sheet) */
/* eslint-disable */

function useIsMobile(bp = 720) {
  // URL'de ?mobile=1 varsa her zaman mobil mod (iframe telefon önizlemesi için)
  const forced = typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('mobile') === '1';
  const q = `(max-width:${bp}px)`;
  const detect = () => forced || (document.documentElement.clientWidth || window.innerWidth) <= bp;
  const [m, setM] = React.useState(detect);
  React.useEffect(() => {
    if (forced) return;
    const update = () => setM(detect());
    update();
    const mq = window.matchMedia(q);
    mq.addEventListener('change', update);
    window.addEventListener('resize', update);
    return () => { mq.removeEventListener('change', update); window.removeEventListener('resize', update); };
  }, []);
  return m;
}

/* Perim'in beş bölümü barda birden sığıyor; "Daha" menüsüne gerek yok.
   Profil başlıktaki avatardan açılıyor. */
const NAV_META = {
  home:      { icon: ICONS.moon,  en: 'Calendar',    tr: 'Takvim' },
  meds:      { icon: ICONS.pill,  en: 'Medications', tr: 'İlaçlar' },
  symptoms:  { icon: ICONS.pulse, en: 'Symptoms',    tr: 'Belirtiler' },
  move:      { icon: ICONS.spark, en: 'Movement',    tr: 'Hareketler' },
  analytics: { icon: ICONS.vial,  en: 'Analytics',   tr: 'Analizler' },
};

function mobileNav() {
  const keys = navItemsFor().map(i => i.k).filter(k => NAV_META[k]);
  return { tabs: keys.map(k => ({ k, ...NAV_META[k] })), more: [] };
}

const ICON_DOTS = 'M5 12h.01M12 12h.01M19 12h.01';

function MobileShell({ active, onNav, children, profile, stage }) {
  const [sheet, setSheet] = React.useState(false);
  const { tabs: TABS, more: MORE_ITEMS } = React.useMemo(() => mobileNav(), []);
  const moreActive = MORE_ITEMS.some(m => m.k === active);
  const initial = (profile && profile.name) ? profile.name.charAt(0).toLocaleLowerCase('tr') : '·';

  return (
    <div className="lunara-mobile" style={{
      position: 'fixed', inset: 0,
      display: 'flex', flexDirection: 'column',
      background: 'var(--ivory)',
      fontFamily: 'var(--sans)', color: 'var(--ink)',
    }}>
      {/* Header */}
      <header style={{
        flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: 'calc(env(safe-area-inset-top) + 12px) 18px 12px',
        background: 'var(--bone)',
        borderBottom: '1px solid var(--line)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <Logo size={28}/>
          <span style={{ fontFamily: 'var(--serif)', fontSize: 23, fontStyle: 'var(--display-italic)', fontWeight: 500, letterSpacing: '0.01em' }}>Perim</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button aria-label="Notifications" style={{
            width: 38, height: 38, borderRadius: 999, position: 'relative',
            background: 'var(--card)', boxShadow: 'inset 0 0 0 1px var(--line)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-2)',
          }}>
            <Icon d={ICONS.bell} size={16}/>
            <span style={{ position: 'absolute', top: 9, right: 10, width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }}/>
          </button>
          <button onClick={() => { onNav('profile'); setSheet(false); }} aria-label="Profile" style={{
            width: 38, height: 38, borderRadius: '50%',
            background: 'var(--accent-soft)', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--serif)', fontStyle: 'var(--display-italic)', fontSize: 17, color: 'var(--ink)',
            boxShadow: active === 'profile' ? '0 0 0 2px var(--accent)' : 'none',
          }}>{initial}</button>
        </div>
      </header>

      {/* Scrollable content */}
      <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch' }}>
        <div key={active} className="fade-up">{children}</div>
      </main>

      {/* Bottom tab bar */}
      <nav style={{
        flexShrink: 0,
        display: 'grid', gridTemplateColumns: `repeat(${TABS.length}, 1fr)`,
        background: 'var(--card)',
        borderTop: '1px solid var(--line)',
        padding: '8px 6px calc(env(safe-area-inset-bottom) + 8px)',
      }}>
        {TABS.map(tb => <TabButton key={tb.k} icon={tb.icon} label={t(tb.en, tb.tr)} active={active === tb.k} onClick={() => { onNav(tb.k); setSheet(false); }}/>)}
      </nav>

      {/* More sheet */}
      {sheet && (
        <>
          <div onClick={() => setSheet(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(20,14,10,0.4)', zIndex: 50 }}/>
          <div className="sheet-up" style={{
            position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 51,
            background: 'var(--card)', borderTopLeftRadius: 22, borderTopRightRadius: 22,
            padding: '12px 16px calc(env(safe-area-inset-bottom) + 20px)',
            boxShadow: '0 -16px 40px -16px rgba(0,0,0,0.4)',
          }}>
            <div style={{ width: 38, height: 4, borderRadius: 4, background: 'var(--line)', margin: '4px auto 14px' }}/>
            <div className="eyebrow" style={{ padding: '0 6px 10px' }}>{t('More', 'Daha fazla')}</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {MORE_ITEMS.map((m, i) => (
                <button key={m.k} onClick={() => { onNav(m.k); setSheet(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '14px 6px', textAlign: 'left',
                    borderBottom: i < MORE_ITEMS.length - 1 ? '1px solid var(--line-soft)' : 'none', background: 'transparent',
                  }}>
                  <span style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--bone)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: active === m.k ? 'var(--accent)' : 'var(--ink-2)' }}>
                    <Icon d={m.icon} size={19}/>
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>{t(m.en, m.tr)}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>{t(m.subEn, m.subTr)}</div>
                  </div>
                  <Icon d={ICONS.arrow} size={15} stroke="var(--muted-2)"/>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function TabButton({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
      padding: '4px 0', background: 'transparent', cursor: 'pointer',
      color: active ? 'var(--accent)' : 'var(--muted)',
      transition: 'color 140ms ease',
    }}>
      <Icon d={icon} size={21} sw={active ? 2 : 1.5}/>
      <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, letterSpacing: '0.02em' }}>{label}</span>
    </button>
  );
}

export { useIsMobile, mobileNav, NAV_META, ICON_DOTS, MobileShell, TabButton };
