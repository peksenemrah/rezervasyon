import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CalendarHeart,
  Users,
  Save,
  Plus,
  Lock,
  X,
  Archive,
  ChevronDown,
  ChevronUp,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { Etkinlik, TeacherClassItem } from '../types';
import {
  etkinlikleriIzle,
  aktifEtkinlik,
  etkinlikEkle,
  etkinlikSil,
  katilimKaydet,
  katilimSil,
  toplamKatilim,
  girisYapanSubeSayisi,
  subeKaydi,
} from '../etkinlik';

/* ------------------------------------------------------------------
   OKUL ETKİNLİĞİ

   İdare bir etkinlik açar; öğretmenler kendi şubelerinden kaç
   öğrencinin katıldığını yazar. Böylece hem şube bazında hem okul
   geneli katılım görülür.

   Aynı anda tek bir etkinlik açıktır. İdare yeni bir etkinlik
   eklediğinde önceki arşive düşer: arşivdeki etkinlik görülebilir
   ama giriş yapılamaz — geçmişe dönük sayı değiştirilemesin diye.
------------------------------------------------------------------- */

interface EtkinlikGorunumuProps {
  onGeri: () => void;
  teachers: TeacherClassItem[];
  /** İdare işlemleri için sorulacak yönetici şifresi (Ayarlar'dan gelir). */
  adminSifre: string;
  onSonuc: (mesaj: string) => void;
}

/* Öğretmen listesinde şubesi olmayan kayıtlar da var (İngilizce,
   Rehberlik, Okul İdaresi gibi). Katılım şube bazında tutulduğu için
   yalnızca gerçek şubeleri alıyoruz. */
function subeMi(ad: string): boolean {
  return /^\d+\s*\/\s*[A-ZÇĞİÖŞÜ]$/.test(ad) || /^anasınıfı/i.test(ad);
}

function tarihYaz(gun: string): string {
  if (!gun) return '';
  const [y, a, g] = gun.split('-');
  if (!y || !a || !g) return gun;
  return `${g}.${a}.${y}`;
}

export const EtkinlikGorunumu: React.FC<EtkinlikGorunumuProps> = ({
  onGeri,
  teachers,
  adminSifre,
  onSonuc,
}) => {
  const [liste, setListe] = useState<Etkinlik[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');

  /* Katılım girişi */
  const [sinif, setSinif] = useState('');
  const [sayi, setSayi] = useState('');
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [formHata, setFormHata] = useState('');

  /* Yeni etkinlik (idare) */
  const [yeniAcik, setYeniAcik] = useState(false);
  const [yeniAd, setYeniAd] = useState('');
  const [yeniTarih, setYeniTarih] = useState('');
  const [yeniAciklama, setYeniAciklama] = useState('');
  const [yeniSifre, setYeniSifre] = useState('');
  const [yeniHata, setYeniHata] = useState('');
  const [ekleniyor, setEkleniyor] = useState(false);

  /* Etkinlik silme (idare) */
  const [silinecek, setSilinecek] = useState<Etkinlik | null>(null);
  const [silmeSifre, setSilmeSifre] = useState('');
  const [silmeHata, setSilmeHata] = useState('');
  const [siliniyor, setSiliniyor] = useState(false);

  /* Arşivde açık duran etkinlik */
  const [acikArsiv, setAcikArsiv] = useState<string | null>(null);

  useEffect(() => {
    const kapat = etkinlikleriIzle(
      (l) => {
        setListe(l);
        setYukleniyor(false);
        setHata('');
      },
      (m) => {
        setHata(m);
        setYukleniyor(false);
      }
    );

    /* Bağlantı yoksa Firebase ne veri ne hata döndürür; ekran sonsuza
       kadar "Yükleniyor" kalırdı. Bir süre sonra vazgeçip durumu
       söylüyoruz — dinleyici açık kalıyor, bağlantı gelince liste
       kendiliğinden doluyor. */
    const zamanAsimi = window.setTimeout(() => {
      setYukleniyor((hala) => {
        if (hala) {
          setHata(
            'Etkinlik listesi yüklenemedi. İnternet bağlantınızı kontrol edip sayfayı yenileyin.'
          );
        }
        return false;
      });
    }, 12000);

    return () => {
      window.clearTimeout(zamanAsimi);
      kapat();
    };
  }, []);

  const aktif = useMemo(() => aktifEtkinlik(liste), [liste]);
  const arsiv = useMemo(() => liste.filter((e) => e.arsiv), [liste]);

  /* Şube listesi: aynı şube iki kez görünmesin. */
  const subeler = useMemo(() => {
    const görülen = new Set<string>();
    const çıktı: string[] = [];
    for (const t of teachers) {
      const ad = (t.className || '').trim();
      if (!ad || !subeMi(ad) || görülen.has(ad)) continue;
      görülen.add(ad);
      çıktı.push(ad);
    }
    return çıktı;
  }, [teachers]);

  const sinifOgretmeni = useMemo(() => {
    const harita: Record<string, string> = {};
    for (const t of teachers) {
      const ad = (t.className || '').trim();
      if (ad && !harita[ad]) harita[ad] = t.teacherName;
    }
    return harita;
  }, [teachers]);

  /* Seçilen şubenin kaydı varsa form onunla dolar — öğretmen yanlış
     yazdığı sayıyı düzeltebilsin diye. */
  const mevcutKayit = useMemo(
    () => (aktif && sinif ? subeKaydi(aktif, sinif) : undefined),
    [aktif, sinif]
  );

  useEffect(() => {
    setSayi(mevcutKayit ? String(mevcutKayit.sayi) : '');
    setFormHata('');
  }, [mevcutKayit, sinif]);

  const kaydet = async () => {
    if (!aktif) return;
    if (!sinif) return setFormHata('Lütfen şubenizi seçin.');

    const n = Number(sayi);
    if (sayi.trim() === '' || !Number.isFinite(n) || n < 0 || !Number.isInteger(n)) {
      return setFormHata('Katılan öğrenci sayısı 0 veya daha büyük bir tam sayı olmalı.');
    }
    if (n > 500) return setFormHata('Sayı fazla görünüyor, kontrol eder misiniz?');

    setKaydediliyor(true);
    setFormHata('');
    try {
      await katilimKaydet(aktif, sinif, n, sinifOgretmeni[sinif] || '');
      onSonuc(`${sinif} için ${n} öğrenci kaydedildi`);
    } catch (e) {
      setFormHata('Kaydedilemedi. Bağlantınızı kontrol edin.');
    } finally {
      setKaydediliyor(false);
    }
  };

  const kaydiTemizle = async () => {
    if (!aktif || !sinif || !mevcutKayit) return;
    setKaydediliyor(true);
    try {
      await katilimSil(aktif, sinif);
      onSonuc(`${sinif} kaydı silindi`);
    } catch (e) {
      setFormHata('Silinemedi. Bağlantınızı kontrol edin.');
    } finally {
      setKaydediliyor(false);
    }
  };

  const yeniyiKapat = () => {
    setYeniAcik(false);
    setYeniAd('');
    setYeniTarih('');
    setYeniAciklama('');
    setYeniSifre('');
    setYeniHata('');
  };

  const yeniyiOnayla = async () => {
    /* Şifre yanlışsa ne doğrusunu ne de biçimini belli eden bir ipucu
       vermiyoruz; yalnızca yanlış olduğunu söylüyoruz. */
    if (yeniSifre !== adminSifre) return setYeniHata('Şifre hatalı.');
    if (!yeniAd.trim()) return setYeniHata('Etkinlik adı gerekli.');
    if (!yeniTarih) return setYeniHata('Etkinlik tarihi gerekli.');

    setEkleniyor(true);
    setYeniHata('');
    try {
      await etkinlikEkle(
        { ad: yeniAd, tarih: yeniTarih, aciklama: yeniAciklama },
        liste
      );
      onSonuc('Yeni etkinlik açıldı, öncekiler arşive alındı');
      yeniyiKapat();
      setSinif('');
    } catch (e) {
      setYeniHata('Eklenemedi. Bağlantınızı kontrol edin.');
    } finally {
      setEkleniyor(false);
    }
  };

  const silmeyiKapat = () => {
    setSilinecek(null);
    setSilmeSifre('');
    setSilmeHata('');
  };

  const silmeyiOnayla = async () => {
    if (!silinecek?.key) return;
    if (silmeSifre !== adminSifre) return setSilmeHata('Şifre hatalı.');

    setSiliniyor(true);
    try {
      await etkinlikSil(silinecek.key);
      onSonuc('Etkinlik silindi');
      silmeyiKapat();
    } catch (e) {
      setSilmeHata('Silinemedi. Bağlantınızı kontrol edin.');
    } finally {
      setSiliniyor(false);
    }
  };

  const girdiStili =
    'w-full px-3.5 py-2.5 rounded-xl text-sm font-medium border outline-none transition-colors focus:border-teal-500';
  const girdiStyle = {
    background: 'var(--paper-2)',
    borderColor: 'var(--line)',
    color: 'var(--ink)',
  };

  /* Bir etkinliğin şube şube dökümü. Giriş yapmamış şubeler de
     görünür: idare kimin girmediğini görebilsin diye. */
  const Dokum: React.FC<{ etkinlik: Etkinlik }> = ({ etkinlik }) => (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--line)' }}>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: 'var(--paper-2)' }}>
            <th
              className="text-left px-3 py-2 text-[11px] font-bold uppercase tracking-wide"
              style={{ color: 'var(--ink-soft)' }}
            >
              Şube
            </th>
            <th
              className="text-left px-3 py-2 text-[11px] font-bold uppercase tracking-wide hidden sm:table-cell"
              style={{ color: 'var(--ink-soft)' }}
            >
              Öğretmen
            </th>
            <th
              className="text-right px-3 py-2 text-[11px] font-bold uppercase tracking-wide"
              style={{ color: 'var(--ink-soft)' }}
            >
              Katılan
            </th>
          </tr>
        </thead>
        <tbody>
          {subeler.map((s) => {
            const k = subeKaydi(etkinlik, s);
            return (
              <tr key={s} className="border-t" style={{ borderColor: 'var(--line)' }}>
                <td className="px-3 py-2 font-bold" style={{ color: 'var(--ink)' }}>
                  {s}
                </td>
                <td
                  className="px-3 py-2 font-medium hidden sm:table-cell"
                  style={{ color: 'var(--ink-soft)' }}
                >
                  {sinifOgretmeni[s] || '—'}
                </td>
                <td
                  className="px-3 py-2 text-right font-bold tabular-nums"
                  style={{ color: k ? 'var(--teal-dark)' : 'var(--ink-soft)' }}
                >
                  {k ? k.sayi : '—'}
                </td>
              </tr>
            );
          })}
          <tr className="border-t-2" style={{ borderColor: 'var(--line)', background: 'var(--paper-2)' }}>
            <td className="px-3 py-2.5 font-display font-bold" style={{ color: 'var(--ink)' }}>
              Toplam
            </td>
            <td className="hidden sm:table-cell" />
            <td
              className="px-3 py-2.5 text-right font-display font-bold text-base tabular-nums"
              style={{ color: 'var(--teal-dark)' }}
            >
              {toplamKatilim(etkinlik)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="min-h-dvh" style={{ background: 'var(--paper)' }}>
      <header
        className="no-snapshot sticky top-0 z-40 safe-t border-b"
        style={{
          background: 'rgba(242,241,231,0.95)',
          backdropFilter: 'blur(12px)',
          borderColor: 'var(--line)',
        }}
      >
        <div className="max-w-[1100px] mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center gap-3">
          <button
            onClick={onGeri}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold border shadow-xs hover:opacity-90 shrink-0"
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
              <CalendarHeart className="w-4 h-4" style={{ color: 'var(--teal-dark)' }} />
            </div>
            <div className="min-w-0">
              <div
                className="font-display font-bold text-base sm:text-lg leading-tight truncate"
                style={{ color: 'var(--ink)' }}
              >
                Okul Etkinliği
              </div>
              <div
                className="text-[11px] font-semibold leading-tight truncate"
                style={{ color: 'var(--ink-soft)' }}
              >
                {aktif ? aktif.ad : 'Açık etkinlik yok'}
              </div>
            </div>
          </div>

          <button
            onClick={() => setYeniAcik(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-white shadow-xs shrink-0"
            style={{ background: 'var(--teal-dark)' }}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Yeni Etkinlik</span>
          </button>
        </div>
      </header>

      <div className="max-w-[1100px] mx-auto px-3 sm:px-6 py-5 sm:py-8 space-y-5">
        {hata && (
          <div className="text-xs font-bold text-rose-600 bg-rose-50 rounded-xl px-3 py-2.5">
            {hata}
          </div>
        )}

        {yukleniyor && (
          <div
            className="text-sm font-semibold text-center py-10"
            style={{ color: 'var(--ink-soft)' }}
          >
            Yükleniyor…
          </div>
        )}

        {!yukleniyor && !aktif && (
          <div
            className="rounded-2xl border p-6 sm:p-8 text-center shadow-xs"
            style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ background: 'var(--teal-tint)' }}
            >
              <CalendarHeart className="w-7 h-7" style={{ color: 'var(--teal-dark)' }} />
            </div>
            <h2
              className="font-display font-bold text-lg mb-1"
              style={{ color: 'var(--ink)' }}
            >
              Şu an açık bir etkinlik yok
            </h2>
            <p className="text-xs font-medium" style={{ color: 'var(--ink-soft)' }}>
              Okul idaresi bir etkinlik açtığında katılım girişi burada açılır.
            </p>
          </div>
        )}

        {aktif && (
          <>
            {/* Aktif etkinlik başlığı ve özet */}
            <div
              className="rounded-2xl border p-4 sm:p-5 shadow-xs"
              style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div
                    className="text-[11px] font-bold uppercase tracking-wide mb-1"
                    style={{ color: 'var(--teal-dark)' }}
                  >
                    Açık etkinlik
                  </div>
                  <h2
                    className="font-display font-bold text-lg sm:text-xl leading-tight"
                    style={{ color: 'var(--ink)' }}
                  >
                    {aktif.ad}
                  </h2>
                  <div
                    className="text-xs font-semibold mt-1"
                    style={{ color: 'var(--ink-soft)' }}
                  >
                    {tarihYaz(aktif.tarih)}
                  </div>
                  {aktif.aciklama && (
                    <p
                      className="text-xs font-medium mt-2 leading-relaxed"
                      style={{ color: 'var(--ink-soft)' }}
                    >
                      {aktif.aciklama}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => setSilinecek(aktif)}
                  title="Etkinliği sil"
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 hover:opacity-80"
                  style={{ background: 'var(--brick-tint)' }}
                >
                  <Trash2 className="w-4 h-4" style={{ color: 'var(--brick)' }} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <div
                  className="rounded-xl p-3 text-center"
                  style={{ background: 'var(--teal-tint)' }}
                >
                  <div
                    className="font-display font-bold text-2xl tabular-nums"
                    style={{ color: 'var(--teal-dark)' }}
                  >
                    {toplamKatilim(aktif)}
                  </div>
                  <div className="text-[11px] font-bold" style={{ color: 'var(--ink-soft)' }}>
                    Toplam katılan öğrenci
                  </div>
                </div>
                <div
                  className="rounded-xl p-3 text-center"
                  style={{ background: 'var(--ochre-tint)' }}
                >
                  <div
                    className="font-display font-bold text-2xl tabular-nums"
                    style={{ color: 'var(--ink)' }}
                  >
                    {girisYapanSubeSayisi(aktif)} / {subeler.length}
                  </div>
                  <div className="text-[11px] font-bold" style={{ color: 'var(--ink-soft)' }}>
                    Giriş yapan şube
                  </div>
                </div>
              </div>
            </div>

            {/* Katılım girişi */}
            <div
              className="rounded-2xl border p-4 sm:p-5 shadow-xs"
              style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
            >
              <h2
                className="font-display font-bold text-base sm:text-lg mb-1"
                style={{ color: 'var(--ink)' }}
              >
                Katılım girişi
              </h2>
              <p className="text-xs font-medium mb-4" style={{ color: 'var(--ink-soft)' }}>
                Şubenizi seçip etkinliğe katılan öğrenci sayısını yazın. Daha önce
                girdiyseniz sayı gelir, düzeltip yeniden kaydedebilirsiniz.
              </p>

              <div className="space-y-3.5">
                <div className="grid sm:grid-cols-2 gap-3.5">
                  <div>
                    <label
                      className="block text-xs font-bold mb-1.5"
                      style={{ color: 'var(--ink-soft)' }}
                    >
                      Şube
                    </label>
                    <select
                      value={sinif}
                      onChange={(e) => setSinif(e.target.value)}
                      className={girdiStili}
                      style={girdiStyle}
                    >
                      <option value="">Şubenizi seçin…</option>
                      {subeler.map((s) => (
                        <option key={s} value={s}>
                          {s}
                          {sinifOgretmeni[s] ? ` — ${sinifOgretmeni[s]}` : ''}
                          {subeKaydi(aktif, s) ? ' ✓' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      className="block text-xs font-bold mb-1.5"
                      style={{ color: 'var(--ink-soft)' }}
                    >
                      Katılan öğrenci sayısı
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={sayi}
                      onChange={(e) => setSayi(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && kaydet()}
                      placeholder="Örn: 18"
                      className={girdiStili}
                      style={girdiStyle}
                    />
                  </div>
                </div>

                {mevcutKayit && (
                  <div
                    className="flex items-center gap-2 text-xs font-semibold"
                    style={{ color: 'var(--teal-dark)' }}
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    Bu şube için daha önce {mevcutKayit.sayi} öğrenci kaydedilmiş.
                  </div>
                )}

                {formHata && (
                  <div className="text-xs font-bold text-rose-600 bg-rose-50 rounded-xl px-3 py-2.5">
                    {formHata}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={kaydet}
                    disabled={kaydediliyor}
                    className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm text-white disabled:opacity-60"
                    style={{ background: 'var(--teal-dark)' }}
                  >
                    <Save className="w-4 h-4" />
                    {kaydediliyor ? 'Kaydediliyor…' : mevcutKayit ? 'Güncelle' : 'Kaydet'}
                  </button>

                  {mevcutKayit && (
                    <button
                      onClick={kaydiTemizle}
                      disabled={kaydediliyor}
                      className="px-4 py-3 rounded-xl font-bold text-sm border disabled:opacity-60"
                      style={{
                        borderColor: 'var(--line)',
                        background: 'var(--panel)',
                        color: 'var(--ink)',
                      }}
                    >
                      Kaydı sil
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Şube dökümü */}
            <div
              className="rounded-2xl border p-4 sm:p-5 shadow-xs"
              style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-[18px] h-[18px]" style={{ color: 'var(--ink-soft)' }} />
                <h2
                  className="font-display font-bold text-base sm:text-lg"
                  style={{ color: 'var(--ink)' }}
                >
                  Şube Dökümü
                </h2>
              </div>
              <Dokum etkinlik={aktif} />
            </div>
          </>
        )}

        {/* Arşiv */}
        {arsiv.length > 0 && (
          <div
            className="rounded-2xl border p-4 sm:p-5 shadow-xs"
            style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Archive className="w-[18px] h-[18px]" style={{ color: 'var(--ink-soft)' }} />
              <h2
                className="font-display font-bold text-base sm:text-lg"
                style={{ color: 'var(--ink)' }}
              >
                Geçmiş Etkinlikler
              </h2>
            </div>
            <p className="text-xs font-medium mb-4" style={{ color: 'var(--ink-soft)' }}>
              Arşivdeki etkinlikler yalnızca görüntülenir; giriş yapılamaz.
            </p>

            <div className="space-y-2.5">
              {arsiv.map((e) => {
                const acik = acikArsiv === e.key;
                return (
                  <div
                    key={e.key}
                    className="rounded-xl border overflow-hidden"
                    style={{ borderColor: 'var(--line)' }}
                  >
                    <button
                      onClick={() => setAcikArsiv(acik ? null : e.key || null)}
                      className="w-full flex items-center gap-3 px-3.5 py-3 text-left hover:opacity-90"
                      style={{ background: 'var(--paper-2)' }}
                    >
                      <div className="flex-1 min-w-0">
                        <div
                          className="font-display font-bold text-sm leading-snug truncate"
                          style={{ color: 'var(--ink)' }}
                        >
                          {e.ad}
                        </div>
                        <div
                          className="text-[11px] font-semibold"
                          style={{ color: 'var(--ink-soft)' }}
                        >
                          {tarihYaz(e.tarih)} · {toplamKatilim(e)} öğrenci ·{' '}
                          {girisYapanSubeSayisi(e)} şube
                        </div>
                      </div>
                      {acik ? (
                        <ChevronUp className="w-4 h-4 shrink-0" style={{ color: 'var(--ink-soft)' }} />
                      ) : (
                        <ChevronDown className="w-4 h-4 shrink-0" style={{ color: 'var(--ink-soft)' }} />
                      )}
                    </button>

                    {acik && (
                      <div className="p-3 space-y-3">
                        {e.aciklama && (
                          <p
                            className="text-xs font-medium leading-relaxed"
                            style={{ color: 'var(--ink-soft)' }}
                          >
                            {e.aciklama}
                          </p>
                        )}
                        <Dokum etkinlik={e} />
                        <button
                          onClick={() => setSilinecek(e)}
                          className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border"
                          style={{
                            borderColor: 'var(--line)',
                            background: 'var(--panel)',
                            color: 'var(--brick)',
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Etkinliği sil
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Yeni etkinlik — yönetici şifresi ister */}
      {yeniAcik && (
        <div
          className="no-snapshot fixed inset-0 z-[900] flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: 'rgba(32,38,31,0.65)', backdropFilter: 'blur(6px)' }}
        >
          <div
            className="w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl border max-h-[92dvh] overflow-y-auto"
            style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: 'var(--teal-tint)' }}
                >
                  <Lock className="w-5 h-5" style={{ color: 'var(--teal-dark)' }} />
                </div>
                <div className="min-w-0">
                  <h3
                    className="font-display font-bold text-lg leading-tight"
                    style={{ color: 'var(--ink)' }}
                  >
                    Yeni etkinlik aç
                  </h3>
                  <p
                    className="text-xs font-semibold"
                    style={{ color: 'var(--ink-soft)' }}
                  >
                    Yalnızca okul idaresi açabilir
                  </p>
                </div>
              </div>
              <button
                onClick={yeniyiKapat}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-stone-200 shrink-0"
                style={{ background: 'var(--paper-2)' }}
              >
                <X className="w-4 h-4 text-stone-700" />
              </button>
            </div>

            {aktif && (
              <div
                className="text-xs font-medium rounded-xl px-3 py-2.5 mb-3.5"
                style={{ background: 'var(--ochre-tint)', color: 'var(--ink)' }}
              >
                Açık etkinlik <strong>{aktif.ad}</strong> arşive alınacak ve
                giriş yapılamayacak. Kayıtlar silinmez, arşivden görülebilir.
              </div>
            )}

            <div className="space-y-3.5">
              <div>
                <label
                  className="block text-xs font-bold mb-1.5"
                  style={{ color: 'var(--ink-soft)' }}
                >
                  Etkinlik adı
                </label>
                <input
                  type="text"
                  autoFocus
                  value={yeniAd}
                  onChange={(e) => setYeniAd(e.target.value)}
                  placeholder="Örn: 29 Ekim Cumhuriyet Bayramı Töreni"
                  className={girdiStili}
                  style={girdiStyle}
                />
              </div>

              <div>
                <label
                  className="block text-xs font-bold mb-1.5"
                  style={{ color: 'var(--ink-soft)' }}
                >
                  Etkinlik tarihi
                </label>
                <input
                  type="date"
                  value={yeniTarih}
                  onChange={(e) => setYeniTarih(e.target.value)}
                  className={girdiStili}
                  style={girdiStyle}
                />
              </div>

              <div>
                <label
                  className="block text-xs font-bold mb-1.5"
                  style={{ color: 'var(--ink-soft)' }}
                >
                  Açıklama <span className="font-medium">(isteğe bağlı)</span>
                </label>
                <textarea
                  rows={2}
                  value={yeniAciklama}
                  onChange={(e) => setYeniAciklama(e.target.value)}
                  placeholder="Yer, saat ya da öğretmenlere not"
                  className={girdiStili}
                  style={girdiStyle}
                />
              </div>

              <div>
                <label
                  className="block text-xs font-bold mb-1.5"
                  style={{ color: 'var(--ink-soft)' }}
                >
                  Yönetici şifresi
                </label>
                <input
                  type="password"
                  value={yeniSifre}
                  onChange={(e) => {
                    setYeniSifre(e.target.value);
                    if (yeniHata) setYeniHata('');
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && yeniyiOnayla()}
                  placeholder="Yönetici şifresi"
                  className={girdiStili}
                  style={girdiStyle}
                />
              </div>

              {yeniHata && (
                <div className="text-xs font-bold text-rose-600 bg-rose-50 rounded-xl px-3 py-2.5">
                  {yeniHata}
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={yeniyiOnayla}
                  disabled={ekleniyor}
                  className="flex-1 py-3 rounded-xl font-bold text-sm text-white disabled:opacity-60"
                  style={{ background: 'var(--teal-dark)' }}
                >
                  {ekleniyor ? 'Açılıyor…' : 'Etkinliği aç'}
                </button>
                <button
                  onClick={yeniyiKapat}
                  className="px-4 py-3 rounded-xl font-bold text-sm border"
                  style={{
                    borderColor: 'var(--line)',
                    background: 'var(--panel)',
                    color: 'var(--ink)',
                  }}
                >
                  Vazgeç
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Etkinlik silme — yönetici şifresi ister */}
      {silinecek && (
        <div
          className="no-snapshot fixed inset-0 z-[900] flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: 'rgba(32,38,31,0.65)', backdropFilter: 'blur(6px)' }}
        >
          <div
            className="w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl border"
            style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: 'var(--brick-tint)' }}
                >
                  <Lock className="w-5 h-5" style={{ color: 'var(--brick)' }} />
                </div>
                <div className="min-w-0">
                  <h3
                    className="font-display font-bold text-lg leading-tight"
                    style={{ color: 'var(--ink)' }}
                  >
                    Etkinliği sil
                  </h3>
                  <p
                    className="text-xs font-semibold truncate"
                    style={{ color: 'var(--ink-soft)' }}
                  >
                    {silinecek.ad}
                  </p>
                </div>
              </div>
              <button
                onClick={silmeyiKapat}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-stone-200 shrink-0"
                style={{ background: 'var(--paper-2)' }}
              >
                <X className="w-4 h-4 text-stone-700" />
              </button>
            </div>

            <p className="text-xs font-medium mb-3" style={{ color: 'var(--ink-soft)' }}>
              Etkinlik ve içindeki bütün katılım kayıtları silinir, geri
              alınamaz. Devam etmek için yönetici şifresini girin.
            </p>

            <input
              type="password"
              autoFocus
              value={silmeSifre}
              onChange={(e) => {
                setSilmeSifre(e.target.value);
                if (silmeHata) setSilmeHata('');
              }}
              onKeyDown={(e) => e.key === 'Enter' && silmeyiOnayla()}
              placeholder="Yönetici şifresi"
              className={girdiStili}
              style={girdiStyle}
            />

            {silmeHata && (
              <div className="text-xs font-bold text-rose-600 bg-rose-50 rounded-xl px-3 py-2.5 mt-3">
                {silmeHata}
              </div>
            )}

            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={silmeyiOnayla}
                disabled={siliniyor}
                className="flex-1 py-3 rounded-xl font-bold text-sm text-white disabled:opacity-60"
                style={{ background: '#e11d48' }}
              >
                {siliniyor ? 'Siliniyor…' : 'Sil'}
              </button>
              <button
                onClick={silmeyiKapat}
                className="px-4 py-3 rounded-xl font-bold text-sm border"
                style={{
                  borderColor: 'var(--line)',
                  background: 'var(--panel)',
                  color: 'var(--ink)',
                }}
              >
                Vazgeç
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
