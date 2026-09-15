/* ------------------------------------------------------------------
   TELEGRAM BİLDİRİMİ — sunucu tarafı

   Yeni rezervasyon ya da yeni talep oluştuğunda tarayıcı buraya
   POST atar, burası Telegram'a mesajı gönderir.

   Bot anahtarı neden burada?
   Tarayıcıya konulan her şey herkese açıktır. Bot anahtarı sızarsa
   başkası senin botunla mesaj gönderebilir. O yüzden anahtar
   Vercel ortam değişkeninde durur, tarayıcı onu hiç görmez.

   Gerekli ortam değişkenleri (Vercel > Settings > Environment Variables):
     TELEGRAM_BOT_TOKEN   BotFather'ın verdiği anahtar
     TELEGRAM_CHAT_ID     Mesajın gideceği sohbetin numarası
------------------------------------------------------------------- */

const AYLAR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

const GUNLER = [
  'Pazar', 'Pazartesi', 'Salı', 'Çarşamba',
  'Perşembe', 'Cuma', 'Cumartesi',
];

/* "2026-09-17" -> "17 Eylül 2026 Perşembe".
   Intl/ICU'ya güvenmiyoruz; elde çeviriyoruz ki sunucu dil paketi
   ne olursa olsun Türkçe çıksın. */
function tarihYaz(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
  if (!m) return String(iso || '').slice(0, 40);
  const [, yil, ay, gun] = m;
  const d = new Date(Date.UTC(Number(yil), Number(ay) - 1, Number(gun)));
  if (Number.isNaN(d.getTime())) return iso;
  return `${Number(gun)} ${AYLAR[Number(ay) - 1]} ${yil} ${GUNLER[d.getUTCDay()]}`;
}

/* Dışarıdan gelen her metni kısalt ve satır sonlarını temizle.
   Mesajın biçimini bozacak ya da şişirecek girdi gelmesin. */
function temiz(deger, sinir = 120) {
  return String(deger == null ? '' : deger)
    .replace(/[\r\n\t]+/g, ' ')
    .trim()
    .slice(0, sinir);
}

function mesajKur(govde) {
  const tip = govde.tip === 'talep' ? 'talep' : 'rezervasyon';
  const baslik = tip === 'talep'
    ? '📝 Yeni rezervasyon talebi (onay bekliyor)'
    : '📌 Yeni rezervasyon';

  const satirlar = [
    baslik,
    '',
    `Yer: ${temiz(govde.location)}`,
    `Tarih: ${tarihYaz(govde.date)}`,
    `Ders: ${temiz(govde.lessonLabel, 40)} (${temiz(govde.block, 10)})`,
    `Öğretmen: ${temiz(govde.teacher)}`,
    `Etkinlik: ${temiz(govde.activity)}`,
  ];

  return satirlar.join('\n');
}

async function telegramaGonder(token, chatId, metin) {
  const cevap = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    /* parse_mode yok: mesaj düz metin gider, böylece öğretmen adındaki
       _ * [ ] gibi karakterler Telegram'da hata çıkarmaz. */
    body: JSON.stringify({
      chat_id: chatId,
      text: metin,
      disable_web_page_preview: true,
    }),
  });
  return cevap;
}

/* Kurulum yardımcısı: sohbet numarası henüz ayarlanmadıysa, botun
   kendisine gelen son mesajlardan numarayı bulup söyler.
   Numara ayarlandıktan sonra bu yardım kapanır. */
async function sohbetNumarasiBul(token) {
  try {
    const cevap = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
    const veri = await cevap.json();
    if (!veri || !veri.ok || !Array.isArray(veri.result)) return null;
    for (let i = veri.result.length - 1; i >= 0; i--) {
      const sohbet = veri.result[i]?.message?.chat;
      if (sohbet && sohbet.id) {
        return { id: String(sohbet.id), ad: sohbet.first_name || sohbet.title || '' };
      }
    }
    return null;
  } catch (e) {
    return null;
  }
}

export default async function handler(req, res) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  /* ---- GET: kurulum durumunu göster ---- */
  if (req.method === 'GET') {
    if (!token) {
      return res.status(200).json({
        hazir: false,
        eksik: 'TELEGRAM_BOT_TOKEN',
        not: 'Vercel > Settings > Environment Variables bölümüne ekle.',
      });
    }
    if (!chatId) {
      const bulunan = await sohbetNumarasiBul(token);
      return res.status(200).json({
        hazir: false,
        eksik: 'TELEGRAM_CHAT_ID',
        bulunanSohbet: bulunan,
        not: bulunan
          ? `Bu numarayı TELEGRAM_CHAT_ID olarak ekle: ${bulunan.id}`
          : 'Telegram\'da bota bir mesaj yaz, sonra bu adresi tazele.',
      });
    }
    /* İkisi de hazır: artık teşhis bilgisi dökmüyoruz. */
    return res.status(200).json({ hazir: true });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ hata: 'yontem_desteklenmiyor' });
  }

  /* Bildirim kapalıysa sessizce geç — rezervasyonun kendisi zaten
     kaydedildi, bildirim yüzünden kullanıcıya hata göstermeyelim. */
  if (!token || !chatId) {
    return res.status(200).json({ gonderildi: false, sebep: 'yapilandirilmadi' });
  }

  let govde = req.body;
  if (typeof govde === 'string') {
    try { govde = JSON.parse(govde); } catch (e) { govde = null; }
  }
  if (!govde || typeof govde !== 'object') {
    return res.status(400).json({ hata: 'govde_okunamadi' });
  }

  try {
    const cevap = await telegramaGonder(token, chatId, mesajKur(govde));
    if (!cevap.ok) {
      const metin = await cevap.text();
      console.error('Telegram reddetti:', cevap.status, metin.slice(0, 300));
      return res.status(200).json({ gonderildi: false, sebep: 'telegram_reddetti' });
    }
    return res.status(200).json({ gonderildi: true });
  } catch (e) {
    console.error('Telegram\'a ulaşılamadı:', e);
    return res.status(200).json({ gonderildi: false, sebep: 'ulasilamadi' });
  }
}
