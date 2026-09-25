import React, { useState } from 'react';
import { ArrowLeft, ExternalLink, RefreshCw, ClipboardList } from 'lucide-react';

/* ------------------------------------------------------------------
   GÖREV DAĞILIMI — KİŞİSEL GÖRÜNÜM

   Kurul/komisyon ve belirli gün-hafta görevleri ayrı bir araçla
   dağıtılıyor; o araç "kişisel görünüm" sayfasını dışa aktarıyor ve
   veriyi sayfanın içine gömüyor.

   O sayfayı public/gorev.html olarak uygulamanın içinde tutuyoruz.
   Nöbet çizelgesinden farkı: aynı adresten geldiği için çevrimdışı da
   açılır (service worker önbelleğe alıyor) ve çerçeve engellenmesi
   diye bir sorun yaşanmaz.

   Görev dağılımı değiştiğinde yapılacak tek şey: dağıtım aracından
   yeni kişisel görünümü dışa aktarıp public/gorev.html dosyasının
   üzerine yazmak.
------------------------------------------------------------------- */

const GOREV_ADRESI = '/gorev.html';

interface GorevGorunumuProps {
  onGeri: () => void;
}

export const GorevGorunumu: React.FC<GorevGorunumuProps> = ({ onGeri }) => {
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
              style={{ background: 'var(--ochre-tint)' }}
            >
              <ClipboardList className="w-4 h-4" style={{ color: 'var(--ochre)' }} />
            </div>
            <div
              className="font-display font-bold text-base sm:text-lg leading-tight truncate"
              style={{ color: 'var(--ink)' }}
            >
              Görevlerim
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
            href={GOREV_ADRESI}
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
            <RefreshCw className="w-6 h-6 animate-spin" style={{ color: 'var(--ochre)' }} />
            <p className="text-sm font-semibold" style={{ color: 'var(--ink-soft)' }}>
              Görev listesi yükleniyor…
            </p>
          </div>
        )}

        <iframe
          key={tazeleme}
          src={GOREV_ADRESI}
          title="Görev Dağılımı — Kişisel Görünüm"
          className="w-full h-full border-0 block"
          style={{ minHeight: 'calc(100dvh - 60px)' }}
          onLoad={() => setYukleniyor(false)}
        />
      </div>
    </div>
  );
};
