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
  date: string; // YYYY-MM-DD
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
