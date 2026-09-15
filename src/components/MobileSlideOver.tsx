import React from 'react';
import { Settings, Role } from '../types';
import { X, Settings as SettingsIcon, LogIn, LogOut, Camera, Users } from 'lucide-react';
import { SISTEM_ADI } from '../constants';

interface MobileSlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  role: Role;
  onOpenSettings: () => void;
  onOpenTeacherList: () => void;
  onOpenSnapshot: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const MobileSlideOver: React.FC<MobileSlideOverProps> = ({
  isOpen,
  onClose,
  role,
  onOpenSettings,
  onOpenTeacherList,
  onOpenSnapshot,
  onOpenAuth,
  onLogout,
}) => {
  if (!isOpen) return null;

  return (
    <div id="mobile-slideover" className="no-snapshot fixed inset-0 z-[850] md:hidden">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={onClose} />
      <div
        className="absolute top-0 right-0 h-full w-[82%] max-w-xs shadow-2xl flex flex-col safe-t border-l"
        style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
      >
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--line)' }}>
          <span className="font-display font-bold text-lg" style={{ color: 'var(--ink)' }}>
            Menü
          </span>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-stone-200 transition-colors"
            style={{ background: 'var(--paper-2)' }}
          >
            <X className="w-5 h-5 text-stone-700" />
          </button>
        </div>

        <div className="p-5 flex-1 overflow-y-auto space-y-3">
          <div className="px-1 pb-1 text-xs font-semibold" style={{ color: 'var(--ink-soft)' }}>
            {role === 'admin'
              ? 'Yönetici olarak oturum açtınız.'
              : 'Görüntüleme modundasınız. Boş saatlere tıklayarak rezervasyon yapabilirsiniz.'}
          </div>

          <button
            onClick={() => {
              onClose();
              onOpenTeacherList();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold border shadow-xs"
            style={{ borderColor: 'var(--line)', background: 'var(--paper)' }}
          >
            <Users className="w-4 h-4 text-teal-800" />
            <span>Öğretmen Listesi</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenSnapshot();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold border shadow-xs"
            style={{ borderColor: 'var(--line)', background: 'var(--paper)' }}
          >
            <Camera className="w-4 h-4 text-teal-800" />
            <span>Paylaş / Resim Kaydet</span>
          </button>

          {role === 'admin' && (
            <button
              onClick={() => {
                onClose();
                onOpenSettings();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold border shadow-xs"
              style={{ borderColor: 'var(--line)', background: 'var(--paper)' }}
            >
              <SettingsIcon className="w-4 h-4 text-stone-700" />
              <span>Sistem Ayarları</span>
            </button>
          )}

          <button
            onClick={() => {
              onClose();
              if (role === 'admin') onLogout();
              else onOpenAuth();
            }}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold text-white shadow-xs"
            style={{ background: role === 'admin' ? 'var(--brick)' : 'var(--teal-dark)' }}
          >
            {role === 'admin' ? (
              <>
                <LogOut className="w-4 h-4" />
                <span>Oturumu Kapat</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Yönetici Girişi</span>
              </>
            )}
          </button>
        </div>

        <div className="p-5 text-[11px] font-semibold border-t text-stone-500" style={{ borderColor: 'var(--line)' }}>
          {SISTEM_ADI} · 2026–2027
        </div>
      </div>
    </div>
  );
};
