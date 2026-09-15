import React from 'react';
import { Camera, Share2, Download, X } from 'lucide-react';

interface SnapshotBannerProps {
  isCapturing: boolean;
  activeLocation: string;
  onShareWhatsApp: () => void;
  onDownloadPNG: () => void;
  onClose: () => void;
}

export const SnapshotBanner: React.FC<SnapshotBannerProps> = ({
  isCapturing,
  activeLocation,
  onShareWhatsApp,
  onDownloadPNG,
  onClose,
}) => {
  return (
    <div
      id="snapshot-floating-banner"
      className="fixed top-3 left-3 right-3 z-[999] flex flex-col items-center p-4 sm:p-5 rounded-3xl shadow-2xl border border-stone-700"
      style={{ background: 'var(--ink)' }}
    >
      <div className="flex items-center gap-3 mb-3 text-left w-full max-w-xl">
        <div className="p-2.5 rounded-xl bg-teal-900/60 text-teal-300">
          <Camera className="w-5 h-5" />
        </div>
        <div className="text-white">
          <div className="text-sm font-bold">Görüntü Yakalama & Paylaşım Modu</div>
          <div className="text-xs text-stone-400">{activeLocation} haftalık programı</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2.5 w-full max-w-xl justify-center">
        <button
          onClick={onShareWhatsApp}
          disabled={isCapturing}
          className="flex-1 min-w-[130px] text-white py-3 sm:py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-opacity disabled:opacity-50"
          style={{ background: 'var(--teal-dark)' }}
        >
          <Share2 className="w-4 h-4" />
          <span>{isCapturing ? 'Hazırlanıyor…' : "WhatsApp'ta Paylaş"}</span>
        </button>

        <button
          onClick={onDownloadPNG}
          disabled={isCapturing}
          className="flex-1 min-w-[120px] text-white py-3 sm:py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-opacity disabled:opacity-50"
          style={{ background: '#3B5A73' }}
        >
          <Download className="w-4 h-4" />
          <span>{isCapturing ? 'İndiriliyor…' : 'PNG İndir'}</span>
        </button>

        <button
          onClick={onClose}
          className="py-3 sm:py-3.5 px-5 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-1.5"
          style={{ background: 'var(--brick)' }}
        >
          <X className="w-4 h-4" />
          <span>Kapat</span>
        </button>
      </div>
    </div>
  );
};
