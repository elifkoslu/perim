/* phase-colors.js — faz renkleri, bağımlılığı olmayan yaprak modül.

   Neden ayrı dosya: bu sabit screens.jsx içindeydi ve reference-card.jsx onu
   oradan alıyordu. Ama screens.jsx de ReferenceCard'ı import ediyor — döngüsel
   bağımlılık. Kart yalnızca screens'ten çağrıldığı sürece sorun çıkmıyordu;
   Perim'in ilk sayfası kartı doğrudan import edince döngü, sabitin
   tanımlanmasından önce okunmasına yol açtı ve ekran çöktü.

   Yaprak modül döngüyü kırıyor: kimseyi import etmiyor, herkes onu alabiliyor.

   Renk seçimi: doğrulanmış paletin sekiz durağı arasından, her çiftin hem açık
   hem koyu yüzeyde geçtiği iki dörtlüden biri. CVD ayrımı 6.9 (8 hedefinin
   altı), o yüzden renk hiçbir yerde tek başına kimlik taşımıyor — her
   kullanıldığı yerde yanında yazılı faz adı var. */
const PHASE_TINT = {
  menstrual: '#e87ba4',
  follicular: '#008300',
  ovulation: '#eda100',
  luteal: '#2a78d6',
};

export { PHASE_TINT };
