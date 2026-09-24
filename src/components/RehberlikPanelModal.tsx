import React, { useEffect, useState } from 'react';
import { X, Lock, Inbox, Trash2, LogOut } from 'lucide-react';
import { Yonlendirme } from '../types';
import {
  rehberGiris,
  rehberCikis,
  rehberDurumuIzle,
  yonlendirmeleriIzle,
  yonlendirmeSil,
} from '../rehberlik';

interface RehberlikPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RehberlikPanelModal: React.FC<RehberlikPanelModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [girisYapildi, setGirisYapildi] = useState(false);
  const [eposta, setEposta] = useState('');
  const [sifre, setSifre] = useState('');
  const [hata, setHata] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);
  const [liste, setListe] = useState<Yonlendirme[]>([]);

  useEffect(() => rehberDurumuIzle((k) => setGirisYapildi(Boolean(k))), []);

  useEffect(() => {
    if (!girisYapildi || !isOpen) return;
    return yonlendirmeleriIzle(setListe, (m) => setHata(m));
  }, [girisYapildi, isOpen]);

  if (!isOpen) return null;

  const girisYap = async () => {
    setYukleniyor(true);
    setHata('');
    try {
      await rehberGiris(eposta.trim(), sifre);
      setSifre('');
    } catch {
      setHata('E-posta veya şifre hatalı.');
    } finally {
      setYukleniyor(false);
    }
  };

  const tarihYaz = (ms: number) =>
    new Date(ms).toLocaleString('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const girdiStili =
    'w-full px-3.5 py-2.5 rounded-xl text-sm font-medium border outline-none focus:border-teal-500';
  const girdiStyle = {
    background: 'var(--paper-2)',
    borderColor: 'var(--line)',
    color: 'var(--ink)',
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="no-snapshot fixed inset-0 z-[900] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(32,38,31,0.65)', backdropFilter: 'blur(6px)' }}
    >
      <div
        className="w-full max-w-2xl rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 max-h-[90vh] flex flex-col shadow-2xl border"
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
              <Inbox className="w-5 h-5" style={{ color: 'var(--teal-dark)' }} />
            </div>
            <div>
              <h3
                className="font-display font-bold text-lg sm:text-xl"
                style={{ color: 'var(--ink)' }}
              >
                Rehberlik Yönlendirmeleri
              </h3>
              <p className="text-xs font-semibold" style={{ color: 'var(--ink-soft)' }}>
                {girisYapildi ? `${liste.length} kayıt` : 'Rehber öğretmen girişi gerekli'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {girisYapildi && (
              <button
                onClick={() => rehberCikis()}
                title="Çıkış yap"
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-stone-200"
                style={{ background: 'var(--paper-2)' }}
              >
                <LogOut className="w-4 h-4 text-stone-700" />
              </button>
            )}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-stone-200"
              style={{ background: 'var(--paper-2)' }}
            >
              <X className="w-5 h-5 text-stone-700" />
            </button>
          </div>
        </div>

        {!girisYapildi ? (
          <div className="py-6 max-w-sm mx-auto w-full space-y-3.5">
            <div className="text-center mb-2">
              <div
                className="w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-3"
                style={{ background: 'var(--teal-tint)' }}
              >
                <Lock className="w-5 h-5" style={{ color: 'var(--teal-dark)' }} />
              </div>
              <p className="text-sm font-semibold" style={{ color: 'var(--ink-soft)' }}>
                Bu bölüm yalnızca rehber öğretmene açıktır.
              </p>
            </div>
            <input
              type="email"
              placeholder="E-posta"
              value={eposta}
              onChange={(e) => setEposta(e.target.value)}
              className={girdiStili}
              style={girdiStyle}
            />
            <input
              type="password"
              placeholder="Şifre"
              value={sifre}
              onChange={(e) => setSifre(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && girisYap()}
              className={girdiStili}
              style={girdiStyle}
            />
            {hata && (
              <div className="text-xs font-bold text-rose-600 bg-rose-50 rounded-xl px-3 py-2.5">
                {hata}
              </div>
            )}
            <button
              onClick={girisYap}
              disabled={yukleniyor}
              className="w-full py-3 rounded-xl font-bold text-sm text-white disabled:opacity-60"
              style={{ background: 'var(--teal-dark)' }}
            >
              {yukleniyor ? 'Kontrol ediliyor…' : 'Giriş Yap'}
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {liste.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-2 bg-stone-100 text-stone-400">
                  <Inbox className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold" style={{ color: 'var(--ink-soft)' }}>
                  Henüz yönlendirme yok.
                </p>
              </div>
            ) : (
              liste.map((y) => (
                <div
                  key={y.key}
                  className="rounded-2xl p-4 border"
                  style={{ background: 'var(--paper-2)', borderColor: 'var(--line)' }}
                >
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div>
                      <div
                        className="font-display font-bold text-base"
                        style={{ color: 'var(--ink)' }}
                      >
                        {y.ogrenciAd}
                      </div>
                      <div
                        className="text-xs font-semibold"
                        style={{ color: 'var(--ink-soft)' }}
                      >
                        {y.sinif} · No: {y.numara} · {tarihYaz(y.olusturmaZamani)}
                      </div>
                    </div>
                    <button
                      onClick={() => y.key && yonlendirmeSil(y.key)}
                      title="Kaydı sil"
                      className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-rose-100 shrink-0"
                    >
                      <Trash2 className="w-4 h-4 text-rose-500" />
                    </button>
                  </div>

                  <div className="space-y-2.5 text-sm" style={{ color: 'var(--ink)' }}>
                    <div>
                      <div
                        className="text-[11px] font-bold uppercase tracking-wide mb-0.5"
                        style={{ color: 'var(--ink-soft)' }}
                      >
                        Yönlendirilme Nedeni
                      </div>
                      <p className="whitespace-pre-wrap leading-relaxed">{y.neden}</p>
                    </div>
                    <div>
                      <div
                        className="text-[11px] font-bold uppercase tracking-wide mb-0.5"
                        style={{ color: 'var(--ink-soft)' }}
                      >
                        Yapılan Çalışmalar
                      </div>
                      <p className="whitespace-pre-wrap leading-relaxed">
                        {y.yapilanCalismalar}
                      </p>
                    </div>
                  </div>

                  <div
                    className="mt-3 pt-2.5 border-t text-xs font-semibold"
                    style={{ borderColor: 'var(--line)', color: 'var(--ink-soft)' }}
                  >
                    Yönlendiren: {y.yonlendirenOgretmen}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
