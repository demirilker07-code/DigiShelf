# DigiShelf

DigiShelf, kisisel kutuphane yonetimi icin gelistirilen bir kitap takip web uygulamasidir. Ilk surum tek kullanicilidir; buna ragmen veri modeli kullanici, kutuphane girdisi, okuma oturumu ve yillik hedefleri ayirdigi icin cok kullanicili yapıya gecis icin uygun bir temel sunar.

## MVP kapsamı

- Ana sayfada kutuphane ozet kartlari, tur dagilimi ve donemsel dashboard
- Kitaplari durum bazli izleme: baslanmadi, devam ediyor, okundu, ara verildi, yarim birakildi, istek listesi
- Kart bazli kutuphane sayfasi ve kitap guncelleme
- Open Library API ile kitap arama ve hizli ekleme
- Manuel kitap ekleme formu
- Okunmamis kitaplar arasindan rastgele secim modulu
- Yillik kitap hedefini yil bazli saklama ve guncelleme

## Teknoloji

- Next.js App Router
- TypeScript
- Prisma
- SQLite
- Zod

## Kurulum

```bash
npm install
npx prisma generate
npm run db:push
npm run dev
```

## Mimari notlar

- `User`, `Book`, `LibraryBook`, `ReadingSession`, `YearGoal` ayrimi cok kullanicili genisleme icin temel katmandir.
- Dis API verisi sisteme kopyalanir; kutuphane her zaman uygulamanin kendi veritabani uzerinden yonetilir.
- Bir sonraki mantikli adimlar: kimlik dogrulama, Excel import, gelismis filtreleme, okuma notlari ve raporlar.
