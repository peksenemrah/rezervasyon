import React from 'react';
import { Search, Calendar, Bell, Clock } from 'lucide-react';
import { Role } from '../types';
import { SISTEM_BASLANGIC, SISTEM_BITIS, toDateStrLocal } from '../constants';

interface MobileBottomNavProps {
  showDateJump: boolean;
  setShowDateJump: (b: boolean) => void;
  onGoToday: () => void;
  onJumpDate: (dateStr: string) => void;
  role: Role;
  bekleyenTalepSayisi: number;
  benimBildirimSayisi: number;
  onOpenTalepler: () => void;
  onOpenTaleplerim: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  showDateJump,
  setShowDateJump,
  onGoToday,
  onJumpDate,
  role,
  bekleyenTalepSayisi,
  benimBildirimSayisi,
  onOpenTalepler,
  onOpenTaleplerim,
}) => {
  return (
    <div
      id="mobile-bottom-bar"
      className="no-snapshot md:hidden fixed bottom-0 left-0 right-0 z-30 safe-b px-3 pt-2 pb-2 border-t shadow-lg"
      style={{
        background: 'rgba(242,241,231,0.96)',
        backdropFilter: 'blur(12px)',
        borderColor: 'var(--line)',
      }}
    >
      {showDateJump ? (
        <div className="flex gap-2 max-w-lg mx-auto items-center">
          <input
            type="date"
            autoFocus
            min={toDateStrLocal(SISTEM_BASLANGIC)}
            max={toDateStrLocal(SISTEM_BITIS)}
            onChange={(e) => onJumpDate(e.target.value)}
            className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold border text-center"
            style={{ borderColor: 'var(--line)', color: 'var(--ink)', background: 'var(--panel)' }}
          />
          <button
            onClick={() => setShowDateJump(false)}
            className="px-4 py-2.5 rounded-xl text-xs font-bold border"
            style={{ borderColor: 'var(--line)', color: 'var(--ink)', background: 'var(--panel)' }}
          >
            Vazgeç
          </button>
        </div>
      ) : (
        <div className="flex gap-2 max-w-lg mx-auto items-center">
          <button
            onClick={onGoToday}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 shadow-xs"
            style={{ borderColor: 'var(--line)', color: 'var(--ink)', background: 'var(--panel)' }}
          >
            <Clock className="w-3.5 h-3.5 text-stone-500" />
            <span>Bugüne Git</span>
          </button>

          <button
            onClick={() => setShowDateJump(true)}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 shadow-xs"
            style={{ background: 'var(--teal-dark)' }}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Tarih Seç</span>
          </button>

          {/* Taleplerim / Talepler Button */}
          {role === 'admin' ? (
            <button
              onClick={onOpenTalepler}
              className="relative shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-xs"
              style={{ background: 'var(--brick)' }}
              aria-label="Talepler"
            >
              <Bell className="w-4 h-4 text-white" />
              {bekleyenTalepSayisi > 0 && (
                <span
                  className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center bg-white text-red-700 shadow-xs"
                >
                  {bekleyenTalepSayisi}
                </span>
              )}
            </button>
          ) : (
            <button
              onClick={onOpenTaleplerim}
              className="relative shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-xs"
              style={{ background: 'var(--teal-dark)' }}
              aria-label="Taleplerim"
            >
              <Bell className="w-4 h-4 text-white" />
              {benimBildirimSayisi > 0 && (
                <span
                  className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center bg-red-600 text-white shadow-xs"
                >
                  {benimBildirimSayisi}
                </span>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
