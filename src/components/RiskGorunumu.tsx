import React, { useState } from 'react';
import { ArrowLeft, ExternalLink, RefreshCw, ShieldAlert } from 'lucide-react';

/* ------------------------------------------------------------------
   SINIF / OKUL RİSK HARİTASI

   Araç public/risk.html içinde duruyor ve çerçeveyle gömülüyor —
   Görev Dağılımı'ndaki düzenin aynısı. İki farkı var:

   1. Sayfa giriş ister. Öğrenci bilgisi taşıdığı için uygulamanın
      geri kalanı gibi girişsiz açılmıyor; kendi giriş perdesi var.
   2. Sayfanın kaynağında hiçbir öğrenci adı yok. Sınıf listeleri ve
      şube özetleri yalnızca giriş yapıldıktan sonra Firebase'den
      geliyor, öğretmenin işaretleri ise kendi tarayıcısında kalıyor.

   Bu yüzden burada kart/özet göstermiyoruz: dışarıdan hiçbir veri
   görünmesin, her şey çerçevenin ve girişin arkasında kalsın.
------------------------------------------------------------------- */

const RISK_ADRESI = '/risk.html';

interface RiskGorunumuProps {
  onGeri: () => void;
}

export const RiskGorunumu: React.FC<RiskGorunumuProps> = ({ onGeri }) => {
  const [yukleniyor, setYukleniyor] = useState(true);
  const [tazeleme, setTazeleme] = useState(0);

  const tazele = () => {
    setYukleniyor(true);
    setTazeleme((n) => n + 1);
  };

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'var(--paper)' }}>
      <header
        className="no-snapshot sticky top-0 z-40 safe-t border-b"
        style={{
          background: 'rgba(242,241,231,0.95)',
          backdropFilter: 'blur(12px)',
          borderColor: 'var(--line)',
        }}
      >
        <div className="max-w-[1440px] mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center gap-3">
          <button
            onClick={onGeri}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold border shadow-xs hover:opacity-90 transition-all shrink-0"
            style={{
              borderColor: 'var(--line)',
              background: 'var(--panel)',
              color: 'var(--ink)',
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Ana Menü</span>
          </button>

          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'var(--brick-tint)' }}
            >
              <ShieldAlert className="w-4 h-4" style={{ color: 'var(--brick)' }} />
            </div>
            <div className="min-w-0">
              <div
                className="font-display font-bold text-base sm:text-lg leading-tight truncate"
                style={{ color: 'var(--ink)' }}
              >
                Risk Haritası
              </div>
              <div
                className="text-[11px] font-semibold leading-tight truncate"
                style={{ color: 'var(--ink-soft)' }}
              >
                Giriş gerektirir
              </div>
            </div>
          </div>

          <button
            onClick={tazele}
            title="Yenile"
            className="w-9 h-9 rounded-xl flex items-center justify-center border shadow-xs shrink-0"
            style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}
          >
            <RefreshCw className="w-4 h-4" style={{ color: 'var(--ink-soft)' }} />
          </button>

          <a
            href={RISK_ADRESI}
            target="_blank"
            rel="noopener noreferrer"
            title="Yeni sekmede aç"
            className="w-9 h-9 rounded-xl flex items-center justify-center border shadow-xs shrink-0"
            style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}
          >
            <ExternalLink className="w-4 h-4" style={{ color: 'var(--ink-soft)' }} />
          </a>
        </div>
      </header>

      <div className="flex-1 relative">
        {yukleniyor && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-3"
            style={{ background: 'var(--paper)' }}
          >
            <RefreshCw className="w-6 h-6 animate-spin" style={{ color: 'var(--brick)' }} />
            <p className="text-sm font-semibold" style={{ color: 'var(--ink-soft)' }}>
              Risk haritası yükleniyor…
            </p>
          </div>
        )}

        <iframe
          key={tazeleme}
          src={RISK_ADRESI}
          title="Sınıf ve Okul Risk Haritası"
          className="w-full h-full border-0 block"
          style={{ minHeight: 'calc(100dvh - 60px)' }}
          onLoad={() => setYukleniyor(false)}
        />
      </div>
    </div>
  );
};
