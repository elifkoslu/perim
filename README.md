# Perim

Perimenopoz takibi. Womentum'un sadeleştirilmiş hâli: tek evre, beş bölüm.

## Bölümler

| Bölüm | İçerik |
|---|---|
| **Takvim** (açılış) | Ay takvimi: döngü günü, dört faz, beklenen ve gerçekleşen kanama, o gün ne kaydedildiği. Altında bugünün durumu. |
| **İlaçlar** | Üstte hormon tablosu (normalde olması gereken seviyeler · tahlilinde ölçülen · bugünün dozları). Üç bölüm: BHRT ilaçları, takviyeler, yemekler. |
| **Belirtiler** | Günlük belirti kaydı ve geçmiş. |
| **Hareketler** | Kegel, sıçrama (jump), ağırlık. |
| **Analizler** | Doz uyumu, belirti eğilimleri, döngü uzunluğu dağılımı, tahlil grafikleri, hekim raporu. |

## Tasarım kuralları

- **Uygulama doz hesaplamaz ve önermez.** Hormon eğrisi bağlamdır, hedef değil —
  perimenopozda tedavi o eğriyi yeniden üretmeyi amaçlamaz. Doz kararı hekimindir.
- **Veri yokken uygulama kesin konuşmaz.** Döngü çapası yoksa faz uydurulmaz,
  takvim boyanmaz, grafik çizilmez.
- **Örnek veri yok.** Ekranda görünen her sayı gerçek kayıttan gelir.
- **Renk tek başına kimlik taşımaz.** Faz renklerinin renk körlüğündeki ayrımı
  ΔE 6.9 ile sınırda; her kullanımın yanında yazılı etiket vardır.
- Veriler yalnızca cihazda (`localStorage`, anahtar `perim.v1`). Sunucu yok.

## Geliştirme

```bash
npm install
npm run dev      # http://localhost:5200
npm test         # vitest
npm run build
```

Womentum'dan türedi; fizyoloji verisi, döngü matematiği ve testler oradan gelir.
