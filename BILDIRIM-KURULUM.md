# Bildirim Kurulumu

Yeni rezervasyon ya da yeni talep geldiğinde telefonuna bildirim düşer.

Kod tarafı hazır ve denendi. Sana kalan üç adım var, 3 dakika sürer.
Hesap açmak, şifre, anahtar yok.

---

## Kanal adın

```
cg-rez-935byvu5qt
```

Bu senin özel kanal adın. Bildirimler buradan akacak. Rastgele üretildi;
**tahmin edilmesin diye kimseyle paylaşma** (nedeni aşağıda "Bilinmesi
gerekenler" bölümünde).

---

## 1. Uygulamayı kur (telefonda)

Play Store'da **ntfy** diye ara — simgesi yeşil zil olan, geliştirici
"Philipp Heckel". Kur ve aç.

## 2. Kanalı ekle

1. Uygulamada sağ alttaki **+** düğmesine bas.
2. Açılan kutuya kanal adını yaz:

   ```
   cg-rez-935byvu5qt
   ```

3. **Subscribe** (Abone ol) de. Başka hiçbir şeye dokunma —
   "Use another server" gibi seçenekleri boş bırak.

Listede kanal adı görünüyorsa tamamdır.

## 3. Vercel'e kanal adını gir

Vercel paneli → `rezervasyon` projesi → **Settings** → **Environment Variables**
→ yeni kayıt:

| Name | Value |
|---|---|
| `NTFY_TOPIC` | `cg-rez-935byvu5qt` |

Production / Preview / Development — üçü de işaretli olsun. **Save**.

---

## Yayına alma

```bash
cd ~/rezervasyon
git push origin main
```

Vercel otomatik deploy eder.

> **Önemli:** Ortam değişkenini deploy'dan sonra eklediysen yeni bir deploy
> gerekir. Panelde **Deployments** → en üstteki → **Redeploy**.

## Deneme

1. `https://rezervasyon-seven.vercel.app/api/bildir` adresini aç.
   `{"hazir":true,"kanallar":["ntfy"]}` görmelisin.
   - `{"hazir":false...}` görüyorsan 3. adım eksik ya da redeploy yapılmadı.
2. Siteden bir rezervasyon yap. Telefonuna birkaç saniye içinde şu düşer:

   ```
   Yeni rezervasyon

   Yer: Akıl ve Zeka Oyunları Sınıfı
   Tarih: 17 Eylül 2026 Perşembe
   Ders: 6. Ders (ÖĞLE)
   Öğretmen: 2/C - Neşe Dilber
   Etkinlik: Zeka Oyunları Kulüp Saati
   ```

Talep geldiğinde başlık "Yeni talep (onay bekliyor)" olur ve bildirim
daha sessiz gelir; rezervasyon bildirimi yüksek öncelikli gider.

---

## Nasıl çalışıyor

- `src/bildirim.ts` — rezervasyon/talep oluşunca `/api/bildir` adresine
  haber verir. Beklemez, hata fırlatmaz.
- `api/bildir.js` — Vercel'de çalışan küçük bir fonksiyon. Mesajı kurup
  ntfy'ye gönderir. Kanal adı **burada** durur, tarayıcıya inmez.
- Bildirimi, kaydı oluşturan cihaz tetikler. Bir rezervasyon için tek
  bildirim gelir, siteyi açık tutan her cihaz için ayrı ayrı gelmez.

## Bilinmesi gerekenler

**Bildirim gelmezse rezervasyon kaybolmaz.** İkisi birbirinden bağımsız.
ntfy çökse bile sistem normal çalışır.

**ntfy'de şifre yok, kanal adının kendisi anahtardır.** Kanal adını bilen
biri hem bildirimleri görebilir hem sana sahte bildirim gönderebilir.
Verilere dokunamaz. Ad rastgele üretildiği için tahmin edilmesi pratikte
imkânsız, ama adı yazılı bir yere koyma. Sızdığını düşünürsen: yeni bir ad
uydur, telefonda ona abone ol, Vercel'deki `NTFY_TOPIC` değerini değiştir,
redeploy et.

**Bildirim gelmiyorsa** ilk bakılacak yer telefonun pil ayarları:
Ayarlar → Uygulamalar → ntfy → Pil → **Kısıtlanmamış** olsun. Android
uygulamayı uyutursa bildirim gecikir.

**Bildirimi kapatmak istersen** Vercel'den `NTFY_TOPIC` değerini sil ve
redeploy et. Kod bunu görünce sessizce devre dışı kalır.

**Telefonu değiştirirsen** yeni telefona ntfy'yi kurup aynı kanal adına
abone olman yeterli.

## Telegram isteyen olursa

Kod Telegram'ı da destekliyor. `TELEGRAM_BOT_TOKEN` ve `TELEGRAM_CHAT_ID`
ortam değişkenlerini girersen oraya da gönderir; ikisi aynı anda açık
olabilir. Kurulumu ntfy'den zahmetli olduğu için varsayılan bu değil.

## Sonradan istenebilecekler

- Rezervasyon **iptallerinde** de bildirim (`silBooking` çağrısına aynı
  kancayı takmak yeterli).
- Her akşam "yarın şunlar var" özeti (bir cron gerekir).
- Bildirimin birden fazla kişiye gitmesi — ntfy'de bedava: diğer kişi de
  aynı kanal adına abone olur, hepsine birden düşer.
