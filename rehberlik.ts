import { getDatabase, ref, push, onValue, remove } from 'firebase/database';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { firebaseConfig } from './firebase';
import type { Yonlendirme } from './types';

/* ------------------------------------------------------------------
   AYARLANMASI GEREKEN TEK DEĞER

   Google Apps Script web app adresi. Script'i deploy ettikten sonra
   aldığın /exec ile biten URL'i buraya yapıştır.

   Boş bırakılırsa kayıt yine veritabanına yazılır, sadece mail gitmez.
------------------------------------------------------------------- */
export const APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbxtIL576GBdFLDOGXEHv-mYGvoG0e2NXP-yHx_kJEuDOzxQPXNCsz8bwrsC-4dcgnJeNw/exec';

function app() {
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

/* ---------------- Öğretmen tarafı: form gönderimi ---------------- */

/**
 * Yönlendirmeyi kaydeder ve maili tetikler.
 * Kayıt yazıldıktan sonra öğretmen onu tekrar okuyamaz — kurallar
 * okumayı yalnızca rehber öğretmenin hesabına açar.
 */
export async function yonlendirmeGonder(veri: Yonlendirme): Promise<void> {
  const db = getDatabase(app());
  await push(ref(db, 'yonlendirmeler'), veri);

  if (!APPS_SCRIPT_URL) return;

  // Mail gönderimi başarısız olsa bile kayıt durur; kullanıcıyı
  // boşuna hata ile karşılamamak için sessiz geçiyoruz.
  try {
    await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(veri),
    });
  } catch (e) {
    console.warn('Yönlendirme maili gönderilemedi:', e);
  }
}

/* ---------------- Rehber öğretmen tarafı ---------------- */

export async function rehberGiris(eposta: string, sifre: string): Promise<void> {
  await signInWithEmailAndPassword(getAuth(app()), eposta, sifre);
}

export async function rehberCikis(): Promise<void> {
  await signOut(getAuth(app()));
}

export function rehberDurumuIzle(cb: (kullanici: User | null) => void): () => void {
  return onAuthStateChanged(getAuth(app()), cb);
}

/** Yalnızca giriş yapmış rehber öğretmen için veri döner. */
export function yonlendirmeleriIzle(
  onVeri: (liste: Yonlendirme[]) => void,
  onHata?: (mesaj: string) => void
): () => void {
  const db = getDatabase(app());
  return onValue(
    ref(db, 'yonlendirmeler'),
    (snap) => {
      const val = snap.val() || {};
      const liste: Yonlendirme[] = Object.entries(val)
        .map(([key, v]) => ({ ...(v as Yonlendirme), key }))
        .sort((a, b) => b.olusturmaZamani - a.olusturmaZamani);
      onVeri(liste);
    },
    (err) => onHata?.(err.message)
  );
}

export async function yonlendirmeSil(key: string): Promise<void> {
  const db = getDatabase(app());
  await remove(ref(db, `yonlendirmeler/${key}`));
}
