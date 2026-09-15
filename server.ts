import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Persistence file location
const DATA_DIR = process.env.VERCEL
  ? path.join('/tmp', 'data')
  : path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const REPO_DB_FILE = path.join(process.cwd(), 'data', 'db.json');

// Initial setup data
const INITIAL_DATA = {
  lastUpdated: Date.now(),
  settings: {
    locations: ["Toplantı Salonu", "Akıl Zeka Oyunları Sınıfı"],
    adminPassword: "cg2026",
    schoolName: "Cevdet Güçlüer İlkokulu",
    schoolSubtitle: "Toplantı Salonu & Akıl Zeka Oyunları Sınıfı Rezervasyon Sistemi",
    logoDataUrl: "",
    holidays: [
      { date: "2026-10-28", name: "Cumhuriyet Bayramı Arifesi", block: "ÖĞLE" },
      { date: "2026-10-29", name: "Cumhuriyet Bayramı", block: "TAM" },
      { date: "2027-01-01", name: "Yılbaşı Tatili", block: "TAM" },
      { date: "2027-03-08", name: "Ramazan Bayramı Arifesi", block: "ÖĞLE" },
      { date: "2027-03-09", name: "Ramazan Bayramı 1. Gün", block: "TAM" },
      { date: "2027-03-10", name: "Ramazan Bayramı 2. Gün", block: "TAM" },
      { date: "2027-03-11", name: "Ramazan Bayramı 3. Gün", block: "TAM" },
      { date: "2027-04-23", name: "23 Nisan Ulusal Egemenlik ve Çocuk Bayramı", block: "TAM" },
      { date: "2027-05-17", name: "Kurban Bayramı 2. Gün", block: "TAM" },
      { date: "2027-05-18", name: "Kurban Bayramı 3. Gün", block: "TAM" },
      { date: "2027-05-19", name: "19 Mayıs Atatürk'ü Anma, Gençlik ve Spor Bayramı", block: "TAM" },
    ],
    lessonTimes: {
      morning: [
        { label: "1. Ders", start: "07:50", end: "08:30", block: "SABAH" },
        { label: "2. Ders", start: "08:40", end: "09:20", block: "SABAH" },
        { label: "3. Ders", start: "09:30", end: "10:10", block: "SABAH" },
        { label: "4. Ders", start: "10:20", end: "11:00", block: "SABAH" },
        { label: "5. Ders", start: "11:10", end: "11:50", block: "SABAH" },
        { label: "6. Ders", start: "12:00", end: "12:40", block: "SABAH" },
      ],
      afternoon: [
        { label: "1. Ders", start: "13:00", end: "13:40", block: "ÖĞLE" },
        { label: "2. Ders", start: "13:50", end: "14:30", block: "ÖĞLE" },
        { label: "3. Ders", start: "14:40", end: "15:20", block: "ÖĞLE" },
        { label: "4. Ders", start: "15:30", end: "16:10", block: "ÖĞLE" },
        { label: "5. Ders", start: "16:20", end: "17:00", block: "ÖĞLE" },
        { label: "6. Ders", start: "17:10", end: "17:50", block: "ÖĞLE" },
      ]
    }
  },
  teachers: [
    // 1. Sınıflar (1/A'dan 1/G'ye tam sıralı)
    { id: '1a', className: '1/A', teacherName: 'İlkay Aydemir', branch: '1/A Sınıfı Öğretmeni', group: 'SABAH' },
    { id: '1b', className: '1/B', teacherName: 'Eylül Demir Al', branch: '1/B Sınıfı Öğretmeni', group: 'SABAH' },
    { id: '1c', className: '1/C', teacherName: 'Işıl Keleş Sabancı', branch: '1/C Sınıfı Öğretmeni', group: 'SABAH' },
    { id: '1d', className: '1/D', teacherName: 'Müşerref Bozdağ', branch: '1/D Sınıfı Öğretmeni', group: 'SABAH' },
    { id: '1e', className: '1/E', teacherName: 'Emel Sert', branch: '1/E Sınıfı Öğretmeni', group: 'SABAH' },
    { id: '1f', className: '1/F', teacherName: 'Ezo Kunt', branch: '1/F Sınıfı Öğretmeni', group: 'SABAH' },
    { id: '1g', className: '1/G', teacherName: 'Gül Alibaş SÜTÇÜ', branch: '1/G Sınıfı Öğretmeni', group: 'SABAH' },

    // 2. Sınıflar
    { id: '2a', className: '2/A', teacherName: 'Özlem Eravcı', branch: '2/A Sınıfı Öğretmeni', group: 'SABAH' },
    { id: '2b', className: '2/B', teacherName: 'Aysel Ötenen', branch: '2/B Sınıfı Öğretmeni', group: 'SABAH' },
    { id: '2c', className: '2/C', teacherName: 'Neşe Dilber', branch: '2/C Sınıfı Öğretmeni', group: 'SABAH' },
    { id: '2d', className: '2/D', teacherName: 'Salih Sevgi', branch: '2/D Sınıfı Öğretmeni', group: 'SABAH' },
    { id: '2e', className: '2/E', teacherName: 'Tuna Doğru', branch: '2/E Sınıfı Öğretmeni', group: 'SABAH' },
    { id: '2f', className: '2/F', teacherName: 'Güldemet Çalışkan', branch: '2/F Sınıfı Öğretmeni', group: 'SABAH' },
    { id: '2g', className: '2/G', teacherName: 'İlknur Akın', branch: '2/G Sınıfı Öğretmeni', group: 'SABAH' },

    // 3. Sınıflar
    { id: '3a', className: '3/A', teacherName: 'Aylin Türkkolu', branch: '3/A Sınıfı Öğretmeni', group: 'ÖĞLE' },
    { id: '3b', className: '3/B', teacherName: 'Derya Aktaş Savaşır', branch: '3/B Sınıfı Öğretmeni', group: 'ÖĞLE' },
    { id: '3c', className: '3/C', teacherName: 'Sevgi Öztürk', branch: '3/C Sınıfı Öğretmeni', group: 'ÖĞLE' },
    { id: '3d', className: '3/D', teacherName: 'Feride Nur Aktan', branch: '3/D Sınıfı Öğretmeni', group: 'ÖĞLE' },
    { id: '3e', className: '3/E', teacherName: 'Ebrar Rukiye Doğan', branch: '3/E Sınıfı Öğretmeni', group: 'ÖĞLE' },
    { id: '3f', className: '3/F', teacherName: 'Ekin Ölmez', branch: '3/F Sınıfı Öğretmeni', group: 'ÖĞLE' },
    { id: '3g', className: '3/G', teacherName: 'Ümit Bal', branch: '3/G Sınıfı Öğretmeni', group: 'ÖĞLE' },

    // 4. Sınıflar
    { id: '4a', className: '4/A', teacherName: 'Arzu Akgüner', branch: '4/A Sınıfı Öğretmeni', group: 'ÖĞLE' },
    { id: '4b', className: '4/B', teacherName: 'Sevgi Ayyıldız', branch: '4/B Sınıfı Öğretmeni', group: 'ÖĞLE' },
    { id: '4c', className: '4/C', teacherName: 'Ahmet Ayyıldız', branch: '4/C Sınıfı Öğretmeni', group: 'ÖĞLE' },
    { id: '4d', className: '4/D', teacherName: 'Nihal Ermez', branch: '4/D Sınıfı Öğretmeni', group: 'ÖĞLE' },
    { id: '4e', className: '4/E', teacherName: 'Atay Akpınar', branch: '4/E Sınıfı Öğretmeni', group: 'ÖĞLE' },
    { id: '4f', className: '4/F', teacherName: 'Eda Arpacı', branch: '4/F Sınıfı Öğretmeni', group: 'ÖĞLE' },
    { id: '4g', className: '4/G', teacherName: 'Aylin Karaahmet', branch: '4/G Sınıfı Öğretmeni', group: 'ÖĞLE' },
    { id: '4h', className: '4/H', teacherName: 'Kıymet Erol Tecim', branch: '4/H Sınıfı Öğretmeni', group: 'ÖĞLE' },

    // Anasınıfı
    { id: 'ana-a', className: 'Anasınıfı-A', teacherName: 'Sevilay İleri', branch: 'Anasınıfı A Şubesi', group: 'SABAH' },
    { id: 'ana-b', className: 'Anasınıfı-B', teacherName: 'Sevcan Timuçin Kartal', branch: 'Anasınıfı B Şubesi', group: 'SABAH' },
    { id: 'ana-c', className: 'Anasınıfı-C', teacherName: 'Selis Tekatlı', branch: 'Anasınıfı C Şubesi', group: 'SABAH' },
    { id: 'ana-d', className: 'Anasınıfı-D', teacherName: 'Sevcan Çınar', branch: 'Anasınıfı D Şubesi', group: 'ÖĞLE' },
    { id: 'ana-e', className: 'Anasınıfı-E', teacherName: 'Arzu Şahin Gür', branch: 'Anasınıfı E Şubesi', group: 'ÖĞLE' },
    { id: 'ana-f', className: 'Anasınıfı-F', teacherName: 'Nurcan Öztayşi', branch: 'Anasınıfı F Şubesi', group: 'ÖĞLE' },
    { id: 'ana-g', className: 'Anasınıfı-G', teacherName: 'Demet Güleç', branch: 'Anasınıfı G Şubesi', group: 'ÖĞLE' },

    // Branş, Özel Eğitim ve Rehberlik
    { id: 'ing-1', className: 'İngilizce', teacherName: 'Saadet Ata Sucu', branch: 'İngilizce Öğretmeni', group: 'TÜM' },
    { id: 'ing-2', className: 'İngilizce', teacherName: 'Yasin Erbulundu', branch: 'İngilizce Öğretmeni', group: 'TÜM' },
    { id: 'din-1', className: 'Din Kültürü', teacherName: 'İbrahim Güçlü', branch: 'Din Kültürü ve Ahlak Bilgisi Öğretmeni', group: 'TÜM' },
    { id: 'ozel-1', className: 'Özel Eğitim', teacherName: 'Ayşe Elmacı', branch: 'Özel Eğitim Sınıf Öğretmeni', group: 'TÜM' },
    { id: 'ozel-2', className: 'Özel Eğitim', teacherName: 'Ezgi Gülhan', branch: 'Özel Eğitim Sınıf Öğretmeni', group: 'TÜM' },
    { id: 'ozel-3', className: 'Özel Eğitim', teacherName: 'Funda Aydöner', branch: 'Özel Eğitim Sınıf Öğretmeni', group: 'TÜM' },
    { id: 'ozel-4', className: 'Özel Eğitim', teacherName: 'Müjgan Korkut', branch: 'Özel Eğitim Sınıf Öğretmeni', group: 'TÜM' },
    { id: 'reh-1', className: 'Rehberlik', teacherName: 'Seher Duygu Gürsoy', branch: 'Rehber Öğretmen', group: 'TÜM' },
    { id: 'idare', className: 'Okul İdaresi', teacherName: 'Yönetim / Nöbetçi Md. Yrd.', branch: 'Okul Yönetimi', group: 'TÜM' }
  ],
  bookings: [],
  talepler: {}
};

function sortTeachersServer(teachers: any[]): any[] {
  return [...teachers].sort((a, b) => {
    const getWeight = (item: any) => {
      const cls = (item.className || '').trim();
      const clsLower = cls.toLocaleLowerCase('tr');
      const match = cls.match(/^(\d+)\/([A-Za-zĞÜŞİÖÇğüşıöç]+)/i);
      if (match) {
        const grade = parseInt(match[1], 10);
        const letter = match[2].toLocaleUpperCase('tr');
        return grade * 1000 + letter.charCodeAt(0);
      }
      if (clsLower.includes('ana')) {
        const matchAna = cls.match(/[-/\s]([A-Za-zĞÜŞİÖÇğüşıöç])$/i) || cls.match(/([A-Za-zĞÜŞİÖÇğüşıöç])$/i);
        const letter = matchAna ? matchAna[1].toLocaleUpperCase('tr') : 'Z';
        return 10000 + letter.charCodeAt(0);
      }
      if (clsLower.includes('ingilizce')) return 20000;
      if (clsLower.includes('din')) return 21000;
      if (clsLower.includes('özel')) return 22000;
      if (clsLower.includes('rehber')) return 23000;
      if (clsLower.includes('idare') || clsLower.includes('yönetim')) return 24000;
      return 30000;
    };

    const weightA = getWeight(a);
    const weightB = getWeight(b);
    if (weightA !== weightB) {
      return weightA - weightB;
    }
    return (a.teacherName || '').localeCompare(b.teacherName || '', 'tr');
  });
}

// Ensure data folder and file exist
function loadDatabase() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const targetFile = fs.existsSync(DB_FILE) ? DB_FILE : (fs.existsSync(REPO_DB_FILE) ? REPO_DB_FILE : DB_FILE);
    if (fs.existsSync(targetFile)) {
      const content = fs.readFileSync(targetFile, 'utf-8');
      const parsed = JSON.parse(content);
      const settings = { ...INITIAL_DATA.settings, ...(parsed.settings || {}) };
      if (!settings.adminPassword || settings.adminPassword === '123456') {
        settings.adminPassword = 'cg2026';
      }
      const rawTeachers = parsed.teachers && parsed.teachers.length ? parsed.teachers : INITIAL_DATA.teachers;
      // Ensure required keys exist
      return {
        ...INITIAL_DATA,
        ...parsed,
        settings,
        teachers: sortTeachersServer(rawTeachers),
        bookings: parsed.bookings || INITIAL_DATA.bookings,
        talepler: parsed.talepler || {}
      };
    }
  } catch (err) {
    console.error('Error reading database file, using defaults:', err);
  }
  // Initialize file
  saveDatabase(INITIAL_DATA);
  return INITIAL_DATA;
}

let db = loadDatabase();

function saveDatabase(dataToSave = db) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    dataToSave.lastUpdated = Date.now();
    fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving database file:', err);
  }
}

// ---------------- API ROUTES ----------------

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', school: db.settings.schoolName, lastUpdated: db.lastUpdated });
});

// Full state (for all users - cloud synchronization)
app.get('/api/state', (req, res) => {
  res.json({
    bookings: db.bookings,
    talepler: db.talepler,
    settings: db.settings,
    teachers: db.teachers,
    lastUpdated: db.lastUpdated
  });
});

// Polling endpoint for fast check
app.get('/api/poll', (req, res) => {
  res.json({
    lastUpdated: db.lastUpdated,
    bookingCount: db.bookings.length
  });
});

// Create booking (Allowed for all users: "giren kişi rezervasyon oluşturabilmeli")
app.post('/api/bookings', (req, res) => {
  try {
    const { id, location, date, lessonLabel, block, teacher, activity } = req.body;

    if (!location || !date || !lessonLabel || !block || !teacher) {
      return res.status(400).json({ error: 'Eksik rezervasyon bilgisi (Konum, tarih, saat veya öğretmen girilmedi).' });
    }

    const bookingId = id || `${location.toLowerCase().replace(/[^a-z0-9]/g, '-')}_${date}_${block.toLowerCase()}_${lessonLabel.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

    // Conflict check
    const existingIndex = db.bookings.findIndex(
      b => b.location === location && b.date === date && b.block === block && b.lessonLabel === lessonLabel
    );

    if (existingIndex >= 0) {
      return res.status(409).json({
        error: `Bu saat ve salon zaten rezerve edilmiş: ${db.bookings[existingIndex].teacher} (${db.bookings[existingIndex].activity})`
      });
    }

    const newBooking = {
      id: bookingId,
      location,
      date,
      lessonLabel,
      block,
      teacher,
      activity: activity || 'Belirtilmedi',
      timestamp: Date.now()
    };

    db.bookings.push(newBooking);
    saveDatabase();

    return res.json({
      success: true,
      booking: newBooking,
      bookings: db.bookings,
      lastUpdated: db.lastUpdated
    });
  } catch (err: any) {
    console.error('Error creating booking:', err);
    return res.status(500).json({ error: 'Rezervasyon kaydedilirken sunucu hatası oluştu.' });
  }
});

// Delete booking ("yönetim ekranından silme yetkisi olmalı")
app.delete('/api/bookings/:id', (req, res) => {
  try {
    const bookingId = decodeURIComponent(req.params.id);
    const authHeader = req.headers['authorization'];
    const adminPass = req.headers['x-admin-password'] || req.body?.password;

    // Check admin authority
    const isAuthorized =
      authHeader === 'Bearer admin' ||
      adminPass === db.settings.adminPassword ||
      adminPass === 'cg2026';

    if (!isAuthorized) {
      return res.status(403).json({
        error: 'Rezervasyon silme yetkisi sadece okul yönetimine aittir. Lütfen yönetici şifresini girin.'
      });
    }

    const initialLength = db.bookings.length;
    db.bookings = db.bookings.filter(b => b.id !== bookingId);

    if (db.bookings.length === initialLength) {
      return res.status(404).json({ error: 'Silinecek rezervasyon bulunamadı.' });
    }

    saveDatabase();
    return res.json({
      success: true,
      message: 'Rezervasyon başarıyla silindi.',
      bookings: db.bookings,
      lastUpdated: db.lastUpdated
    });
  } catch (err: any) {
    console.error('Error deleting booking:', err);
    return res.status(500).json({ error: 'Rezervasyon silinirken sunucu hatası oluştu.' });
  }
});

// Replace all bookings (admin or restore)
app.put('/api/bookings', (req, res) => {
  try {
    const { bookings, adminPassword } = req.body;
    if (adminPassword && adminPassword !== db.settings.adminPassword && adminPassword !== 'cg2026') {
      return res.status(403).json({ error: 'Yetkisiz işlem.' });
    }
    if (!Array.isArray(bookings)) {
      return res.status(400).json({ error: 'Geçersiz rezervasyon listesi.' });
    }
    db.bookings = bookings;
    db.lastUpdated = Date.now();
    saveDatabase();
    return res.json({ success: true, bookings: db.bookings, lastUpdated: db.lastUpdated });
  } catch (err: any) {
    return res.status(500).json({ error: 'Rezervasyonlar güncellenirken hata oluştu.' });
  }
});

// Bulk create bookings (admin)
app.post('/api/bookings/bulk', (req, res) => {
  try {
    const { items, adminPassword } = req.body;
    if (adminPassword !== db.settings.adminPassword && adminPassword !== 'cg2026') {
      return res.status(403).json({ error: 'Yetkisiz işlem.' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Geçersiz kayıt listesi.' });
    }

    let addedCount = 0;
    for (const item of items) {
      const exists = db.bookings.some(
        b => b.location === item.location && b.date === item.date && b.block === item.block && b.lessonLabel === item.lessonLabel
      );
      if (!exists) {
        db.bookings.push({
          id: item.id || `${item.location}_${item.date}_${item.block}_${item.lessonLabel}`,
          location: item.location,
          date: item.date,
          lessonLabel: item.lessonLabel,
          block: item.block,
          teacher: item.teacher,
          activity: item.activity || '',
          timestamp: Date.now()
        });
        addedCount++;
      }
    }

    saveDatabase();
    return res.json({
      success: true,
      addedCount,
      bookings: db.bookings,
      lastUpdated: db.lastUpdated
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Toplu rezervasyon hatası.' });
  }
});

// Update settings (admin)
app.put('/api/settings', (req, res) => {
  try {
    const { settings, adminPassword } = req.body;
    if (adminPassword !== db.settings.adminPassword && adminPassword !== 'cg2026') {
      return res.status(403).json({ error: 'Yetkisiz işlem.' });
    }
    db.settings = { ...db.settings, ...settings };
    saveDatabase();
    return res.json({ success: true, settings: db.settings, lastUpdated: db.lastUpdated });
  } catch (err: any) {
    return res.status(500).json({ error: 'Ayarlar güncellenirken hata oluştu.' });
  }
});

// Update teacher & class list (admin)
app.put('/api/teachers', (req, res) => {
  try {
    const { teachers, adminPassword } = req.body;
    if (adminPassword !== db.settings.adminPassword && adminPassword !== 'cg2026') {
      return res.status(403).json({ error: 'Yetkisiz işlem.' });
    }
    if (!Array.isArray(teachers)) {
      return res.status(400).json({ error: 'Öğretmen listesi bir dizi olmalıdır.' });
    }
    db.teachers = sortTeachersServer(teachers);
    saveDatabase();
    return res.json({ success: true, teachers: db.teachers, lastUpdated: db.lastUpdated });
  } catch (err: any) {
    return res.status(500).json({ error: 'Öğretmen listesi güncellenirken hata oluştu.' });
  }
});

// ---------------- VITE & STATIC SERVING ----------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Cevdet Güçlüer İlkokulu Rezervasyon Sunucusu port ${PORT} üzerinde hazır.`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
