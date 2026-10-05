export type Role = 'admin' | 'teacher';

export type HolidayBlock = 'TAM' | 'SABAH' | 'ÖĞLE';

export interface Holiday {
  date: string; // YYYY-MM-DD
  name: string;
  block: HolidayBlock;
}

export interface Lesson {
  label: string;
  start: string;
  end: string;
  block: 'SABAH' | 'ÖĞLE';
}

export interface LessonTimes {
  morning: Lesson[];
  afternoon: Lesson[];
}

export interface Booking {
  id: string;
  location: string;
  /** YYYY-MM-DD — bahçenin sabit saatlerinde 'HAFTALIK' yazar. */
  date: string;
  /** Yalnızca sabit bahçe saatlerinde: 1 Pazartesi ... 5 Cuma. */
  gun?: number;
  lessonLabel: string;
  block: 'SABAH' | 'ÖĞLE';
  teacher: string;
  activity: string;
  timestamp: number;
}

export interface Talep {
  key?: string;
  location: string;
  date: string; // YYYY-MM-DD
  lessonLabel: string;
  block: 'SABAH' | 'ÖĞLE';
  teacher: string;
  activity: string;
  durum: 'bekliyor' | 'onaylandi' | 'reddedildi' | 'iptal_edildi';
  olusturmaZamani: number;
  cevapZamani?: number;
}

/* Rezervasyon iptal talebi.

   Öğretmen "iptal et" dediğinde rezervasyon SİLİNMEZ; burada bir talep
   oluşur ve yönetim onaylayana kadar rezervasyon yerinde durur.
   Kayıtlar bookings'ten ayrı bir düğümde (iptalTalepleri) tutulur. */
export interface IptalTalebi {
  key: string;
  bookingId: string;           // iptali istenen rezervasyonun id'si
  location: string;
  date: string;                // YYYY-MM-DD
  lessonLabel: string;
  block: 'SABAH' | 'ÖĞLE';
  teacher: string;             // rezervasyonun sahibi
  activity: string;
  isteyen: string;             // talebi gönderen kişi
  sebep?: string;              // isteğe bağlı gerekçe
  durum: 'bekliyor' | 'onaylandi' | 'reddedildi';
  olusturmaZamani: number;
  cevapZamani?: number;
}

export interface FirebaseConfig {
  apiKey?: string;
  authDomain?: string;
  databaseURL?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

export interface TeacherClassItem {
  id: string;
  className: string; // e.g. "1/G"
  teacherName: string; // e.g. "Gül Alibaş SÜTÇÜ"
  branch?: string; // e.g. "Sınıf Öğretmeni"
  group?: 'SABAH' | 'ÖĞLE' | 'TÜM';
}

export interface Settings {
  locations: string[];
  adminPassword: string;
  schoolName: string;
  schoolSubtitle: string;
  logoDataUrl: string;
  holidays: Holiday[];
  lessonTimes: LessonTimes;
  teachers?: TeacherClassItem[];
  firebaseConfig?: FirebaseConfig;
  /** Bahçede aynı saatte kaç şube olabilir (varsayılan 2). */
  bahceKapasitesi?: number;
}

export interface DayInfo {
  name: string;
  fullName: string;
  dateStr: string;
  display: string;
  monthIndex: number;
  dayNumber: number;
  year: number;
  valid: boolean;
  dayHolidays: Holiday[];
}

export interface EditingCell extends DayInfo {
  lesson: Lesson;
  holiday?: Holiday | null;
}

export interface Yonlendirme {
  key?: string;
  ogrenciAd: string;
  sinif: string;
  numara: string;
  neden: string;
  yapilanCalismalar: string;
  yonlendirenOgretmen: string;
  olusturmaZamani: number;
}

export interface Gosteri {
  key?: string;
  ogretmen: string;
  gosteriAdi: string;
  sarki: string;
  olusturmaZamani: number;
  guncellemeZamani?: number;
}

/* ------------------------------------------------------------------
   OKUL ETKİNLİKLERİ

   İdare bir etkinlik açar; öğretmenler kendi şubelerinden kaç
   öğrencinin katıldığını yazar. Her şubenin tek bir kaydı olur,
   bu yüzden katılımlar şube anahtarına göre saklanır — aynı şube
   için ikinci bir satır oluşmaz, yazılan son değer geçerlidir.
------------------------------------------------------------------- */

export interface EtkinlikKatilim {
  /** Şube adı, göründüğü hâliyle: "3/B", "Anasınıfı-D". */
  sinif: string;
  sayi: number;
  /** Girişi yapan öğretmen — sonradan kime sorulacağı bilinsin diye. */
  giren: string;
  zaman: number;
}

export interface Etkinlik {
  key?: string;
  ad: string;
  /** YYYY-MM-DD */
  tarih: string;
  aciklama?: string;
  olusturmaZamani: number;
  /* Tek bir etkinlik açık kalır. Yeni etkinlik eklendiğinde öncekiler
     arşive düşer: arşivdekiler görülebilir ama giriş yapılamaz. */
  arsiv: boolean;
  katilim?: Record<string, EtkinlikKatilim>;
}
