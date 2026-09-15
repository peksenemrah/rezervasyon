import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import html2canvas from 'html2canvas';
import {
  Role,
  Settings,
  Booking,
  Talep,
  DayInfo,
  Lesson,
  EditingCell,
  TeacherClassItem,
} from './types';
import {
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
import { Header } from './components/Header';
import { ScheduleGrid } from './components/ScheduleGrid';
import { CellModal } from './components/CellModal';
import { SettingsModal } from './components/SettingsModal';
import { TaleplerModal } from './components/TaleplerModal';
import { TaleplerimModal } from './components/TaleplerimModal';
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

  // State: Teachers & Classes (sorted 1/A, 1/B ... 1/G, 2/A ...)
  const [teachers, setTeachers] = useState<TeacherClassItem[]>(() =>
    sortTeachers(okuOnbellek('rz_onbellek_ogretmenler', DEFAULT_TEACHERS))
  );

  // Cloud/Storage Status
  const [cloudStatus, setCloudStatus] = useState<'senkron' | 'yerel' | 'baglaniyor' | 'hata'>('baglaniyor');

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
  const [showTaleplerimModal, setShowTaleplerimModal] = useState(false);
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
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      });
    } catch (e) {}
  }, []);

  const commitBookings = useCallback(async (next: Booking[]) => {
    setBookings(next);
    yazOnbellek('rz_onbellek_rezervasyonlar', next);
    try {
      await fetch('/api/bookings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookings: next, adminPassword: settings.adminPassword || 'cg2026' }),
      });
    } catch (e) {}
  }, [settings.adminPassword]);

  const commitTeachers = useCallback(async (next: TeacherClassItem[]) => {
    const sorted = sortTeachers(next);
    setTeachers(sorted);
    yazOnbellek('rz_onbellek_ogretmenler', sorted);
    try {
      await fetch('/api/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sorted),
      });
    } catch (e) {}
  }, []);

  const commitTalepler = useCallback((next: Record<string, Talep>) => {
    setTalepler(next);
    yazOnbellek('rz_onbellek_talepler', next);
  }, []);

  // Cloud Synchronization Engine
  const lastSyncTimestampRef = useRef<number>(0);

  const fetchCloudState = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch('/api/state', { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data.bookings && Array.isArray(data.bookings)) {
          setBookings(data.bookings);
          yazOnbellek('rz_onbellek_rezervasyonlar', data.bookings);
        }
        if (data.talepler && typeof data.talepler === 'object') {
          setTalepler(data.talepler);
          yazOnbellek('rz_onbellek_talepler', data.talepler);
        }
        if (data.settings && typeof data.settings === 'object') {
          setSettings((prev) => {
            const merged = { ...prev, ...data.settings };
            if (!merged.adminPassword || merged.adminPassword === '123456') {
              merged.adminPassword = 'cg2026';
            }
            yazOnbellek('rz_onbellek_ayarlar', merged);
            return merged;
          });
        }
        if (data.teachers && Array.isArray(data.teachers) && data.teachers.length > 0) {
          const sorted = sortTeachers(data.teachers);
          setTeachers(sorted);
          yazOnbellek('rz_onbellek_ogretmenler', sorted);
        }
        if (data.lastUpdated) {
          lastSyncTimestampRef.current = data.lastUpdated;
        }
        setCloudStatus('senkron');
      } else {
        setCloudStatus('yerel');
      }
    } catch (err) {
      setCloudStatus('yerel');
    }
  }, []);

  // Poll cloud state every 2.5s so every client sees live changes in real time
  useEffect(() => {
    fetchCloudState();

    const interval = setInterval(async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const checkRes = await fetch('/api/poll', { signal: controller.signal });
        clearTimeout(timeoutId);

        if (checkRes.ok) {
          setCloudStatus('senkron');
          const pollData = await checkRes.json();
          if (pollData.lastUpdated && pollData.lastUpdated > lastSyncTimestampRef.current) {
            fetchCloudState();
          }
        } else {
          setCloudStatus('yerel');
        }
      } catch (e) {
        // network or server temporary unavailable
        setCloudStatus('yerel');
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [fetchCloudState]);

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

  const taleplerListesi = useMemo(() => {
    return (Object.entries(talepler) as [string, Talep][])
      .map(([key, t]) => ({ ...t, key }))
      .sort((a, b) => (b.olusturmaZamani || 0) - (a.olusturmaZamani || 0));
  }, [talepler]);

  const bekleyenTalepSayisi = useMemo(
    () => taleplerListesi.filter((t) => t.durum === 'bekliyor').length,
    [taleplerListesi]
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
    const id = bookingDocId(
      activeLocation,
      editingCell.dateStr,
      editingCell.lesson.block,
      editingCell.lesson.label
    );
    const newBooking: Booking = {
      id,
      location: activeLocation,
      date: editingCell.dateStr,
      lessonLabel: editingCell.lesson.label,
      block: editingCell.lesson.block,
      teacher,
      activity: activity || (activeLocation.includes('Akıl') ? 'Akıl ve Zeka Oyunları Dersi' : 'Salon Etkinliği'),
      timestamp: Date.now(),
    };
    const nextBookings = [...bookings.filter((b) => b.id !== id), newBooking];
    commitBookings(nextBookings);
    setEditingCell(null);
    setToastMsg(`${teacher} rezervasyonu kaydedildi`);

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBooking),
      });
      if (res.ok) {
        setCloudStatus('senkron');
      }
    } catch (e) {
      console.warn('Buluta aktarılamadı', e);
    }
  };

  const handleDeleteBookingById = async (id: string) => {
    const updated = bookings.filter((x) => x.id !== id);
    commitBookings(updated);
    setToastMsg('Rezervasyon silindi');

    try {
      const res = await fetch(`/api/bookings/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: {
          'x-admin-password': settings.adminPassword,
        },
      });
      if (res.ok) {
        setCloudStatus('senkron');
      }
    } catch (e) {
      console.warn('Buluttan silinemedi', e);
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
        onRetrySync={fetchCloudState}
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
      />

      {/* Cell Detail / Booking / Request Modal */}
      <CellModal
        editingCell={editingCell}
        onClose={() => setEditingCell(null)}
        currentBooking={currentBooking}
        currentTalep={currentTalep}
        role={role}
        activeLocation={activeLocation}
        teachers={teachers}
        onSaveBooking={handleSaveBooking}
        onDeleteBooking={handleDeleteCurrentBooking}
        onOpenAuth={() => setShowAuthModal(true)}
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

      {/* Teacher Requests Tracking Modal */}
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

      {/* Teacher List & Signature Sheet Modal */}
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
