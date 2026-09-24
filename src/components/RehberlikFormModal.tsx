import React, { useState } from 'react';
import { X, HeartHandshake, Send, ShieldCheck } from 'lucide-react';
import { TeacherClassItem, Yonlendirme } from '../types';
import { yonlendirmeGonder } from '../rehberlik';

interface RehberlikFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  teachers: TeacherClassItem[];
  onSonuc: (mesaj: string) => void;
}

const BOS = {
  yonlendirenOgretmen: '',
  ogrenciAd: '',
  sinif: '',
  numara: '',
  neden: '',
  yapilanCalismalar: '',
};

export const RehberlikFormModal: React.FC<RehberlikFormModalProps> = ({
  isOpen,
  onClose,
  teachers,
  onSonuc,
}) => {
  const [form, setForm] = useState({ ...BOS });
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [hata, setHata] = useState('');

  if (!isOpen) return null;

  const alanDegistir = (alan: keyof typeof BOS, deger: string) => {
    setForm((p) => ({ ...p, [alan]: deger }));
    if (hata) setHata('');
  };

  const kapat = () => {
    setForm({ ...BOS });
    setHata('');
    onClose();
  };

  const gonder = async () => {
    if (!form.yonlendirenOgretmen) return setHata('Lütfen listeden kendinizi seçin.');
    if (!form.ogrenciAd.trim()) return setHata('Öğrencinin adı soyadı gerekli.');
    if (!form.sinif.trim()) return setHata('Öğrencinin sınıfı gerekli.');
    if (!form.numara.trim()) return setHata('Öğrencinin numarası gerekli.');
    if (!form.neden.trim()) return setHata('Yönlendirme nedeni gerekli.');
    if (!form.yapilanCalismalar.trim())
      return setHata('Yapılan çalışmalar bölümü gerekli.');

    const veri: Yonlendirme = {
      ogrenciAd: form.ogrenciAd.trim(),
      sinif: form.sinif.trim(),
      numara: form.numara.trim(),
      neden: form.neden.trim(),
      yapilanCalismalar: form.yapilanCalismalar.trim(),
      yonlendirenOgretmen: form.yonlendirenOgretmen,
      olusturmaZamani: Date.now(),
    };

    setGonderiliyor(true);
    try {
      await yonlendirmeGonder(veri);
      setForm({ ...BOS });
      onSonuc('Yönlendirme rehberlik servisine iletildi');
      onClose();
    } catch (e) {
      setHata('Gönderilemedi. İnternet bağlantınızı kontrol edip tekrar deneyin.');
    } finally {
      setGonderiliyor(false);
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
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) kapat();
      }}
      className="no-snapshot fixed inset-0 z-[900] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(32,38,31,0.65)', backdropFilter: 'blur(6px)' }}
    >
      <div
        className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 max-h-[90vh] flex flex-col shadow-2xl border"
        style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
      >
        <div
          className="flex items-center justify-between mb-4 pb-3 border-b"
          style={{ borderColor: 'var(--line)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: 'var(--teal-tint)' }}
            >
              <HeartHandshake className="w-5 h-5" style={{ color: 'var(--teal-dark)' }} />
            </div>
            <div>
              <h3
                className="font-display font-bold text-lg sm:text-xl"
                style={{ color: 'var(--ink)' }}
              >
                Rehberlik Servisine Yönlendirme
              </h3>
              <p className="text-xs font-semibold" style={{ color: 'var(--ink-soft)' }}>
                Form yalnızca rehber öğretmene ulaşır
              </p>
            </div>
          </div>
          <button
            onClick={kapat}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-stone-200 transition-colors shrink-0"
            style={{ background: 'var(--paper-2)' }}
          >
            <X className="w-5 h-5 text-stone-700" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
          <div
            className="flex items-start gap-2.5 p-3 rounded-xl text-xs font-medium"
            style={{ background: 'var(--teal-tint)', color: 'var(--teal-dark)' }}
          >
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Gönderdiğiniz bilgileri sizin dâhil kimse uygulama üzerinden geri
              göremez. Kayıt yalnızca rehber öğretmenin hesabına açıktır.
            </span>
          </div>

          <div>
            <label
              className="block text-xs font-bold mb-1.5"
              style={{ color: 'var(--ink-soft)' }}
            >
              Yönlendiren Öğretmen
            </label>
            <select
              value={form.yonlendirenOgretmen}
              onChange={(e) => alanDegistir('yonlendirenOgretmen', e.target.value)}
              className={girdiStili}
              style={girdiStyle}
            >
              <option value="">Listeden kendinizi seçin…</option>
              {teachers.map((t) => (
                <option key={t.id} value={`${t.teacherName} (${t.className})`}>
                  {t.className} — {t.teacherName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              className="block text-xs font-bold mb-1.5"
              style={{ color: 'var(--ink-soft)' }}
            >
              Öğrencinin Adı Soyadı
            </label>
            <input
              type="text"
              value={form.ogrenciAd}
              onChange={(e) => alanDegistir('ogrenciAd', e.target.value)}
              className={girdiStili}
              style={girdiStyle}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                className="block text-xs font-bold mb-1.5"
                style={{ color: 'var(--ink-soft)' }}
              >
                Sınıfı
              </label>
              <input
                type="text"
                value={form.sinif}
                onChange={(e) => alanDegistir('sinif', e.target.value)}
                placeholder="3/B"
                className={girdiStili}
                style={girdiStyle}
              />
            </div>
            <div>
              <label
                className="block text-xs font-bold mb-1.5"
                style={{ color: 'var(--ink-soft)' }}
              >
                Numarası
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={form.numara}
                onChange={(e) => alanDegistir('numara', e.target.value)}
                placeholder="142"
                className={girdiStili}
                style={girdiStyle}
              />
            </div>
          </div>

          <div>
            <label
              className="block text-xs font-bold mb-1.5"
              style={{ color: 'var(--ink-soft)' }}
            >
              Rehberlik Servisine Yönlendirilme Nedeni
            </label>
            <textarea
              rows={4}
              value={form.neden}
              onChange={(e) => alanDegistir('neden', e.target.value)}
              className={girdiStili + ' resize-none leading-relaxed'}
              style={girdiStyle}
            />
          </div>

          <div>
            <label
              className="block text-xs font-bold mb-1.5"
              style={{ color: 'var(--ink-soft)' }}
            >
              Yönlendirmeye Neden Olan Durumla İlgili Yapılan Çalışmalar
            </label>
            <textarea
              rows={4}
              value={form.yapilanCalismalar}
              onChange={(e) => alanDegistir('yapilanCalismalar', e.target.value)}
              className={girdiStili + ' resize-none leading-relaxed'}
              style={girdiStyle}
            />
          </div>

          {hata && (
            <div className="text-xs font-bold text-rose-600 bg-rose-50 rounded-xl px-3 py-2.5">
              {hata}
            </div>
          )}
        </div>

        <div className="pt-4 mt-1 border-t" style={{ borderColor: 'var(--line)' }}>
          <button
            onClick={gonder}
            disabled={gonderiliyor}
            className="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
            style={{ background: 'var(--teal-dark)' }}
          >
            <Send className="w-4 h-4" />
            {gonderiliyor ? 'Gönderiliyor…' : 'Rehberlik Servisine Gönder'}
          </button>
        </div>
      </div>
    </div>
  );
};
