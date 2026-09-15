import React from 'react';
import { Booking } from '../types';
import { AlertTriangle, AlertCircle } from 'lucide-react';
import { formatDateStrDisplay, trUpper } from '../constants';

interface ConflictModalProps {
  conflicts: { nb: Booking; existing: Booking }[] | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConflictModal: React.FC<ConflictModalProps> = ({
  conflicts,
  onConfirm,
  onCancel,
}) => {
  if (!conflicts || conflicts.length === 0) return null;

  return (
    <div
      id="conflict-warning-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
      className="no-snapshot fixed inset-0 z-[900] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(32,38,31,0.65)', backdropFilter: 'blur(6px)' }}
    >
      <div
        className="w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border"
        style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: 'var(--brick-tint)' }}
          >
            <AlertTriangle className="w-6 h-6" style={{ color: 'var(--brick)' }} />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg" style={{ color: 'var(--ink)' }}>
              Ders Saati Çakışması Bulundu
            </h3>
            <p className="text-xs font-semibold" style={{ color: 'var(--ink-soft)' }}>
              {conflicts.length} ders saati zaten dolu
            </p>
          </div>
        </div>

        <div className="max-h-52 overflow-y-auto space-y-2 mb-4 pr-1">
          {conflicts.slice(0, 30).map((c, i) => (
            <div
              key={i}
              className="text-xs font-medium p-2.5 rounded-xl border flex items-start gap-2"
              style={{ background: 'var(--paper)', borderColor: 'var(--line)' }}
            >
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-mono font-bold">{formatDateStrDisplay(c.nb.date)}</span> · {c.nb.lessonLabel}
                <div className="text-stone-600">
                  Dolu:{' '}
                  <span className="font-bold text-stone-900">{trUpper(c.existing.teacher)}</span> (
                  {c.existing.activity})
                </div>
              </div>
            </div>
          ))}
          {conflicts.length > 30 && (
            <div className="text-xs font-semibold text-center text-stone-500 py-1">
              ...ve {conflicts.length - 30} çakışan saat daha var.
            </div>
          )}
        </div>

        <p className="text-xs font-medium mb-4" style={{ color: 'var(--ink-soft)' }}>
          Devam ederseniz, bu saatlerdeki mevcut rezervasyonların üzerine yeni kurs saatleri yazılacaktır.
        </p>

        <div className="flex gap-2">
          <button
            onClick={onConfirm}
            className="flex-1 py-3.5 rounded-xl text-white font-bold text-xs shadow-xs"
            style={{ background: 'var(--brick)' }}
          >
            Üzerine Yaz, Devam Et
          </button>
          <button
            onClick={onCancel}
            className="flex-1 py-3.5 rounded-xl font-bold text-xs border hover:bg-stone-200"
            style={{ borderColor: 'var(--line)', background: 'var(--paper-2)', color: 'var(--ink)' }}
          >
            İptal Et
          </button>
        </div>
      </div>
    </div>
  );
};
