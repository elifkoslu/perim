import React from 'react';
import { t, useLang } from './i18n';
import { doseAmountOf, doseUnitOf } from './screens';
import { Card, TODAY_DATE, getTodayKey, medTaken, nowHM, todaysDoses } from './shared';

/* dose-backfill.jsx — ana sayfada son günlerin dozlarını hızlı girmek.

   İlaçlar ekranı günü tek tek ilerletiyor ve her seferinde tek gün
   gösteriyor: üç günü doldurmak için altı-yedi dokunuş, üstelik hangi
   günde olduğunu akılda tutarak. Burada son yedi gün alt alta, her
   satırda o günün planlı ilaçları birer düğme; dokununca o güne yazılıyor.

   Planlı ilaçlar gün gün hesaplanıyor (todaysDoses(lunara, tarih)) —
   rejim döngüsel olabilir, dünün listesi bugünkinden farklı olabilir. */

const GUN_SAYISI = 7;

function isoKey(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

/* Son n günün her biri için: tarih anahtarı, etiket, planlı ilaçlar ve
   alınmış olup olmadıkları. Rejim yoksa boş dizi. */
function sonGunler(lunara, n = GUN_SAYISI, today = TODAY_DATE, lang = 'tr') {
  if (!lunara || !lunara.regimen || !(lunara.regimen.meds || []).length) return [];
  const out = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const key = isoKey(d);
    const { meds } = todaysDoses(lunara, d);
    out.push({
      key, date: d,
      label: i === 0 ? t('Today', 'Bugün')
        : i === 1 ? t('Yesterday', 'Dün')
        : d.toLocaleDateString(lang === 'tr' ? 'tr' : 'en', { weekday: 'short', day: 'numeric' }),
      meds: meds.map(m => ({ id: m.id, ad: m.name, med: m, alindi: !!medTaken(lunara, m.id, key) })),
    });
  }
  return out;
}

function DoseBackfill({ lunara, api }) {
  const lang = useLang();
  const gunler = sonGunler(lunara, GUN_SAYISI, TODAY_DATE, lang);
  if (!gunler.length) return null;
  const bugunKey = getTodayKey();

  return (
    <Card>
      <div className="eyebrow" style={{ marginBottom: 4 }}>{t('Recent days', 'Son günler')}</div>
      <p style={{ fontSize: 11.5, color: 'var(--muted)', margin: '0 0 12px', lineHeight: 1.45 }}>
        {t('Tap a dose to mark it for that day — no need to change the date.',
           'Bir doza dokun, o güne işlenir — tarih değiştirmeye gerek yok.')}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {gunler.map(g => (
          <div key={g.key} style={{
            display: 'grid', gridTemplateColumns: '64px 1fr', gap: 10, alignItems: 'center',
            padding: '7px 0', borderBottom: '1px solid var(--line-soft)',
          }}>
            <span style={{ fontSize: 11.5, fontFamily: 'var(--mono)', color: g.key === bugunKey ? 'var(--ink)' : 'var(--muted)',
              fontWeight: g.key === bugunKey ? 700 : 400 }}>{g.label}</span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {g.meds.length === 0 && (
                <span style={{ fontSize: 11, color: 'var(--muted-2)', fontStyle: 'italic' }}>{t('rest day', 'ara günü')}</span>
              )}
              {g.meds.map(m => (
                <button key={m.id} aria-pressed={m.alindi}
                  aria-label={`${g.label} · ${m.ad} · ${m.alindi ? t('taken', 'alındı') : t('not taken', 'alınmadı')}`}
                  onClick={() => api && api.toggleMed(g.key, m.id,
                    /* Geçmiş güne şu anki saati yazmak yanlış olur; ilacın planlı saati */
                    g.key === bugunKey ? nowHM() : (m.med.time || nowHM()),
                    doseAmountOf(m.med), doseUnitOf(m.med))}
                  style={{
                    padding: '6px 11px', borderRadius: 999, cursor: 'pointer',
                    fontFamily: 'var(--sans)', fontSize: 12, fontWeight: 600,
                    maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    border: m.alindi ? '1px solid var(--accent)' : '1px solid var(--line)',
                    background: m.alindi ? 'var(--accent)' : 'var(--card)',
                    color: m.alindi ? 'var(--ivory)' : 'var(--ink-2)',
                  }}>
                  {m.alindi ? '✓ ' : ''}{m.ad}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export { DoseBackfill, sonGunler, GUN_SAYISI };
