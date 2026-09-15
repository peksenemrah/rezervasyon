import { TeacherClassItem } from '../types';

export const DEFAULT_TEACHERS: TeacherClassItem[] = [
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

  // Anasınıfları
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
  { id: 'reh-1', className: 'Rehberlik', teacherName: 'Seher Duygu Gürsoy', branch: 'Rehber Öğretmen', group: 'TÜM' },
  { id: 'idare', className: 'Okul İdaresi', teacherName: 'Yönetim / Nöbetçi Md. Yrd.', branch: 'Okul Yönetimi', group: 'TÜM' },
];

/**
 * Natural sequential sorting:
 * 1/A, 1/B ... 1/G
 * 2/A ... 2/G
 * 3/A ... 3/G
 * 4/A ... 4/H
 * Anasınıfı-A ... Anasınıfı-G
 * İngilizce, Din Kültürü, Özel Eğitim, Rehberlik, Okul İdaresi
 */
export function sortTeachers(teachers: TeacherClassItem[]): TeacherClassItem[] {
  return [...teachers].sort((a, b) => {
    const getWeight = (item: TeacherClassItem) => {
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
