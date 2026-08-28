import React from 'react';
import { t } from './i18n';

/* Kasıtlı olarak shared.jsx'ten import edilmiyor: bu ekran son savunma hattı,
   modül grafiğinin geri kalanına bağlanmamalı. shared.jsx'teki LS_KEY ile
   aynı tutulmalı. */
const LS_KEY = 'perim.v1';

/* Top-level error boundary — a runtime error must never leave the user
   staring at a blank screen. Data lives in localStorage, so a reload is safe.

   Çökmenin kaynağı kayıtlı verinin kendisiyse (bozuk ya da eski biçimli bir
   yedeğin içe aktarılması gibi) yeniden yükleme sonsuz döngüye girer: hiçbir
   ekran çizilmediği için kullanıcı Profil'e ulaşıp veriyi dışa aktaramaz veya
   silemez de. O yüzden kurtarma bu ekranda duruyor — önce yedeği indir,
   sonra gerekiyorsa sıfırla. */

// Ham kaydı, uygulama hiç açılmadan diske indirir.
function yedegiIndir() {
  try {
    const raw = localStorage.getItem(LS_KEY) || '{}';
    const blob = new Blob([raw], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'perim-kurtarma-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (e) {}
}

// Bozuk kaydı bir kenara alıp temiz başlar. Silmez — geri dönüş şansı kalsın.
function verileriSifirla() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      try { localStorage.setItem(LS_KEY + '.kurtarma.' + Date.now(), raw); } catch (e) {}
    }
    localStorage.removeItem(LS_KEY);
  } catch (e) {}
  window.location.reload();
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, onayBekliyor: false };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    try { console.error('[Perim] render error:', error, info); } catch (e) {}
  }
  render() {
    if (!this.state.error) return this.props.children;
    const msg = String((this.state.error && this.state.error.message) || '');
    const { onayBekliyor } = this.state;

    const btn = (bg, fg) => ({
      padding: '13px 26px', borderRadius: 999, border: 'none', cursor: 'pointer',
      background: bg, color: fg, fontSize: 14, fontWeight: 600, fontFamily: 'inherit',
    });

    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--ivory, #F5F0E6)', padding: 24,
        fontFamily: "var(--sans, 'Manrope', system-ui, sans-serif)",
      }}>
        <div style={{ maxWidth: 440, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 14 }}>🌙</div>
          <div style={{ fontFamily: "var(--serif, Georgia, serif)", fontSize: 28, color: 'var(--ink, #2A2233)', marginBottom: 10, letterSpacing: '-0.01em' }}>
            {t('Something went wrong', 'Bir şeyler ters gitti')}
          </div>
          <p style={{ fontSize: 14, color: 'var(--muted, #7C6F89)', lineHeight: 1.6, margin: '0 0 22px' }}>
            {t('Your data is safe on this device. Reloading usually fixes this.',
               'Verilerin bu cihazda güvende. Yeniden yüklemek genellikle sorunu çözer.')}
          </p>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => window.location.reload()}
              style={btn('var(--ink, #2A2233)', 'var(--ivory, #F5F0E6)')}>
              {t('Reload Perim', 'Perim’u yeniden yükle')}
            </button>
            <button onClick={yedegiIndir}
              style={{ ...btn('transparent', 'var(--ink, #2A2233)'), boxShadow: 'inset 0 0 0 1px var(--line, #E0D8C8)' }}>
              {t('Download my data', 'Verilerimi indir')}
            </button>
          </div>

          {/* Kalıcı çökmenin tek çıkışı: kaydı bir kenara alıp temiz başlamak. */}
          <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid var(--line-soft, #E9E2D4)' }}>
            {!onayBekliyor ? (
              <>
                <p style={{ fontSize: 12.5, color: 'var(--muted, #7C6F89)', lineHeight: 1.6, margin: '0 0 12px' }}>
                  {t('Still broken after reloading? The saved record itself may be the problem.',
                     'Yeniden yükledikten sonra da açılmıyorsa sorun kayıtlı verinin kendisinde olabilir.')}
                </p>
                <button onClick={() => this.setState({ onayBekliyor: true })}
                  style={{ ...btn('transparent', 'var(--signal-low, #8C4A3F)'), padding: '10px 20px', fontSize: 13, boxShadow: 'inset 0 0 0 1px var(--line, #E0D8C8)' }}>
                  {t('Start over with an empty record', 'Boş bir kayıtla baştan başla')}
                </button>
              </>
            ) : (
              <>
                <p style={{ fontSize: 12.5, color: 'var(--ink, #2A2233)', lineHeight: 1.6, margin: '0 0 12px' }}>
                  {t('This clears the app’s current record. A copy is kept in this browser, and “Download my data” saves it to a file first.',
                     'Bu, uygulamanın şu anki kaydını temizler. Bir kopyası bu tarayıcıda saklanır; “Verilerimi indir” ile önce dosyaya da alabilirsin.')}
                </p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button onClick={verileriSifirla}
                    style={{ ...btn('var(--signal-low, #8C4A3F)', '#FFF6EC'), padding: '10px 20px', fontSize: 13 }}>
                    {t('Yes, start over', 'Evet, baştan başla')}
                  </button>
                  <button onClick={() => this.setState({ onayBekliyor: false })}
                    style={{ ...btn('transparent', 'var(--muted, #7C6F89)'), padding: '10px 20px', fontSize: 13 }}>
                    {t('Cancel', 'Vazgeç')}
                  </button>
                </div>
              </>
            )}
          </div>

          {msg && (
            <div style={{ marginTop: 18, fontFamily: "var(--mono, ui-monospace, monospace)", fontSize: 11, color: 'var(--muted-2, #A89178)', wordBreak: 'break-word' }}>
              {msg}
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
