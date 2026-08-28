# Sadeleştirme çalışması — 17 Ağustos 2026

"Arkadaşlarıma kurup anlattığımda karışık geliyor" geri bildiriminden çıkan
kullanılabilirlik değerlendirmesi ve uygulanan yedi düzeltme.

Yöntem: her iki uygulama da 375 px genişlikte, boş kayıtla, sıfırdan kurulum
yapılarak gezildi. Ekran başına kart/buton/kelime sayıları canlı DOM'dan sayıldı.

---

## Yapılanlar

### 01 · Mobil navigasyon evreye bağlandı — `src/mobile.jsx`

**Sorun.** Alt bardaki dört sekme ve "Daha" menüsündeki beş kalem `TABS` ve
`MORE_ITEMS` sabitlerinde elle yazılmıştı. Evreye göre bölüm seçen
`navItemsFor(stage)` yalnızca masaüstü yan menüde kullanılıyordu. Telefonda
her evre aynı dokuz bölümü görüyordu — kendi evresinde tanımlı olmayanlar
dahil. Arkadaşlar uygulamayı telefonda kurduğu için hiçbiri doğru listeyi
görmüyordu.

**Yapılan.** Bar `navItemsFor(stage)` çıktısından türüyor. `MOBILE_PRIORITY`
sırası bara günlük dokunulan bölümleri çıkarıyor; Belirtiler her evrede var
ve Bugün ekranının birincil butonu oraya gittiği için ayda bir açılan
Hareket/Beslenme'nin önüne alındı. Profil hiçbir evrenin listesinde değil ama
her zaman "Daha" içinde.

| Evre | Bar (önce) | Bar (sonra) |
|---|---|---|
| Perimenopoz | Bugün · Dozlar · Döngü · Hareket | Bugün · Belirtiler · Döngü · Dozlar |
| Döngü takibi | Bugün · Dozlar · Döngü · Hareket | Bugün · Belirtiler · Döngü · Hareket |
| Gebelik | Bugün · Dozlar · Döngü · Hareket | Bugün · Belirtiler · Hareket · Beslenme |
| Menopoz | Bugün · Dozlar · Döngü · Hareket | Bugün · Belirtiler · Dozlar · Hareket |

Gebelik ve menopoz artık Döngü sekmesi görmüyor; döngü takibi Dozlar ve
Tahliller görmüyor.

**Test.** `src/mobile-nav.test.js` — 8 test: gösterilenler evrenin listesini
aşmıyor, hiçbiri düşmüyor, tekrar etmiyor, profil bara çıkmıyor, Bugün ve
Belirtiler barda, bar dolunca taşanlar iniyor, bilinmeyen evrede çökmüyor.

---

### 02 · Veri yokken faz uydurma bitirildi — `src/shared.jsx`, `src/screens.jsx`

**Sorun.** Kurulumda hiçbir alan doldurulmadığında `periodStart` sessizce
bugüne düşüyordu. Hiçbir bilgi verilmemişken uygulama şunu gösteriyordu:

> "Döngünün 1. günündesin — menstrüel fazı."

Ayın tamamı fazlara boyanıyor, beş gün "beklenen kanama" işaretleniyordu.
Son reglinin tarihini bilmeyen ya da o alanı atlayan biri uydurulmuş bir
döngü görüyordu.

**Yapılan.** Çapa yoksa `periodStart` **null** kalıyor. `cycleDayFrom` ve
`phaseOf` null dönüyor — çağıran "bilinmiyor" hâlini ele almak zorunda.
`hasCycleAnchor(lunara)` yardımcısı eklendi.

Çapa yokken: takvim boyanmıyor, kesikli beklenen-kanama çerçeveleri yok,
halkada "buradasın" işaretçisi yok, `ReferenceCard` hiç çizilmiyor, Bugün
ekranı tek iş gösteriyor — *"Döngünü kuralım — son reglinin ilk gününü
işaretle."* İlk gün işaretlendiği an her şey açılıyor.

**Yol üstünde çıkan hata.** `bleedExpected(null, 28)` → `null <= 5` → `true`.
Yani fonksiyonun kendisi yalan söylüyordu; çağıranları korumak yetmiyordu.
Testi yazarken yakalandı, fonksiyona da guard eklendi.

**Test.** `src/cycle-unset.test.js` — 6 test.

---

### 04 · İlk ekrandaki dört sıfır kaldırıldı — `src/editorial.jsx`

**Sorun.** Yeni kurulmuş uygulamada Bugün ekranının sonu: `0` gün takip,
`0` doz alındı, `0` belirti kaydı, `0` kanama günü + "Son 30 günde kayıt yok".

**Yapılan.** Hiç kayıt yokken sayaç kartı yerine tek adımlık başlangıç kartı
geliyor. Metin duruma göre değişiyor: çapa yoksa "son reglini işaretle",
varsa "bugün nasıl hissettiğini kaydet". İlk kayıttan sonra sayaçlar devreye
giriyor.

---

### 05 · Kurulum hafifletildi — `src/stages.jsx`

**Sorun.** Tek ekranda ad, yaş, kilo, BHRT durumu, son adet ve döngü uzunluğu
soruluyordu; hiçbirinin niye sorulduğu yazmıyordu. Kilonun neden istendiğini
bilmeyen ya boş geçiyor (bkz. 02) ya tereddüt ediyordu.

**Yapılan.** Görünen alan **6 → 2**:

1. **Son reglinin ilk günü** — tek asıl soru, en üstte, gerekçesiyle:
   *"Döngü günün, fazın ve kanamanın ne zaman beklendiği hep bundan çıkıyor.
   Bilmiyorsan geç — sonra takvimden işaretleyebilirsin."*
2. **Adın (isteğe bağlı)**
3. *Birkaç ayrıntı daha (isteğe bağlı)* — katlanmış: yaş, kilo, döngü uzunluğu,
   BHRT durumu; her grubun altında ne işe yaradığı yazıyor
   ("Kilo yalnızca günlük protein hedefin için kullanılıyor",
   "Bu yalnızca Dozlar ekranının görünüp görünmeyeceğini belirliyor").

---

### 06 · Referans ekranları katlandı — `src/nourish.jsx`

**Sorun.** Beslenme telefonda 9 kart / 251 kelimeyle, Hareket 369 kelimeyle
açılıyordu. İkisi de ayda bir okunacak referans içerik, ama her gün açılan
ekranı bir makale gibi karşılıyorlardı.

**Yapılan.** Faz rehberi `ReferansBolum` içine alındı: tek satırlık
"bugünün önerisi" görünür kalıyor (örn. *"Bugün: Demir & sıcaklık yenile."*),
gerisi "Tüm faz rehberini gör" ile açılıyor. Faz seçici korundu — orası iyi
çalışıyordu.

| Ekran | Önce | Sonra (kapalı) |
|---|---|---|
| Beslenme | 9 kart / 251 kelime | 3 kart / 94 kelime |
| Hareket | 6 kart / 369 kelime | 3 kart / 260 kelime |

Hareket'te kalan kelimelerin çoğu rutin, Kegel ve sıçrama kartları — bunlar
günlük araçlar, referans içerik değil, o yüzden açıkta bırakıldı.

---

### 07 · İki uygulama ayrıştırıldı — `src/stages.jsx`

Kurulum ekranına tek cümle eklendi: *"Düzenli döngü, gebelik ya da doğum
sonrası mı takip ediyorsun? Onlar için Lunara var."*

---

## Yol üstünde çıkan ve düzeltilen iki hata

1. **`bleedExpected(null)` `true` dönüyordu** — yukarıda 02'de anlatıldı.
   Test yazarken yakalandı.
2. **`ReferenceCard`'da koşullu hook çağrısı** — "döngü günü yoksa çizme"
   erken çıkışını `useLang()` hook'undan önce koymuştum. React ağacı bozuldu,
   Bugün ekranı ErrorBoundary'ye düşüp boş kaldı. Tarayıcı doğrulamasında
   yakalandı; çıkış hook'un arkasına alındı.

---

## Değiştirilmeyenler (kasıtlı)

- **Takvimdeki beklenen / gerçekleşen kanama ayrımı** — 02'deki sorunun
  panzehiri: uygulamanın tahmini ile kullanıcının kaydı görsel olarak ayrı.
- **Faz renginin yanındaki yazılı etiket** — dört faz rengi renk körlüğünde
  ΔE 6.9 ile ayrışıyor (hedef 8). Etiket kaldırılırsa renk tek başına yetmiyor.
- **Tahliller ve titrasyon günlüğü** — hekime götürülen çıktı bu. Bardan indi,
  silinmedi.

---

## Doğrulama

- Womentum **110 test** geçiyor (9 dosya), Lunara **120 test** (10 dosya).
- İki uygulama da temiz derleniyor; service worker üretiliyor
  (`precache 27 entries`).
- Sekiz ekran 375 px'de tek tek gezildi, konsolda hata yok.
- Yedi evrenin tamamında mobil bar doğru bölümleri gösteriyor.

## Commit'ler

```
11ad744  ReferenceCard'daki koşullu hook çağrısını düzelt
fff7a50  Boş durumu dürüst yap, kurulumu ve referans ekranlarını hafiflet
9c9a31d  Mobil navigasyonu evreye bağla
```
