import React from 'react';
import { Talep } from '../types';
import { X, Bell, Trash2, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import { formatDateStrDisplay, trUpper } from '../constants';

interface TaleplerimModalProps {
  isOpen: boolean;
  onClose: () => void;
  benimTalepKayitlari: Talep[];
  onDeleteTalep: (t: Talep) => void;
}

export const TaleplerimModal: React.FC<TaleplerimModalProps> = ({
  isOpen,
  onClose,
  benimTalepKayitlari,
  onDeleteTalep,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="taleplerim-modal"
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
              style={{ background: 'var(--teal-tint)' }}
            >
              <Bell className="w-5 h-5" style={{ color: 'var(--teal-dark)' }} />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg sm:text-xl" style={{ color: 'var(--ink)' }}>
                Taleplerim
              </h3>
              <p className="text-xs font-semibold" style={{ color: 'var(--ink-soft)' }}>
                Bu cihazdan gönderdiğiniz rezervasyon talepleri
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

        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {benimTalepKayitlari.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-2 bg-stone-100 text-stone-400">
                <Bell className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold" style={{ color: 'var(--ink-soft)' }}>
                Henüz bu cihazdan gönderilmiş bir talep bulunmuyor.
              </p>
              <p className="text-xs mt-1 text-stone-400">
                Takvimdeki boş bir saate tıklayarak rezervasyon talebi gönderebilirsiniz.
              </p>
            </div>
          ) : (
            benimTalepKayitlari.map((t) => {
              const statusConfig =
                t.durum === 'onaylandi'
                  ? {
                      bg: 'var(--green-tint)',
                      color: 'var(--green)',
                      text: 'Onaylandı',
                      icon: <CheckCircle className="w-3.5 h-3.5" />,
                    }
                  : t.durum === 'reddedildi'
                  ? {
                      bg: 'var(--brick-tint)',
                      color: 'var(--brick)',
                      text: 'Reddedildi',
                      icon: <XCircle className="w-3.5 h-3.5" />,
                    }
                  : t.durum === 'iptal_edildi'
                  ? {
                      bg: 'var(--paper-2)',
                      color: 'var(--ink-soft)',
                      text: 'İptal Edildi',
                      icon: <AlertCircle className="w-3.5 h-3.5" />,
                    }
                  : {
                      bg: 'var(--ochre-tint)',
                      color: 'var(--ochre)',
                      text: 'Onay Bekliyor',
                      icon: <Clock className="w-3.5 h-3.5" />,
                    };

              return (
                <div
                  key={t.key}
                  className="rounded-2xl border p-3.5 shadow-xs transition-colors"
                  style={{ borderColor: 'var(--line)', background: 'var(--paper)' }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-bold" style={{ color: 'var(--ink)' }}>
                        {t.location}
                      </div>
                      <div className="text-xs font-mono font-medium mt-0.5" style={{ color: 'var(--ink-soft)' }}>
                        {formatDateStrDisplay(t.date)} · {t.lessonLabel}
                      </div>
                    </div>
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold shrink-0"
                      style={{ background: statusConfig.bg, color: statusConfig.color }}
                    >
                      {statusConfig.icon}
                      <span>{statusConfig.text}</span>
                    </span>
                  </div>

                  {t.activity && (
                    <div className="text-xs font-medium mt-2 text-stone-600 bg-stone-100/70 p-2 rounded-lg">
                      {t.activity}
                    </div>
                  )}

                  <div className="flex justify-end mt-2">
                    <button
                      onClick={() => onDeleteTalep(t)}
                      className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded hover:bg-red-50 transition-colors"
                      style={{ color: 'var(--brick)' }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Listeden kaldır</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
