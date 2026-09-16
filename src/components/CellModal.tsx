import React, { useState, useMemo } from 'react';
import { EditingCell, Booking, Talep, Role, TeacherClassItem } from '../types';
import { X, Trash2, Calendar, User, BookOpen, Search, Check, Plus, AlertCircle, ShieldAlert, Sparkles, Clock, Send } from 'lucide-react';
import { formatDateStrDisplay, trUpper } from '../constants';
import { DEFAULT_TEACHERS, sortTeachers } from '../data/defaultTeachers';

interface CellModalProps {
  editingCell: EditingCell | null;
  onClose: () => void;
  currentBooking: Booking | null;
  currentTalep: Talep | null;
  role: Role;
  activeLocation: string;
  teachers?: TeacherClassItem[];
  onSaveBooking: (teacher: string, activity: string) => void;
  onDeleteBooking: () => void;
  onOpenAuth?: () => void;
  /* Bu hücredeki rezervasyon için zaten bekleyen bir iptal talebi var mı */
  bekleyenIptalTalebi?: boolean;
  onIptalTalebiGonder?: (isteyen: string, sebep: string) => void;
}

export const CellModal: React.FC<CellModalProps> = ({
  editingCell,
  onClose,
  currentBooking,
  role,
  activeLocation,
  teachers = DEFAULT_TEACHERS,
  onSaveBooking,
  onDeleteBooking,
  onOpenAuth,
  bekleyenIptalTalebi = false,
  onIptalTalebiGonder,
}) => {
  if (!editingCell) return null;

  // Selected teacher/class or custom input
  const [selectedTeacherItem, setSelectedTeacherItem] = useState<TeacherClassItem | null>(null);
  const [teacherSearch, setTeacherSearch] = useState('');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('TÜMÜ');
  const [isManualInput, setIsManualInput] = useState(false);
  const [manualTeacher, setManualTeacher] = useState('');
  const [activityInput, setActivityInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  /* İptal talebi formu */
  const [iptalFormuAcik, setIptalFormuAcik] = useState(false);
  const [iptalIsteyen, setIptalIsteyen] = useState(() => {
    try {
      return localStorage.getItem('rz_iptal_isim') || '';
    } catch (e) {
      return '';
    }
  });
  const [iptalSebep, setIptalSebep] = useState('');
  const [iptalHata, setIptalHata] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Admin delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const formattedDate = editingCell.dateStr
    ? `${formatDateStrDisplay(editingCell.dateStr)} ${new Date(
        editingCell.dateStr + 'T00:00:00'
      ).toLocaleDateString('tr-TR', { weekday: 'long' })}`
    : '';

  // Quick activity recommendations based on location
  const quickActivities = useMemo(() => {
    if (activeLocation.toLowerCase().includes('akıl') || activeLocation.toLowerCase().includes('zeka')) {
      return [
        'Akıl ve Zeka Oyunları Dersi',
        'Mangala Turnuvası',
        'Satranç Çalışması',
        'Q-Bitz & Katamino',
        'Abalone & Koridor',
        'Zeka Oyunları Kulüp Saati'
      ];
    }
    return [
      'Veli Bilgilendirme Toplantısı',
      'Sene Başı / Sonu Öğretmenler Kurulu',
      'Tiyatro ve Drama Provası',
      'Seminer & Sunum',
      'Şiir Dinletisi',
      'Öğrenci Sinema / Belgesel Saati'
    ];
  }, [activeLocation]);

  // Filtered teachers list (sorted strictly: 1/A, 1/B ... 1/G, 2/A ...)
  const filteredTeachers = useMemo(() => {
    const list = teachers && teachers.length ? teachers : DEFAULT_TEACHERS;
    const sorted = sortTeachers(list);
    return sorted.filter((t) => {
      // Grade filter
      if (selectedGradeFilter === '1' && !t.className.startsWith('1/')) return false;
      if (selectedGradeFilter === '2' && !t.className.startsWith('2/')) return false;
      if (selectedGradeFilter === '3' && !t.className.startsWith('3/')) return false;
      if (selectedGradeFilter === '4' && !t.className.startsWith('4/')) return false;
      if (selectedGradeFilter === 'ANA' && !t.className.toLowerCase().includes('ana')) return false;
      if (selectedGradeFilter === 'BRANŞ' && (t.className.includes('/') || t.className.toLowerCase().includes('ana'))) return false;

      // Search text
      if (teacherSearch.trim()) {
        const query = teacherSearch.toLowerCase();
        const full = `${t.className} ${t.teacherName} ${t.branch || ''}`.toLowerCase();
        return full.includes(query);
      }
      return true;
    });
  }, [teachers, selectedGradeFilter, teacherSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    let finalTeacherName = '';
    if (isManualInput) {
      finalTeacherName = manualTeacher.trim();
    } else if (selectedTeacherItem) {
      finalTeacherName = `${selectedTeacherItem.className} - ${selectedTeacherItem.teacherName}`;
    }

    if (!finalTeacherName) {
      setErrorMsg('Lütfen listeden sınıf/öğretmen seçin veya manuel olarak girin.');
      return;
    }

    const finalActivity = activityInput.trim() || (activeLocation.includes('Akıl') ? 'Akıl ve Zeka Oyunları Dersi' : 'Salon Etkinliği');

    setIsSaving(true);
    onSaveBooking(finalTeacherName, finalActivity);
  };

  return (
    <div
      id="cell-details-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="no-snapshot fixed inset-0 z-[700] flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      style={{ background: 'rgba(23,30,24,0.65)', backdropFilter: 'blur(6px)' }}
    >
      <div
        className="w-full max-w-lg rounded-3xl overflow-y-auto max-h-[92vh] p-5 sm:p-7 shadow-2xl border"
        style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
      >
        {/* ----------------- CASE 1: SLOT IS OCCUPIED (ALREADY BOOKED) ----------------- */}
        {currentBooking ? (
          <div>
            <div className="flex justify-between items-start mb-4 pb-3 border-b" style={{ borderColor: 'var(--line)' }}>
              <div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 mb-1">
                  Rezerve Edilmiş Saat
                </span>
                <h3 className="font-display font-bold text-xl sm:text-2xl" style={{ color: 'var(--ink)' }}>
                  Rezervasyon Detayı
                </h3>
                <p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--ink-soft)' }}>
                  {activeLocation} · {formattedDate}
                </p>
              </div>
              <button
                id="btn-close-cell-modal"
                onClick={onClose}
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-stone-200 transition-colors shrink-0"
                style={{ background: 'var(--paper-2)' }}
              >
                <X className="w-5 h-5 text-stone-700" />
              </button>
            </div>

            {/* Time Banner */}
            <div
              className="p-4 rounded-2xl flex items-center justify-between font-bold text-white text-sm mb-4 shadow-xs"
              style={{ background: 'var(--teal-dark)' }}
            >
              <span>{editingCell.lesson?.label} ({editingCell.lesson?.block} GRUBU)</span>
              <span className="font-mono px-3 py-1 rounded-lg bg-white/20">
                {editingCell.lesson?.start} – {editingCell.lesson?.end}
              </span>
            </div>

            {/* Reservation Info Card */}
            <div className="p-5 rounded-2xl space-y-4 border mb-5" style={{ background: 'var(--ochre-tint)', borderColor: 'var(--ochre)' }}>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  Sınıf & Öğretmen
                </div>
                <div className="text-xl font-bold mt-1" style={{ color: 'var(--ink)' }}>
                  {currentBooking.teacher ? trUpper(currentBooking.teacher) : 'Bilinmiyor'}
                </div>
              </div>
              <div className="pt-3 border-t border-amber-300/60">
                <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  Etkinlik / Konu / Kullanım Amacı
                </div>
                <div className="text-base font-semibold mt-1" style={{ color: 'var(--ink)' }}>
                  {currentBooking.activity || 'Belirtilmedi'}
                </div>
              </div>
            </div>

            {/* DELETION AUTHORITY SECTION ("yönetim ekranından silme yetkisi olmalı") */}
            {role === 'admin' ? (
              <div className="space-y-2 mb-3">
                {bekleyenIptalTalebi && (
                  <div
                    className="p-3.5 rounded-xl border text-xs flex items-start gap-2.5"
                    style={{ background: 'var(--ochre-tint)', borderColor: 'var(--ochre)', color: 'var(--ink)' }}
                  >
                    <Clock className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--ochre)' }} />
                    <p className="font-semibold leading-relaxed">
                      Bu rezervasyon için <strong>bekleyen bir iptal talebi</strong> var.
                      İptal Talepleri ekranından onaylayabilir ya da reddedebilirsiniz.
                    </p>
                  </div>
                )}
                {showDeleteConfirm ? (
                  <div className="p-3.5 rounded-xl border border-red-200 bg-red-50 text-center space-y-2">
                    <p className="text-xs font-bold text-red-900">
                      Bu rezervasyonu silmek istediğinizden emin misiniz?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={onDeleteBooking}
                        className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs transition-colors"
                      >
                        Evet, Rezervasyonu Sil
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="px-4 py-2.5 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold rounded-lg text-xs transition-colors"
                      >
                        Vazgeç
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    id="btn-delete-booking"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full py-3.5 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors border"
                    style={{ background: 'var(--brick-tint)', color: 'var(--brick)', borderColor: 'rgba(179,58,58,0.2)' }}
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Rezervasyonu Sil (Yönetici Yetkisi)</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2.5 mb-4">
                <div className="p-3.5 rounded-xl border bg-stone-100/90 text-stone-700 text-xs flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold leading-relaxed">
                      Rezervasyon silme yetkisi yalnızca <strong>okul yönetimine</strong> aittir.
                      Bu saatin iptalini isteyebilir, kararı yönetime bırakabilirsiniz.
                    </p>
                    {onOpenAuth && (
                      <button
                        onClick={() => {
                          onClose();
                          onOpenAuth();
                        }}
                        className="text-teal-800 font-bold underline hover:text-teal-950 text-xs inline-block"
                      >
                        Yönetici girişi yaparak sil &rarr;
                      </button>
                    )}
                  </div>
                </div>

                {/* ---------- İPTAL TALEBİ ---------- */}
                {bekleyenIptalTalebi ? (
                  <div
                    className="p-3.5 rounded-xl border text-xs flex items-start gap-2.5"
                    style={{ background: 'var(--ochre-tint)', borderColor: 'var(--ochre)', color: 'var(--ink)' }}
                  >
                    <Clock className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--ochre)' }} />
                    <p className="font-semibold leading-relaxed">
                      Bu saat için <strong>iptal talebi gönderildi</strong>. Yönetim onaylayana kadar
                      rezervasyon yerinde kalır.
                    </p>
                  </div>
                ) : onIptalTalebiGonder ? (
                  iptalFormuAcik ? (
                    <div
                      className="p-4 rounded-xl border space-y-2.5"
                      style={{ background: 'var(--paper-2)', borderColor: 'var(--line)' }}
                    >
                      <p className="text-xs font-bold" style={{ color: 'var(--ink)' }}>
                        İptal talebi gönder
                      </p>

                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--ink-soft)' }}>
                          Adınız / Sınıfınız
                        </label>
                        <input
                          type="text"
                          value={iptalIsteyen}
                          onChange={(e) => {
                            setIptalIsteyen(e.target.value);
                            setIptalHata('');
                          }}
                          placeholder="Örn: 3/D - Feride Nur Aktan"
                          className="w-full mt-1 px-3 py-2.5 rounded-lg border text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-500/40"
                          style={{ background: 'var(--panel)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--ink-soft)' }}>
                          Gerekçe (isteğe bağlı)
                        </label>
                        <input
                          type="text"
                          value={iptalSebep}
                          onChange={(e) => setIptalSebep(e.target.value)}
                          placeholder="Örn: Etkinlik başka güne alındı"
                          className="w-full mt-1 px-3 py-2.5 rounded-lg border text-sm font-medium outline-none focus:ring-2 focus:ring-teal-500/40"
                          style={{ background: 'var(--panel)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                        />
                      </div>

                      {iptalHata && (
                        <div className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--brick)' }}>
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>{iptalHata}</span>
                        </div>
                      )}

                      <div className="flex gap-2 pt-0.5">
                        <button
                          onClick={() => {
                            const ad = iptalIsteyen.trim();
                            if (ad.length < 3) {
                              setIptalHata('Lütfen adınızı ve sınıfınızı yazın.');
                              return;
                            }
                            try {
                              localStorage.setItem('rz_iptal_isim', ad);
                            } catch (e) {}
                            onIptalTalebiGonder(ad, iptalSebep.trim());
                            setIptalFormuAcik(false);
                            setIptalSebep('');
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-white text-xs font-bold transition-opacity hover:opacity-95"
                          style={{ background: 'var(--brick)' }}
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Talebi Gönder</span>
                        </button>
                        <button
                          onClick={() => {
                            setIptalFormuAcik(false);
                            setIptalHata('');
                          }}
                          className="px-4 py-2.5 rounded-lg text-xs font-bold bg-stone-200 hover:bg-stone-300 text-stone-800 transition-colors"
                        >
                          Vazgeç
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      id="btn-iptal-talebi"
                      onClick={() => setIptalFormuAcik(true)}
                      className="w-full py-3.5 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors border"
                      style={{ background: 'var(--brick-tint)', color: 'var(--brick)', borderColor: 'rgba(179,58,58,0.2)' }}
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>İptal Talebi Gönder</span>
                    </button>
                  )
                ) : null}
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full py-3 text-white font-bold rounded-xl transition-colors"
              style={{ background: 'var(--ink)' }}
            >
              Kapat
            </button>
          </div>
        ) : (
          /* ----------------- CASE 2: SLOT IS EMPTY -> DIRECT RESERVATION CREATION ----------------- */
          <div>
            <div className="flex justify-between items-start mb-3 pb-3 border-b" style={{ borderColor: 'var(--line)' }}>
              <div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 mb-1">
                  Boş Saat · Rezervasyon Açık
                </span>
                <h3 className="font-display font-bold text-xl sm:text-2xl" style={{ color: 'var(--ink)' }}>
                  Rezervasyon Oluştur
                </h3>
                <p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--ink-soft)' }}>
                  {activeLocation} · {formattedDate}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-stone-200 transition-colors shrink-0"
                style={{ background: 'var(--paper-2)' }}
              >
                <X className="w-5 h-5 text-stone-700" />
              </button>
            </div>

            {/* Time Banner */}
            <div
              className="p-3.5 rounded-2xl flex items-center justify-between font-bold text-white text-sm mb-4 shadow-xs"
              style={{ background: 'var(--teal-dark)' }}
            >
              <div>
                <span className="text-teal-200 text-xs block font-normal">{editingCell.lesson?.block} GRUBU</span>
                <span>{editingCell.lesson?.label}</span>
              </div>
              <span className="font-mono px-3 py-1 rounded-lg bg-white/20 text-sm">
                {editingCell.lesson?.start} – {editingCell.lesson?.end}
              </span>
            </div>

            {editingCell.holiday && (
              <div className="p-3 rounded-xl text-xs font-semibold mb-3 border flex items-center gap-2" style={{ background: 'var(--brick-tint)', color: 'var(--brick)', borderColor: 'rgba(179,58,58,0.2)' }}>
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Bu saat "{editingCell.holiday.name}" resmi tatili içindedir.</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 rounded-xl text-xs font-bold mb-3 bg-red-100 text-red-800 border border-red-200">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* STEP 1: SELECT TEACHER & CLASS */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--ink)' }}>
                    <User className="w-3.5 h-3.5 text-teal-700" />
                    Sınıf ve Öğretmen Seçimi <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsManualInput(!isManualInput);
                      setSelectedTeacherItem(null);
                    }}
                    className="text-[11px] font-bold text-teal-800 hover:text-teal-950 underline"
                  >
                    {isManualInput ? 'Listeden Seç' : '+ Manuel İsim Gir'}
                  </button>
                </div>

                {isManualInput ? (
                  <div className="relative">
                    <input
                      type="text"
                      required
                      autoFocus
                      value={manualTeacher}
                      onChange={(e) => setManualTeacher(e.target.value)}
                      placeholder="Örn: 1/G - Gül Alibaş SÜTÇÜ"
                      className="w-full px-4 py-3 rounded-xl font-semibold text-sm outline-none border-2 transition-all focus:border-teal-700"
                      style={{ borderColor: 'var(--line)', background: 'var(--paper)' }}
                    />
                    <span className="text-[11px] text-stone-500 mt-1 block">
                      Sınıf ve öğretmen adını birlikte yazabilirsiniz (örn. 1/G - Gül Alibaş SÜTÇÜ)
                    </span>
                  </div>
                ) : (
                  <div className="border rounded-2xl p-3 bg-stone-50/70" style={{ borderColor: 'var(--line)' }}>
                    {/* Search & Filter Chips */}
                    <div className="relative mb-2.5">
                      <Search className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
                      <input
                        type="text"
                        value={teacherSearch}
                        onChange={(e) => setTeacherSearch(e.target.value)}
                        placeholder="Öğretmen veya sınıf ara (örn: Gül, 1/G, 2/A)..."
                        className="w-full pl-9 pr-3 py-2 rounded-xl text-xs font-semibold outline-none border bg-white focus:border-teal-700"
                        style={{ borderColor: 'var(--line)' }}
                      />
                    </div>

                    {/* Grade quick filter buttons */}
                    <div className="flex gap-1 overflow-x-auto pb-1.5 mb-2 scrollbar-none">
                      {[
                        { id: 'TÜMÜ', label: 'Tümü' },
                        { id: '1', label: '1. Sınıf' },
                        { id: '2', label: '2. Sınıf' },
                        { id: '3', label: '3. Sınıf' },
                        { id: '4', label: '4. Sınıf' },
                        { id: 'ANA', label: 'Anasınıfı' },
                        { id: 'BRANŞ', label: 'Branş' },
                      ].map((chip) => (
                        <button
                          key={chip.id}
                          type="button"
                          onClick={() => setSelectedGradeFilter(chip.id)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors ${
                            selectedGradeFilter === chip.id
                              ? 'bg-teal-800 text-white shadow-xs'
                              : 'bg-white text-stone-700 hover:bg-stone-200 border'
                          }`}
                          style={selectedGradeFilter !== chip.id ? { borderColor: 'var(--line)' } : {}}
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>

                    {/* Scrollable list of selectable teachers */}
                    <div className="max-h-44 overflow-y-auto space-y-1 pr-1">
                      {filteredTeachers.length === 0 ? (
                        <div className="text-center py-4 text-xs text-stone-500 font-medium">
                          Aramaya uygun öğretmen bulunamadı.
                        </div>
                      ) : (
                        filteredTeachers.map((item) => {
                          const isSelected = selectedTeacherItem?.id === item.id;
                          return (
                            <div
                              key={item.id}
                              onClick={() => setSelectedTeacherItem(item)}
                              className={`p-2.5 rounded-xl cursor-pointer flex items-center justify-between transition-all border ${
                                isSelected
                                  ? 'bg-teal-50 border-teal-600 shadow-xs ring-1 ring-teal-600'
                                  : 'bg-white hover:bg-stone-50 border-stone-200/70'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[11px] font-bold tracking-tight shrink-0 ${
                                    isSelected
                                      ? 'bg-teal-700 text-white'
                                      : 'bg-stone-100 text-stone-800'
                                  }`}
                                >
                                  {item.className}
                                </span>
                                <div className="truncate">
                                  <span className="font-bold text-xs text-stone-900 block truncate">
                                    {item.teacherName}
                                  </span>
                                  {item.branch && (
                                    <span className="text-[10px] text-stone-500 block truncate">
                                      {item.branch}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="shrink-0 ml-2">
                                {isSelected ? (
                                  <span className="w-6 h-6 rounded-full bg-teal-700 text-white flex items-center justify-center">
                                    <Check className="w-3.5 h-3.5" />
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-stone-600 font-semibold px-2 py-0.5 rounded bg-stone-100 hover:bg-teal-50 hover:text-teal-700">
                                    Seç
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Selected Banner */}
                    {selectedTeacherItem && (
                      <div className="mt-2.5 p-2 rounded-xl bg-teal-100/70 border border-teal-300 text-teal-900 text-xs font-bold flex items-center justify-between">
                        <span className="truncate">
                          Seçilen: {selectedTeacherItem.className} - {selectedTeacherItem.teacherName}
                        </span>
                        <Check className="w-4 h-4 text-teal-700 shrink-0 ml-2" />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* STEP 2: ACTIVITY / PURPOSE */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider block mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--ink)' }}>
                  <BookOpen className="w-3.5 h-3.5 text-teal-700" />
                  Etkinlik / Konu / Kullanım Amacı
                </label>

                {/* Quick chip suggestions */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {quickActivities.map((act, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActivityInput(act)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition-colors border ${
                        activityInput === act
                          ? 'bg-teal-700 text-white border-teal-700'
                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border-stone-200'
                      }`}
                    >
                      {act}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={activityInput}
                    onChange={(e) => setActivityInput(e.target.value)}
                    placeholder={
                      activeLocation.includes('Akıl')
                        ? 'Örn: Akıl ve Zeka Oyunları Dersi / Mangala'
                        : 'Örn: Veli Bilgilendirme Toplantısı / Seminer'
                    }
                    className="w-full px-4 py-3 rounded-xl font-semibold text-sm outline-none border-2 transition-all focus:border-teal-700"
                    style={{ borderColor: 'var(--line)', background: 'var(--paper)' }}
                  />
                </div>
              </div>

              {/* SUBMIT BUTTON (DIRECT RESERVATION CREATION) */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-3.5 text-white font-bold rounded-xl transition-all shadow-md hover:opacity-95 flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer disabled:opacity-50"
                  style={{ background: 'var(--teal-dark)' }}
                >
                  <Sparkles className="w-4 h-4 text-teal-200" />
                  <span>{isSaving ? 'Kaydediliyor…' : 'Rezervasyonu Onayla ve Kaydet'}</span>
                </button>
                <p className="text-[11px] text-center font-medium mt-2 text-stone-500">
                  Rezervasyon bulut sistemine anında işlenecek ve tüm kullanıcılarda canlı görüntülenecektir.
                </p>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
