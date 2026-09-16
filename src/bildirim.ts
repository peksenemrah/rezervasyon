import type { Booking, IptalTalebi, Talep } from './types';

/* ------------------------------------------------------------------
   TELEGRAM BİLDİRİMİ — tarayıcı tarafı

   Yeni bir rezervasyon ya da talep oluştuğunda `/api/bildir` adresine
   haber verir. Asıl gönderimi sunucu yapar (bkz. api/bildir.js).

   Kural: bu fonksiyon ASLA hata fırlatmaz ve ASLA beklemez.
   Bildirim gitmese bile rezervasyon kaydedilmiş olmalı; kullanıcı
   bildirim yüzünden hata ekranı görmemeli.
------------------------------------------------------------------- */

type BildirimTipi = 'rezervasyon' | 'talep' | 'iptal';

function gonder(tip: BildirimTipi, kayit: Booking | Talep | IptalTalebi, ek?: Record<string, string>): void {
  /* Yerel geliştirmede (vite dev) /api/bildir yoktur; 404 döner ve
     sessizce yutulur. Canlıda Vercel bu adresi karşılar. */
  try {
    void fetch('/api/bildir', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true, // sekme hemen kapansa bile istek yola çıksın
      body: JSON.stringify({
        tip,
        location: kayit.location,
        date: kayit.date,
        lessonLabel: kayit.lessonLabel,
        block: kayit.block,
        teacher: kayit.teacher,
        activity: kayit.activity,
        ...(ek || {}),
      }),
    }).catch(() => {
      /* Ağ yoksa ya da adres kapalıysa: sorun değil, sessiz geç. */
    });
  } catch (e) {
    /* fetch hiç yoksa (çok eski tarayıcı) yine sessiz geç. */
  }
}

export function bildirYeniRezervasyon(booking: Booking): void {
  gonder('rezervasyon', booking);
}

export function bildirYeniTalep(talep: Talep): void {
  gonder('talep', talep);
}

/** Bir öğretmen rezervasyonunun iptalini istedi — yönetimin onayı gerekiyor. */
export function bildirIptalTalebi(talep: IptalTalebi): void {
  gonder('iptal', talep, {
    isteyen: talep.isteyen,
    sebep: talep.sebep || '',
  });
}
