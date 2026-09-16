import React from 'react';
import { IptalTalebi } from '../types';
import { X, Check, Trash2, AlertTriangle, MessageSquare } from 'lucide-react';
import { formatDateStrDisplay, trUpper } from '../constants';

interface IptalTalepleriModalProps {
  isOpen: boolean;
  onClose: () => void;
  talepler: IptalTalebi[];
  onApprove: (t: IptalTalebi) => void;
  onReject: (t: IptalTalebi) => void;
  islemHata: string;
}

/* Yönetimin bekleyen iptal taleplerini gördüğü ekran.
   Onayla  -> rezervasyon silinir, talep "onaylandi" olur.
   Reddet  -> rezervasyon yerinde kalır, talep "reddedildi" olur. */
export const IptalTalepleriModal: React.FC<IptalTalepleriModalProps> = ({
  isOpen,
  onClose,
  talepler,
  onApprove,
  onReject,
  islemHata,
}) => {
  if (!isOpen) return null;

  const bekleyenler = talepler
    .filter((t) => t.durum === 'bekliyor')
    .sort((a, b) => (b.olusturmaZamani || 0) - (a.olusturmaZamani || 0));

  return (
    <div
      id="iptal-talepleri-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="no-snapshot fixed inset-0 z-[900] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(32,38,31,0.65)', backdropFilter: 'blur(6px)' }}
    >
      <div
        className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 max-h-[85vh] sm:max-h-[80vh] flex flex-col shadow-2xl border"
        style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
      >
        <div className="flex items-center justify-between mb-4 pb-3 border-b" style={{ borderColor: 'var(--line)' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: 'var(--brick-tint)' }}
            >
              <Trash2 className="w-5 h-5" style={{ color: 'var(--brick)' }} />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg sm:text-xl" style={{ color: 'var(--ink)' }}>
                İptal Talepleri
              </h3>
              <p className="text-xs font-semibold" style={{ color: 'var(--ink-soft)' }}>
                {bekleyenler.length} bekleyen talep
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-stone-200 transition-colors shrink-0"
            style={{ background: 'var(--paper-2)' }}
          >
            <X className="w-5 h-5 text-stone-700" />
          </button>
        </div>

        {islemHata && (
          <div
            className="text-xs font-bold px-3 py-2.5 rounded-xl mb-3 flex items-center gap-2"
            style={{ background: 'var(--brick-tint)', color: 'var(--brick)' }}
          >
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{islemHata}</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {bekleyenler.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-2 bg-stone-100 text-stone-400">
                <Trash2 className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold" style={{ color: 'var(--ink-soft)' }}>
                Bekleyen iptal talebi bulunmuyor.
              </p>
            </div>
          ) : (
            bekleyenler.map((t) => (
              <div
                key={t.key}
                className="rounded-2xl border p-4 shadow-xs"
                style={{ borderColor: 'var(--line)', background: 'var(--paper)' }}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-md"
                    style={{ background: 'var(--teal-tint)', color: 'var(--teal-dark)' }}
                  >
                    {t.location}
                  </span>
                  <span className="text-xs font-mono font-semibold" style={{ color: 'var(--ink-soft)' }}>
                    {formatDateStrDisplay(t.date)} · {t.lessonLabel} ({t.block})
                  </span>
                </div>

                <div className="text-base font-bold" style={{ color: 'var(--ink)' }}>
                  {trUpper(t.teacher)}
                </div>
                {t.activity && (
                  <div className="text-xs font-medium mt-1 leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
                    {t.activity}
                  </div>
                )}

                <div className="mt-2.5 pt-2.5 border-t space-y-1" style={{ borderColor: 'var(--line)' }}>
                  <div className="text-xs font-bold" style={{ color: 'var(--brick)' }}>
                    İptali isteyen: {trUpper(t.isteyen || 'Belirtilmedi')}
                  </div>
                  {t.sebep && (
                    <div className="text-xs font-medium flex items-start gap-1.5" style={{ color: 'var(--ink-soft)' }}>
                      <MessageSquare className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{t.sebep}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-3 pt-3 border-t" style={{ borderColor: 'var(--line)' }}>
                  <button
                    onClick={() => onApprove(t)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-white text-xs font-bold shadow-xs hover:opacity-95 transition-opacity"
                    style={{ background: 'var(--brick)' }}
                  >
                    <Check className="w-4 h-4" />
                    <span>Onayla ve Sil</span>
                  </button>
                  <button
                    onClick={() => onReject(t)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold border transition-colors hover:bg-stone-100"
                    style={{ background: 'var(--paper-2)', color: 'var(--ink)', borderColor: 'var(--line)' }}
                  >
                    <X className="w-4 h-4" />
                    <span>Reddet</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
