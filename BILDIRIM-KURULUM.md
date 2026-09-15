# Telegram Bildirimi — Kurulum

Yeni rezervasyon ya da yeni talep geldiğinde telefonuna Telegram mesajı düşer.

Kod tarafı hazır. Geriye botu açıp iki tane değeri Vercel'e girmek kaldı.
Tahmini süre: 10 dakika.

---

## 1. Botu aç (telefondan, Telegram içinde)

1. Telegram'da arama kutusuna `@BotFather` yaz, çık gelen resmî hesabı aç
   (mavi tikli olan).
2. `/newbot` yaz.
3. Bota bir ad sor: örneğin `Okul Rezervasyon`.
4. Bir kullanıcı adı sor: **`bot` ile bitmek zorunda**, örneğin
   `cg_rezervasyon_bot`. Adın alınmışsa başka dene.
5. BotFather sana şöyle bir satır verir:

   ```
   7123456789:AAE_kQ-buradaUzunBirDizi_xyz
   ```

   Bu **bot anahtarı**. Kimseyle paylaşma, ekran görüntüsünü atma.

## 2. Bota bir kez yaz

Botunun adına dokunup sohbeti aç ve **Start**'a bas (ya da `merhaba` yaz).

Bu adım şart: Telegram, sen ona yazmadan botun sana mesaj atmasına izin vermez.

## 3. Sohbet numaranı öğren

Tarayıcıda şu adresi aç — `<ANAHTAR>` yerine 1. adımdaki anahtarı yapıştır:

```
https://api.telegram.org/bot<ANAHTAR>/getUpdates
```

Dönen metinde `"chat":{"id":123456789,` gibi bir yer olacak. Oradaki sayı
(`123456789`) senin **sohbet numaran**. Eksi işaretliyse eksiyi de al.

> Boş `{"ok":true,"result":[]}` dönüyorsa 2. adımı atlamışsındır: bota
> bir mesaj yaz, sonra sayfayı tazele.

## 4. İki değeri Vercel'e gir

Vercel paneli → `rezervasyon` projesi → **Settings** → **Environment Variables**.
İki kayıt ekle (üçü de — Production, Preview, Development — işaretli olsun):

| Name | Value |
|---|---|
| `TELEGRAM_BOT_TOKEN` | 1. adımdaki anahtar |
| `TELEGRAM_CHAT_ID` | 3. adımdaki sayı |

## 5. Yayına al

```bash
cd ~/rezervasyon
git push origin main
```

Vercel otomatik deploy eder. **Önemli:** ortam değişkenlerini deploy'dan
sonra eklediysen yeni bir deploy gerekir — panelde **Deployments** →
en üstteki → **Redeploy**.

## 6. Dene

1. `https://rezervasyon-seven.vercel.app/api/bildir` adresini aç.
   `{"hazir":true}` görmelisin.
   - `{"hazir":false,"eksik":"TELEGRAM_CHAT_ID"}` görüyorsan 4. adım eksik
     ya da redeploy yapılmamış.
2. Siteden bir rezervasyon yap. Telefonuna birkaç saniye içinde şöyle bir
   mesaj düşmeli:

   ```
   📌 Yeni rezervasyon

   Yer: Akıl ve Zeka Oyunları Sınıfı
   Tarih: 17 Eylül 2026 Perşembe
   Ders: 6. Ders (ÖĞLE)
   Öğretmen: 2/C - Neşe Dilber
   Etkinlik: Zeka Oyunları Kulüp Saati
   ```

---

## Nasıl çalışıyor

- `src/bildirim.ts` — rezervasyon/talep oluşunca `/api/bildir` adresine
  haber verir. Beklemez, hata fırlatmaz: bildirim gitmese bile rezervasyon
  kaydedilir.
- `api/bildir.js` — Vercel'de çalışan küçük bir fonksiyon. Mesajı kurar ve
  Telegram'a gönderir. Bot anahtarı **burada** durur, tarayıcıya hiç inmez.
- Bildirimi, kaydı oluşturan cihaz tetikler. Yani bir rezervasyon için tek
  mesaj gelir, siteyi açık tutan her cihaz için ayrı ayrı gelmez.

## Bilinmesi gerekenler

**Bildirim gelmezse rezervasyon kaybolmaz.** İkisi birbirinden bağımsız.
Telegram çökse bile sistem normal çalışır.

**`/api/bildir` adresi herkese açık.** Adresi bilen biri teoride sahte
bildirim gönderip seni rahatsız edebilir. Verilere dokunamaz, sadece
mesaj atar. Böyle bir şey olursa BotFather'dan `/revoke` ile anahtarı
yenile ve Vercel'deki değeri güncelle.

**Telefonu değiştirirsen** bir şey yapmana gerek yok; Telegram hesabın
aynı kaldığı sürece mesajlar gelmeye devam eder.

**Bildirimi kapatmak istersen** Vercel'den `TELEGRAM_BOT_TOKEN` değerini
sil ve redeploy et. Kod bunu görünce sessizce devre dışı kalır.

## Sonradan istenebilecekler

- Rezervasyon **iptallerinde** de bildirim (`silBooking` çağrısına aynı
  kancayı takmak yeterli).
- Her akşam "yarın şunlar var" özeti (bir cron gerekir).
- Bildirimin birden fazla kişiye gitmesi (Telegram'da bir grup açıp grup
  numarasını `TELEGRAM_CHAT_ID` yapmak yeterli).
