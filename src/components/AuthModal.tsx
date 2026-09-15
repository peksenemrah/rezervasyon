import React, { useState } from 'react';
import { Lock, X } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (password: string) => boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLogin,
}) => {
  if (!isOpen) return null;

  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = onLogin(password);
    if (!success) {
      setError('Şifre hatalı. Lütfen tekrar deneyin.');
      setPassword('');
    } else {
      setError('');
      setPassword('');
      onClose();
    }
  };

  return (
    <div
      id="auth-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[800] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(32,38,31,0.6)', backdropFilter: 'blur(6px)' }}
    >
      <div
        className="rounded-t-3xl sm:rounded-3xl w-full max-w-sm p-7 text-center shadow-2xl border relative"
        style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center hover:bg-stone-200 transition-colors"
          style={{ background: 'var(--paper-2)' }}
        >
          <X className="w-4 h-4 text-stone-700" />
        </button>

        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: 'var(--ochre-tint)' }}
        >
          <Lock className="w-7 h-7" style={{ color: 'var(--ochre)' }} />
        </div>

        <h3 className="font-display font-bold text-xl" style={{ color: 'var(--ink)' }}>
          Yönetici Girişi
        </h3>
        <p className="text-xs font-semibold mt-1" style={{ color: 'var(--ink-soft)' }}>
          Rezervasyon ve ayarları yönetmek için şifrenizi girin
        </p>

        {error && (
          <div
            className="mt-3 text-xs font-bold p-2.5 rounded-xl text-center"
            style={{ background: 'var(--brick-tint)', color: 'var(--brick)' }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Yönetici Şifresi"
            className="w-full px-4 py-3.5 rounded-xl outline-none font-mono text-center text-lg font-bold border-2 transition-all focus:border-teal-700"
            style={{ borderColor: 'var(--line)', background: 'var(--paper)' }}
          />

          <button
            type="submit"
            className="w-full py-3.5 text-white font-bold rounded-xl shadow-xs transition-opacity hover:opacity-95"
            style={{ background: 'var(--teal-dark)' }}
          >
            Giriş Yap
          </button>
        </form>
      </div>
    </div>
  );
};
