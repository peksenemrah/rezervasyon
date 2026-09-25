import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import html2canvas from 'html2canvas';
import {
  Role,
  Settings,
  Booking,
  Talep,
  IptalTalebi,
  DayInfo,
  Lesson,
  EditingCell,
  TeacherClassItem,
} from './types';
import {
  BAHCE,
  IPTAL_TALEBI_AKTIF,
  yerAyari,
  birDortSinifMi,
  bahceSaatId,
  gunNo,
  GUN_ADLARI_TR,
  HAFTALIK_TARIH,
  DEFAULT_SETTINGS,
  INITIAL_SAMPLE_BOOKINGS,
  INITIAL_SAMPLE_TALEPLER,
  SISTEM_BASLANGIC,
  SISTEM_BITIS,
  GUN_ADLARI,
  MONTHS,
  toDateStrLocal,
  isInSystemRange,
  bookingDocId,
  getDayHolidays,
  pickHolidayForBlock,
  trUpper,
} from './constants';
import { DEFAULT_TEACHERS, sortTeachers } from './data/defaultTeachers';
import {
  firebaseHazir,
  bulutaBaglan,
  yazBookings,
  yazBooking,
  silBooking,
  yenidenBaglan,
  yazTalepler,
  yazIptalTalebi,
  silIptalTalebi,
  yazSettings,
  yazTeachers,
} from './firebase';
import { bildirYeniRezervasyon, bildirYeniTalep, bildirIptalTalebi } from './bildirim';
import { Header } from './components/Header';
import { ScheduleGrid } from './components/ScheduleGrid';
import { CellModal } from './components/CellModal';
import { BahceCellModal } from './components/BahceCellModal';
import { SettingsModal } from './components/SettingsModal';
import { TaleplerModal } from './components/TaleplerModal';
import { IptalTalepleriModal } from './components/IptalTalepleriModal';
import { TaleplerimModal } from './components/TaleplerimModal';
import { RehberlikFormModal } from './components/RehberlikFormModal';
import { RehberlikPanelModal } from './components/RehberlikPanelModal';
import { KurulumBanner } from './components/KurulumBanner';
import { AnaMenu, MenuSecimi } from './components/AnaMenu';
import { NobetGorunumu } from './components/NobetGorunumu';
import { GorevGorunumu } from './components/GorevGorunumu';
import { SnapshotBanner } from './components/SnapshotBanner';
import { ConflictModal } from './components/ConflictModal';
import { AuthModal } from './components/AuthModal';
import { TeacherListModal } from './components/TeacherListModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { MobileSlideOver } from './components/MobileSlideOver';
import { Bell } from 'lucide-react';

export default function App() {
  // LocalStorage Caching Helpers
  const okuOnbellek = <T,>(key: string, defaultValue: T): T => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  };

  const yazOnbellek = <T,>(key: string, val: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      // ignore
    }
  };

  // State: Role
  const [role, setRole] = useState<Role>(() => {
    try {
      return localStorage.getItem('rz_role') === 'admin' ? 'admin' : 'teacher';
    } catch (e) {
      return 'teacher';
    }
  });

  // State: Settings
  const [settings, setSettings] = useState<Settings>(() => {
    const cached = okuOnbellek('rz_onbellek_ayarlar', DEFAULT_SETTINGS);
    if (!cached.adminPassword || cached.adminPassword === '123456') {
      cached.adminPassword = 'cg2026';
    }
    return cached;
  });

  // State: Bookings
  const [bookings, setBookings] = useState<Booking[]>(() => {
    const cached = okuOnbellek<Booking[]>('rz_onbellek_rezervasyonlar', INITIAL_SAMPLE_BOOKINGS);
    return cached.filter(
      (b) =>
        !b.id.includes('akil-zeka-oyunlari-sinifi') &&
        !b.id.includes('toplanti-salonu') &&
        !(b.teacher.includes('Gül Alibaş SÜTÇÜ') && b.date === '2026-09-14') &&
        !(b.teacher.includes('Emine ARSLAN') && b.date === '2026-09-15') &&
        !(b.teacher.includes('Okul İdaresi') && b.date === '2026-09-16') &&
        !(b.teacher.includes('Hilal VURAL') && b.date === '2026-09-17')
    );
  });

  // State: Talepler (requests)
  const [talepler, setTalepler] = useState<Record<string, Talep>>(() => {
    const cached = okuOnbellek<Record<string, Talep>>('rz_onbellek_talepler', INITIAL_SAMPLE_TALEPLER);
    const cleaned = { ...cached };
    delete cleaned['talep-sample-1'];
    return cleaned;
  });

  /* İptal talepleri. Rezervasyonlardan ayrı bir düğümde durur; bir talep
     oluşması rezervasyona dokunmaz, yalnızca yönetime iş düşürür. */
  const [iptalTalepleri, setIptalTalepleri] = useState<Record<string, IptalTalebi>>(() =>
    okuOnbellek<Record<string, IptalTalebi>>('rz_onbellek_iptal_talepleri', {})
  );

  // State: Teachers & Classes (sorted 1/A, 1/B ... 1/G, 2/A ...)
  const [teachers, setTeachers] = useState<TeacherClassItem[]>(() =>
    sortTeachers(okuOnbellek('rz_onbellek_ogretmenler', DEFAULT_TEACHERS))
  );

  // Cloud/Storage Status
  const [cloudStatus, setCloudStatus] = useState<'senkron' | 'yerel' | 'baglaniyor' | 'hata'>('senkron');

  // Active Location & Block
  const [activeLocation, setActiveLocation] = useState<string>(() => {
    return settings.locations[0] || 'Toplantı Salonu';
  });
  const [activeBlock, setActiveBlock] = useState<'SABAH' | 'ÖĞLE'>('SABAH');

  // Lessons
  const morningLessons = settings.lessonTimes?.morning || DEFAULT_SETTINGS.lessonTimes.morning;
  const afternoonLessons = settings.lessonTimes?.afternoon || DEFAULT_SETTINGS.lessonTimes.afternoon;
  const allPeriods = [...morningLessons, ...afternoonLessons];

  // Modals & UI States
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showTaleplerModal, setShowTaleplerModal] = useState(false);
  const [showIptalTalepleriModal, setShowIptalTalepleriModal] = useState(false);
  const [iptalIslemHata, setIptalIslemHata] = useState('');
  const [showTaleplerimModal, setShowTaleplerimModal] = useState(false);
  /* Uygulama ana menüyle açılır; kullanıcı bir bölüm seçince kapanır. */
  const [anaMenuAcik, setAnaMenuAcik] = useState(true);
  const [nobetAcik, setNobetAcik] = useState(false);
  const [gorevAcik, setGorevAcik] = useState(false);
  const [showRehberlikForm, setShowRehberlikForm] = useState(false);
  const [showRehberlikPanel, setShowRehberlikPanel] = useState(false);
  const [showTeacherListModal, setShowTeacherListModal] = useState(false);
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showDateJump, setShowDateJump] = useState(false);
  const [isSnapshotMode, setIsSnapshotMode] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [bulkResult, setBulkResult] = useState('');
  const [taleplerIslemHata, setTaleplerIslemHata] = useState('');
  const [talepGonderHata, setTalepGonderHata] = useState('');
  const [talepGonderiliyor, setTalepGonderiliyor] = useState(false);
  const [conflictDialog, setConflictDialog] = useState<{
    conflicts: { nb: Booking; existing: Booking }[];
    onConfirm: () => void;
    onCancel: () => void;
  } | null>(null);

  // Date Navigation State
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    const now = Date.now();
    if (now >= SISTEM_BASLANGIC.getTime() && now <= SISTEM_BITIS.getTime()) {
      return new Date();
    }
    return new Date(SISTEM_BASLANGIC);
  });

  // Commit wrappers
  const commitSettings = useCallback(async (next: Settings) => {
    setSettings(next);
    yazOnbellek('rz_onbellek_ayarlar', next);
    await yazSettings(next);
  }, []);

  const commitBookings = useCallback(async (next: Booking[]) => {
    setBookings(next);
    yazOnbellek('rz_onbellek_rezervasyonlar', next);
    await yazBookings(next);
  }, []);

  const commitTeachers = useCallback(async (next: TeacherClassItem[]) => {
    const sorted = sortTeachers(next);
    setTeachers(sorted);
    yazOnbellek('rz_onbellek_ogretmenler', sorted);
    await yazTeachers(sorted);
  }, []);

  const commitTalepler = useCallback(async (next: Record<string, Talep>) => {
    setTalepler(next);
    yazOnbellek('rz_onbellek_talepler', next);
    await yazTalepler(next);
  }, []);

  // ---------------- Firebase Realtime Database senkronizasyonu ----------------
  // Sunucu yoklama (polling) kaldırıldı: RTDB dinleyicileri değişikliği
  // açık olan bütün cihazlara anında iletir.
  useEffect(() => {
    if (!firebaseHazir) {
      setCloudStatus('yerel');
      return;
    }

    setCloudStatus('baglaniyor');

    const kapat = bulutaBaglan({
      onDurum: (durum) => setCloudStatus(durum),
      onBookings: (liste) => {
        setBookings(liste);
        yazOnbellek('rz_onbellek_rezervasyonlar', liste);
      },
      onTalepler: (gelen) => {
        setTalepler(gelen);
        yazOnbellek('rz_onbellek_talepler', gelen);
      },
      onIptalTalepleri: (gelen) => {
        setIptalTalepleri(gelen);
        yazOnbellek('rz_onbellek_iptal_talepleri', gelen);
      },
      onSettings: (gelen) => {
        setSettings((prev) => {
          const merged = { ...prev, ...gelen } as Settings;
          if (!merged.adminPassword || merged.adminPassword === '123456') {
            merged.adminPassword = 'cg2026';
          }
          /* Bahçe sekmesi bulut ayarlarında yoksa ekle — eski kayıtlarda
             yalnızca iki salon var, güncelleme sonrası kaybolmasın. */
          if (Array.isArray(merged.locations) && !merged.locations.includes(BAHCE)) {
            merged.locations = [...merged.locations, BAHCE];
          }
          yazOnbellek('rz_onbellek_ayarlar', merged);
          return merged;
        });
      },
      onTeachers: (gelen) => {
        const sorted = sortTeachers(gelen);
        setTeachers(sorted);
        yazOnbellek('rz_onbellek_ogretmenler', sorted);
      },
    });

    return () => kapat();
  }, []);

  // Sync activeLocation if locations changed
  useEffect(() => {
    if (!settings.locations.includes(activeLocation)) {
      setActiveLocation(settings.locations[0] || 'Konferans Salonu');
    }
  }, [settings.locations, activeLocation]);

  // Notifications permission
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | 'unsupported'>(() => {
    try {
      return 'Notification' in window ? Notification.permission : 'unsupported';
    } catch (e) {
      return 'unsupported';
    }
  });

  const requestNotifPermission = () => {
    if (!('Notification' in window)) return;
    try {
      Notification.requestPermission().then((p) => setNotifPermission(p));
    } catch (e) {
      // ignore
    }
  };

  // Auto clear toasts
  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(''), 2500);
    return () => clearTimeout(t);
  }, [toastMsg]);

  useEffect(() => {
    if (!bulkResult) return;
    const t = setTimeout(() => setBulkResult(''), 3500);
    return () => clearTimeout(t);
  }, [bulkResult]);

  // Prevent background scroll when any modal is open
  useEffect(() => {
    const anyModalOpen =
      showSettingsModal ||
      showAuthModal ||
      !!editingCell ||
      showMobileMenu ||
      isSnapshotMode ||
      !!conflictDialog ||
      showTaleplerModal ||
      showTaleplerimModal ||
      showRehberlikForm ||
      showRehberlikPanel ||
      showTeacherListModal;

    if (anyModalOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [
    showSettingsModal,
    showAuthModal,
    editingCell,
    showMobileMenu,
    isSnapshotMode,
    conflictDialog,
    showTaleplerModal,
    showTaleplerimModal,
    showTeacherListModal,
  ]);

  // Week Days calculation (Monday through Friday)
  const weekDays = useMemo<DayInfo[]>(() => {
    const dCopy = new Date(currentDate);
    const day = dCopy.getDay();
    const diff = dCopy.getDate() - day + (day === 0 ? -6 : 1);
    dCopy.setDate(diff);

    return Array.from({ length: 5 }, (_, i) => {
      const d = new Date(dCopy);
      d.setDate(dCopy.getDate() + i);
      d.setHours(0, 0, 0, 0);
      const dateStr = toDateStrLocal(d);
      return {
        name: GUN_ADLARI[i],
        fullName: GUN_ADLARI[i],
        dateStr,
        display: d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' }),
        monthIndex: d.getMonth(),
        dayNumber: d.getDate(),
        year: d.getFullYear(),
        valid: isInSystemRange(d),
        dayHolidays: getDayHolidays(settings.holidays, dateStr),
      };
    });
  }, [currentDate, settings.holidays]);

  const canGoPrevWeek = useMemo(() => {
    const first = new Date(weekDays[0].dateStr);
    first.setDate(first.getDate() - 7);
    return first.getTime() + 6 * 86400000 >= SISTEM_BASLANGIC.getTime();
  }, [weekDays]);

  const canGoNextWeek = useMemo(() => {
    const last = new Date(weekDays[4].dateStr);
    last.setDate(last.getDate() + 7);
    return last.getTime() - 6 * 86400000 <= SISTEM_BITIS.getTime();
  }, [weekDays]);

  const gotoPrevWeek = () => {
    if (!canGoPrevWeek) return;
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  };

  const gotoNextWeek = () => {
    if (!canGoNextWeek) return;
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  };

  const goToday = () => {
    const now = Date.now();
    if (now >= SISTEM_BASLANGIC.getTime() && now <= SISTEM_BITIS.getTime()) {
      setCurrentDate(new Date());
    } else {
      setCurrentDate(new Date(SISTEM_BASLANGIC));
    }
  };

  const jumpToDate = (dateStr: string) => {
    if (!dateStr) return;
    const [y, m, d] = dateStr.split('-').map(Number);
    let target = new Date(y, m - 1, d);
    target.setHours(0, 0, 0, 0);
    if (target < SISTEM_BASLANGIC) target = new Date(SISTEM_BASLANGIC);
    if (target > SISTEM_BITIS) target = new Date(SISTEM_BITIS);
    setCurrentDate(target);
    setShowDateJump(false);
  };

  // Header display string (e.g. 14–18 Eylül 2026)
  const headerDateString = useMemo(() => {
    if (!weekDays[0]) return '';
    const first = weekDays[0];
    const last = weekDays[4];
    const firstDay = first.dayNumber.toString().padStart(2, '0');
    const lastDay = last.dayNumber.toString().padStart(2, '0');
    const firstMonth = MONTHS[first.monthIndex] || '';
    const lastMonth = MONTHS[last.monthIndex] || '';
    if (first.year !== last.year) {
      return `${firstDay} ${firstMonth} ${first.year} – ${lastDay} ${lastMonth} ${last.year}`;
    }
    if (first.monthIndex !== last.monthIndex) {
      return `${firstDay} ${firstMonth} – ${lastDay} ${lastMonth} ${last.year}`;
    }
    return `${firstDay}–${lastDay} ${firstMonth} ${last.year}`;
  }, [weekDays]);

  // Finding Bookings & Requests
  const findBooking = useCallback(
    (day: DayInfo, lesson: Lesson): Booking | null => {
      if (!day || !lesson) return null;
      return (
        bookings.find(
          (b) =>
            b.location === activeLocation &&
            b.date === day.dateStr &&
            b.lessonLabel === lesson.label &&
            b.block === lesson.block
        ) || null
      );
    },
    [bookings, activeLocation]
  );

  /* ---------------- BAHÇE KURALLARI ----------------
     Bahçe diğer yerlerden üç noktada ayrılır: aynı saate birden fazla
     şube girebilir, şube başına haftalık kota vardır ve yalnızca
     1-4. sınıf şubeleri seçilebilir. */
  const aktifYerAyari = useMemo(
    () => yerAyari(activeLocation, settings.bahceKapasitesi),
    [activeLocation, settings.bahceKapasitesi]
  );

  /* Bir hücredeki tüm kayıtlar.

     Bahçe kayıtları tarihe değil haftanın gününe bağlıdır: bir şube
     saatini bir kez seçer, yönetim iptal edene kadar her hafta onundur.
     Bu yüzden bahçede eşleştirme "gün" alanı üzerinden yapılır. */
  const findBookings = useCallback(
    (day: DayInfo, lesson: Lesson): Booking[] => {
      if (!day || !lesson) return [];

      if (activeLocation === BAHCE) {
        const g = gunNo(day.dateStr);
        if (!g) return [];
        return bookings
          .filter(
            (b) =>
              b.location === BAHCE &&
              b.gun === g &&
              b.lessonLabel === lesson.label &&
              b.block === lesson.block
          )
          .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      }

      return bookings
        .filter(
          (b) =>
            b.location === activeLocation &&
            b.date === day.dateStr &&
            b.lessonLabel === lesson.label &&
            b.block === lesson.block
        )
        .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    },
    [bookings, activeLocation]
  );

  /* Bir şubenin bahçedeki sabit saatleri. Haftalık değil, toplam sayılır:
     saat bir kez alınır ve yönetim iptal edene kadar her hafta geçerlidir. */
  const sabitSaatleri = useCallback(
    (teacher: string): Booking[] =>
      bookings.filter((b) => b.location === BAHCE && b.teacher === teacher),
    [bookings]
  );

  const taleplerListesi = useMemo(() => {
    return (Object.entries(talepler) as [string, Talep][])
      .map(([key, t]) => ({ ...t, key }))
      .sort((a, b) => (b.olusturmaZamani || 0) - (a.olusturmaZamani || 0));
  }, [talepler]);

  const bekleyenTalepSayisi = useMemo(
    () => taleplerListesi.filter((t) => t.durum === 'bekliyor').length,
    [taleplerListesi]
  );

  const iptalTalepListesi = useMemo(
    () =>
      (Object.entries(iptalTalepleri) as [string, IptalTalebi][]).map(([key, t]) => ({
        ...t,
        key,
      })),
    [iptalTalepleri]
  );

  const bekleyenIptalSayisi = useMemo(
    () => iptalTalepListesi.filter((t) => t.durum === 'bekliyor').length,
    [iptalTalepListesi]
  );

  /* Bir rezervasyon için bekleyen iptal talebi var mı? */
  const iptalTalebiVarMi = useCallback(
    (bookingId: string) =>
      iptalTalepListesi.some((t) => t.bookingId === bookingId && t.durum === 'bekliyor'),
    [iptalTalepListesi]
  );

  const findTalep = useCallback(
    (day: DayInfo, lesson: Lesson): Talep | null => {
      if (!day.valid) return null;
      return (
        taleplerListesi.find(
          (t) =>
            t.durum === 'bekliyor' &&
            t.location === activeLocation &&
            t.date === day.dateStr &&
            t.block === lesson.block &&
            t.lessonLabel === lesson.label
        ) || null
      );
    },
    [taleplerListesi, activeLocation]
  );

  // Teacher sent requests from this device
  const [benimTalepAnahtarlari, setBenimTalepAnahtarlari] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('rz_talep_anahtarlarim') || '[]');
    } catch (e) {
      return [];
    }
  });

  const benimTalepKayitlari = useMemo(() => {
    return benimTalepAnahtarlari
      .map((key) => taleplerListesi.find((t) => t.key === key))
      .filter((t): t is Talep => Boolean(t))
      .reverse();
  }, [benimTalepAnahtarlari, taleplerListesi]);

  const [gorulenDurumlar, setGorulenDurumlar] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem('rz_talep_gorulen') || '{}');
    } catch (e) {
      return {};
    }
  });

  const benimBildirimSayisi = useMemo(() => {
    return benimTalepKayitlari.filter((t) => t.key && gorulenDurumlar[t.key] !== t.durum).length;
  }, [benimTalepKayitlari, gorulenDurumlar]);

  const openTaleplerim = () => {
    const updated = { ...gorulenDurumlar };
    benimTalepKayitlari.forEach((t) => {
      if (t.key) updated[t.key] = t.durum;
    });
    setGorulenDurumlar(updated);
    try {
      localStorage.setItem('rz_talep_gorulen', JSON.stringify(updated));
    } catch (e) {
      // ignore
    }
    setShowTaleplerimModal(true);
  };

  // Handlers for Authentication
  const handleLogin = (password: string) => {
    if (password === settings.adminPassword || password === 'cg2026') {
      try {
        localStorage.setItem('rz_role', 'admin');
      } catch (e) {}
      setRole('admin');
      setToastMsg('Yönetici girişi başarılı.');
      requestNotifPermission();
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('rz_role');
    } catch (e) {}
    setRole('teacher');
    setShowSettingsModal(false);
    setShowTaleplerModal(false);
    setToastMsg('Oturum kapatıldı.');
  };

  // Booking Actions (Direct reservation creation by anyone + management deletion)
  const handleSaveBooking = async (teacher: string, activity: string) => {
    if (!editingCell) return;

    const ayar = yerAyari(activeLocation, settings.bahceKapasitesi);
    let id: string;

    if (ayar.kapasite > 1) {
      /* ---- Sabit saatli yer (bahçe) ---- */
      const gun = gunNo(editingCell.dateStr);
      if (!gun) {
        setToastMsg('Bahçe yalnızca hafta içi kullanılabilir.');
        return;
      }
      const mevcut = findBookings(editingCell, editingCell.lesson);

      if (mevcut.length >= ayar.kapasite) {
        setToastMsg(`Bu saat dolu (${ayar.kapasite}/${ayar.kapasite}). Başka bir saat seçin.`);
        return;
      }

      /* Aynı şube aynı saate ikinci kez giremez. */
      if (mevcut.some((b) => b.teacher === teacher)) {
        setToastMsg('Bu şube zaten bu saate kayıtlı.');
        return;
      }

      /* Sabit saat hakkı — yöneticinin aşma yetkisi var. */
      if (ayar.haftalikKota > 0 && role !== 'admin') {
        const sahip = sabitSaatleri(teacher);
        if (sahip.length >= ayar.haftalikKota) {
          setToastMsg(
            `${teacher} ${ayar.haftalikKota} sabit bahçe saatini kullanıyor. Değişiklik için yönetime başvurun.`
          );
          return;
        }
      }

      /* Boş sırayı bul: s1, s2, s3... */
      const doluIdler = new Set(mevcut.map((b) => b.id));
      let sira = 1;
      while (sira <= ayar.kapasite) {
        const aday = bahceSaatId(gun, editingCell.lesson.block, editingCell.lesson.label, sira);
        if (!doluIdler.has(aday)) break;
        sira++;
      }
      if (sira > ayar.kapasite) {
        setToastMsg('Bu saatte boş yer kalmadı.');
        return;
      }
      id = bahceSaatId(gun, editingCell.lesson.block, editingCell.lesson.label, sira);
    } else {
      id = bookingDocId(
        activeLocation,
        editingCell.dateStr,
        editingCell.lesson.block,
        editingCell.lesson.label
      );
    }
    const bahceMi = activeLocation === BAHCE;
    const newBooking: Booking = {
      id,
      location: activeLocation,
      /* Bahçede kayıt tarihe değil güne bağlı: her hafta geçerli. */
      date: bahceMi ? HAFTALIK_TARIH : editingCell.dateStr,
      ...(bahceMi ? { gun: gunNo(editingCell.dateStr) } : {}),
      lessonLabel: editingCell.lesson.label,
      block: editingCell.lesson.block,
      teacher,
      activity:
        activity ||
        (bahceMi
          ? 'Bahçe Kullanımı'
          : activeLocation.includes('Akıl')
          ? 'Akıl ve Zeka Oyunları Dersi'
          : 'Salon Etkinliği'),
      timestamp: Date.now(),
    };
    const nextBookings = [...bookings.filter((b) => b.id !== id), newBooking];
    setBookings(nextBookings);
    yazOnbellek('rz_onbellek_rezervasyonlar', nextBookings);
    setEditingCell(null);
    setToastMsg(
      bahceMi
        ? `${teacher} — her ${GUN_ADLARI_TR[gunNo(editingCell.dateStr)] || ''} ${editingCell.lesson.label} sabit bahçe saati`
        : `${teacher} rezervasyonu kaydedildi`
    );

    // Sadece bu hücreyi yaz; listenin tamamını ezme.
    await yazBooking(newBooking);

    // Yöneticinin telefonuna Telegram bildirimi (beklemeden, sessizce).
    bildirYeniRezervasyon(newBooking, bahceMi ? GUN_ADLARI_TR[newBooking.gun || 0] : undefined);
  };

  /* ---------------- İPTAL TALEBİ AKIŞI ----------------
     Öğretmen iptal istediğinde rezervasyon SİLİNMEZ; yalnızca bir talep
     kaydı oluşur ve yönetime bildirim gider. Silme işlemi yönetim
     onayladığında gerçekleşir. */
  const handleIptalTalebiGonder = async (bookingId: string, isteyen: string, sebep: string) => {
    const b = bookings.find((x) => x.id === bookingId);
    if (!b) return;

    /* Aynı rezervasyon için bekleyen talep varsa ikincisini oluşturma. */
    if (iptalTalebiVarMi(b.id)) {
      setEditingCell(null);
      setToastMsg('Bu saat için zaten bekleyen bir iptal talebi var.');
      return;
    }

    const key = `iptal-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const talep: IptalTalebi = {
      key,
      bookingId: b.id,
      location: b.location,
      date: b.date,
      lessonLabel: b.lessonLabel,
      block: b.block,
      teacher: b.teacher,
      activity: b.activity,
      isteyen,
      sebep: sebep || undefined,
      durum: 'bekliyor',
      olusturmaZamani: Date.now(),
    };

    setEditingCell(null);

    const yazildi = await yazIptalTalebi(talep);
    if (!yazildi) {
      /* Bulut kabul etmediyse talep yok demektir. Sahte onay verme. */
      setToastMsg('İptal talebi gönderilemedi. Lütfen tekrar deneyin.');
      return;
    }

    setIptalTalepleri((prev) => ({ ...prev, [key]: talep }));
    setToastMsg('İptal talebiniz yönetime iletildi.');
    bildirIptalTalebi(talep);
  };

  /* Yönetim onayladı: rezervasyon şimdi silinir, talep kapanır. */
  const handleIptalOnayla = async (t: IptalTalebi) => {
    setIptalIslemHata('');
    const halaVar = bookings.some((b) => b.id === t.bookingId);

    if (halaVar) {
      const kalan = bookings.filter((b) => b.id !== t.bookingId);
      setBookings(kalan);
      yazOnbellek('rz_onbellek_rezervasyonlar', kalan);
      await silBooking(t.bookingId);
    }

    const kapali: IptalTalebi = { ...t, durum: 'onaylandi', cevapZamani: Date.now() };
    const yazildi = await yazIptalTalebi(kapali);
    if (yazildi) {
      setIptalTalepleri((prev) => ({ ...prev, [t.key]: kapali }));
    } else {
      setIptalIslemHata('Talep kapatılamadı, ama rezervasyon silindi. Sayfayı yenileyip tekrar deneyin.');
    }

    setToastMsg(
      halaVar
        ? 'İptal onaylandı, rezervasyon silindi.'
        : 'Rezervasyon zaten silinmişti; talep kapatıldı.'
    );
  };

  /* Yönetim reddetti: rezervasyon yerinde kalır. */
  const handleIptalReddet = async (t: IptalTalebi) => {
    setIptalIslemHata('');
    const kapali: IptalTalebi = { ...t, durum: 'reddedildi', cevapZamani: Date.now() };
    const yazildi = await yazIptalTalebi(kapali);
    if (!yazildi) {
      setIptalIslemHata('Talep güncellenemedi. Lütfen tekrar deneyin.');
      return;
    }
    setIptalTalepleri((prev) => ({ ...prev, [t.key]: kapali }));
    setToastMsg('İptal talebi reddedildi. Rezervasyon yerinde kaldı.');
  };

  const handleDeleteBookingById = async (id: string) => {
    const updated = bookings.filter((x) => x.id !== id);
    setBookings(updated);
    yazOnbellek('rz_onbellek_rezervasyonlar', updated);
    setToastMsg('Rezervasyon silindi');

    // Sadece bu kaydı sil; listenin tamamını ezme.
    await silBooking(id);

    /* Bu rezervasyon için bekleyen iptal talebi varsa artık konusuz kaldı. */
    for (const t of iptalTalepListesi) {
      if (t.bookingId === id && t.durum === 'bekliyor') {
        const kapali: IptalTalebi = { ...t, durum: 'onaylandi', cevapZamani: Date.now() };
        setIptalTalepleri((prev) => ({ ...prev, [t.key]: kapali }));
        await yazIptalTalebi(kapali);
      }
    }
  };

  const handleDeleteCurrentBooking = () => {
    if (!editingCell) return;
    const b = findBooking(editingCell, editingCell.lesson);
    if (!b) return;
    handleDeleteBookingById(b.id);
    setEditingCell(null);
  };

  // Submit Talep (Teacher)
  const handleSubmitTalep = (teacher: string, activity: string) => {
    if (!editingCell) return;
    setTalepGonderHata('');
    setTalepGonderiliyor(true);

    try {
      localStorage.setItem('rz_talep_isim', teacher);
    } catch (e) {}

    const pushId = `talep-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newTalep: Talep = {
      key: pushId,
      location: activeLocation,
      date: editingCell.dateStr,
      lessonLabel: editingCell.lesson.label,
      block: editingCell.lesson.block,
      teacher,
      activity: activity || 'Rezervasyon Talebi',
      durum: 'bekliyor',
      olusturmaZamani: Date.now(),
    };

    const nextTalepler = { ...talepler, [pushId]: newTalep };
    commitTalepler(nextTalepler);

    // Yöneticinin telefonuna Telegram bildirimi (beklemeden, sessizce).
    bildirYeniTalep(newTalep);

    const nextKeys = [pushId, ...benimTalepAnahtarlari].slice(0, 80);
    setBenimTalepAnahtarlari(nextKeys);
    yazOnbellek('rz_talep_anahtarlarim', nextKeys);

    setTalepGonderiliyor(false);
    setEditingCell(null);
    setToastMsg('Rezervasyon talebiniz idareye iletildi.');
  };

  // Admin Request Approval / Rejection
  const handleApproveTalep = (t: Talep) => {
    if (role !== 'admin' || !t.key) return;
    const id = bookingDocId(t.location, t.date, t.block, t.lessonLabel);
    const conflict = bookings.find((b) => b.id === id);
    if (conflict) {
      setTaleplerIslemHata(
        `Bu saat için zaten bir rezervasyon mevcut: ${conflict.teacher} (${conflict.activity})`
      );
      return;
    }
    setTaleplerIslemHata('');

    const newBooking: Booking = {
      id,
      location: t.location,
      date: t.date,
      lessonLabel: t.lessonLabel,
      block: t.block,
      teacher: t.teacher,
      activity: t.activity,
      timestamp: Date.now(),
    };

    commitBookings([...bookings.filter((b) => b.id !== id), newBooking]);

    const nextTalepler = {
      ...talepler,
      [t.key]: {
        ...t,
        durum: 'onaylandi' as const,
        cevapZamani: Date.now(),
      },
    };
    commitTalepler(nextTalepler);
    setToastMsg(`${t.teacher} talebi onaylandı`);
  };

  const handleRejectTalep = (t: Talep) => {
    if (role !== 'admin' || !t.key) return;
    const nextTalepler = {
      ...talepler,
      [t.key]: {
        ...t,
        durum: 'reddedildi' as const,
        cevapZamani: Date.now(),
      },
    };
    commitTalepler(nextTalepler);
    setToastMsg('Talep reddedildi');
  };

  const handleDeleteMyTalep = (t: Talep) => {
    if (!t.key) return;
    if (!window.confirm('Bu talebi listenizden kaldırmak istediğinize emin misiniz?')) return;
    const nextTalepler = { ...talepler };
    delete nextTalepler[t.key];
    commitTalepler(nextTalepler);

    const nextKeys = benimTalepAnahtarlari.filter((k) => k !== t.key);
    setBenimTalepAnahtarlari(nextKeys);
    yazOnbellek('rz_talep_anahtarlarim', nextKeys);
    setToastMsg('Talep silindi');
  };

  // Course Groups
  const courseGroups = useMemo(() => {
    const map = new Map<
      string,
      {
        key: string;
        location: string;
        teacher: string;
        activity: string;
        sessions: Booking[];
      }
    >();

    bookings.forEach((b) => {
      const key = `${b.location}|${b.teacher}|${b.activity}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          location: b.location,
          teacher: b.teacher,
          activity: b.activity,
          sessions: [],
        });
      }
      map.get(key)!.sessions.push(b);
    });

    return Array.from(map.values())
      .map((g) => {
        const dates = g.sessions.map((s) => s.date).sort();
        return {
          ...g,
          count: g.sessions.length,
          minDate: dates[0],
          maxDate: dates[dates.length - 1],
        };
      })
      .sort((a, b) => (a.minDate < b.minDate ? -1 : 1));
  }, [bookings]);

  const handleDeleteGroup = (key: string) => {
    commitBookings(bookings.filter((b) => `${b.location}|${b.teacher}|${b.activity}` !== key));
    setToastMsg('Kurs grubu ve saatleri silindi');
  };

  const handleUpdateGroup = (
    key: string,
    newTeacher: string,
    newActivity: string,
    newStartDate: string,
    newEndDate: string
  ) => {
    const groupSessions = bookings.filter((b) => `${b.location}|${b.teacher}|${b.activity}` === key);
    if (!groupSessions.length) return;
    const location = groupSessions[0].location;
    const weekdaySet = new Set<number>(groupSessions.map((b) => new Date(b.date).getDay()));
    const periodSet = new Set<string>(groupSessions.map((b) => `${b.block}|${b.lessonLabel}`));
    const start = new Date(newStartDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(newEndDate);
    end.setHours(0, 0, 0, 0);

    const newOnes: Booking[] = [];
    for (
      let d = new Date(Math.max(start.getTime(), SISTEM_BASLANGIC.getTime()));
      d.getTime() <= Math.min(end.getTime(), SISTEM_BITIS.getTime());
      d.setDate(d.getDate() + 1)
    ) {
      if (!weekdaySet.has(d.getDay())) continue;
      if (!isInSystemRange(d)) continue;
      const dateStr = toDateStrLocal(d);
      const dayHolidays = getDayHolidays(settings.holidays, dateStr);

      periodSet.forEach((pk) => {
        const [block, label] = pk.split('|') as ['SABAH' | 'ÖĞLE', string];
        if (pickHolidayForBlock(dayHolidays, block)) return;
        const id = bookingDocId(location, dateStr, block, label);
        newOnes.push({
          id,
          location,
          date: dateStr,
          lessonLabel: label,
          block,
          teacher: newTeacher,
          activity: newActivity,
          timestamp: Date.now(),
        });
      });
    }

    const filtered = bookings.filter((b) => `${b.location}|${b.teacher}|${b.activity}` !== key);
    const map = new Map(filtered.map((b) => [b.id, b]));
    newOnes.forEach((nb) => map.set(nb.id, nb));
    commitBookings(Array.from(map.values()));
    setToastMsg('Kurs güncellendi');
  };

  // Bulk Create
  const handleBulkCreate = (form: {
    location: string;
    teacher: string;
    activity: string;
    startDate: string;
    endDate: string;
    days: number[];
    periods: string[];
  }) => {
    if (role !== 'admin') return;
    const loc = form.location || activeLocation;
    if (
      !loc ||
      !form.teacher.trim() ||
      !form.activity.trim() ||
      !form.days.length ||
      !form.periods.length
    ) {
      setBulkResult('Lütfen tüm alanları doldurup en az bir gün ve bir ders saati seçin.');
      return;
    }

    const start = new Date(form.startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(form.endDate);
    end.setHours(0, 0, 0, 0);

    const newOnes: Booking[] = [];
    let tatilAtlanan = 0;

    for (
      let d = new Date(Math.max(start.getTime(), SISTEM_BASLANGIC.getTime()));
      d.getTime() <= Math.min(end.getTime(), SISTEM_BITIS.getTime());
      d.setDate(d.getDate() + 1)
    ) {
      const jsDay = d.getDay();
      if (!form.days.includes(jsDay)) continue;
      if (!isInSystemRange(d)) continue;
      const dateStr = toDateStrLocal(d);
      const dayHolidays = getDayHolidays(settings.holidays, dateStr);

      for (const key of form.periods) {
        const period = allPeriods.find((p) => `${p.block}-${p.label}` === key);
        if (!period) continue;
        if (pickHolidayForBlock(dayHolidays, period.block)) {
          tatilAtlanan++;
          continue;
        }
        const id = bookingDocId(loc, dateStr, period.block, period.label);
        newOnes.push({
          id,
          location: loc,
          date: dateStr,
          lessonLabel: period.label,
          block: period.block,
          teacher: form.teacher.trim(),
          activity: form.activity.trim(),
          timestamp: Date.now(),
        });
      }
    }

    if (newOnes.length === 0) {
      setBulkResult(
        tatilAtlanan > 0
          ? 'Seçilen saatler resmi tatile denk geldiği için kayıt oluşturulmadı.'
          : 'Seçilen aralıkta uygun ders saati bulunamadı.'
      );
      return;
    }

    const conflicts = newOnes
      .map((nb) => ({ nb, existing: bookings.find((b) => b.id === nb.id)! }))
      .filter((x) => x.existing);

    const commitAction = () => {
      const map = new Map(bookings.map((b) => [b.id, b]));
      newOnes.forEach((nb) => map.set(nb.id, nb));
      commitBookings(Array.from(map.values()));
      setBulkResult(
        `${newOnes.length} ders saati başarıyla oluşturuldu.${
          conflicts.length ? ` (${conflicts.length} çakışan saatin üzerine yazıldı.)` : ''
        }${tatilAtlanan > 0 ? ` (${tatilAtlanan} tatil saati atlandı.)` : ''}`
      );
      setConflictDialog(null);
    };

    if (conflicts.length > 0) {
      setConflictDialog({
        conflicts,
        onConfirm: commitAction,
        onCancel: () => {
          setConflictDialog(null);
          setBulkResult('İşlem iptal edildi, hiçbir kayıt değiştirilmedi.');
        },
      });
      return;
    }

    commitAction();
  };

  // Image capture logic
  const processImage = async (mode: 'share' | 'download') => {
    if (isCapturing) return;
    setIsCapturing(true);
    try {
      window.scrollTo(0, 0);
      const target = document.getElementById('printable-table-area');
      if (!target) throw new Error('Table not found');

      const fullWidth = Math.max(target.scrollWidth, target.offsetWidth, 1300);
      const fullHeight = Math.max(target.scrollHeight, target.offsetHeight) + 60;

      const canvas = await html2canvas(target, {
        scale: 2,
        backgroundColor: '#FCFBF6',
        useCORS: true,
        width: fullWidth,
        height: fullHeight,
        windowWidth: fullWidth,
        windowHeight: fullHeight,
        scrollX: 0,
        scrollY: 0,
      });

      if (mode === 'download') {
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `Rezervasyon-${activeLocation}-${toDateStrLocal(currentDate)}.png`;
        link.click();
        setToastMsg('Program görseli indirildi');
      } else if (navigator.share) {
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, 'image/png')
        );
        if (blob) {
          const file = new File([blob], 'program.png', { type: 'image/png' });
          await navigator.share({
            files: [file],
            title: `${activeLocation} Rezervasyon Programı`,
          });
        }
      } else {
        // Fallback to direct download
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `Rezervasyon-${activeLocation}.png`;
        link.click();
        setToastMsg('Paylaşım desteklenmediği için görsel indirildi');
      }
    } catch (e) {
      console.error('Image capture fail', e);
      setToastMsg('Görsel oluşturulurken bir hata oluştu');
    }
    setIsCapturing(false);
  };

  const currentBooking = editingCell ? findBooking(editingCell, editingCell.lesson) : null;
  const currentTalep = editingCell ? findTalep(editingCell, editingCell.lesson) : null;

  /* ---------------- Ana menü yönlendirmesi ---------------- */
  const menuSec = (secim: MenuSecimi) => {
    if (secim.tur === 'mekan') {
      setActiveLocation(secim.mekan);
      setAnaMenuAcik(false);
      return;
    }
    if (secim.tur === 'nobet') {
      setNobetAcik(true);
      return;
    }
    if (secim.tur === 'gorev') {
      setGorevAcik(true);
      return;
    }
    /* Rehberlik formu ana menünün üstünde açılır; kapanınca menüye dönülür. */
    setShowRehberlikForm(true);
  };

  /* Nöbet çizelgesi tam ekran açılır. */
  if (nobetAcik) {
    return <NobetGorunumu onGeri={() => setNobetAcik(false)} />;
  }

  /* Görev dağılımı (kişisel görünüm) tam ekran açılır. */
  if (gorevAcik) {
    return <GorevGorunumu onGeri={() => setGorevAcik(false)} />;
  }

  /* Ana menü: rezervasyon tablosu yerine bölüm seçimi gösterilir. */
  if (anaMenuAcik) {
    return (
      <>
        <AnaMenu settings={settings} onSec={menuSec} />

        {toastMsg && (
          <div
            className="no-snapshot fixed top-5 left-1/2 -translate-x-1/2 z-[999] px-5 py-3 rounded-2xl text-white font-bold text-xs sm:text-sm shadow-2xl border border-stone-700"
            style={{ background: 'var(--ink)' }}
          >
            {toastMsg}
          </div>
        )}

        <RehberlikFormModal
          isOpen={showRehberlikForm}
          onClose={() => setShowRehberlikForm(false)}
          teachers={teachers}
          onSonuc={(m) => setToastMsg(m)}
        />

        <KurulumBanner />
      </>
    );
  }

  return (
    <div
      id="app-shell"
      className={`min-h-screen pb-20 md:pb-12 ${isSnapshotMode ? 'snapshot-active' : ''}`}
      style={{ background: 'var(--paper)' }}
    >
      {/* Toast message popup */}
      {toastMsg && (
        <div
          id="toast-notification"
          className="no-snapshot fixed top-5 left-1/2 -translate-x-1/2 z-[999] px-5 py-3 rounded-2xl text-white font-bold text-xs sm:text-sm shadow-2xl border border-stone-700 animate-in fade-in slide-in-from-top-3 duration-200"
          style={{ background: 'var(--ink)' }}
        >
          {toastMsg}
        </div>
      )}

      {/* Bulk result popup */}
      {bulkResult && (
        <div className="no-snapshot fixed inset-0 z-[950] flex items-center justify-center p-5 pointer-events-none">
          <div
            className="pointer-events-auto max-w-sm w-full rounded-2xl px-5 py-4 shadow-2xl text-center border border-stone-700"
            style={{ background: 'var(--ink)', color: 'white' }}
          >
            <div className="text-xs sm:text-sm font-bold leading-snug">{bulkResult}</div>
          </div>
        </div>
      )}

      {/* Desktop Floating Taleplerim Button (Teacher) */}
      {role !== 'admin' && (
        <button
          id="btn-taleplerim-floating-desktop"
          onClick={openTaleplerim}
          className="no-snapshot hidden md:flex fixed z-40 right-6 bottom-6 items-center gap-2 pl-4 pr-5 py-3.5 rounded-full text-white font-bold text-sm shadow-2xl transition-all hover:scale-105 active:scale-95"
          style={{ background: 'var(--teal-dark)' }}
        >
          <Bell className="w-5 h-5" />
          <span>Taleplerim</span>
          {benimBildirimSayisi > 0 && (
            <span
              className="min-w-[20px] h-5 px-1.5 rounded-full text-white text-[11px] font-bold flex items-center justify-center bg-red-600 shadow-xs"
            >
              {benimBildirimSayisi}
            </span>
          )}
        </button>
      )}

      {/* İptal Talepleri düğmesi (Yönetim) — yalnızca bekleyen talep varken görünür */}
      {IPTAL_TALEBI_AKTIF && role === 'admin' && bekleyenIptalSayisi > 0 && (
        <button
          id="btn-iptal-talepleri-floating"
          onClick={() => setShowIptalTalepleriModal(true)}
          className="no-snapshot flex fixed z-40 right-4 md:right-6 bottom-24 md:bottom-24 items-center gap-2 pl-4 pr-5 py-3.5 rounded-full text-white font-bold text-sm shadow-2xl transition-all hover:scale-105 active:scale-95"
          style={{ background: 'var(--ochre)' }}
        >
          <Bell className="w-5 h-5" />
          <span className="hidden sm:inline">İptal Talepleri</span>
          <span className="sm:hidden">İptal</span>
          <span className="min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold flex items-center justify-center bg-white text-amber-800 shadow-xs">
            {bekleyenIptalSayisi}
          </span>
        </button>
      )}

      {/* Desktop Floating Talepler Button (Admin) */}
      {role === 'admin' && (
        <button
          id="btn-talepler-admin-floating-desktop"
          onClick={() => setShowTaleplerModal(true)}
          className="no-snapshot hidden md:flex fixed z-40 right-6 bottom-6 items-center gap-2 pl-4 pr-5 py-3.5 rounded-full text-white font-bold text-sm shadow-2xl transition-all hover:scale-105 active:scale-95"
          style={{ background: 'var(--brick)' }}
        >
          <Bell className="w-5 h-5" />
          <span>Öğretmen Talepleri</span>
          {bekleyenTalepSayisi > 0 && (
            <span
              className="min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold flex items-center justify-center bg-white text-red-700 shadow-xs"
            >
              {bekleyenTalepSayisi}
            </span>
          )}
        </button>
      )}

      {/* Snapshot Top Banner */}
      {isSnapshotMode && (
        <SnapshotBanner
          isCapturing={isCapturing}
          activeLocation={activeLocation}
          onShareWhatsApp={() => processImage('share')}
          onDownloadPNG={() => processImage('download')}
          onClose={() => setIsSnapshotMode(false)}
        />
      )}

      {/* Header */}
      <Header
        settings={settings}
        role={role}
        cloudStatus={cloudStatus}
        activeLocation={activeLocation}
        onSelectLocation={setActiveLocation}
        onOpenSettings={() => setShowSettingsModal(true)}
        onOpenTeacherList={() => setShowTeacherListModal(true)}
        onOpenSnapshot={() => {
          window.scrollTo(0, 0);
          setIsSnapshotMode(true);
        }}
        onOpenAuth={() => setShowAuthModal(true)}
        onLogout={handleLogout}
        onOpenMobileMenu={() => setShowMobileMenu(true)}
        onRetrySync={yenidenBaglan}
        onOpenRehberlikForm={() => setShowRehberlikForm(true)}
        onOpenRehberlikPanel={() => setShowRehberlikPanel(true)}
        onAnaMenu={() => setAnaMenuAcik(true)}
      />

      {/* Main Table Content */}
      <main className="max-w-[1440px] mx-auto px-3 sm:px-6 pt-3 sm:pt-5">
        <ScheduleGrid
          activeLocation={activeLocation}
          headerDateString={headerDateString}
          activeBlock={activeBlock}
          setActiveBlock={setActiveBlock}
          currentDate={currentDate}
          setCurrentDate={setCurrentDate}
          canGoPrevWeek={canGoPrevWeek}
          canGoNextWeek={canGoNextWeek}
          gotoPrevWeek={gotoPrevWeek}
          gotoNextWeek={gotoNextWeek}
          weekDays={weekDays}
          morningLessons={morningLessons}
          afternoonLessons={afternoonLessons}
          findBooking={findBooking}
          findBookings={findBookings}
          slotKapasitesi={aktifYerAyari.kapasite}
          findTalep={findTalep}
          onCellClick={setEditingCell}
          role={role}
          isSnapshotMode={isSnapshotMode}
        />
      </main>

      {/* Mobile Bottom Bar */}
      <MobileBottomNav
        showDateJump={showDateJump}
        setShowDateJump={setShowDateJump}
        onGoToday={goToday}
        onJumpDate={jumpToDate}
        role={role}
        bekleyenTalepSayisi={bekleyenTalepSayisi}
        benimBildirimSayisi={benimBildirimSayisi}
        onOpenTalepler={() => setShowTaleplerModal(true)}
        onOpenTaleplerim={openTaleplerim}
      />

      {/* Mobile Slide-Over Menu */}
      <MobileSlideOver
        isOpen={showMobileMenu}
        onClose={() => setShowMobileMenu(false)}
        role={role}
        onOpenSettings={() => setShowSettingsModal(true)}
        onOpenTeacherList={() => setShowTeacherListModal(true)}
        onOpenSnapshot={() => {
          window.scrollTo(0, 0);
          setIsSnapshotMode(true);
        }}
        onOpenAuth={() => setShowAuthModal(true)}
        onLogout={handleLogout}
        onAnaMenu={() => setAnaMenuAcik(true)}
      />

      {/* Cell Detail / Booking / Request Modal */}
      {/* Bahçe hücresi kendi penceresini kullanır (çok kayıtlı + kotalı) */}
      <BahceCellModal
        editingCell={aktifYerAyari.kapasite > 1 ? editingCell : null}
        onClose={() => setEditingCell(null)}
        slotBookings={editingCell ? findBookings(editingCell, editingCell.lesson) : []}
        kapasite={aktifYerAyari.kapasite}
        haftalikKota={aktifYerAyari.haftalikKota}
        role={role}
        teachers={teachers}
        sabitSaatSayisi={(teacher) => sabitSaatleri(teacher).length}
        sabitSaatOzeti={(teacher) =>
          sabitSaatleri(teacher)
            .map((b) => `${GUN_ADLARI_TR[b.gun || 0] || ''} ${b.lessonLabel}`)
            .join(' · ')
        }
        bekleyenIptalVarMi={iptalTalebiVarMi}
        onSaveBooking={handleSaveBooking}
        onDeleteBooking={handleDeleteBookingById}
        onIptalTalebiGonder={IPTAL_TALEBI_AKTIF ? handleIptalTalebiGonder : undefined}
        onOpenAuth={() => setShowAuthModal(true)}
      />

      <CellModal
        editingCell={aktifYerAyari.kapasite > 1 ? null : editingCell}
        onClose={() => setEditingCell(null)}
        currentBooking={currentBooking}
        currentTalep={currentTalep}
        role={role}
        activeLocation={activeLocation}
        teachers={teachers}
        onSaveBooking={handleSaveBooking}
        onDeleteBooking={handleDeleteCurrentBooking}
        onOpenAuth={() => setShowAuthModal(true)}
        bekleyenIptalTalebi={currentBooking ? iptalTalebiVarMi(currentBooking.id) : false}
        onIptalTalebiGonder={
          IPTAL_TALEBI_AKTIF
            ? (isteyen, sebep) => {
                const b = currentBooking;
                if (b) handleIptalTalebiGonder(b.id, isteyen, sebep);
              }
            : undefined
        }
      />

      {/* Settings Modal (Admin) */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        settings={settings}
        onSaveSettings={(partial, msg) => {
          commitSettings({ ...settings, ...partial });
          if (msg) setToastMsg(msg);
        }}
        bookings={bookings}
        commitBookings={commitBookings}
        courseGroups={courseGroups}
        onDeleteGroup={handleDeleteGroup}
        onUpdateGroup={handleUpdateGroup}
        activeLocation={activeLocation}
        onBulkCreate={handleBulkCreate}
        notifPermission={notifPermission}
        onRequestNotif={requestNotifPermission}
        teachers={teachers}
        onSaveTeachers={commitTeachers}
        onDeleteBooking={handleDeleteBookingById}
      />

      {/* Admin Requests Modal */}
      <TaleplerModal
        isOpen={showTaleplerModal && role === 'admin'}
        onClose={() => {
          setShowTaleplerModal(false);
          setTaleplerIslemHata('');
        }}
        taleplerListesi={taleplerListesi}
        onApprove={handleApproveTalep}
        onReject={handleRejectTalep}
        taleplerIslemHata={taleplerIslemHata}
      />

      {/* İptal Talepleri (Yönetim) */}
      <IptalTalepleriModal
        isOpen={IPTAL_TALEBI_AKTIF && showIptalTalepleriModal && role === 'admin'}
        onClose={() => {
          setShowIptalTalepleriModal(false);
          setIptalIslemHata('');
        }}
        talepler={iptalTalepListesi}
        onApprove={handleIptalOnayla}
        onReject={handleIptalReddet}
        islemHata={iptalIslemHata}
      />

      {/* Teacher Requests Tracking Modal */}
      <RehberlikFormModal
        isOpen={showRehberlikForm}
        onClose={() => setShowRehberlikForm(false)}
        teachers={teachers}
        onSonuc={(m) => setToastMsg(m)}
      />

      <RehberlikPanelModal
        isOpen={showRehberlikPanel}
        onClose={() => setShowRehberlikPanel(false)}
      />

      {/* Ekran görüntüsü alınırken ve modal açıkken görünmesin. */}
      {!isSnapshotMode && <KurulumBanner />}

      <TaleplerimModal
        isOpen={showTaleplerimModal}
        onClose={() => setShowTaleplerimModal(false)}
        benimTalepKayitlari={benimTalepKayitlari}
        onDeleteTalep={handleDeleteMyTalep}
      />

      {/* Admin Login Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLogin={handleLogin}
      />

      {/* Teacher List Modal */}
      <TeacherListModal
        isOpen={showTeacherListModal}
        onClose={() => setShowTeacherListModal(false)}
        teachers={teachers}
        schoolName={settings.schoolName || 'Cevdet Güçlüer İlkokulu'}
      />

      {/* Conflict Dialog */}
      <ConflictModal
        conflicts={conflictDialog?.conflicts || null}
        onConfirm={() => conflictDialog?.onConfirm()}
        onCancel={() => conflictDialog?.onCancel()}
      />
    </div>
  );
}
