import { getDatabase, ref, onValue, push, set, remove } from 'firebase/database';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { firebaseConfig } from './firebase';
import type { Gosteri } from './types';

/* ------------------------------------------------------------------
   29 EKİM GÖSTERİ KAYITLARI

   Öğretmenler Cumhuriyet Bayramı töreninde yapacakları gösteriyi
   buraya yazıyor. Amaç aynı gösterinin iki kez hazırlanmasını
   önlemek, bu yüzden liste herkese açık: kim ne yapacak, herkes
   görebiliyor.

   Rehberlik yönlendirmelerinden farkı bu: orada veri gizliydi,
   burada görünür olması işin ta kendisi.
------------------------------------------------------------------- */

const DAL = 'gosteriler';

function db() {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return getDatabase(app);
}

/** Canlı dinleyici: biri kayıt eklediğinde herkesin listesi güncellenir. */
export function gosterileriIzle(
  onVeri: (liste: Gosteri[]) => void,
  onHata?: (mesaj: string) => void
): () => void {
  return onValue(
    ref(db(), DAL),
    (snap) => {
      const val = snap.val() || {};
      const liste: Gosteri[] = Object.entries(val)
        .map(([key, v]) => ({ ...(v as Gosteri), key }))
        .sort((a, b) => a.ogretmen.localeCompare(b.ogretmen, 'tr'));
      onVeri(liste);
    },
    (err) => onHata?.(err.message)
  );
}

/** Yeni kayıt ekler. */
export async function gosteriEkle(veri: Omit<Gosteri, 'key'>): Promise<void> {
  await push(ref(db(), DAL), veri);
}

/** Var olan kaydı günceller — öğretmen kendi girdisini düzeltebilsin diye. */
export async function gosteriGuncelle(key: string, veri: Omit<Gosteri, 'key'>): Promise<void> {
  await set(ref(db(), `${DAL}/${key}`), veri);
}

export async function gosteriSil(key: string): Promise<void> {
  await remove(ref(db(), `${DAL}/${key}`));
}

/* Aynı gösteri ya da şarkı başkası tarafından alınmış mı?
   Engellemiyoruz — bilerek aynısını yapıyor olabilirler — ama
   kaydetmeden önce uyarıyoruz. */
export function cakismaBul(
  liste: Gosteri[],
  gosteriAdi: string,
  sarki: string,
  hariçKey?: string
): { alan: 'gösteri' | 'şarkı'; kim: string; ne: string }[] {
  const sadeleştir = (s: string) =>
    (s || '').toLocaleLowerCase('tr').replace(/\s+/g, ' ').trim();

  const g = sadeleştir(gosteriAdi);
  const s = sadeleştir(sarki);
  const bulunan: { alan: 'gösteri' | 'şarkı'; kim: string; ne: string }[] = [];

  for (const kayit of liste) {
    if (hariçKey && kayit.key === hariçKey) continue;
    if (g && sadeleştir(kayit.gosteriAdi) === g) {
      bulunan.push({ alan: 'gösteri', kim: kayit.ogretmen, ne: kayit.gosteriAdi });
    }
    if (s && kayit.sarki && sadeleştir(kayit.sarki) === s) {
      bulunan.push({ alan: 'şarkı', kim: kayit.ogretmen, ne: kayit.sarki });
    }
  }
  return bulunan;
}
