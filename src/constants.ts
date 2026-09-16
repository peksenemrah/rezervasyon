import { Holiday, Lesson, Settings, Booking, Talep } from './types';
import { DEFAULT_TEACHERS } from './data/defaultTeachers';

export const SISTEM_ADI = "Cevdet Güçlüer İlkokulu Rezervasyon Sistemi";
export const SISTEM_KISA = "CGİ";
export const DEFAULT_ADMIN_PASSWORD = "cg2026";
/* Bahçe diger yerlerden farkli calisir: ayni saate birden fazla sube
   girebilir, sube basina haftalik kota vardir ve yalnizca 1-4. sinif
   subeleri rezervasyon yapabilir. Kurallar YER_AYARLARI'nda. */
/* İptal talebi akışı, Realtime Database'de "iptalTalepleri" düğümüne
   yazma izni verilene kadar kapalı. Kural yayınlandıktan sonra burayı
   true yapmak yeterli — kodun geri kalanı hazır.
   Yayınlamak icin: npx firebase-tools login && firebase deploy --only database */
export const IPTAL_TALEBI_AKTIF = false;

export const BAHCE = "Bahçe";

export const DEFAULT_LOCATIONS = ["Toplantı Salonu", "Akıl Zeka Oyunları Sınıfı", BAHCE];

export interface YerAyari {
  /** Ayni saatte kac sube olabilir. */
  kapasite: number;
  /** Sube basina haftada kac ders (0 = sinirsiz). */
  haftalikKota: number;
  /** Yalnizca 1-4. sinif subeleri secilebilsin mi. */
  sadeceSiniflar: boolean;
}

export const VARSAYILAN_YER_AYARI: YerAyari = {
  kapasite: 1,
  haftalikKota: 0,
  sadeceSiniflar: false,
};

export const BAHCE_VARSAYILAN_KAPASITE = 2;
export const BAHCE_HAFTALIK_KOTA = 2;

export function yerAyari(location: string, bahceKapasitesi?: number): YerAyari {
  if (location !== BAHCE) return VARSAYILAN_YER_AYARI;
  const kap = Number(bahceKapasitesi);
  return {
    kapasite: Number.isFinite(kap) && kap >= 1 && kap <= 6 ? Math.floor(kap) : BAHCE_VARSAYILAN_KAPASITE,
    haftalikKota: BAHCE_HAFTALIK_KOTA,
    sadeceSiniflar: true,
  };
}

/** 1/A, 2/C, 4/H gibi 1-4. sinif subesi mi? Anasinifi ve branslar haric. */
export function birDortSinifMi(className: string): boolean {
  return /^[1-4]\//.test((className || '').trim());
}

// 14 Eylül 2026 – 25 Haziran 2027
export const SISTEM_BASLANGIC = new Date(2026, 8, 14);
export const SISTEM_BITIS = new Date(2027, 5, 25);
SISTEM_BASLANGIC.setHours(0, 0, 0, 0);
SISTEM_BITIS.setHours(0, 0, 0, 0);

export const DEFAULT_HOLIDAYS: Holiday[] = [
  { date: "2026-10-28", name: "Cumhuriyet Bayramı Arifesi", block: "ÖĞLE" },
  { date: "2026-10-29", name: "Cumhuriyet Bayramı", block: "TAM" },
  { date: "2027-01-01", name: "Yılbaşı Tatili", block: "TAM" },
  { date: "2027-03-08", name: "Ramazan Bayramı Arifesi", block: "ÖĞLE" },
  { date: "2027-03-09", name: "Ramazan Bayramı 1. Gün", block: "TAM" },
  { date: "2027-03-10", name: "Ramazan Bayramı 2. Gün", block: "TAM" },
  { date: "2027-03-11", name: "Ramazan Bayramı 3. Gün", block: "TAM" },
  { date: "2027-04-23", name: "23 Nisan Ulusal Egemenlik ve Çocuk Bayramı", block: "TAM" },
  { date: "2027-05-17", name: "Kurban Bayramı 2. Gün", block: "TAM" },
  { date: "2027-05-18", name: "Kurban Bayramı 3. Gün", block: "TAM" },
  { date: "2027-05-19", name: "19 Mayıs Atatürk'ü Anma, Gençlik ve Spor Bayramı", block: "TAM" },
];

export const MONTHS = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

export const GUN_ADLARI = ["PAZARTESİ", "SALI", "ÇARŞAMBA", "PERŞEMBE", "CUMA"];
export const DAY_LABELS = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma"];
export const DAY_SHORT = ["Pzt", "Sal", "Çar", "Per", "Cum"];
export const GUN_ADLARI_TR: Record<number, string> = {
  1: "Pazartesi",
  2: "Salı",
  3: "Çarşamba",
  4: "Perşembe",
  5: "Cuma"
};

// SABAHÇI GRUP DERS SAATLERİ (07:50 - 12:40)
export const DEFAULT_MORNING_LESSONS: Lesson[] = [
  { label: "1. Ders", start: "07:50", end: "08:30", block: "SABAH" },
  { label: "2. Ders", start: "08:40", end: "09:20", block: "SABAH" },
  { label: "3. Ders", start: "09:30", end: "10:10", block: "SABAH" },
  { label: "4. Ders", start: "10:20", end: "11:00", block: "SABAH" },
  { label: "5. Ders", start: "11:10", end: "11:50", block: "SABAH" },
  { label: "6. Ders", start: "12:00", end: "12:40", block: "SABAH" },
];

// ÖĞLECİ GRUP DERS SAATLERİ (13:00 - 17:50)
export const DEFAULT_AFTERNOON_LESSONS: Lesson[] = [
  { label: "1. Ders", start: "13:00", end: "13:40", block: "ÖĞLE" },
  { label: "2. Ders", start: "13:50", end: "14:30", block: "ÖĞLE" },
  { label: "3. Ders", start: "14:40", end: "15:20", block: "ÖĞLE" },
  { label: "4. Ders", start: "15:30", end: "16:10", block: "ÖĞLE" },
  { label: "5. Ders", start: "16:20", end: "17:00", block: "ÖĞLE" },
  { label: "6. Ders", start: "17:10", end: "17:50", block: "ÖĞLE" },
];

export const MONTH_OPTIONS = (() => {
  const opts: { year: number; month: number; label: string }[] = [];
  let y = SISTEM_BASLANGIC.getFullYear(), m = SISTEM_BASLANGIC.getMonth();
  while (y < SISTEM_BITIS.getFullYear() || (y === SISTEM_BITIS.getFullYear() && m <= SISTEM_BITIS.getMonth())) {
    opts.push({ year: y, month: m, label: `${MONTHS[m]} ${y}` });
    m++;
    if (m > 11) { m = 0; y++; }
  }
  return opts;
})();

export function slugify(str: string): string {
  return (str || "")
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || "yer";
}

export function toDateStrLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function normalizeDate(d: Date): Date {
  const n = new Date(d);
  n.setHours(0, 0, 0, 0);
  return n;
}

export function isInSystemRange(d: Date): boolean {
  const n = normalizeDate(d);
  return n.getTime() >= SISTEM_BASLANGIC.getTime() && n.getTime() <= SISTEM_BITIS.getTime();
}

export function bookingDocId(location: string, dateStr: string, block: string, label: string): string {
  return `${slugify(location)}-${dateStr}-${block}-${label}`.replace(/\s+/g, '-');
}

/* Kapasitesi 1'den buyuk yerlerde ayni saate birden fazla kayit girer.
   Kimligin sonuna sira ekliyoruz: ...-s1, ...-s2. Kapasitesi 1 olan
   yerlerde eski kimlik bicimi aynen korunur, boylece mevcut kayitlar
   etkilenmez. */
export function bookingDocIdSirali(
  location: string,
  dateStr: string,
  block: string,
  label: string,
  sira: number
): string {
  const temel = bookingDocId(location, dateStr, block, label);
  return sira <= 1 && location !== BAHCE ? temel : `${temel}-s${sira}`;
}

/** Verilen gunun icinde bulundugu haftanin pazartesisi (YYYY-MM-DD). */
export function haftaBasi(dateStr: string): string {
  const parcalar = (dateStr || '').split('-');
  if (parcalar.length !== 3) return dateStr || '';
  const d = new Date(Number(parcalar[0]), Number(parcalar[1]) - 1, Number(parcalar[2]));
  if (Number.isNaN(d.getTime())) return dateStr;
  const gun = d.getDay();               // 0 pazar, 1 pazartesi
  const geri = gun === 0 ? 6 : gun - 1; // pazartesiye kac gun geri
  d.setDate(d.getDate() - geri);
  const ay = String(d.getMonth() + 1).padStart(2, '0');
  const gn = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${ay}-${gn}`;
}

export function trUpper(str: string): string {
  return (str || '').toLocaleUpperCase('tr-TR');
}

export function formatDateStrDisplay(s: string): string {
  if (!s) return '';
  const parts = s.split('-');
  if (parts.length !== 3) return s;
  const [y, m, d] = parts;
  return `${d}.${m}.${y}`;
}

export function getDayHolidays(holidaysList: Holiday[], dateStr: string): Holiday[] {
  return (holidaysList || []).filter(h => h.date === dateStr);
}

export function pickHolidayForBlock(dayHolidays: Holiday[], block: 'SABAH' | 'ÖĞLE'): Holiday | null {
  if (!dayHolidays || !dayHolidays.length) return null;
  return dayHolidays.find(h => h.block === 'TAM') || dayHolidays.find(h => h.block === block) || null;
}

export const DEFAULT_SETTINGS: Settings = {
  locations: DEFAULT_LOCATIONS,
  adminPassword: DEFAULT_ADMIN_PASSWORD,
  schoolName: "Cevdet Güçlüer İlkokulu",
  schoolSubtitle: "Toplantı Salonu & Akıl Zeka Oyunları Sınıfı Rezervasyon Sistemi",
  logoDataUrl: "",
  holidays: DEFAULT_HOLIDAYS,
  teachers: DEFAULT_TEACHERS,
  lessonTimes: {
    morning: DEFAULT_MORNING_LESSONS,
    afternoon: DEFAULT_AFTERNOON_LESSONS
  }
};

export const INITIAL_SAMPLE_BOOKINGS: Booking[] = [];

export const INITIAL_SAMPLE_TALEPLER: Record<string, Talep> = {};
