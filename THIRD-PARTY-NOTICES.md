# Üçüncü taraf bileşenler

Bu uygulama aşağıdaki üçüncü taraf bileşenleri içerir. Lisans metinlerinin
tamamı `public/lisanslar/` altında dağıtımla birlikte gönderiliyor ve
uygulama içinden Profil → "Lisanslar & künye" ile açılıyor.

SIL Open Font License, fontlar yeniden dağıtıldığında lisans metninin de
eşlik etmesini şart koşar; bu yüzden dosyalar `public/` altında, derlenmiş
çıktıya giren yerde duruyor.

## Yazı tipleri — SIL Open Font License 1.1

| Font | Telif | Dosya |
|---|---|---|
| Manrope | Copyright 2018 The Manrope Project Authors | `OFL-Manrope.txt` |
| Spectral | Copyright 2017 The Spectral Project Authors | `OFL-Spectral.txt` |
| JetBrains Mono | Copyright 2020 The JetBrains Mono Project Authors | `OFL-JetBrainsMono.txt` |

Metinler fontların kanonik dağıtımından (`github.com/google/fonts`)
birebir alındı; üçü de OFL 1.1 başlığını ve izin maddesini taşıyor.
OFL ticari kullanıma, gömmeye ve satışa izin verir.

## Yazılım bileşenleri

| Paket | Lisans | Dosya |
|---|---|---|
| react, react-dom | MIT | `LICENSE-react.txt`, `LICENSE-react-dom.txt` |
| pdfjs-dist (pdf.js) | Apache-2.0 | `LICENSE-pdfjs-dist.txt` |

pdfjs-dist paketinde ayrı bir NOTICE dosyası bulunmuyor; Apache-2.0
yalnızca mevcut olan bir NOTICE'ın korunmasını ister.

Derleme araçları (vite, vitest ve bağımlılıkları) kullanıcıya giden
pakete dahil değildir, bu yüzden burada listelenmez.
