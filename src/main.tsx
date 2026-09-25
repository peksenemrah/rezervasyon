import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

/* ------------------------------------------------------------------
   SERVICE WORKER KAYDI

   Uygulamanın telefona kurulabilmesi (PWA) için gereken parça.
   public/sw.js dosyası zaten vardı ama hiçbir yerde kaydedilmiyordu;
   bu yüzden tarayıcılar uygulamayı "kurulabilir" saymıyordu.

   Yalnızca canlı yayında kaydediyoruz. Yerel geliştirmede (localhost)
   devre dışı — eski sürüm önbellekte kalıp kafa karıştırmasın.
------------------------------------------------------------------- */
const yerelMi =
  location.hostname === 'localhost' ||
  location.hostname === '127.0.0.1' ||
  location.hostname === '';

if ('serviceWorker' in navigator && !yerelMi) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((e) => {
      /* Kayıt başarısızsa uygulama yine normal çalışır, sadece
         kurulabilir olmaz. Kullanıcıya hata göstermeye gerek yok. */
      console.warn('Service worker kaydedilemedi:', e);
    });
  });
}
