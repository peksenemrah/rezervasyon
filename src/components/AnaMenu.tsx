import React from 'react';
import {
  Presentation,
  Brain,
  Trees,
  HeartHandshake,
  CalendarClock,
  ChevronRight,
} from 'lucide-react';
import { Settings } from '../types';

/* ------------------------------------------------------------------
   ANA MENÜ

   Uygulama açıldığında ilk görülen ekran. Kullanıcı ne yapmak
   istediğini seçer; seçtikten sonra ilgili bölüm açılır.

   Kartlar sabit değil: mekanlar Ayarlar'daki listeden gelir, böylece
   yönetici yeni bir mekan eklediğinde menüde kendiliğinden belirir.
------------------------------------------------------------------- */

export type MenuSecimi =
  | { tur: 'mekan'; mekan: string }
  | { tur: 'rehberlik' }
  | { tur: 'nobet' };

interface AnaMenuProps {
  settings: Settings;
  onSec: (secim: MenuSecimi) => void;
}

/* Mekan adına göre simge ve tanıtım yazısı. Ayarlardan eklenen,
   burada tanınmayan bir mekan da çalışır — varsayılana düşer. */
function mekanGorunumu(ad: string) {
  const a = ad.toLocaleLowerCase('tr');
  if (a.includes('bahçe')) {
    return {
      simge: Trees,
      aciklama: 'Şubelerin haftalık sabit bahçe saatleri',
      renk: 'var(--green)',
      zemin: 'var(--green-tint)',
    };
  }
  if (a.includes('akıl') || a.includes('zeka')) {
    return {
      simge: Brain,
      aciklama: 'Akıl ve zeka oyunları sınıfı için ders saati ayırın',
      renk: 'var(--ochre)',
      zemin: 'var(--ochre-tint)',
    };
  }
  return {
    simge: Presentation,
    aciklama: 'Toplantı, sunum ve etkinlikler için salon rezervasyonu',
    renk: 'var(--teal-dark)',
    zemin: 'var(--teal-tint)',
  };
}

export const AnaMenu: React.FC<AnaMenuProps> = ({ settings, onSec }) => {
  const mekanlar = settings.locations || [];

  const kartlar: Array<{
    anahtar: string;
    baslik: string;
    aciklama: string;
    simge: React.ElementType;
    renk: string;
    zemin: string;
    secim: MenuSecimi;
  }> = [
    ...mekanlar.map((m) => {
      const g = mekanGorunumu(m);
      return {
        anahtar: `mekan-${m}`,
        baslik: m,
        aciklama: g.aciklama,
        simge: g.simge,
        renk: g.renk,
        zemin: g.zemin,
        secim: { tur: 'mekan', mekan: m } as MenuSecimi,
      };
    }),
    {
      anahtar: 'rehberlik',
      baslik: 'Rehberlik Yönlendirme',
      aciklama: 'Öğrenciyi rehberlik servisine yönlendirme formu',
      simge: HeartHandshake,
      renk: 'var(--brick)',
      zemin: 'var(--brick-tint)',
      secim: { tur: 'rehberlik' },
    },
    {
      anahtar: 'nobet',
      baslik: 'Nöbet Çizelgesi',
      aciklama: 'Haftalık nöbet listesi ve kendi nöbet günleriniz',
      simge: CalendarClock,
      renk: 'var(--teal)',
      zemin: 'var(--teal-tint)',
      secim: { tur: 'nobet' },
    },
  ];

  return (
    <div className="min-h-dvh safe-t" style={{ background: 'var(--paper)' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-14">
        {/* Okul başlığı */}
        <div className="flex flex-col items-center text-center mb-8 sm:mb-12">
          <div
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl flex items-center justify-center overflow-hidden border shadow-xs mb-4 font-display font-bold text-3xl"
            style={{
              background: 'var(--panel)',
              borderColor: 'var(--line)',
              color: 'var(--teal-dark)',
            }}
          >
            {settings.logoDataUrl ? (
              <img
                src={settings.logoDataUrl}
                alt=""
                className="w-full h-full object-contain"
              />
            ) : (
              (settings.schoolName || 'C').charAt(0)
            )}
          </div>
          <h1
            className="font-display font-bold text-2xl sm:text-3xl leading-tight"
            style={{ color: 'var(--ink)' }}
          >
            {settings.schoolName}
          </h1>
          <p
            className="text-sm font-semibold mt-1.5 max-w-md"
            style={{ color: 'var(--ink-soft)' }}
          >
            Ne yapmak istiyorsunuz?
          </p>
        </div>

        {/* Kartlar */}
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
          {kartlar.map((k) => {
            const Simge = k.simge;
            return (
              <button
                key={k.anahtar}
                onClick={() => onSec(k.secim)}
                className="group text-left rounded-2xl border p-4 sm:p-5 shadow-xs transition-all hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-4"
                style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
              >
                <div
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: k.zemin }}
                >
                  <Simge className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: k.renk }} />
                </div>

                <div className="flex-1 min-w-0">
                  <div
                    className="font-display font-bold text-base sm:text-lg leading-snug"
                    style={{ color: 'var(--ink)' }}
                  >
                    {k.baslik}
                  </div>
                  <p
                    className="text-xs sm:text-[13px] font-medium leading-relaxed mt-0.5"
                    style={{ color: 'var(--ink-soft)' }}
                  >
                    {k.aciklama}
                  </p>
                </div>

                <ChevronRight
                  className="w-5 h-5 shrink-0 opacity-30 group-hover:opacity-60 transition-opacity"
                  style={{ color: 'var(--ink)' }}
                />
              </button>
            );
          })}
        </div>

        <p
          className="text-center text-xs font-semibold mt-8 sm:mt-10"
          style={{ color: 'var(--ink-soft)' }}
        >
          {settings.schoolSubtitle}
        </p>
      </div>
    </div>
  );
};
