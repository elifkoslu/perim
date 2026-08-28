import React from 'react';

/* i18n.jsx — Lunara dil destek katmanı (EN / TR)
   Kullanım: t('English', 'Türkçe')  → aktif dile göre döner.
   Sadece Root useLang() ile aboneyse tüm alt ağaç yeniden render olur. */
/* eslint-disable */

const I18N = {
  lang: (function () {
    // womentu.lang / aster.lang: Perim adından önceki anahtarlar; okuma yedeği.
    try { return localStorage.getItem('perim.lang') || localStorage.getItem('womentu.lang') || localStorage.getItem('aster.lang') || 'tr'; } catch (e) { return 'tr'; }
  })(),
  listeners: new Set(),
  set(l) {
    this.lang = l;
    try { localStorage.setItem('perim.lang', l); } catch (e) {}
    document.documentElement.setAttribute('lang', l);
    this.listeners.forEach(fn => fn());
  },
};

// index.html'de lang="tr" sabit; kayıtlı dili açılışta uygula.
// Yoksa CSS text-transform:uppercase İngilizce metni Türkçe kuralıyla büyütür (i → İ).
try { document.documentElement.setAttribute('lang', I18N.lang); } catch (e) {}

// Aktif dile göre metin seç
function t(en, tr) {
  return I18N.lang === 'tr' && tr != null ? tr : en;
}

// Re-render aboneliği
function useLang() {
  const [, force] = React.useReducer(x => x + 1, 0);
  React.useEffect(() => {
    I18N.listeners.add(force);
    return () => I18N.listeners.delete(force);
  }, []);
  return I18N.lang;
}

// Dil değiştirici — sidebar'da kullanılır
function LangToggle() {
  const lang = useLang();
  const opts = [{ k: 'en', label: 'EN' }, { k: 'tr', label: 'TR' }];
  return (
    <div style={{
      display: 'flex', gap: 3, padding: 3, borderRadius: 999,
      background: 'var(--bone)', boxShadow: 'inset 0 0 0 1px var(--line)',
    }}>
      {opts.map(o => {
        const on = o.k === lang;
        return (
          <button key={o.k} onClick={() => I18N.set(o.k)}
            style={{
              flex: 1, padding: '6px 0', borderRadius: 999,
              fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.06em',
              fontWeight: on ? 700 : 500, cursor: 'pointer', border: 'none',
              background: on ? 'var(--ink)' : 'transparent',
              color: on ? 'var(--ivory)' : 'var(--muted)',
              transition: 'all 140ms ease',
            }}>{o.label}</button>
        );
      })}
    </div>
  );
}

export { I18N, t, useLang, LangToggle };
