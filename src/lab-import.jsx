import React from 'react';
import { t } from './i18n';
import { Card, ICONS, Icon, LABS, getTodayKey } from './shared';

/* lab-import.jsx — e-Nabız tahlil PDF'ini cihaz İÇİNDE çözümleyip
   Tahliller'e panel olarak aktarır. Dosya hiçbir sunucuya gönderilmez. */
/* eslint-disable */

// pdfjs ~1 MB — yalnızca gerçekten PDF içe aktarılırken dinamik yüklenir,
// ana paket küçük kalır.
/* "legacy" yapı: pdf.js 4.x modern yapısı Promise.withResolvers gibi yeni
   API'lere doğrudan dayanıyor; iOS/Safari 17.4 öncesinde bu yüzden getDocument
   patlıyor ve kullanıcı geçerli e-Nabız PDF'inde "işlenemedi" görüyordu.
   Legacy yapı bu polyfill'leri hem ana iş parçacığında hem worker'da taşır. */
async function loadPdfjs() {
  const [pdfjs, worker] = await Promise.all([
    import('pdfjs-dist/legacy/build/pdf.mjs'),
    import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'),
  ]);
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  return pdfjs;
}

// ── 1. PDF → satırlar (hücre dizileri) ────────────────────────────
// Metin parçalarını y koordinatına göre satırlara, x'e göre hücrelere dizer.
/* PDF dış kaynaklı bir dosya; ayrıştırıcıyı en dar kipte çalıştırıyoruz.
   isEvalSupported: pdf.js'in font/desen kodundaki eval benzeri yolu kapatır
   (CVE-2024-4367 bu sınıftandı; kurulu sürüm yamalı ama kapalı tutmak bedava).
   disableFontFace: gömülü fontlar tarayıcıya kaydedilmez, yalnızca çizilir.
   Yalnızca metin okuduğumuz için hiçbiri sonucu etkilemiyor.
   Sayfa ve boyut sınırı, çok büyük bir dosyanın sekmeyi kilitlemesini önler. */
const MAKS_SAYFA = 40;
const MAKS_BAYT = 20 * 1024 * 1024;

async function extractLines(file) {
  if (file.size > MAKS_BAYT) throw new Error('pdf-cok-buyuk');
  const pdfjs = await loadPdfjs();
  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({
    data,
    isEvalSupported: false,
    disableFontFace: true,
    useSystemFonts: false,
  }).promise;
  const lines = [];
  const sayfaSiniri = Math.min(doc.numPages, MAKS_SAYFA);
  for (let p = 1; p <= sayfaSiniri; p++) {
    const page = await doc.getPage(p);
    const tc = await page.getTextContent();
    const byY = new Map();
    for (const it of tc.items) {
      if (!it.str || !it.str.trim()) continue;
      const y = Math.round(it.transform[5]);
      if (!byY.has(y)) byY.set(y, []);
      byY.get(y).push({ x: it.transform[4], s: it.str.trim() });
    }
    const sorted = [...byY.entries()].sort((a, b) => b[0] - a[0]);
    for (const [, items] of sorted) {
      lines.push(items.sort((a, b) => a.x - b.x).map(i => i.s));
    }
  }
  return lines;
}

// ── 2. e-Nabız tablo çözümleyici ──────────────────────────────────
const NUM_RE = /^\d+(?:[.,]\d+)?$/;
const RANGE_RE = /^(\d+(?:[.,]\d+)?)\s*-\s*(\d+(?:[.,]\d+)?)$/;
const DATE_RE = /^(\d{2})\.(\d{2})\.(\d{4})$/;
const toNum = s => parseFloat(String(s).replace(',', '.'));

// Hormon adlarını Perim'un kayıtlı analitlerine bağla (sıra önemli)
const HORMONE_MAP = [
  [/estradiol|östradiol|\be2\b/i, 'e2'],
  [/progesteron/i, 'p4'],
  [/serbest\s+test[eo]steron/i, 'ft'],   // raporlarda "testesteron" yazımı da geçiyor
  [/test[eo]steron/i, 't'],
  [/shbg/i, 'shbg'],
  [/\bfsh\b/i, 'fsh'],
];
function keyFor(name) {
  for (const [re, key] of HORMONE_MAP) if (re.test(name)) return key;
  return 'enb-' + name.toLocaleLowerCase('tr').replace(/[^a-z0-9çğıöşü%]+/gi, '-').replace(/^-+|-+$/g, '');
}

// Satırları oku → tarihe göre gruplanmış panel listesi
function parseEnabizLines(lines) {
  const groups = new Map(); // 'YYYY-MM-DD' -> readings[]
  let curDate = null;
  let lastReading = null;

  for (const cells of lines) {
    const joined = cells.join(' ');

    // Panel tarihi: satır çıplak tarihle başlıyor ("Tarih:" etiketiyle değil)
    const dm = DATE_RE.exec(cells[0] || '');
    if (dm) { curDate = `${dm[3]}-${dm[2]}-${dm[1]}`; continue; }
    if (/^\d{2}:\d{2}$/.test(joined)) continue; // saat satırı

    // Yalnız referans aralığı içeren satır → bir önceki tahlile iliştir
    if (cells.length === 1 && RANGE_RE.test(cells[0])) {
      if (lastReading && !lastReading.range) {
        const m = RANGE_RE.exec(cells[0]);
        lastReading.range = [toNum(m[1]), toNum(m[2])];
      }
      continue;
    }

    // Tahlil satırı: ilk TAMAMEN sayısal hücre = sonuç değeri.
    // (Başlık/altbilgi satırları lastReading'i SIFIRLAMAZ — sayfa sonuna denk
    // gelen tahlilin referans aralığı sonraki sayfanın başında gelebilir.)
    let vi = -1;
    for (let i = 1; i < cells.length; i++) if (NUM_RE.test(cells[i])) { vi = i; break; }
    if (vi < 1) continue;
    const name = cells.slice(0, vi).join(' ').replace(/\s+/g, ' ').trim();
    if (!/[a-zçğıöşüA-ZÇĞİÖŞÜ]/.test(name)) continue;
    if (/sayfa|enabiz|sağlık|tel:|adı|soyadı|doğum/i.test(name)) continue;

    const value = toNum(cells[vi]);
    let unit = cells[vi + 1] && !RANGE_RE.test(cells[vi + 1]) ? cells[vi + 1] : '';
    if (unit === '-' || /karar/i.test(unit)) unit = '';
    let range = null;
    for (let i = vi + 1; i < cells.length; i++) {
      const m = RANGE_RE.exec(cells[i]);
      if (m) { range = [toNum(m[1]), toNum(m[2])]; break; }
    }

    const key = keyFor(name);
    const reg = LABS.find(l => l.key === key);
    // Birimi PDF vermediyse boş bırak — kayıt defteri birimini VARSAYMA
    // (raporun birimi farklı olabilir; yanlış birim yanlış yorumdur).
    const reading = {
      key,
      name: reg ? reg.name : name,
      nameTr: reg ? (reg.nameTr || reg.name) : name,
      unit,
      value, range,
    };
    const date = curDate || getTodayKey();
    if (!groups.has(date)) groups.set(date, []);
    // aynı tahlil bir kez (ilk görülen kazanır)
    if (!groups.get(date).some(r => r.key === key)) groups.get(date).push(reading);
    lastReading = reading;
  }

  return [...groups.entries()]
    .map(([date, readings]) => ({ date, readings }))
    .filter(g => g.readings.length > 0);
}

async function parseEnabizPdf(file) {
  const lines = await extractLines(file);
  return parseEnabizLines(lines);
}

// ── 3. İçe aktarma modalı ─────────────────────────────────────────
function ImportLabModal({ onClose, api }) {
  const [phase, setPhase] = React.useState('pick'); // pick | parsing | review | error
  const [groups, setGroups] = React.useState([]);
  const [checked, setChecked] = React.useState({}); // 'date|key' -> bool
  const [error, setError] = React.useState('');

  const pick = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setPhase('parsing');
    try {
      const gs = await parseEnabizPdf(file);
      if (!gs.length) { setError(t('No lab values could be read from this PDF.', 'Bu PDF’ten tahlil değeri okunamadı.')); setPhase('error'); return; }
      const ck = {};
      gs.forEach(g => g.readings.forEach(r => { ck[g.date + '|' + r.key] = true; }));
      setGroups(gs); setChecked(ck); setPhase('review');
    } catch (err) {
      // Gerçek nedeni konsola bırak; kullanıcı mesajı her hatada aynı.
      console.error('e-Nabız PDF içe aktarma hatası:', err);
      setError(err && err.message === 'pdf-cok-buyuk'
        ? t('This file is too large (limit 20 MB).', 'Bu dosya çok büyük (sınır 20 MB).')
        : t('The file could not be processed. Is it an e-Nabız lab PDF?', 'Dosya işlenemedi. Bu bir e-Nabız tahlil PDF’i mi?'));
      setPhase('error');
    }
  };

  const total = groups.reduce((s, g) => s + g.readings.filter(r => checked[g.date + '|' + r.key]).length, 0);

  const save = () => {
    for (const g of groups) {
      const readings = g.readings.filter(r => checked[g.date + '|' + r.key]);
      if (readings.length) api.addLabPanel({ date: g.date, readings });
    }
    onClose();
  };

  const X_PATH = 'M18 6 6 18M6 6l12 12';
  const fmtD = iso => { const p = iso.split('-'); return `${p[2]}.${p[1]}.${p[0]}`; };

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(20,14,10,0.5)', backdropFilter: 'blur(3px)', padding: 18,
    }}>
      <div onClick={e => e.stopPropagation()} className="sheet-up" style={{
        width: '100%', maxWidth: 500, maxHeight: '88vh', overflow: 'auto',
        background: 'var(--card)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-card)', padding: 24,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 4 }}>{t('IMPORT FROM PDF', 'PDF’TEN İÇE AKTAR')}</div>
            <h2 className="serif-display" style={{ margin: 0, fontSize: 24 }}>{t('e-Nabız lab report', 'e-Nabız tahlil raporu')}</h2>
          </div>
          <button onClick={onClose} style={{ padding: 6, color: 'var(--muted)', cursor: 'pointer' }}><Icon d={X_PATH} size={18} sw={2}/></button>
        </div>

        {phase === 'pick' && (
          <>
            <p style={{ fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.6, margin: '0 0 16px' }}>
              {t('Choose the PDF you downloaded from e-Nabız. It is read entirely on your device — nothing is uploaded anywhere.',
                 'e-Nabız’dan indirdiğin PDF’i seç. Dosya tamamen cihazında okunur — hiçbir yere yüklenmez.')}
            </p>
            <label style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, cursor: 'pointer',
              padding: '30px 20px', borderRadius: 'var(--r-md)', border: '1.5px dashed var(--line)',
              background: 'var(--ivory)', textAlign: 'center',
            }}>
              <Icon d={ICONS.vial} size={26} stroke="var(--accent)"/>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{t('Choose PDF file', 'PDF dosyası seç')}</span>
              <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>Enabiz-Tahlilleri.pdf</span>
              <input type="file" accept="application/pdf,.pdf" onChange={pick} style={{ display: 'none' }}/>
            </label>
          </>
        )}

        {phase === 'parsing' && (
          <p className="pulse-soft" style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 15, color: 'var(--muted)', textAlign: 'center', padding: '30px 0' }}>
            {t('Reading your report…', 'Raporun okunuyor…')}
          </p>
        )}

        {phase === 'error' && (
          <>
            <p style={{ fontSize: 13.5, color: 'var(--signal-low)', lineHeight: 1.55, margin: '0 0 16px' }}>{error}</p>
            <button onClick={() => setPhase('pick')} style={{
              width: '100%', padding: '12px 0', borderRadius: 999, border: '1px solid var(--line)',
              background: 'transparent', color: 'var(--ink-2)', fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}>{t('Try another file', 'Başka dosya dene')}</button>
          </>
        )}

        {phase === 'review' && (
          <>
            <p style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5, margin: '0 0 14px' }}>
              {t('Review what was found. Untick anything you don’t want to keep.',
                 'Bulunanları gözden geçir. İstemediklerinin işaretini kaldır.')}
            </p>
            {groups.map(g => (
              <div key={g.date} style={{ marginBottom: 16 }}>
                <div className="eyebrow" style={{ marginBottom: 8 }}>{t('Panel', 'Panel')} · {fmtD(g.date)}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {g.readings.map(r => {
                    const id = g.date + '|' + r.key;
                    const on = !!checked[id];
                    return (
                      <button key={id} onClick={() => setChecked(c => ({ ...c, [id]: !c[id] }))} style={{
                        display: 'grid', gridTemplateColumns: '22px 1fr auto', gap: 10, alignItems: 'center',
                        padding: '9px 12px', borderRadius: 10, textAlign: 'left', cursor: 'pointer',
                        background: on ? 'var(--bone)' : 'transparent',
                        boxShadow: 'inset 0 0 0 1px var(--line-soft)', opacity: on ? 1 : 0.55,
                      }}>
                        <span style={{
                          width: 18, height: 18, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: on ? 'var(--accent)' : 'transparent', color: 'var(--ivory)',
                          boxShadow: on ? 'none' : 'inset 0 0 0 1.5px var(--line)',
                        }}>{on && <Icon d={ICONS.check} size={11} sw={2.6}/>}</span>
                        <span style={{ fontSize: 13, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t(r.name, r.nameTr)}</span>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--ink-2)', whiteSpace: 'nowrap' }}>
                          {r.value} {r.unit}{r.range ? ` · ${r.range[0]}–${r.range[1]}` : ''}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            <button onClick={save} disabled={!total} style={{
              width: '100%', padding: '13px 0', borderRadius: 999, border: 'none',
              background: 'var(--ink)', color: 'var(--ivory)', fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 600,
              cursor: total ? 'pointer' : 'not-allowed', opacity: total ? 1 : 0.45,
            }}>{t(`Save ${total} result${total === 1 ? '' : 's'}`, `${total} sonucu kaydet`)}</button>
          </>
        )}

        <p style={{ fontSize: 11, color: 'var(--muted-2)', lineHeight: 1.5, margin: '14px 0 0', fontStyle: 'italic', textAlign: 'center' }}>
          {t('Processed on this device only · never uploaded', 'Yalnızca bu cihazda işlenir · hiçbir yere yüklenmez')}
        </p>
      </div>
    </div>
  );
}

export { parseEnabizPdf, parseEnabizLines, ImportLabModal };
