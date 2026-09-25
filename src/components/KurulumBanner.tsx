import React, { useEffect, useState } from 'react';
import { Download, X, Share } from 'lucide-react';

/* ------------------------------------------------------------------
   UYGULAMAYI YÜKLE ÇUBUĞU

   Chrome/Edge/Android: tarayıcı "kurulabilir" dediğinde (beforeinstallprompt)
   kendi kurulum penceresini açan bir düğme gösterir.

   iPhone/iPad (Safari): Apple bu olayı desteklemiyor; oraya elle
   "Paylaş → Ana Ekrana Ekle" yönergesi gösteriyoruz.

   Uygulama zaten kurulduysa ya da kullanıcı kapattıysa hiç görünmez.
------------------------------------------------------------------- */

const KAPATILDI_ANAHTARI = 'rz_kurulum_kapatildi';

interface YuklemeOlayi extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function zatenKurulu(): boolean {
  try {
    if (window.matchMedia('(display-mode: standalone)').matches) return true;
    // iOS Safari'nin kendi bayrağı
    if ((window.navigator as unknown as { standalone?: boolean }).standalone) return true;
  } catch (e) {
    /* yoksay */
  }
  return false;
}

function iosMu(): boolean {
  try {
    const ua = window.navigator.userAgent;
    const iPadYeni = /Macintosh/.test(ua) && 'ontouchend' in document;
    return /iPad|iPhone|iPod/.test(ua) || iPadYeni;
  } catch (e) {
    return false;
  }
}

export const KurulumBanner: React.FC = () => {
  const [olay, setOlay] = useState<YuklemeOlayi | null>(null);
  const [gorunur, setGorunur] = useState(false);
  const [iosYonerge, setIosYonerge] = useState(false);

  useEffect(() => {
    if (zatenKurulu()) return;

    let kapatilmis = false;
    try {
      kapatilmis = localStorage.getItem(KAPATILDI_ANAHTARI) === '1';
    } catch (e) {
      /* yoksay */
    }
    if (kapatilmis) return;

    // iOS'ta beforeinstallprompt hiç gelmez; çubuğu doğrudan gösteriyoruz.
    if (iosMu()) {
      setGorunur(true);
      return;
    }

    const yakala = (e: Event) => {
      e.preventDefault(); // tarayıcının kendi çubuğunu bastır
      setOlay(e as YuklemeOlayi);
      setGorunur(true);
    };

    const kuruldu = () => setGorunur(false);

    window.addEventListener('beforeinstallprompt', yakala);
    window.addEventListener('appinstalled', kuruldu);
    return () => {
      window.removeEventListener('beforeinstallprompt', yakala);
      window.removeEventListener('appinstalled', kuruldu);
    };
  }, []);

  if (!gorunur) return null;

  const kapat = () => {
    setGorunur(false);
    try {
      localStorage.setItem(KAPATILDI_ANAHTARI, '1');
    } catch (e) {
      /* yoksay */
    }
  };

  const kur = async () => {
    if (iosMu()) {
      setIosYonerge((v) => !v);
      return;
    }
    if (!olay) return;
    try {
      await olay.prompt();
      const secim = await olay.userChoice;
      if (secim.outcome === 'accepted') setGorunur(false);
    } catch (e) {
      /* kullanıcı vazgeçti ya da tarayıcı reddetti: sessiz geç */
    }
  };

  return (
    <div
      className="no-snapshot fixed left-0 right-0 bottom-0 z-[800] px-3 pb-3 sm:px-6 sm:pb-5 pointer-events-none"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.75rem)' }}
    >
      <div
        className="pointer-events-auto max-w-lg mx-auto rounded-2xl shadow-2xl border p-3.5 sm:p-4"
        style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: 'var(--teal-tint)' }}
          >
            <Download className="w-5 h-5" style={{ color: 'var(--teal-dark)' }} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="font-display font-bold text-sm" style={{ color: 'var(--ink)' }}>
              Uygulamayı telefona ekle
            </div>
            <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
              Ana ekrandan tek dokunuşla açılır, tarayıcı çubuğu olmadan çalışır.
            </p>

            {iosYonerge && (
              <div
                className="mt-2.5 p-2.5 rounded-xl text-xs leading-relaxed"
                style={{ background: 'var(--paper-2)', color: 'var(--ink)' }}
              >
                Safari'nin alt çubuğundaki{' '}
                <Share className="w-3.5 h-3.5 inline-block align-text-bottom mx-0.5" />{' '}
                <strong>Paylaş</strong> düğmesine dokunun, açılan listeden{' '}
                <strong>Ana Ekrana Ekle</strong> seçeneğini seçin.
              </div>
            )}

            <div className="flex items-center gap-2 mt-2.5">
              <button
                onClick={kur}
                className="px-3.5 py-2 rounded-xl font-bold text-xs text-white"
                style={{ background: 'var(--teal-dark)' }}
              >
                {iosMu() ? (iosYonerge ? 'Gizle' : 'Nasıl eklerim?') : 'Yükle'}
              </button>
              <button
                onClick={kapat}
                className="px-3 py-2 rounded-xl font-semibold text-xs"
                style={{ color: 'var(--ink-soft)' }}
              >
                Şimdi değil
              </button>
            </div>
          </div>

          <button
            onClick={kapat}
            aria-label="Kapat"
            className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-stone-200 shrink-0"
            style={{ background: 'var(--paper-2)' }}
          >
            <X className="w-4 h-4 text-stone-600" />
          </button>
        </div>
      </div>
    </div>
  );
};
