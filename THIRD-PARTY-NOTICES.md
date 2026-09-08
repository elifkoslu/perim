# Üçüncü taraf bileşenler

Ticari dağıtımdan önce bu dosyanın tamamlanması gerekiyor: aşağıdaki
bileşenlerin lisans metinleri uygulamayla birlikte dağıtılmalı.

## Fontlar — EKSİK, EKLENMESİ GEREKİYOR

`public/fonts/` altındaki dosyalar bir paket yöneticisiyle değil elle
kopyalanmış, bu yüzden lisans metinleri projede yok. SIL Open Font
License, fontlar yeniden dağıtıldığında lisans metninin de eşlik
etmesini şart koşar.

| Font | Beklenen lisans | Yapılacak |
|---|---|---|
| Manrope | SIL OFL 1.1 | OFL.txt dosyasını projeye ekle |
| Spectral | SIL OFL 1.1 | OFL.txt dosyasını projeye ekle |
| JetBrains Mono | SIL OFL 1.1 | OFL.txt dosyasını projeye ekle |

Üçünün de OFL olduğu biliniyor ve OFL ticari kullanıma, gömmeye ve
satışa izin verir — ama bunu resmî kaynaktan (fontun kendi deposu)
doğrulamak ve metni buraya koymak gerekiyor. Bu dosyalar eklenmeden
ticari yayın yapılmamalı.

## Çalışma zamanı bağımlılıkları

| Paket | Lisans | Not |
|---|---|---|
| react, react-dom | MIT | künye yeterli |
| pdfjs-dist | Apache-2.0 | Apache-2.0 künye ve değişiklik bildirimi ister |

Apache-2.0, dağıtımda LICENSE ve NOTICE dosyalarının korunmasını
istiyor; pdfjs-dist paketindeki metinler bu dosyaya eklenmeli.
