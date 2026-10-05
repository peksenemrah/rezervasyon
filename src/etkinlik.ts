import { getDatabase, ref, onValue, push, set, remove, update } from 'firebase/database';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { firebaseConfig, guvenliAnahtar } from './firebase';
import type { Etkinlik, EtkinlikKatilim } from './types';

/* ------------------------------------------------------------------
   OKUL ETKİNLİKLERİ — VERİ KATMANI

   İdare bir etkinlik açar, öğretmenler şubelerinden kaç öğrencinin
   katıldığını yazar. Aynı anda yalnızca bir etkinlik açıktır; yeni
   bir etkinlik eklendiğinde öncekiler arşive düşer.

   Arşivin salt okunur olması bir kural değil, veri yapısının sonucu:
   katılım yazan her yol önce etkinliğin arşivde olmadığını doğrular.
   Ekrandaki form da gizlenir, yani iki ayrı yerde korunuyor.
------------------------------------------------------------------- */

const DAL = 'etkinlikler';

function db() {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return getDatabase(app);
}

/** Canlı dinleyici. Liste yeniden eskiye sıralı gelir. */
export function etkinlikleriIzle(
  onVeri: (liste: Etkinlik[]) => void,
  onHata?: (mesaj: string) => void
): () => void {
  return onValue(
    ref(db(), DAL),
    (snap) => {
      const val = snap.val() || {};
      const liste: Etkinlik[] = Object.entries(val)
        .map(([key, v]) => {
          const e = v as Etkinlik;
          return { ...e, key, arsiv: Boolean(e.arsiv), katilim: e.katilim || {} };
        })
        .sort((a, b) => (b.olusturmaZamani || 0) - (a.olusturmaZamani || 0));
      onVeri(liste);
    },
    (err) => onHata?.(err.message)
  );
}

/** Açık etkinlik — yoksa null. */
export function aktifEtkinlik(liste: Etkinlik[]): Etkinlik | null {
  return liste.find((e) => !e.arsiv) || null;
}

/* Yeni etkinlik ekler ve önceki bütün etkinlikleri arşive alır.

   İki iş tek bir update ile gönderiliyor: yarısı yazılıp yarısı
   yazılamazsa iki açık etkinlik kalırdı. */
export async function etkinlikEkle(
  veri: { ad: string; tarih: string; aciklama?: string },
  mevcutListe: Etkinlik[]
): Promise<void> {
  const yeniRef = push(ref(db(), DAL));
  const guncelleme: Record<string, unknown> = {};

  for (const e of mevcutListe) {
    if (e.key && !e.arsiv) guncelleme[`${DAL}/${e.key}/arsiv`] = true;
  }

  guncelleme[`${DAL}/${yeniRef.key}`] = {
    ad: veri.ad.trim(),
    tarih: veri.tarih,
    aciklama: (veri.aciklama || '').trim(),
    olusturmaZamani: Date.now(),
    arsiv: false,
  };

  await update(ref(db()), guncelleme);
}

/* Bir şubenin katılım sayısını yazar.

   Şube adı anahtar olarak kullanılıyor ("3/B" içindeki / Firebase'de
   yol ayracı sayıldığı için guvenliAnahtar'dan geçiriliyor). Böylece
   aynı şube ikinci kez yazdığında yeni satır açılmıyor, eski değer
   güncelleniyor. */
export async function katilimKaydet(
  etkinlik: Etkinlik,
  sinif: string,
  sayi: number,
  giren: string
): Promise<void> {
  if (!etkinlik.key) throw new Error('Etkinlik bulunamadı.');
  if (etkinlik.arsiv) throw new Error('Arşivdeki etkinliğe giriş yapılamaz.');

  const kayit: EtkinlikKatilim = { sinif, sayi, giren, zaman: Date.now() };
  await set(ref(db(), `${DAL}/${etkinlik.key}/katilim/${guvenliAnahtar(sinif)}`), kayit);
}

/** Bir şubenin kaydını siler — yanlış girilen sayı tamamen kaldırılsın diye. */
export async function katilimSil(etkinlik: Etkinlik, sinif: string): Promise<void> {
  if (!etkinlik.key) throw new Error('Etkinlik bulunamadı.');
  if (etkinlik.arsiv) throw new Error('Arşivdeki etkinliğe giriş yapılamaz.');
  await remove(ref(db(), `${DAL}/${etkinlik.key}/katilim/${guvenliAnahtar(sinif)}`));
}

/** Etkinliği tümüyle siler (katılım kayıtlarıyla birlikte). */
export async function etkinlikSil(key: string): Promise<void> {
  await remove(ref(db(), `${DAL}/${key}`));
}

/** Etkinliğin toplam katılımcı sayısı. */
export function toplamKatilim(e: Etkinlik): number {
  return Object.values(e.katilim || {}).reduce((t, k) => t + (Number(k.sayi) || 0), 0);
}

/** Kaç şube giriş yapmış. */
export function girisYapanSubeSayisi(e: Etkinlik): number {
  return Object.keys(e.katilim || {}).length;
}

/** Bir şubenin bu etkinlikteki kaydı — yoksa undefined. */
export function subeKaydi(e: Etkinlik, sinif: string): EtkinlikKatilim | undefined {
  return (e.katilim || {})[guvenliAnahtar(sinif)];
}
