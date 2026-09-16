import React, { useState } from 'react';
import { Settings, Lesson, Booking, Holiday, TeacherClassItem } from '../types';
import {
  X,
  School,
  Clock,
  MapPin,
  Calendar,
  Layers,
  ListFilter,
  Database,
  Plus,
  Trash2,
  Upload,
  Download,
  Smartphone,
  Bell,
  Check,
  Users,
  ShieldCheck,
  Search,
  Filter,
} from 'lucide-react';
import {
  SISTEM_ADI,
  SISTEM_BASLANGIC,
  SISTEM_BITIS,
  DEFAULT_LOCATIONS,
  DEFAULT_MORNING_LESSONS,
  DEFAULT_AFTERNOON_LESSONS,
  DAY_SHORT,
  GUN_ADLARI_TR,
  toDateStrLocal,
  formatDateStrDisplay,
  trUpper,
} from '../constants';
import { DEFAULT_TEACHERS, sortTeachers } from '../data/defaultTeachers';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onSaveSettings: (partial: Partial<Settings>, message?: string) => void;
  bookings: Booking[];
  commitBookings: (b: Booking[]) => void;
  courseGroups: {
    key: string;
    location: string;
    teacher: string;
    activity: string;
    count: number;
    minDate: string;
    maxDate: string;
  }[];
  onDeleteGroup: (key: string) => void;
  onUpdateGroup: (key: string, teacher: string, activity: string, start: string, end: string) => void;
  activeLocation: string;
  onBulkCreate: (form: {
    location: string;
    teacher: string;
    activity: string;
    startDate: string;
    endDate: string;
    days: number[];
    periods: string[];
  }) => void;
  notifPermission: NotificationPermission | 'unsupported';
  onRequestNotif: () => void;
  teachers?: TeacherClassItem[];
  onSaveTeachers?: (newTeachers: TeacherClassItem[]) => void;
  onDeleteBooking?: (id: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  bookings,
  commitBookings,
  courseGroups,
  onDeleteGroup,
  onUpdateGroup,
  activeLocation,
  onBulkCreate,
  notifPermission,
  onRequestNotif,
  teachers = DEFAULT_TEACHERS,
  onSaveTeachers,
  onDeleteBooking,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<
    'okul' | 'ogretmenler' | 'rezervasyonlar' | 'saatler' | 'mekan' | 'tatiller' | 'toplu' | 'kurslar' | 'yedek'
  >('okul');

  // Teacher list management state
  const [teacherSearch, setTeacherSearch] = useState('');
  const [newClassInput, setNewClassInput] = useState('');
  const [newTeacherInput, setNewTeacherInput] = useState('');
  const [newBranchInput, setNewBranchInput] = useState('');
  const [newGroupInput, setNewGroupInput] = useState<'SABAH' | 'ÖĞLE' | 'TÜM'>('SABAH');
  const [bulkTeachersText, setBulkTeachersText] = useState('');
  const [showBulkPaste, setShowBulkPaste] = useState(false);

  // Reservation management state
  const [rezSearch, setRezSearch] = useState('');
  const [rezLocFilter, setRezLocFilter] = useState('ALL');

  // New location
  const [newLocationInput, setNewLocationInput] = useState('');

  // New holiday
  const [newHolidayForm, setNewHolidayForm] = useState<{
    date: string;
    name: string;
    block: 'TAM' | 'SABAH' | 'ÖĞLE';
    days: number;
  }>({
    date: '',
    name: '',
    block: 'TAM',
    days: 1,
  });

  // Bulk form
  const [bulkForm, setBulkForm] = useState({
    location: activeLocation,
    teacher: '',
    activity: '',
    startDate: toDateStrLocal(SISTEM_BASLANGIC),
    endDate: toDateStrLocal(SISTEM_BITIS),
    days: [] as number[],
    periods: [] as string[],
  });

  // Group edit
  const [editingGroupKey, setEditingGroupKey] = useState<string | null>(null);

  // Logo file handler
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onSaveSettings({ logoDataUrl: reader.result as string }, 'Okul logosu güncellendi');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Add location
  const handleAddLoc = () => {
    const name = newLocationInput.trim();
    if (!name || settings.locations.includes(name)) return;
    onSaveSettings({ locations: [...settings.locations, name] }, 'Yeni mekan eklendi');
    setNewLocationInput('');
  };

  // Remove location
  const handleRemoveLoc = (loc: string) => {
    const remaining = settings.locations.filter((l) => l !== loc);
    onSaveSettings(
      { locations: remaining.length ? remaining : DEFAULT_LOCATIONS },
      'Mekan kaldırıldı'
    );
  };

  // Add holiday
  const handleAddHoliday = () => {
    const { date, name, block, days } = newHolidayForm;
    if (!date || !name.trim()) return;
    const dayCount = Math.max(1, Math.min(60, Number(days) || 1));
    const list = settings.holidays || [];

    const start = new Date(date + 'T00:00:00');
    const newEntries: Holiday[] = [];
    for (let i = 0; i < dayCount; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      newEntries.push({ date: toDateStrLocal(d), name: name.trim(), block });
    }
    const newKeys = new Set(newEntries.map((e) => `${e.date}-${e.block}`));
    const filtered = list.filter((h) => !newKeys.has(`${h.date}-${h.block}`));
    onSaveSettings(
      { holidays: [...filtered, ...newEntries].sort((a, b) => (a.date < b.date ? -1 : 1)) },
      dayCount > 1 ? `${dayCount} günlük tatil eklendi` : 'Tatil eklendi'
    );
    setNewHolidayForm({ date: '', name: '', block: 'TAM', days: 1 });
  };

  // Remove holiday
  const handleRemoveHoliday = (date: string, block: string) => {
    onSaveSettings(
      { holidays: (settings.holidays || []).filter((h) => !(h.date === date && h.block === block)) },
      'Tatil kaldırıldı'
    );
  };

  // Lesson times
  const handleSaveLessonTime = (
    blockKey: 'SABAH' | 'ÖĞLE',
    index: number,
    field: 'start' | 'end',
    val: string
  ) => {
    const mapKey = blockKey === 'SABAH' ? 'morning' : 'afternoon';
    const current =
      settings.lessonTimes?.[mapKey] ||
      (blockKey === 'SABAH' ? DEFAULT_MORNING_LESSONS : DEFAULT_AFTERNOON_LESSONS);
    const updated = current.map((l, i) => (i === index ? { ...l, [field]: val } : l));
    onSaveSettings({
      lessonTimes: {
        morning: settings.lessonTimes?.morning || DEFAULT_MORNING_LESSONS,
        afternoon: settings.lessonTimes?.afternoon || DEFAULT_AFTERNOON_LESSONS,
        [mapKey]: updated,
      },
    });
  };

  // Export JSON Backup
  const handleExportBackup = () => {
    const data = { settings, bookings, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rezervasyon-yedek-${toDateStrLocal(new Date())}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON Backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        if (!data || typeof data !== 'object') throw new Error('invalid');
        if (window.confirm('Mevcut tüm ayarlar ve rezervasyonlar yedekle değiştirilecek. Onaylıyor musunuz?')) {
          if (data.settings) onSaveSettings(data.settings, 'Ayarlar geri yüklendi');
          if (Array.isArray(data.bookings)) commitBookings(data.bookings);
        }
      } catch (err) {
        alert('Geçersiz yedek dosyası.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const tabs: { key: typeof activeTab; label: string; icon: React.ReactNode }[] = [
    { key: 'okul', label: 'Okul Bilgileri', icon: <School className="w-4 h-4" /> },
    { key: 'ogretmenler', label: 'Sınıf & Öğretmenler', icon: <Users className="w-4 h-4" /> },
    { key: 'rezervasyonlar', label: 'Rezervasyon Yönetimi', icon: <ShieldCheck className="w-4 h-4" /> },
    { key: 'saatler', label: 'Ders Saatleri', icon: <Clock className="w-4 h-4" /> },
    { key: 'mekan', label: 'Mekanlar', icon: <MapPin className="w-4 h-4" /> },
    { key: 'tatiller', label: 'Resmi Tatiller', icon: <Calendar className="w-4 h-4" /> },
    { key: 'toplu', label: 'Toplu Oluştur', icon: <Layers className="w-4 h-4" /> },
    { key: 'kurslar', label: 'Kurslar / Kayıtlar', icon: <ListFilter className="w-4 h-4" /> },
    { key: 'yedek', label: 'Yedekleme & PWA', icon: <Database className="w-4 h-4" /> },
  ];

  return (
    <div
      id="settings-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="no-snapshot fixed inset-0 z-[800] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(32,38,31,0.65)', backdropFilter: 'blur(6px)' }}
    >
      <div
        className="w-full max-w-5xl rounded-t-3xl sm:rounded-3xl overflow-hidden h-[94vh] sm:h-[780px] flex flex-col shadow-2xl border"
        style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 sm:px-8 py-4 border-b shrink-0"
          style={{ borderColor: 'var(--line)', background: 'var(--paper)' }}
        >
          <div className="flex items-center gap-3">
            <h3 className="font-display font-bold text-xl sm:text-2xl" style={{ color: 'var(--ink)' }}>
              Sistem Ayarları
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-200 text-amber-900">
              Yönetici
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-stone-200 transition-colors"
            style={{ background: 'var(--paper-2)' }}
          >
            <X className="w-5 h-5 text-stone-700" />
          </button>
        </div>

        <div className="flex flex-col sm:flex-row flex-1 min-h-0">
          {/* Mobile Horizontal Tab Strip */}
          <div
            className="flex sm:hidden gap-1.5 px-3 py-2 border-b overflow-x-auto scrollbar-hide shrink-0"
            style={{ borderColor: 'var(--line)', background: 'var(--paper-2)' }}
          >
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="px-3.5 py-2 text-xs font-bold rounded-lg whitespace-nowrap flex items-center gap-1.5 transition-all"
                style={
                  activeTab === tab.key
                    ? { background: 'var(--teal-dark)', color: 'white' }
                    : { color: 'var(--ink-soft)' }
                }
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Desktop Vertical Sidebar */}
          <div
            className="hidden sm:flex flex-col w-56 shrink-0 border-r p-3 gap-1.5"
            style={{ borderColor: 'var(--line)', background: 'var(--paper-2)' }}
          >
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="text-left px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2.5 transition-all"
                style={
                  activeTab === tab.key
                    ? {
                        background: 'var(--panel)',
                        color: 'var(--teal-dark)',
                        boxShadow: '0 2px 5px rgba(32,38,31,0.1)',
                        border: '1px solid var(--line)',
                      }
                    : { color: 'var(--ink-soft)' }
                }
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="flex-1 min-h-0 p-4 sm:p-8 overflow-y-auto">
            {/* Tab: Okul Bilgileri */}
            {activeTab === 'okul' && (
              <div className="max-w-2xl space-y-6">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    onSaveSettings(
                      {
                        schoolName: (f.get('schoolName') as string) || SISTEM_ADI,
                        schoolSubtitle: (f.get('schoolSubtitle') as string) || '',
                      },
                      'Okul bilgileri güncellendi'
                    );
                  }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-4 p-4 rounded-2xl border" style={{ borderColor: 'var(--line)', background: 'var(--paper)' }}>
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden font-display font-bold text-2xl border shrink-0"
                      style={{ color: 'var(--teal-dark)', borderColor: 'var(--line)', background: 'var(--panel)' }}
                    >
                      {settings.logoDataUrl ? (
                        <img src={settings.logoDataUrl} alt="Logo" className="w-full h-full object-contain" />
                      ) : (
                        (settings.schoolName || SISTEM_ADI).charAt(0)
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer w-fit shadow-xs flex items-center gap-2 text-white" style={{ background: 'var(--teal-dark)' }}>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Logo Yükle</span>
                        <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                      </label>
                      {settings.logoDataUrl && (
                        <button
                          type="button"
                          onClick={() => onSaveSettings({ logoDataUrl: '' }, 'Logo kaldırıldı')}
                          className="text-xs font-bold text-left text-red-700 hover:underline"
                        >
                          Logoyu Kaldır
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--ink-soft)' }}>
                      Okul / Kurum Adı
                    </label>
                    <input
                      name="schoolName"
                      defaultValue={settings.schoolName}
                      placeholder={SISTEM_ADI}
                      className="w-full px-4 py-3 rounded-xl text-sm font-bold outline-none border-2 transition-all focus:border-teal-700"
                      style={{ borderColor: 'var(--line)', background: 'var(--paper)' }}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--ink-soft)' }}>
                      Alt Başlık / Açıklama
                    </label>
                    <input
                      name="schoolSubtitle"
                      defaultValue={settings.schoolSubtitle}
                      placeholder="Örn: Konferans ve Spor Salonu Rezervasyonu"
                      className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none border-2 transition-all focus:border-teal-700"
                      style={{ borderColor: 'var(--line)', background: 'var(--paper)' }}
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-3 rounded-xl text-white font-bold text-sm shadow-xs transition-opacity hover:opacity-95"
                    style={{ background: 'var(--teal-dark)' }}
                  >
                    Bilgileri Kaydet
                  </button>
                </form>

                {/* Password Change */}
                <div className="pt-6 border-t" style={{ borderColor: 'var(--line)' }}>
                  <h4 className="text-sm font-bold mb-2" style={{ color: 'var(--ink)' }}>
                    Yönetici Şifresi
                  </h4>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const f = new FormData(e.currentTarget);
                      const p = (f.get('adminPassword') as string) || settings.adminPassword;
                      onSaveSettings({ adminPassword: p }, 'Yönetici şifresi güncellendi');
                    }}
                    className="flex gap-2 max-w-md"
                  >
                    <input
                      name="adminPassword"
                      defaultValue={settings.adminPassword}
                      className="flex-1 px-4 py-2.5 rounded-xl font-mono text-sm font-bold outline-none border-2"
                      style={{ borderColor: 'var(--line)', background: 'var(--paper)' }}
                    />
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl text-white font-bold text-sm shadow-xs"
                      style={{ background: 'var(--teal-dark)' }}
                    >
                      Şifreyi Güncelle
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Tab: Sınıf ve Öğretmenler */}
            {activeTab === 'ogretmenler' && (
              <div className="max-w-4xl space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b" style={{ borderColor: 'var(--line)' }}>
                  <div>
                    <h4 className="text-base font-bold" style={{ color: 'var(--ink)' }}>
                      Sınıf & Öğretmen Listesi
                    </h4>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Rezervasyon oluştururken listeden seçilecek öğretmenleri ve sınıfları buradan yönetebilirsiniz.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowBulkPaste(!showBulkPaste)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold border hover:bg-stone-200 transition-colors"
                      style={{ borderColor: 'var(--line)' }}
                    >
                      {showBulkPaste ? 'Forma Dön' : 'Toplu Metin Yapıştır'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (onSaveTeachers && window.confirm('Varsayılan Cevdet Güçlüer İlkokulu öğretmen listesi yüklensin mi?')) {
                          onSaveTeachers(DEFAULT_TEACHERS);
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-100 text-amber-900 hover:bg-amber-200 transition-colors"
                    >
                      Varsayılan Listeyi Yükle
                    </button>
                  </div>
                </div>

                {/* Bulk Paste Area */}
                {showBulkPaste ? (
                  <div className="p-4 rounded-2xl border bg-stone-50/80 space-y-3" style={{ borderColor: 'var(--line)' }}>
                    <label className="block text-xs font-bold" style={{ color: 'var(--ink)' }}>
                      Toplu Sınıf ve Öğretmen Ekle (Her satıra: Sınıf - Öğretmen Adı)
                    </label>
                    <textarea
                      rows={6}
                      value={bulkTeachersText}
                      onChange={(e) => setBulkTeachersText(e.target.value)}
                      placeholder={`1/G - Gül Alibaş SÜTÇÜ\n1/A - Ayşe YILMAZ\n2/B - Hüseyin DOĞAN`}
                      className="w-full p-3 rounded-xl text-xs font-mono border bg-white outline-none focus:border-teal-700"
                      style={{ borderColor: 'var(--line)' }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!bulkTeachersText.trim() || !onSaveTeachers) return;
                        const lines = bulkTeachersText.split('\n').map(l => l.trim()).filter(Boolean);
                        const newItems: TeacherClassItem[] = lines.map((line, idx) => {
                          const parts = line.split('-');
                          const cName = parts[0]?.trim() || '';
                          const tName = parts.slice(1).join('-').trim() || cName;
                          return {
                            id: `custom-${Date.now()}-${idx}`,
                            className: cName,
                            teacherName: tName,
                            branch: 'Sınıf Öğretmeni',
                            group: 'TÜM'
                          };
                        });
                        onSaveTeachers([...teachers, ...newItems]);
                        setBulkTeachersText('');
                        setShowBulkPaste(false);
                      }}
                      className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl"
                    >
                      Satırları Listeye Ekle
                    </button>
                  </div>
                ) : (
                  /* Single Add Form */
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!newClassInput.trim() || !newTeacherInput.trim() || !onSaveTeachers) return;
                      const newItem: TeacherClassItem = {
                        id: `t-${Date.now()}`,
                        className: newClassInput.trim(),
                        teacherName: newTeacherInput.trim(),
                        branch: newBranchInput.trim() || 'Sınıf Öğretmeni',
                        group: newGroupInput,
                      };
                      onSaveTeachers([newItem, ...teachers]);
                      setNewClassInput('');
                      setNewTeacherInput('');
                      setNewBranchInput('');
                    }}
                    className="p-4 rounded-2xl border bg-stone-50/70 space-y-3"
                    style={{ borderColor: 'var(--line)' }}
                  >
                    <div className="text-xs font-bold text-teal-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5" /> Yeni Sınıf & Öğretmen Ekle
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-stone-600 mb-1">Sınıf</label>
                        <input
                          required
                          value={newClassInput}
                          onChange={(e) => setNewClassInput(e.target.value)}
                          placeholder="Örn: 1/G"
                          className="w-full px-3 py-2 rounded-xl text-xs font-bold border bg-white outline-none focus:border-teal-700"
                          style={{ borderColor: 'var(--line)' }}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-stone-600 mb-1">Öğretmen Adı Soyadı</label>
                        <input
                          required
                          value={newTeacherInput}
                          onChange={(e) => setNewTeacherInput(e.target.value)}
                          placeholder="Örn: Gül Alibaş SÜTÇÜ"
                          className="w-full px-3 py-2 rounded-xl text-xs font-bold border bg-white outline-none focus:border-teal-700"
                          style={{ borderColor: 'var(--line)' }}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-stone-600 mb-1">Dönem / Grup</label>
                        <select
                          value={newGroupInput}
                          onChange={(e) => setNewGroupInput(e.target.value as any)}
                          className="w-full px-3 py-2 rounded-xl text-xs font-bold border bg-white outline-none focus:border-teal-700"
                          style={{ borderColor: 'var(--line)' }}
                        >
                          <option value="SABAH">Sabahçı</option>
                          <option value="ÖĞLE">Öğleci</option>
                          <option value="TÜM">Tüm Gün / Branş</option>
                        </select>
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-xs"
                    >
                      Öğretmeni Listeye Ekle
                    </button>
                  </form>
                )}

                {/* Teacher Search & Table */}
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3.5 top-3 text-stone-400" />
                    <input
                      type="text"
                      value={teacherSearch}
                      onChange={(e) => setTeacherSearch(e.target.value)}
                      placeholder="Listede ara (örn: Gül, 1/G, 2/A, Rehberlik)..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-semibold outline-none border bg-white"
                      style={{ borderColor: 'var(--line)' }}
                    />
                  </div>

                  <div className="border rounded-2xl overflow-hidden bg-white" style={{ borderColor: 'var(--line)' }}>
                    <div className="max-h-72 overflow-y-auto divide-y" style={{ borderColor: 'var(--line)' }}>
                      {sortTeachers(teachers)
                        .filter((t) => {
                          if (!teacherSearch.trim()) return true;
                          const q = teacherSearch.toLowerCase();
                          return `${t.className} ${t.teacherName} ${t.branch || ''}`.toLowerCase().includes(q);
                        })
                        .map((t) => {
                          return (
                            <div
                              key={t.id}
                              className="px-4 py-2.5 flex items-center justify-between text-xs transition-colors hover:bg-stone-50"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-stone-100 text-stone-800">
                                  {t.className}
                                </span>
                                <span className="font-bold text-stone-900 truncate">{t.teacherName}</span>
                                {t.branch && <span className="text-stone-400 text-[11px] hidden sm:inline truncate">({t.branch})</span>}
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[10px] text-stone-500 font-mono hidden sm:inline px-2 py-0.5 rounded bg-stone-100">
                                  {t.group}
                                </span>
                                {onSaveTeachers && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (window.confirm(`${t.className} - ${t.teacherName} kaydı silinsin mi?`)) {
                                        onSaveTeachers(teachers.filter((item) => item.id !== t.id));
                                      }
                                    }}
                                    className="p-1 rounded-lg text-stone-400 hover:text-red-700 hover:bg-red-50 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                  <div className="text-[11px] text-stone-500 font-medium">
                    Toplam {teachers.length} sınıf/öğretmen tanımlı.
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Rezervasyon Yönetimi ("yönetim ekranından silme yetkisi olmalı") */}
            {activeTab === 'rezervasyonlar' && (
              <div className="max-w-4xl space-y-4">
                <div className="pb-3 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ borderColor: 'var(--line)' }}>
                  <div>
                    <h4 className="text-base font-bold" style={{ color: 'var(--ink)' }}>
                      Yönetim Rezervasyon Ekranı
                    </h4>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Okuldaki tüm aktif rezervasyonları buradan inceleyebilir, filtreleyebilir ve silebilirsiniz.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 self-start">
                    {bookings.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('DİKKAT: Sistemdeki TÜM rezervasyonlar silinecektir. Emin misiniz?')) {
                            commitBookings([]);
                          }
                        }}
                        className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-full font-bold text-xs flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Tümünü Sil
                      </button>
                    )}
                    <span className="px-3 py-1 bg-teal-100 text-teal-800 rounded-full font-bold text-xs">
                      Toplam {bookings.length} Rezervasyon
                    </span>
                  </div>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-2 relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
                    <input
                      type="text"
                      value={rezSearch}
                      onChange={(e) => setRezSearch(e.target.value)}
                      placeholder="Öğretmen, sınıf, etkinlik veya tarih ara..."
                      className="w-full pl-9 pr-3 py-2 rounded-xl text-xs font-semibold outline-none border bg-white"
                      style={{ borderColor: 'var(--line)' }}
                    />
                  </div>
                  <div>
                    <select
                      value={rezLocFilter}
                      onChange={(e) => setRezLocFilter(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs font-bold border bg-white outline-none"
                      style={{ borderColor: 'var(--line)' }}
                    >
                      <option value="ALL">Tüm Mekanlar</option>
                      {settings.locations.map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Bookings List */}
                {bookings.length === 0 ? (
                  <div className="text-center py-12 text-stone-400 font-medium text-xs">
                    Henüz hiçbir rezervasyon oluşturulmamış.
                  </div>
                ) : (
                  <div className="border rounded-2xl overflow-hidden bg-white" style={{ borderColor: 'var(--line)' }}>
                    <div className="max-h-80 overflow-y-auto divide-y" style={{ borderColor: 'var(--line)' }}>
                      {bookings
                        .filter((b) => {
                          if (rezLocFilter !== 'ALL' && b.location !== rezLocFilter) return false;
                          if (!rezSearch.trim()) return true;
                          const q = rezSearch.toLowerCase();
                          return `${b.teacher} ${b.activity} ${b.location} ${b.date} ${b.lessonLabel}`
                            .toLowerCase()
                            .includes(q);
                        })
                        .map((b) => (
                          <div key={b.id} className="p-3 sm:p-4 flex items-center justify-between gap-3 hover:bg-stone-50 transition-colors">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800">
                                  {b.location}
                                </span>
                                <span className="font-mono text-xs font-semibold text-stone-700">
                                  {formatDateStrDisplay(b.date)} · {b.lessonLabel} ({b.block})
                                </span>
                              </div>
                              <div className="font-bold text-sm text-stone-900 mt-1">
                                {trUpper(b.teacher)}
                              </div>
                              <div className="text-xs text-stone-500 font-medium truncate mt-0.5">
                                {b.activity || 'Belirtilmedi'}
                              </div>
                            </div>
                            <div className="shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`${b.teacher} - ${b.activity} rezervasyonu silinsin mi?`)) {
                                    if (onDeleteBooking) {
                                      onDeleteBooking(b.id);
                                    } else {
                                      commitBookings(bookings.filter((item) => item.id !== b.id));
                                    }
                                  }
                                }}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                                style={{ background: 'var(--brick-tint)', color: 'var(--brick)' }}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Sil</span>
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Ders Saatleri */}
            {activeTab === 'saatler' && (
              <div className="max-w-3xl">
                <p className="text-xs sm:text-sm font-medium mb-5" style={{ color: 'var(--ink-soft)' }}>
                  6 ders saatlik sabah ve öğle bloklarının başlangıç ve bitiş saatlerini düzenleyin.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {(['SABAH', 'ÖĞLE'] as const).map((blockKey) => {
                    const blockLabel = blockKey === 'SABAH' ? 'Sabah Dersleri' : 'Öğle Dersleri';
                    const list =
                      blockKey === 'SABAH'
                        ? settings.lessonTimes?.morning || DEFAULT_MORNING_LESSONS
                        : settings.lessonTimes?.afternoon || DEFAULT_AFTERNOON_LESSONS;

                    return (
                      <div key={blockKey} className="rounded-2xl border p-4" style={{ borderColor: 'var(--line)', background: 'var(--paper)' }}>
                        <div className="text-xs font-bold mb-3 uppercase tracking-wider text-teal-800 flex items-center justify-between">
                          <span>{blockLabel}</span>
                          <span className="text-[11px] font-mono opacity-70">6 Ders Saati</span>
                        </div>
                        <div className="space-y-2">
                          {list.map((lesson, idx) => (
                            <div
                              key={idx}
                              className="p-2 sm:p-2.5 rounded-xl border flex items-center gap-2"
                              style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}
                            >
                              <div className="w-16 shrink-0 text-xs font-bold text-teal-900">
                                {lesson.label}
                              </div>
                              <input
                                type="time"
                                value={lesson.start}
                                onChange={(e) =>
                                  handleSaveLessonTime(blockKey, idx, 'start', e.target.value)
                                }
                                className="flex-1 px-2 py-1.5 rounded-lg text-xs font-mono font-bold text-center border"
                                style={{ borderColor: 'var(--line)', background: 'var(--paper)' }}
                              />
                              <span className="text-xs font-bold text-stone-400">–</span>
                              <input
                                type="time"
                                value={lesson.end}
                                onChange={(e) =>
                                  handleSaveLessonTime(blockKey, idx, 'end', e.target.value)
                                }
                                className="flex-1 px-2 py-1.5 rounded-lg text-xs font-mono font-bold text-center border"
                                style={{ borderColor: 'var(--line)', background: 'var(--paper)' }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab: Mekanlar */}
            {activeTab === 'mekan' && (
              <div className="max-w-2xl">
                <p className="text-xs sm:text-sm font-medium mb-4" style={{ color: 'var(--ink-soft)' }}>
                  Rezervasyon açmak istediğiniz mekanları yönetin.
                </p>

                {/* Bahçe, aynı saatte birden fazla şube alabilen tek mekan.
                    Kaç şube alacağı buradan ayarlanır. */}
                <div
                  className="rounded-2xl border p-4 mb-5"
                  style={{ background: 'var(--paper-2)', borderColor: 'var(--line)' }}
                >
                  <div className="text-sm font-bold mb-1" style={{ color: 'var(--ink)' }}>
                    Bahçe kapasitesi
                  </div>
                  <p className="text-xs font-medium mb-3" style={{ color: 'var(--ink-soft)' }}>
                    Bahçede aynı ders saatinde en fazla kaç şube olabilir? Her şube haftada
                    2 ders bahçe kullanabilir; bu kuralı yalnızca yönetici aşabilir.
                  </p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map((n) => {
                      const seciliMi = (settings.bahceKapasitesi ?? 2) === n;
                      return (
                        <button
                          key={n}
                          onClick={() =>
                            onSaveSettings(
                              { bahceKapasitesi: n },
                              `Bahçe kapasitesi ${n} şube olarak ayarlandı`
                            )
                          }
                          className="flex-1 py-2.5 rounded-xl font-bold text-sm border transition-colors"
                          style={
                            seciliMi
                              ? { background: 'var(--teal-dark)', color: '#fff', borderColor: 'var(--teal-dark)' }
                              : { background: 'var(--panel)', color: 'var(--ink)', borderColor: 'var(--line)' }
                          }
                        >
                          {n} şube
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] font-semibold mt-2.5" style={{ color: 'var(--ink-soft)' }}>
                    Kapasiteyi düşürmek mevcut kayıtları silmez; fazlalık kayıtlar yerinde kalır,
                    yalnızca yeni rezervasyon alınamaz.
                  </p>
                </div>
                <div className="flex gap-2 mb-5">
                  <input
                    value={newLocationInput}
                    onChange={(e) => setNewLocationInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddLoc();
                      }
                    }}
                    placeholder="Örn: Müzik Sınıfı, Spor Salonu"
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold outline-none border-2"
                    style={{ borderColor: 'var(--line)', background: 'var(--paper)' }}
                  />
                  <button
                    onClick={handleAddLoc}
                    className="px-5 py-2.5 rounded-xl text-white font-bold text-sm flex items-center gap-1.5 shadow-xs"
                    style={{ background: 'var(--teal-dark)' }}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Mekan Ekle</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {settings.locations.map((loc) => (
                    <div
                      key={loc}
                      className="flex items-center justify-between px-4 py-3 rounded-2xl border shadow-xs"
                      style={{ borderColor: 'var(--line)', background: 'var(--paper)' }}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: 'var(--teal-tint)', color: 'var(--teal-dark)' }}
                        >
                          <MapPin className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold truncate" style={{ color: 'var(--ink)' }}>
                          {loc}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveLoc(loc)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-red-100"
                        style={{ background: 'var(--brick-tint)', color: 'var(--brick)' }}
                        title="Mekanı Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab: Tatiller */}
            {activeTab === 'tatiller' && (
              <div className="max-w-3xl">
                <p className="text-xs sm:text-sm font-medium mb-4" style={{ color: 'var(--ink-soft)' }}>
                  Takvimde otomatik kapatılacak resmi ve dini tatilleri tanımlayın.
                </p>
                <div className="p-4 rounded-2xl border mb-5 shadow-xs" style={{ borderColor: 'var(--line)', background: 'var(--paper)' }}>
                  <div className="grid grid-cols-1 sm:grid-cols-[140px,90px,1fr,auto] gap-3 items-end">
                    <div>
                      <label className="block text-xs font-bold mb-1" style={{ color: 'var(--ink-soft)' }}>
                        Başlangıç Tarihi
                      </label>
                      <input
                        type="date"
                        value={newHolidayForm.date}
                        min={toDateStrLocal(SISTEM_BASLANGIC)}
                        max={toDateStrLocal(SISTEM_BITIS)}
                        onChange={(e) => setNewHolidayForm((f) => ({ ...f, date: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl text-xs font-bold outline-none border-2"
                        style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1" style={{ color: 'var(--ink-soft)' }}>
                        Gün Sayısı
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={newHolidayForm.days}
                        onChange={(e) => setNewHolidayForm((f) => ({ ...f, days: Number(e.target.value) }))}
                        className="w-full px-3 py-2.5 rounded-xl text-xs font-bold outline-none border-2"
                        style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1" style={{ color: 'var(--ink-soft)' }}>
                        Tatil Açıklaması
                      </label>
                      <input
                        value={newHolidayForm.name}
                        onChange={(e) => setNewHolidayForm((f) => ({ ...f, name: e.target.value }))}
                        placeholder="Örn: 1. Dönem Ara Tatili"
                        className="w-full px-3 py-2.5 rounded-xl text-xs font-bold outline-none border-2"
                        style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}
                      />
                    </div>
                    <button
                      onClick={handleAddHoliday}
                      className="px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 shrink-0"
                      style={{ background: 'var(--teal-dark)' }}
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tatil Ekle</span>
                    </button>
                  </div>

                  <div className="mt-3">
                    <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--ink-soft)' }}>
                      Kapanış Türü
                    </label>
                    <div className="flex gap-2">
                      {(['TAM', 'SABAH', 'ÖĞLE'] as const).map((key) => (
                        <button
                          type="button"
                          key={key}
                          onClick={() => setNewHolidayForm((f) => ({ ...f, block: key }))}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all"
                          style={
                            newHolidayForm.block === key
                              ? { background: 'var(--teal-dark)', color: 'white', borderColor: 'var(--teal-dark)' }
                              : { borderColor: 'var(--line)', color: 'var(--ink-soft)' }
                          }
                        >
                          {key === 'TAM' ? 'Tüm Gün' : key === 'SABAH' ? 'Sadece Sabah' : 'Sadece Öğle'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-2.5">
                  {(settings.holidays || []).map((h) => (
                    <div
                      key={`${h.date}-${h.block}`}
                      className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border"
                      style={{ borderColor: 'var(--line)', background: 'var(--paper)' }}
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate" style={{ color: 'var(--ink)' }}>
                          {h.name}
                        </div>
                        <div className="text-[11px] font-mono font-medium mt-0.5" style={{ color: 'var(--ink-soft)' }}>
                          {formatDateStrDisplay(h.date)} ·{' '}
                          {h.block === 'TAM' ? 'Tüm Gün' : h.block === 'SABAH' ? 'Sadece Sabah' : 'Sadece Öğle'}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveHoliday(h.date, h.block)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 hover:bg-red-100"
                        style={{ background: 'var(--brick-tint)', color: 'var(--brick)' }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab: Toplu Oluştur */}
            {activeTab === 'toplu' && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  onBulkCreate(bulkForm);
                }}
                className="space-y-5 max-w-3xl"
              >
                <p className="text-xs font-medium" style={{ color: 'var(--ink-soft)' }}>
                  Haftalık tekrar eden kurs veya etkinlikleri tek seferde takvime işleyin. Çakışmalar otomatik algılanır.
                </p>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold mb-1" style={{ color: 'var(--ink-soft)' }}>
                      Mekan
                    </label>
                    <select
                      value={bulkForm.location}
                      onChange={(e) => setBulkForm((f) => ({ ...f, location: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm font-bold border-2"
                      style={{ borderColor: 'var(--line)', background: 'var(--paper)' }}
                    >
                      {settings.locations.map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1" style={{ color: 'var(--ink-soft)' }}>
                      Öğretmen Adı Soyadı
                    </label>
                    <input
                      required
                      value={bulkForm.teacher}
                      onChange={(e) => setBulkForm((f) => ({ ...f, teacher: e.target.value }))}
                      placeholder="Ad Soyad"
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold border-2"
                      style={{ borderColor: 'var(--line)', background: 'var(--paper)' }}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold mb-1" style={{ color: 'var(--ink-soft)' }}>
                      Kurs / Etkinlik Adı
                    </label>
                    <input
                      required
                      value={bulkForm.activity}
                      onChange={(e) => setBulkForm((f) => ({ ...f, activity: e.target.value }))}
                      placeholder="Örn: Robotik Kodlama Kulübü"
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold border-2"
                      style={{ borderColor: 'var(--line)', background: 'var(--paper)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1" style={{ color: 'var(--ink-soft)' }}>
                      Başlangıç Tarihi
                    </label>
                    <input
                      type="date"
                      value={bulkForm.startDate}
                      min={toDateStrLocal(SISTEM_BASLANGIC)}
                      max={toDateStrLocal(SISTEM_BITIS)}
                      onChange={(e) => setBulkForm((f) => ({ ...f, startDate: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm font-bold border-2"
                      style={{ borderColor: 'var(--line)', background: 'var(--paper)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1" style={{ color: 'var(--ink-soft)' }}>
                      Bitiş Tarihi
                    </label>
                    <input
                      type="date"
                      value={bulkForm.endDate}
                      min={toDateStrLocal(SISTEM_BASLANGIC)}
                      max={toDateStrLocal(SISTEM_BITIS)}
                      onChange={(e) => setBulkForm((f) => ({ ...f, endDate: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm font-bold border-2"
                      style={{ borderColor: 'var(--line)', background: 'var(--paper)' }}
                    />
                  </div>
                </div>

                {/* Weekday selection */}
                <div>
                  <label className="block text-xs font-bold mb-2" style={{ color: 'var(--ink-soft)' }}>
                    Haftanın Günleri
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map((dIdx) => {
                      const active = bulkForm.days.includes(dIdx);
                      return (
                        <button
                          type="button"
                          key={dIdx}
                          onClick={() =>
                            setBulkForm((f) => ({
                              ...f,
                              days: active ? f.days.filter((d) => d !== dIdx) : [...f.days, dIdx],
                            }))
                          }
                          className="py-2.5 rounded-xl text-xs font-bold border-2 transition-all text-center"
                          style={
                            active
                              ? { background: 'var(--teal-dark)', color: 'white', borderColor: 'var(--teal-dark)' }
                              : { borderColor: 'var(--line)', color: 'var(--ink)' }
                          }
                        >
                          <span className="sm:hidden">{DAY_SHORT[dIdx - 1]}</span>
                          <span className="hidden sm:inline">{GUN_ADLARI_TR[dIdx]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Lesson period selection */}
                <div>
                  <label className="block text-xs font-bold mb-2" style={{ color: 'var(--ink-soft)' }}>
                    Ders Saatleri
                  </label>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {(['SABAH', 'ÖĞLE'] as const).map((block) => {
                      const list =
                        block === 'SABAH'
                          ? settings.lessonTimes?.morning || DEFAULT_MORNING_LESSONS
                          : settings.lessonTimes?.afternoon || DEFAULT_AFTERNOON_LESSONS;

                      return (
                        <div key={block} className="p-3 rounded-2xl border" style={{ borderColor: 'var(--line)', background: 'var(--paper)' }}>
                          <div className="text-xs font-bold text-teal-800 mb-2">
                            {block === 'SABAH' ? 'Sabah Saatleri' : 'Öğle Saatleri'}
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {list.map((p) => {
                              const key = `${p.block}-${p.label}`;
                              const active = bulkForm.periods.includes(key);
                              return (
                                <button
                                  type="button"
                                  key={key}
                                  onClick={() =>
                                    setBulkForm((f) => ({
                                      ...f,
                                      periods: active
                                        ? f.periods.filter((x) => x !== key)
                                        : [...f.periods, key],
                                    }))
                                  }
                                  className="p-1.5 rounded-lg text-xs font-bold border-2 text-center"
                                  style={
                                    active
                                      ? { background: 'var(--teal-dark)', color: 'white', borderColor: 'var(--teal-dark)' }
                                      : { borderColor: 'var(--line)', color: 'var(--ink)' }
                                  }
                                >
                                  <div>{p.label}</div>
                                  <div className="text-[10px] font-mono opacity-80">{p.start}</div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-8 py-3.5 text-white font-bold rounded-xl text-sm shadow-sm transition-opacity hover:opacity-95"
                  style={{ background: 'var(--teal-dark)' }}
                >
                  Toplu Kursu Takvime Ekle
                </button>
              </form>
            )}

            {/* Tab: Kurslar */}
            {activeTab === 'kurslar' && (
              <div className="max-w-3xl">
                <p className="text-xs sm:text-sm font-medium mb-4" style={{ color: 'var(--ink-soft)' }}>
                  Takvimdeki tüm tekrarlı etkinlik ve kurs kayıtları.
                </p>
                {courseGroups.length === 0 ? (
                  <div className="text-center py-12 text-sm font-semibold text-stone-400">
                    Henüz kayıtlı bir kurs grubu bulunmuyor.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {courseGroups.map((g) => (
                      <div
                        key={g.key}
                        className="p-4 rounded-2xl border shadow-xs"
                        style={{ borderColor: 'var(--line)', background: 'var(--paper)' }}
                      >
                        {editingGroupKey === g.key ? (
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              const f = new FormData(e.currentTarget);
                              onUpdateGroup(
                                g.key,
                                (f.get('teacher') as string) || g.teacher,
                                (f.get('activity') as string) || g.activity,
                                (f.get('startDate') as string) || g.minDate,
                                (f.get('endDate') as string) || g.maxDate
                              );
                              setEditingGroupKey(null);
                            }}
                            className="space-y-3"
                          >
                            <div className="grid sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-bold mb-1">Öğretmen</label>
                                <input
                                  name="teacher"
                                  defaultValue={g.teacher}
                                  className="w-full px-3 py-2 rounded-lg text-xs font-bold border-2"
                                  style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold mb-1">Etkinlik</label>
                                <input
                                  name="activity"
                                  defaultValue={g.activity}
                                  className="w-full px-3 py-2 rounded-lg text-xs font-bold border-2"
                                  style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold mb-1">Başlangıç</label>
                                <input
                                  type="date"
                                  name="startDate"
                                  defaultValue={g.minDate}
                                  className="w-full px-3 py-2 rounded-lg text-xs font-bold border-2"
                                  style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold mb-1">Bitiş</label>
                                <input
                                  type="date"
                                  name="endDate"
                                  defaultValue={g.maxDate}
                                  className="w-full px-3 py-2 rounded-lg text-xs font-bold border-2"
                                  style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}
                                />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="submit"
                                className="px-4 py-2 rounded-lg text-white text-xs font-bold shadow-xs"
                                style={{ background: 'var(--teal-dark)' }}
                              >
                                Kaydet
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingGroupKey(null)}
                                className="px-4 py-2 rounded-lg text-xs font-bold border"
                                style={{ borderColor: 'var(--line)' }}
                              >
                                Vazgeç
                              </button>
                            </div>
                          </form>
                        ) : (
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <div className="text-sm font-bold" style={{ color: 'var(--ink)' }}>
                                {trUpper(g.teacher)} · {trUpper(g.activity)}
                              </div>
                              <div className="text-xs font-medium mt-1" style={{ color: 'var(--ink-soft)' }}>
                                {g.location} · {g.count} ders saati · {formatDateStrDisplay(g.minDate)}–{formatDateStrDisplay(g.maxDate)}
                              </div>
                            </div>
                            <div className="flex gap-2 shrink-0">
                              <button
                                onClick={() => setEditingGroupKey(g.key)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold border hover:bg-stone-200"
                                style={{ borderColor: 'var(--line)' }}
                              >
                                Düzenle
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm('Bu kursa ait tüm saatleri silmek istiyor musunuz?')) {
                                    onDeleteGroup(g.key);
                                  }
                                }}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors hover:bg-red-100"
                                style={{ background: 'var(--brick-tint)', color: 'var(--brick)' }}
                              >
                                Sil
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Yedekleme & PWA */}
            {activeTab === 'yedek' && (
              <div className="max-w-2xl space-y-4">
                <p className="text-xs sm:text-sm font-medium" style={{ color: 'var(--ink-soft)' }}>
                  Sistem verilerini yedekleyin, geri yükleyin veya cihazınıza kısayol ekleyin.
                </p>

                {/* Export Backup */}
                <div className="flex items-center justify-between p-4 rounded-2xl border" style={{ borderColor: 'var(--line)', background: 'var(--paper)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-teal-100 text-teal-800 shrink-0">
                      <Download className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold" style={{ color: 'var(--ink)' }}>
                        Yedek Dosyası İndir
                      </div>
                      <div className="text-xs text-stone-500">Tüm ayarlar ve rezervasyonlar JSON olarak indirilir</div>
                    </div>
                  </div>
                  <button
                    onClick={handleExportBackup}
                    className="px-4 py-2 rounded-xl text-white font-bold text-xs shadow-xs"
                    style={{ background: 'var(--teal-dark)' }}
                  >
                    İndir
                  </button>
                </div>

                {/* Import Backup */}
                <div className="flex items-center justify-between p-4 rounded-2xl border" style={{ borderColor: 'var(--line)', background: 'var(--paper)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-teal-100 text-teal-800 shrink-0">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold" style={{ color: 'var(--ink)' }}>
                        Yedek Dosyası Yükle
                      </div>
                      <div className="text-xs text-stone-500">Daha önce alınan JSON yedeğini geri yükler</div>
                    </div>
                  </div>
                  <label className="px-4 py-2 rounded-xl text-white font-bold text-xs cursor-pointer shadow-xs" style={{ background: 'var(--ink)' }}>
                    Dosya Seç
                    <input type="file" accept="application/json" onChange={handleImportBackup} className="hidden" />
                  </label>
                </div>

                {/* Notifications */}
                <div className="flex items-center justify-between p-4 rounded-2xl border" style={{ borderColor: 'var(--line)', background: 'var(--paper)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-100 text-amber-800 shrink-0">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold" style={{ color: 'var(--ink)' }}>
                        Talep Bildirimleri
                      </div>
                      <div className="text-xs text-stone-500">
                        {notifPermission === 'granted'
                          ? 'Bildirimler etkin — yeni talepte uyarılırsınız'
                          : 'Yeni talep geldiğinde tarayıcı bildirimi al'}
                      </div>
                    </div>
                  </div>
                  {notifPermission === 'granted' ? (
                    <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-green-100 text-green-800 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Açık
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={onRequestNotif}
                      className="px-4 py-2 rounded-xl text-white font-bold text-xs shadow-xs"
                      style={{ background: 'var(--teal-dark)' }}
                    >
                      Aç
                    </button>
                  )}
                </div>

                {/* PWA Info */}
                <div className="flex items-center justify-between p-4 rounded-2xl border" style={{ borderColor: 'var(--line)', background: 'var(--paper)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-teal-100 text-teal-800 shrink-0">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold" style={{ color: 'var(--ink)' }}>
                        Ana Ekrana Ekle (PWA)
                      </div>
                      <div className="text-xs text-stone-500">
                        Tarayıcı adres çubuğu olmadan tam ekran mobil uygulama olarak kullanın
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      // Trigger custom installation prompt or native prompt if available
                      if ((window as any).RezervasyonKurulumu) {
                        (window as any).RezervasyonKurulumu.ac();
                      } else {
                        alert('Mobil tarayıcınızın menüsünden "Ana Ekrana Ekle" (veya Masaüstünde adres çubuğundaki yükleme simgesi) seçeneğini kullanabilirsiniz.');
                      }
                    }}
                    className="px-4 py-2 rounded-xl text-white font-bold text-xs shadow-xs"
                    style={{ background: 'var(--teal-dark)' }}
                  >
                    Kılavuz
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
