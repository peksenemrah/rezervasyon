import React, { useState, useMemo } from 'react';
import { EditingCell, Booking, Role, TeacherClassItem } from '../types';
import { X, Trash2, User, Search, Check, AlertCircle, Clock, Send, Users } from 'lucide-react';
import { formatDateStrDisplay, trUpper, birDortSinifMi } from '../constants';

interface BahceCellModalProps {
  editingCell: EditingCell | null;
  onClose: () => void;
  /** Bu saatte bahçeyi kullanan şubeler */
  slotBookings: Booking[];
  kapasite: number;
  haftalikKota: number;
  role: Role;
  teachers: TeacherClassItem[];
  /** Bir şubenin bu haftaki bahçe kullanım sayısını verir */
  haftalikSayi: (teacher: string) => number;
  bekleyenIptalVarMi: (bookingId: string) => boolean;
  onSaveBooking: (teacher: string, activity: string) => void;
  onDeleteBooking: (bookingId: string) => void;
  /** Akış kapalıyken verilmez; verilmezse iptal bağlantısı hiç görünmez. */
  onIptalTalebiGonder?: (bookingId: string, isteyen: string, sebep: string) => void;
  onOpenAuth?: () => void;
}

/* Bahçe hücresi diğer yerlerden farklı çalıştığı için ayrı bir pencere:
   aynı saatte birden fazla şube olabilir, her şubenin haftalık kotası
   vardır ve listede yalnızca 1-4. sınıf şubeleri görünür. */
export const BahceCellModal: React.FC<BahceCellModalProps> = ({
  editingCell,
  onClose,
  slotBookings,
  kapasite,
  haftalikKota,
  role,
  teachers,
  haftalikSayi,
  bekleyenIptalVarMi,
  onSaveBooking,
  onDeleteBooking,
  onIptalTalebiGonder,
  onOpenAuth,
}) => {
  if (!editingCell) return null;

  const [arama, setArama] = useState('');
  const [secili, setSecili] = useState<TeacherClassItem | null>(null);
  const [etkinlik, setEtkinlik] = useState('');
  const [hata, setHata] = useState('');

  /* İptal talebi formu — hangi kayıt için açıldığını tutuyoruz */
  const [iptalHedefi, setIptalHedefi] = useState<string | null>(null);
  const [iptalIsteyen, setIptalIsteyen] = useState(() => {
    try {
      return localStorage.getItem('rz_iptal_isim') || '';
    } catch (e) {
      return '';
    }
  });
  const [iptalSebep, setIptalSebep] = useState('');
  const [iptalHata, setIptalHata] = useState('');

  const [silOnayi, setSilOnayi] = useState<string | null>(null);

  const dolu = slotBookings.length;
  const bosYer = Math.max(0, kapasite - dolu);
  const formattedDate = formatDateStrDisplay(editingCell.dateStr);

  /* Yalnızca 1-4. sınıf şubeleri. Anasınıfı ve branşlar bu sekmede yok. */
  const uygunSubeler = useMemo(() => {
    const liste = teachers.filter((t) => birDortSinifMi(t.className));
    const q = arama.trim().toLocaleLowerCase('tr-TR');
    if (!q) return liste;
    return liste.filter(
      (t) =>
        t.className.toLocaleLowerCase('tr-TR').includes(q) ||
        (t.teacherName || '').toLocaleLowerCase('tr-TR').includes(q)
    );
  }, [teachers, arama]);

  const etiket = (t: TeacherClassItem) => `${t.className} - ${t.teacherName}`;

  const buSaatteVarMi = (t: TeacherClassItem) =>
    slotBookings.some((b) => b.teacher === etiket(t));

  return (
    <div
      id="bahce-cell-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="no-snapshot fixed inset-0 z-[900] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(32,38,31,0.65)', backdropFilter: 'blur(6px)' }}
    >
      <div
        className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 max-h-[88vh] overflow-y-auto shadow-2xl border"
        style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
      >
        {/* ---------------- BAŞLIK ---------------- */}
        <div className="flex justify-between items-start mb-4 pb-3 border-b" style={{ borderColor: 'var(--line)' }}>
          <div>
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider mb-1"
              style={{ background: 'var(--teal-tint)', color: 'var(--teal-dark)' }}
            >
              <Users className="w-3 h-3" />
              Bahçe · {dolu}/{kapasite} dolu
            </span>
            <h3 className="font-display font-bold text-xl sm:text-2xl" style={{ color: 'var(--ink)' }}>
              Bahçe Kullanımı
            </h3>
            <p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--ink-soft)' }}>
              {formattedDate} · {editingCell.lesson?.label} ({editingCell.lesson?.block})
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

        {/* Saat şeridi */}
        <div
          className="p-4 rounded-2xl flex items-center justify-between font-bold text-white text-sm mb-4"
          style={{ background: 'var(--teal-dark)' }}
        >
          <span>{editingCell.lesson?.label} ({editingCell.lesson?.block} GRUBU)</span>
          <span className="font-mono px-3 py-1 rounded-lg bg-white/20">
            {editingCell.lesson?.start} – {editingCell.lesson?.end}
          </span>
        </div>

        {/* ---------------- MEVCUT KAYITLAR ---------------- */}
        {dolu > 0 && (
          <div className="space-y-2 mb-4">
            <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--ink-soft)' }}>
              Bu saatte bahçede
            </div>
            {slotBookings.map((b) => {
              const iptalBekliyor = bekleyenIptalVarMi(b.id);
              return (
                <div
                  key={b.id}
                  className="p-3.5 rounded-xl border"
                  style={{ background: 'var(--ochre-tint)', borderColor: 'var(--ochre)' }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-base font-bold truncate" style={{ color: 'var(--ink)' }}>
                        {trUpper(b.teacher)}
                      </div>
                      {b.activity && (
                        <div className="text-xs font-medium mt-0.5" style={{ color: 'var(--ink-soft)' }}>
                          {b.activity}
                        </div>
                      )}
                    </div>
                  </div>

                  {iptalBekliyor ? (
                    <div className="mt-2.5 pt-2.5 border-t flex items-start gap-2" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
                      <Clock className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: 'var(--ochre)' }} />
                      <span className="text-[11px] font-bold" style={{ color: 'var(--ink)' }}>
                        İptal talebi gönderildi, yönetimin onayı bekleniyor.
                      </span>
                    </div>
                  ) : role === 'admin' ? (
                    <div className="mt-2.5 pt-2.5 border-t" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
                      {silOnayi === b.id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              onDeleteBooking(b.id);
                              setSilOnayi(null);
                            }}
                            className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs transition-colors"
                          >
                            Evet, sil
                          </button>
                          <button
                            onClick={() => setSilOnayi(null)}
                            className="px-3 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold rounded-lg text-xs transition-colors"
                          >
                            Vazgeç
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setSilOnayi(b.id)}
                          className="text-xs font-bold flex items-center gap-1.5 hover:underline"
                          style={{ color: 'var(--brick)' }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Sil (yönetici)
                        </button>
                      )}
                    </div>
                  ) : iptalHedefi === b.id ? (
                    <div className="mt-2.5 pt-2.5 border-t space-y-2" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
                      <input
                        type="text"
                        value={iptalIsteyen}
                        onChange={(e) => {
                          setIptalIsteyen(e.target.value);
                          setIptalHata('');
                        }}
                        placeholder="Adınız / Sınıfınız"
                        className="w-full px-3 py-2 rounded-lg border text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-500/40"
                        style={{ background: 'var(--panel)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                      />
                      <input
                        type="text"
                        value={iptalSebep}
                        onChange={(e) => setIptalSebep(e.target.value)}
                        placeholder="Gerekçe (isteğe bağlı)"
                        className="w-full px-3 py-2 rounded-lg border text-sm font-medium outline-none focus:ring-2 focus:ring-teal-500/40"
                        style={{ background: 'var(--panel)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                      />
                      {iptalHata && (
                        <div className="text-[11px] font-bold flex items-center gap-1.5" style={{ color: 'var(--brick)' }}>
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>{iptalHata}</span>
                        </div>
                      )}
                      <div className="flex gap-2">
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
                            onIptalTalebiGonder?.(b.id, ad, iptalSebep.trim());
                            setIptalHedefi(null);
                            setIptalSebep('');
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-white text-xs font-bold"
                          style={{ background: 'var(--brick)' }}
                        >
                          <Send className="w-3.5 h-3.5" />
                          Talebi Gönder
                        </button>
                        <button
                          onClick={() => {
                            setIptalHedefi(null);
                            setIptalHata('');
                          }}
                          className="px-3 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold rounded-lg text-xs transition-colors"
                        >
                          Vazgeç
                        </button>
                      </div>
                    </div>
                  ) : onIptalTalebiGonder ? (
                    <div className="mt-2.5 pt-2.5 border-t" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
                      <button
                        onClick={() => setIptalHedefi(b.id)}
                        className="text-xs font-bold flex items-center gap-1.5 hover:underline"
                        style={{ color: 'var(--brick)' }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        İptal talebi gönder
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}

        {/* ---------------- YENİ KAYIT ---------------- */}
        {bosYer === 0 ? (
          <div
            className="p-4 rounded-xl border text-center mb-3"
            style={{ background: 'var(--brick-tint)', borderColor: 'var(--brick)' }}
          >
            <p className="text-sm font-bold" style={{ color: 'var(--brick)' }}>
              Bu saat dolu ({dolu}/{kapasite})
            </p>
            <p className="text-xs font-semibold mt-1" style={{ color: 'var(--ink-soft)' }}>
              Başka bir saat seçebilirsiniz.
            </p>
          </div>
        ) : (
          <div className="space-y-3 mb-3">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--ink-soft)' }}>
                <User className="w-3.5 h-3.5" />
                Şube seçimi
              </div>
              <span className="text-[11px] font-bold" style={{ color: 'var(--teal-dark)' }}>
                {bosYer} yer boş
              </span>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={arama}
                onChange={(e) => setArama(e.target.value)}
                placeholder="Şube ara (örn: 3/D, Feride)"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-500/40"
                style={{ background: 'var(--paper-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
              />
            </div>

            <div
              className="max-h-52 overflow-y-auto rounded-xl border divide-y"
              style={{ borderColor: 'var(--line)', background: 'var(--paper)' }}
            >
              {uygunSubeler.length === 0 ? (
                <div className="p-4 text-center text-xs font-semibold" style={{ color: 'var(--ink-soft)' }}>
                  Eşleşen şube yok.
                </div>
              ) : (
                uygunSubeler.map((t) => {
                  const kullanilan = haftalikSayi(etiket(t));
                  const kotaDoldu = haftalikKota > 0 && kullanilan >= haftalikKota;
                  const zatenVar = buSaatteVarMi(t);
                  const kapali = zatenVar || (kotaDoldu && role !== 'admin');
                  const seciliMi = secili?.id === t.id;

                  return (
                    <button
                      key={t.id}
                      disabled={kapali}
                      onClick={() => {
                        setSecili(t);
                        setHata('');
                      }}
                      className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left transition-colors disabled:opacity-45 disabled:cursor-not-allowed hover:bg-stone-100"
                      style={seciliMi ? { background: 'var(--teal-tint)' } : undefined}
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-bold truncate" style={{ color: 'var(--ink)' }}>
                          {t.className} - {t.teacherName}
                        </div>
                        <div className="text-[11px] font-semibold" style={{ color: kotaDoldu ? 'var(--brick)' : 'var(--ink-soft)' }}>
                          {zatenVar
                            ? 'Bu saate zaten kayıtlı'
                            : haftalikKota > 0
                            ? `Bu hafta ${kullanilan}/${haftalikKota} ders${kotaDoldu ? ' · hak doldu' : ''}`
                            : ''}
                          {kotaDoldu && role === 'admin' ? ' (yönetici aşabilir)' : ''}
                        </div>
                      </div>
                      {seciliMi && <Check className="w-4 h-4 shrink-0" style={{ color: 'var(--teal-dark)' }} />}
                    </button>
                  );
                })
              )}
            </div>

            <input
              type="text"
              value={etkinlik}
              onChange={(e) => setEtkinlik(e.target.value)}
              placeholder="Etkinlik (isteğe bağlı) — örn: Beden eğitimi, doğa gözlemi"
              className="w-full px-3 py-2.5 rounded-lg border text-sm font-medium outline-none focus:ring-2 focus:ring-teal-500/40"
              style={{ background: 'var(--paper-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            />

            {hata && (
              <div className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--brick)' }}>
                <AlertCircle className="w-4 h-4" />
                <span>{hata}</span>
              </div>
            )}

            <button
              onClick={() => {
                if (!secili) {
                  setHata('Önce bir şube seçin.');
                  return;
                }
                onSaveBooking(etiket(secili), etkinlik.trim() || 'Bahçe Kullanımı');
              }}
              className="w-full py-3.5 text-white font-bold rounded-xl transition-opacity hover:opacity-95"
              style={{ background: 'var(--teal-dark)' }}
            >
              Bahçeyi Rezerve Et
            </button>

            {role !== 'admin' && onOpenAuth && (
              <button
                onClick={() => {
                  onClose();
                  onOpenAuth();
                }}
                className="w-full text-center text-[11px] font-bold underline"
                style={{ color: 'var(--teal-dark)' }}
              >
                Yönetici girişi
              </button>
            )}
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
    </div>
  );
};
