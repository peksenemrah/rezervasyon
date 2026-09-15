import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getDatabase,
  ref,
  onValue,
  set,
  remove,
  goOnline,
  Database,
} from 'firebase/database';
import type { Booking, Settings, Talep, TeacherClassItem } from './types';

/* ------------------------------------------------------------------
   FIREBASE YAPILANDIRMASI

   Firebase Console > Proje Ayarları > Genel > "Web uygulamaların"
   bölümündeki yapılandırma nesnesini buraya yapıştır.

   NOT: Bu değerler gizli anahtar değildir; her Firebase web
   uygulamasında tarayıcıya açık şekilde gönderilir. Verinin
   korunması "Realtime Database > Kurallar" bölümünden sağlanır.
------------------------------------------------------------------- */
export const firebaseConfig = {
  apiKey: 'AIzaSyBFMdUB8ReoF5_xsPJNw03Dfwb3ffj4378',
  authDomain: 'rezervasyon-87f10.firebaseapp.com',
  databaseURL: 'https://rezervasyon-87f10-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'rezervasyon-87f10',
  storageBucket: 'rezervasyon-87f10.firebasestorage.app',
  messagingSenderId: '237982364528',
  appId: '1:237982364528:web:0e40fd780d3504568255b5',
};

export const firebaseHazir = Boolean(firebaseConfig.databaseURL);

let db: Database | null = null;

function getDb(): Database | null {
  if (!firebaseHazir) return null;
  if (db) return db;
  try {
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    db = getDatabase(app);
    return db;
  } catch (e) {
    console.error('Firebase başlatılamadı:', e);
    return null;
  }
}

/* Realtime Database anahtarlarında . # $ [ ] / karakterleri kullanılamaz.
   bookingDocId "1. Ders" gibi etiketler ürettiği için nokta içerebiliyor. */
export function guvenliAnahtar(id: string): string {
  return (id || '').replace(/[.#$/[\]]/g, '_');
}

/* ---------------- OKUMA: canlı dinleyiciler ---------------- */

export interface BulutDinleyicileri {
  onBookings?: (b: Booking[]) => void;
  onTalepler?: (t: Record<string, Talep>) => void;
  onSettings?: (s: Partial<Settings>) => void;
  onTeachers?: (t: TeacherClassItem[]) => void;
  onDurum?: (durum: 'senkron' | 'baglaniyor' | 'yerel') => void;
}

export function bulutaBaglan(h: BulutDinleyicileri): () => void {
  const database = getDb();
  if (!database) {
    h.onDurum?.('yerel');
    return () => {};
  }

  goOnline(database);
  h.onDurum?.('baglaniyor');

  const araclar: Array<() => void> = [];

  const baglantiRef = ref(database, '.info/connected');
  araclar.push(
    onValue(baglantiRef, (snap) => {
      h.onDurum?.(snap.val() === true ? 'senkron' : 'baglaniyor');
    })
  );

  if (h.onBookings) {
    araclar.push(
      onValue(
        ref(database, 'bookings'),
        (snap) => {
          const val = snap.val();
          const liste: Booking[] = val ? (Object.values(val) as Booking[]) : [];
          h.onBookings!(liste);
        },
        (err) => {
          console.error('bookings dinlenemedi:', err);
          h.onDurum?.('yerel');
        }
      )
    );
  }

  if (h.onTalepler) {
    araclar.push(
      onValue(ref(database, 'talepler'), (snap) => {
        h.onTalepler!((snap.val() as Record<string, Talep>) || {});
      })
    );
  }

  if (h.onSettings) {
    araclar.push(
      onValue(ref(database, 'settings'), (snap) => {
        const val = snap.val();
        if (val && typeof val === 'object') h.onSettings!(val as Partial<Settings>);
      })
    );
  }

  if (h.onTeachers) {
    araclar.push(
      onValue(ref(database, 'teachers'), (snap) => {
        const val = snap.val();
        if (Array.isArray(val) && val.length) h.onTeachers!(val as TeacherClassItem[]);
        else if (val && typeof val === 'object') {
          const liste = Object.values(val) as TeacherClassItem[];
          if (liste.length) h.onTeachers!(liste);
        }
      })
    );
  }

  return () => araclar.forEach((kapat) => kapat());
}

/** "Yeniden bağlan" düğmesi için. RTDB normalde kendi kendine bağlanır. */
export function yenidenBaglan(): void {
  const database = getDb();
  if (database) goOnline(database);
}

/* ---------------- YAZMA ---------------- */

function bookingsHaritasi(bookings: Booking[]): Record<string, Booking> {
  const harita: Record<string, Booking> = {};
  for (const b of bookings) {
    if (!b || !b.id) continue;
    harita[guvenliAnahtar(b.id)] = b;
  }
  return harita;
}

/** Tüm rezervasyon listesini değiştirir (toplu oluşturma, temizleme, geri yükleme). */
export async function yazBookings(bookings: Booking[]): Promise<void> {
  const database = getDb();
  if (!database) return;
  try {
    await set(ref(database, 'bookings'), bookingsHaritasi(bookings));
  } catch (e) {
    console.warn('Rezervasyonlar buluta yazılamadı:', e);
  }
}

/** Tek rezervasyon ekler/günceller — diğer hücreleri etkilemez. */
export async function yazBooking(booking: Booking): Promise<void> {
  const database = getDb();
  if (!database) return;
  try {
    await set(ref(database, `bookings/${guvenliAnahtar(booking.id)}`), booking);
  } catch (e) {
    console.warn('Rezervasyon buluta yazılamadı:', e);
  }
}

/** Tek rezervasyon siler — diğer hücreleri etkilemez. */
export async function silBooking(id: string): Promise<void> {
  const database = getDb();
  if (!database) return;
  try {
    await remove(ref(database, `bookings/${guvenliAnahtar(id)}`));
  } catch (e) {
    console.warn('Rezervasyon buluttan silinemedi:', e);
  }
}

export async function yazTalepler(talepler: Record<string, Talep>): Promise<void> {
  const database = getDb();
  if (!database) return;
  try {
    const temiz: Record<string, Talep> = {};
    for (const [k, v] of Object.entries(talepler || {})) {
      temiz[guvenliAnahtar(k)] = v;
    }
    await set(ref(database, 'talepler'), temiz);
  } catch (e) {
    console.warn('Talepler buluta yazılamadı:', e);
  }
}

export async function yazSettings(settings: Settings): Promise<void> {
  const database = getDb();
  if (!database) return;
  try {
    await set(ref(database, 'settings'), settings);
  } catch (e) {
    console.warn('Ayarlar buluta yazılamadı:', e);
  }
}

export async function yazTeachers(teachers: TeacherClassItem[]): Promise<void> {
  const database = getDb();
  if (!database) return;
  try {
    await set(ref(database, 'teachers'), teachers);
  } catch (e) {
    console.warn('Öğretmen listesi buluta yazılamadı:', e);
  }
}
