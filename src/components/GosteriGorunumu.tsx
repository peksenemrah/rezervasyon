import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Flag,
  Music,
  Trash2,
  Save,
  AlertTriangle,
  Users,
  Search,
  Lock,
  X,
} from 'lucide-react';
import { Gosteri, TeacherClassItem } from '../types';
import {
  gosterileriIzle,
  gosteriEkle,
  gosteriGuncelle,
  gosteriSil,
  cakismaBul,
} from '../gosteri';

/* ------------------------------------------------------------------
   29 EKİM — CUMHURİYET BAYRAMI GÖSTERİLERİ

   Öğretmen adını seçiyor, yapacağı gösteriyi ve kullanacağı şarkıyı
   yazıyor. Liste herkese açık; böylece aynı gösteri iki kez
   hazırlanmıyor.

   Adını seçen öğretmenin daha önce kaydı varsa form o kayıtla
   dolduruluyor: yanlış yazdığını sonradan düzeltebilsin diye.
------------------------------------------------------------------- */

interface GosteriGorunumuProps {
  onGeri: () => void;
  teachers: TeacherClassItem[];
  /** Silme için sorulacak yönetici şifresi (Ayarlar'dan gelir). */
  adminSifre: string;
  onSonuc: (mesaj: string) => void;
}

export const GosteriGorunumu: React.FC<GosteriGorunumuProps> = ({
  onGeri,
  teachers,
  adminSifre,
  onSonuc,
}) => {
  const [liste, setListe] = useState<Gosteri[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');

  const [ogretmen, setOgretmen] = useState('');
  const [gosteriAdi, setGosteriAdi] = useState('');
  const [sarki, setSarki] = useState('');
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [formHata, setFormHata] = useState('');
  const [arama, setArama] = useState('');

  /* Silme yalnızca yönetici şifresiyle yapılabilir. Şifre kutusu,
     silinecek kayıt seçildiğinde açılır. */
  const [silinecek, setSilinecek] = useState<Gosteri | null>(null);
  const [silmeSifre, setSilmeSifre] = useState('');
  const [silmeHata, setSilmeHata] = useState('');
  const [siliniyor, setSiliniyor] = useState(false);

  useEffect(() => {
    const kapat = gosterileriIzle(
      (l) => {
        setListe(l);
        setYukleniyor(false);
      },
      (m) => {
        setHata(m);
        setYukleniyor(false);
      }
    );
    return () => kapat();
  }, []);

  /* Seçilen öğretmenin kaydı varsa düzenleme moduna geç. */
  const mevcutKayit = useMemo(
    () => liste.find((k) => k.ogretmen === ogretmen),
    [liste, ogretmen]
  );

  useEffect(() => {
    if (mevcutKayit) {
      setGosteriAdi(mevcutKayit.gosteriAdi);
      setSarki(mevcutKayit.sarki || '');
    } else {
      setGosteriAdi('');
      setSarki('');
    }
    setFormHata('');
  }, [mevcutKayit, ogretmen]);

  const cakismalar = useMemo(
    () => cakismaBul(liste, gosteriAdi, sarki, mevcutKayit?.key),
    [liste, gosteriAdi, sarki, mevcutKayit]
  );

  const filtreliListe = useMemo(() => {
    const q = arama.trim().toLocaleLowerCase('tr');
    if (!q) return liste;
    return liste.filter(
      (k) =>
        k.ogretmen.toLocaleLowerCase('tr').includes(q) ||
        k.gosteriAdi.toLocaleLowerCase('tr').includes(q) ||
        (k.sarki || '').toLocaleLowerCase('tr').includes(q)
    );
  }, [liste, arama]);

  const kaydet = async () => {
    if (!ogretmen) return setFormHata('Lütfen listeden adınızı seçin.');
    if (!gosteriAdi.trim()) return setFormHata('Gösteri adı gerekli.');

    setKaydediliyor(true);
    setFormHata('');
    try {
      const veri = {
        ogretmen,
        gosteriAdi: gosteriAdi.trim(),
        sarki: sarki.trim(),
        olusturmaZamani: mevcutKayit?.olusturmaZamani ?? Date.now(),
        ...(mevcutKayit ? { guncellemeZamani: Date.now() } : {}),
      };
      if (mevcutKayit?.key) {
        await gosteriGuncelle(mevcutKayit.key, veri);
        onSonuc('Gösteri kaydınız güncellendi');
      } else {
        await gosteriEkle(veri);
        onSonuc('Gösteriniz listeye eklendi');
      }
      setOgretmen('');
    } catch (e) {
      setFormHata('Kaydedilemedi. Bağlantınızı kontrol edip tekrar deneyin.');
    } finally {
      setKaydediliyor(false);
    }
  };

  const silmeyiKapat = () => {
    setSilinecek(null);
    setSilmeSifre('');
    setSilmeHata('');
  };

  const silmeyiOnayla = async () => {
    if (!silinecek?.key) return;
    /* Şifre uyuşmuyorsa ne doğrusunu ne de biçimini belli eden bir
       ipucu veriyoruz; yalnızca yanlış olduğunu söylüyoruz. */
    if (silmeSifre !== adminSifre) {
      setSilmeHata('Şifre hatalı.');
      return;
    }
    setSiliniyor(true);
    try {
      await gosteriSil(silinecek.key);
      onSonuc('Kayıt silindi');
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
              style={{ background: 'var(--brick-tint)' }}
            >
              <Flag className="w-4 h-4" style={{ color: 'var(--brick)' }} />
            </div>
            <div className="min-w-0">
              <div
                className="font-display font-bold text-base sm:text-lg leading-tight truncate"
                style={{ color: 'var(--ink)' }}
              >
                29 Ekim Gösterileri
              </div>
              <div
                className="text-[11px] font-semibold leading-tight"
                style={{ color: 'var(--ink-soft)' }}
              >
                {liste.length} gösteri kayıtlı
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1100px] mx-auto px-3 sm:px-6 py-5 sm:py-8 space-y-5">
        {/* Kayıt formu */}
        <div
          className="rounded-2xl border p-4 sm:p-5 shadow-xs"
          style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
        >
          <h2
            className="font-display font-bold text-base sm:text-lg mb-1"
            style={{ color: 'var(--ink)' }}
          >
            Gösterinizi kaydedin
          </h2>
          <p className="text-xs font-medium mb-4" style={{ color: 'var(--ink-soft)' }}>
            Adınızı seçip yapacağınız gösteriyi yazın. Daha önce kaydettiyseniz
            adınızı seçtiğinizde bilgileriniz gelir, düzeltip yeniden
            kaydedebilirsiniz.
          </p>

          <div className="space-y-3.5">
            <div>
              <label
                className="block text-xs font-bold mb-1.5"
                style={{ color: 'var(--ink-soft)' }}
              >
                Öğretmen
              </label>
              <select
                value={ogretmen}
                onChange={(e) => setOgretmen(e.target.value)}
                className={girdiStili}
                style={girdiStyle}
              >
                <option value="">Listeden adınızı seçin…</option>
                {teachers.map((t) => {
                  const ad = `${t.teacherName} (${t.className})`;
                  const kayitli = liste.some((k) => k.ogretmen === ad);
                  return (
                    <option key={t.id} value={ad}>
                      {t.className} — {t.teacherName}
                      {kayitli ? ' ✓' : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="grid sm:grid-cols-2 gap-3.5">
              <div>
                <label
                  className="block text-xs font-bold mb-1.5"
                  style={{ color: 'var(--ink-soft)' }}
                >
                  Gösteri Adı
                </label>
                <input
                  type="text"
                  value={gosteriAdi}
                  onChange={(e) => setGosteriAdi(e.target.value)}
                  placeholder="Örn: Halk oyunu — Zeybek"
                  className={girdiStili}
                  style={girdiStyle}
                />
              </div>
              <div>
                <label
                  className="block text-xs font-bold mb-1.5"
                  style={{ color: 'var(--ink-soft)' }}
                >
                  Kullanılacak Şarkı
                </label>
                <input
                  type="text"
                  value={sarki}
                  onChange={(e) => setSarki(e.target.value)}
                  placeholder="Örn: Ankara'nın Bağları"
                  className={girdiStili}
                  style={girdiStyle}
                />
              </div>
            </div>

            {cakismalar.length > 0 && (
              <div
                className="flex items-start gap-2.5 p-3 rounded-xl text-xs font-medium"
                style={{ background: 'var(--ochre-tint)', color: 'var(--ink)' }}
              >
                <AlertTriangle
                  className="w-4 h-4 shrink-0 mt-0.5"
                  style={{ color: 'var(--ochre)' }}
                />
                <div className="space-y-0.5">
                  {cakismalar.map((c, i) => (
                    <div key={i}>
                      Aynı {c.alan} <strong>{c.kim}</strong> tarafından kaydedilmiş:{' '}
                      <strong>{c.ne}</strong>
                    </div>
                  ))}
                  <div style={{ color: 'var(--ink-soft)' }}>
                    Yine de kaydedebilirsiniz; bu yalnızca bir uyarıdır.
                  </div>
                </div>
              </div>
            )}

            {formHata && (
              <div className="text-xs font-bold text-rose-600 bg-rose-50 rounded-xl px-3 py-2.5">
                {formHata}
              </div>
            )}

            <button
              onClick={kaydet}
              disabled={kaydediliyor}
              className="w-full sm:w-auto px-5 py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: 'var(--teal-dark)' }}
            >
              <Save className="w-4 h-4" />
              {kaydediliyor
                ? 'Kaydediliyor…'
                : mevcutKayit
                  ? 'Kaydı Güncelle'
                  : 'Listeye Ekle'}
            </button>
          </div>
        </div>

        {/* Liste */}
        <div
          className="rounded-2xl border shadow-xs overflow-hidden"
          style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
        >
          <div
            className="px-4 sm:px-5 py-3.5 border-b flex items-center gap-3 flex-wrap"
            style={{ borderColor: 'var(--line)' }}
          >
            <div className="flex items-center gap-2 mr-auto">
              <Users className="w-4 h-4" style={{ color: 'var(--ink-soft)' }} />
              <h2
                className="font-display font-bold text-base sm:text-lg"
                style={{ color: 'var(--ink)' }}
              >
                Kayıtlı Gösteriler
              </h2>
            </div>
            <div className="relative">
              <Search
                className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--ink-soft)' }}
              />
              <input
                type="text"
                value={arama}
                onChange={(e) => setArama(e.target.value)}
                placeholder="Ara…"
                className="pl-9 pr-3 py-2 rounded-xl text-sm font-medium border outline-none w-full sm:w-52"
                style={girdiStyle}
              />
            </div>
          </div>

          {yukleniyor ? (
            <p
              className="text-sm font-semibold text-center py-10"
              style={{ color: 'var(--ink-soft)' }}
            >
              Yükleniyor…
            </p>
          ) : hata ? (
            <div className="text-center py-10 px-6">
              <p className="text-sm font-bold" style={{ color: 'var(--ink)' }}>
                Liste açılamadı.
              </p>
              <p
                className="text-xs font-medium mt-1 max-w-md mx-auto"
                style={{ color: 'var(--ink-soft)' }}
              >
                Veritabanı izni eksik olabilir. Yönetici, Realtime Database
                kurallarına "gosteriler" bölümünü eklemelidir.
              </p>
            </div>
          ) : filtreliListe.length === 0 ? (
            <p
              className="text-sm font-semibold text-center py-10"
              style={{ color: 'var(--ink-soft)' }}
            >
              {arama ? 'Aramanıza uyan kayıt yok.' : 'Henüz gösteri kaydedilmemiş.'}
            </p>
          ) : (
            <ul>
              {filtreliListe.map((k, i) => (
                <li
                  key={k.key}
                  className="px-4 sm:px-5 py-3.5 flex items-start gap-3"
                  style={{
                    borderTop: i === 0 ? 'none' : '1px solid var(--line)',
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div
                      className="font-display font-bold text-sm sm:text-base leading-snug"
                      style={{ color: 'var(--ink)' }}
                    >
                      {k.gosteriAdi}
                    </div>
                    <div
                      className="text-xs font-semibold mt-0.5"
                      style={{ color: 'var(--ink-soft)' }}
                    >
                      {k.ogretmen}
                    </div>
                    {k.sarki && (
                      <div
                        className="flex items-center gap-1.5 text-xs font-medium mt-1.5"
                        style={{ color: 'var(--teal-dark)' }}
                      >
                        <Music className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{k.sarki}</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setSilinecek(k);
                      setSilmeSifre('');
                      setSilmeHata('');
                    }}
                    title="Kaydı sil (yönetici şifresi gerekir)"
                    className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-rose-100 shrink-0"
                  >
                    <Trash2 className="w-4 h-4 text-rose-500" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Silme onayı — yönetici şifresi istenir */}
      {silinecek && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) silmeyiKapat();
          }}
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
                    Kaydı sil
                  </h3>
                  <p
                    className="text-xs font-semibold truncate"
                    style={{ color: 'var(--ink-soft)' }}
                  >
                    {silinecek.gosteriAdi}
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
              Gösteri kayıtlarını yalnızca okul idaresi silebilir. Devam etmek
              için yönetici şifresini girin.
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
              className="w-full px-3.5 py-2.5 rounded-xl text-sm font-medium border outline-none focus:border-teal-500"
              style={{
                background: 'var(--paper-2)',
                borderColor: 'var(--line)',
                color: 'var(--ink)',
              }}
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
