import React from 'react';
import { Settings, Role } from '../types';
import { Camera, Settings as SettingsIcon, LogIn, LogOut, Menu, Cloud, CloudOff, RefreshCw, Users } from 'lucide-react';
import { SISTEM_ADI, SISTEM_KISA } from '../constants';

interface HeaderProps {
  settings: Settings;
  role: Role;
  cloudStatus: 'senkron' | 'yerel' | 'baglaniyor' | 'hata';
  activeLocation: string;
  onSelectLocation: (loc: string) => void;
  onOpenSettings: () => void;
  onOpenTeacherList: () => void;
  onOpenSnapshot: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenMobileMenu: () => void;
  onRetrySync?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  role,
  cloudStatus,
  activeLocation,
  onSelectLocation,
  onOpenSettings,
  onOpenTeacherList,
  onOpenSnapshot,
  onOpenAuth,
  onLogout,
  onOpenMobileMenu,
  onRetrySync,
}) => {
  return (
    <header
      id="app-header"
      className="no-snapshot sticky top-0 z-40 safe-t border-b transition-colors"
      style={{
        background: 'rgba(242,241,231,0.95)',
        backdropFilter: 'blur(12px)',
        borderColor: 'var(--line)',
      }}
    >
      <div className="max-w-[1440px] mx-auto px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-3">
        {/* Brand & Title */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            id="brand-logo"
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 font-display font-bold text-xl sm:text-2xl overflow-hidden border shadow-xs"
            style={{
              borderColor: 'var(--line)',
              background: 'var(--panel)',
              color: 'var(--teal-dark)',
            }}
          >
            {settings.logoDataUrl ? (
              <img
                src={settings.logoDataUrl}
                alt="Okul logosu"
                className="w-full h-full object-cover"
              />
            ) : (
              (settings.schoolName || SISTEM_KISA).charAt(0)
            )}
          </div>
          <div className="min-w-0">
            <h1
              id="brand-title"
              className="font-display font-bold text-lg sm:text-2xl leading-tight truncate"
              style={{ color: 'var(--ink)' }}
            >
              {settings.schoolName || SISTEM_ADI}
            </h1>
            <div className="flex items-center gap-2 mt-0.5 min-w-0 flex-wrap">
              <span
                id="role-badge"
                className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider shrink-0"
                style={{
                  background: role === 'admin' ? 'var(--ochre-tint)' : 'var(--teal-tint)',
                  color: role === 'admin' ? '#7A5A1E' : 'var(--teal-dark)',
                }}
              >
                {role === 'admin' ? 'Yönetici' : 'Görüntüleme'}
              </span>
              {settings.schoolSubtitle && (
                <span
                  className="text-xs sm:text-sm font-medium truncate"
                  style={{ color: 'var(--ink-soft)' }}
                >
                  {settings.schoolSubtitle}
                </span>
              )}
              {/* Cloud / Storage Status Pill */}
              <button
                type="button"
                id="cloud-status-pill"
                onClick={onRetrySync}
                className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-semibold px-2.5 py-0.5 rounded-md shrink-0 cursor-pointer transition-transform active:scale-95 border border-emerald-300/40"
                style={{
                  background: 'var(--green-tint)',
                  color: 'var(--green)',
                }}
                title="Canlı Bulut Senkronizasyonu Aktif (Verileriniz anında sunucuyla eşitlenir. Yenilemek için tıklayın.)"
              >
                <Cloud className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span className="font-bold tracking-wide">Senkronize</span>
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Action Buttons */}
        <div className="hidden md:flex items-center gap-2.5 shrink-0">
          <button
            id="btn-teachers-desktop"
            onClick={onOpenTeacherList}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border shadow-xs hover:opacity-90 transition-all"
            style={{
              borderColor: 'var(--line)',
              background: 'var(--panel)',
              color: 'var(--ink)',
            }}
            title="Öğretmen Listesi"
          >
            <Users className="w-4 h-4 text-teal-800" />
            <span>Öğretmen Listesi</span>
          </button>

          {role === 'admin' && (
            <button
              id="btn-settings-desktop"
              onClick={onOpenSettings}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border shadow-xs hover:opacity-90"
              style={{
                borderColor: 'var(--line)',
                background: 'var(--panel)',
                color: 'var(--ink)',
              }}
            >
              <SettingsIcon className="w-4 h-4 text-stone-600" />
              <span>Ayarlar</span>
            </button>
          )}

          <button
            id="btn-snapshot-desktop"
            onClick={onOpenSnapshot}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border shadow-xs hover:opacity-90"
            style={{
              borderColor: 'var(--line)',
              background: 'var(--panel)',
              color: 'var(--ink)',
            }}
          >
            <Camera className="w-4 h-4 text-teal-700" />
            <span>Paylaş / Resim</span>
          </button>

          <button
            id="btn-auth-desktop"
            onClick={role === 'admin' ? onLogout : onOpenAuth}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-xs hover:opacity-95"
            style={{ background: role === 'admin' ? 'var(--brick)' : 'var(--teal-dark)' }}
          >
            {role === 'admin' ? (
              <>
                <LogOut className="w-4 h-4" />
                <span>Çıkış yap</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Yönetici Girişi</span>
              </>
            )}
          </button>
        </div>

        {/* Mobile Quick Action Buttons */}
        <div className="flex md:hidden items-center gap-1.5 shrink-0">
          <button
            id="btn-teachers-mobile"
            onClick={onOpenTeacherList}
            className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-xs"
            style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}
            aria-label="Öğretmen Listesi"
            title="Öğretmen Listesi"
          >
            <Users className="w-5 h-5 text-teal-800" />
          </button>
          <button
            id="btn-snapshot-mobile"
            onClick={onOpenSnapshot}
            className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-xs"
            style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}
            aria-label="Paylaş"
          >
            <Camera className="w-5 h-5 text-teal-800" />
          </button>
          <button
            id="btn-menu-mobile"
            onClick={onOpenMobileMenu}
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-xs"
            style={{ background: 'var(--ink)' }}
            aria-label="Menü"
          >
            <Menu className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Location Tabs */}
      <div className="max-w-[1440px] mx-auto px-3 sm:px-6 pb-2.5 sm:pb-3">
        <div
          id="location-tabs-container"
          className="flex gap-1.5 p-1 rounded-xl overflow-x-auto scrollbar-hide border"
          style={{ background: 'var(--paper-2)', borderColor: 'var(--line)' }}
        >
          {settings.locations.map((loc) => {
            const active = activeLocation === loc;
            return (
              <button
                key={loc}
                id={`tab-location-${loc.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => onSelectLocation(loc)}
                className="flex-none px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg text-sm sm:text-base font-semibold whitespace-nowrap transition-all"
                style={
                  active
                    ? {
                        background: 'var(--panel)',
                        color: 'var(--teal-dark)',
                        boxShadow: '0 2px 5px rgba(32,38,31,0.12)',
                        border: '1px solid var(--line)',
                      }
                    : {
                        color: 'var(--ink-soft)',
                      }
                }
              >
                {loc}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
