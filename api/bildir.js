/* ------------------------------------------------------------------
   BİLDİRİM — sunucu tarafı

   Yeni rezervasyon ya da yeni talep oluştuğunda tarayıcı buraya
   POST atar, burası bildirimi telefona gönderir.

   İki kanal desteklenir; hangisi ayarlıysa o çalışır, ikisi de
   ayarlıysa ikisine birden gider:

     NTFY_TOPIC           ntfy.sh kanal adı  (basit yol, önerilen)
     TELEGRAM_BOT_TOKEN   \
     TELEGRAM_CHAT_ID     / Telegram botu   (ikisi birlikte gerekir)

   Hiçbiri ayarlı değilse sistem sessizce bildirimsiz çalışır —
   rezervasyon yine normal kaydedilir.

   Neden tarayıcıda değil de burada? Tarayıcıya konan her şey herkese
   açıktır. Kanal adı ve bot anahtarı burada kalır, tarayıcıya inmez.
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
  const tip = govde.tip;
  const iptalMi = tip === 'iptal';
  const talepMi = tip === 'talep';
  const bahceMi = tip === 'bahce';

  let baslik = 'Yeni rezervasyon';
  if (iptalMi) baslik = 'İPTAL TALEBİ — onayın bekleniyor';
  else if (talepMi) baslik = 'Yeni talep (onay bekliyor)';
  else if (bahceMi) baslik = 'Yeni sabit bahçe saati';

  /* Bahçe saatleri tarihe değil haftanın gününe bağlı. */
  const zamanSatiri = bahceMi
    ? `Zaman: her ${temiz(govde.gunAdi, 20)}`
    : `Tarih: ${tarihYaz(govde.date)}`;

  const govdeSatirlari = [
    `Yer: ${temiz(govde.location)}`,
    zamanSatiri,
    `Ders: ${temiz(govde.lessonLabel, 40)} (${temiz(govde.block, 10)})`,
    `Öğretmen: ${temiz(govde.teacher)}`,
    `Etkinlik: ${temiz(govde.activity)}`,
  ];

  /* İptal talebinde kimin istediği ve gerekçesi asıl bilgidir. */
  if (iptalMi) {
    govdeSatirlari.push(`İsteyen: ${temiz(govde.isteyen) || 'belirtilmedi'}`);
    const sebep = temiz(govde.sebep, 200);
    if (sebep) govdeSatirlari.push(`Gerekçe: ${sebep}`);
    govdeSatirlari.push('');
    govdeSatirlari.push('Rezervasyon SİLİNMEDİ. Sen onaylayana kadar yerinde duruyor.');
  }

  if (bahceMi) {
    govdeSatirlari.push('');
    govdeSatirlari.push('Bu saat, iptal edilene kadar her hafta bu şubenin.');
  }

  return { iptalMi, talepMi, baslik, metin: govdeSatirlari.join('\n') };
}

/* ---------------- ntfy.sh ---------------- */

/* ntfy başlıkları HTTP başlığı olarak gider; HTTP başlıkları yalnız
   ASCII taşır. Türkçe harfleri kaybetmemek için RFC 2047 ile
   kodluyoruz — ntfy bunu çözüp düzgün gösteriyor. */
function basligiKodla(metin) {
  return `=?UTF-8?B?${Buffer.from(metin, 'utf-8').toString('base64')}?=`;
}

async function ntfyGonder(topic, { iptalMi, talepMi, baslik, metin }) {
  return fetch(`https://ntfy.sh/${encodeURIComponent(topic)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      Title: basligiKodla(baslik),
      Tags: iptalMi ? 'warning' : (talepMi ? 'memo' : 'pushpin'),
      Priority: iptalMi ? 'urgent' : (talepMi ? 'default' : 'high'),
    },
    body: metin,
  });
}

/* ---------------- Telegram ---------------- */

async function telegramGonder(token, chatId, { baslik, metin }) {
  return fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    /* parse_mode yok: mesaj düz metin gider, böylece öğretmen adındaki
       _ * [ ] gibi karakterler Telegram'da hata çıkarmaz. */
    body: JSON.stringify({
      chat_id: chatId,
      text: `${baslik}\n\n${metin}`,
      disable_web_page_preview: true,
    }),
  });
}

/* ---------------- ortak ---------------- */

function kanallar() {
  const liste = [];
  if (process.env.NTFY_TOPIC) {
    liste.push({ ad: 'ntfy', calistir: (m) => ntfyGonder(process.env.NTFY_TOPIC, m) });
  }
  if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
    liste.push({
      ad: 'telegram',
      calistir: (m) => telegramGonder(
        process.env.TELEGRAM_BOT_TOKEN,
        process.env.TELEGRAM_CHAT_ID,
        m
      ),
    });
  }
  return liste;
}

export default async function handler(req, res) {
  const acikKanallar = kanallar();

  /* ---- GET: kurulum durumunu göster ---- */
  if (req.method === 'GET') {
    if (acikKanallar.length === 0) {
      return res.status(200).json({
        hazir: false,
        not: 'Vercel > Settings > Environment Variables bolumune NTFY_TOPIC ekle, sonra yeniden yayinla (Redeploy).',
      });
    }
    /* Kanal adını burada yazdırmıyoruz: bu adres herkese açık. */
    return res.status(200).json({
      hazir: true,
      kanallar: acikKanallar.map((k) => k.ad),
    });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ hata: 'yontem_desteklenmiyor' });
  }

  /* Bildirim kapalıysa sessizce geç — rezervasyonun kendisi zaten
     kaydedildi, bildirim yüzünden kullanıcıya hata göstermeyelim. */
  if (acikKanallar.length === 0) {
    return res.status(200).json({ gonderildi: false, sebep: 'yapilandirilmadi' });
  }

  let govde = req.body;
  if (typeof govde === 'string') {
    try { govde = JSON.parse(govde); } catch (e) { govde = null; }
  }
  if (!govde || typeof govde !== 'object') {
    return res.status(400).json({ hata: 'govde_okunamadi' });
  }

  const mesaj = mesajKur(govde);

  /* Bir kanal patlarsa diğeri yine denensin diye hepsini birlikte
     çalıştırıp sonuçlara tek tek bakıyoruz. */
  const sonuclar = await Promise.allSettled(
    acikKanallar.map((k) => k.calistir(mesaj))
  );

  const basarili = [];
  for (let i = 0; i < sonuclar.length; i++) {
    const ad = acikKanallar[i].ad;
    const s = sonuclar[i];
    if (s.status === 'fulfilled' && s.value && s.value.ok) {
      basarili.push(ad);
    } else {
      const sebep = s.status === 'rejected'
        ? s.reason
        : `HTTP ${s.value && s.value.status}`;
      console.error(`Bildirim gonderilemedi (${ad}):`, sebep);
    }
  }

  return res.status(200).json({ gonderildi: basarili.length > 0, kanallar: basarili });
}
