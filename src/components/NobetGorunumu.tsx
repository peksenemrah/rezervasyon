import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ExternalLink, RefreshCw, CalendarClock } from 'lucide-react';

/* ------------------------------------------------------------------
   NÖBET ÇİZELGESİ

   Nöbet çizelgesi ayrı bir uygulama (peksenemrah/nobet-cizelgesi) ve
   kendi Firebase projesinde çalışıyor. Buraya kopyalamak yerine canlı
   adresini çerçeve içinde gösteriyoruz: nöbet deposu güncellendiğinde
   burası da kendiliğinden güncel kalır.

   Bedeli: internet yoksa açılmaz. Bu yüzden yüklenmezse kullanıcıya
   sessiz bir boşluk değil, açıklayıcı bir bilgi ve yeni sekmede açma
   seçeneği gösteriyoruz.
------------------------------------------------------------------- */

const NOBET_ADRESI = 'https://peksenemrah.github.io/nobet-cizelgesi/index.html';

interface NobetGorunumuProps {
  onGeri: () => void;
}

export const NobetGorunumu: React.FC<NobetGorunumuProps> = ({ onGeri }) => {
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState(false);
  const [tazeleme, setTazeleme] = useState(0);
  const sayacRef = useRef<number | null>(null);

  const tazele = () => {
    setYukleniyor(true);
    setHata(false);
    setTazeleme((n) => n + 1);
  };

  /* Çerçeve başka bir siteden geldiği için yüklenemediğinde onError
     güvenilir biçimde tetiklenmiyor: engellenen istek çoğu tarayıcıda
     boş bir sayfa olarak "yüklenmiş" sayılıyor. Bu yüzden kullanıcıyı
     boş beyaz ekranla baş başa bırakmamak için iki koruma var:
     bağlantı yoksa hemen uyar, varsa belirli süre içinde açılmazsa uyar. */
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setYukleniyor(false);
      setHata(true);
      return;
    }

    sayacRef.current = window.setTimeout(() => {
      setYukleniyor((halaYukleniyor) => {
        if (halaYukleniyor) setHata(true);
        return false;
      });
    }, 15000);

    return () => {
      if (sayacRef.current) window.clearTimeout(sayacRef.current);
    };
  }, [tazeleme]);

  const yuklendi = () => {
    if (sayacRef.current) window.clearTimeout(sayacRef.current);
    setYukleniyor(false);
  };

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'var(--paper)' }}>
      {/* Üst çubuk */}
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
              style={{ background: 'var(--teal-tint)' }}
            >
              <CalendarClock className="w-4 h-4" style={{ color: 'var(--teal-dark)' }} />
            </div>
            <div className="min-w-0">
              <div
                className="font-display font-bold text-base sm:text-lg leading-tight truncate"
                style={{ color: 'var(--ink)' }}
              >
                Nöbet Çizelgesi
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
            href={NOBET_ADRESI}
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

      {/* İçerik */}
      <div className="flex-1 relative">
        {yukleniyor && !hata && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-3"
            style={{ background: 'var(--paper)' }}
          >
            <RefreshCw
              className="w-6 h-6 animate-spin"
              style={{ color: 'var(--teal-dark)' }}
            />
            <p className="text-sm font-semibold" style={{ color: 'var(--ink-soft)' }}>
              Nöbet çizelgesi yükleniyor…
            </p>
          </div>
        )}

        {hata ? (
          <div className="flex flex-col items-center justify-center text-center gap-3 py-20 px-6">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-stone-100">
              <CalendarClock className="w-6 h-6 text-stone-400" />
            </div>
            <p className="text-sm font-bold" style={{ color: 'var(--ink)' }}>
              Nöbet çizelgesi açılamadı.
            </p>
            <p
              className="text-xs font-medium max-w-sm leading-relaxed"
              style={{ color: 'var(--ink-soft)' }}
            >
              Nöbet çizelgesi ayrı bir adresten geliyor ve internet bağlantısı
              gerektiriyor. Bağlantınızı kontrol edip yeniden deneyin.
            </p>
            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={tazele}
                className="px-4 py-2 rounded-xl font-bold text-xs text-white"
                style={{ background: 'var(--teal-dark)' }}
              >
                Yeniden dene
              </button>
              <a
                href={NOBET_ADRESI}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl font-bold text-xs border"
                style={{
                  borderColor: 'var(--line)',
                  background: 'var(--panel)',
                  color: 'var(--ink)',
                }}
              >
                Yeni sekmede aç
              </a>
            </div>
          </div>
        ) : (
          <iframe
            key={tazeleme}
            src={NOBET_ADRESI}
            title="Nöbet Çizelgesi"
            className="w-full h-full border-0 block"
            style={{ minHeight: 'calc(100dvh - 60px)' }}
            onLoad={yuklendi}
            onError={() => {
              if (sayacRef.current) window.clearTimeout(sayacRef.current);
              setYukleniyor(false);
              setHata(true);
            }}
          />
        )}
      </div>
    </div>
  );
};
