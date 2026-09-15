import React, { useState, useMemo } from 'react';
import { TeacherClassItem } from '../types';
import { X, Search, Printer, Users, BookOpen, Clock, CheckCircle2 } from 'lucide-react';

interface TeacherListModalProps {
  isOpen: boolean;
  onClose: () => void;
  teachers: TeacherClassItem[];
  schoolName: string;
}

export const TeacherListModal: React.FC<TeacherListModalProps> = ({
  isOpen,
  onClose,
  teachers,
  schoolName,
}) => {
  const [activeTab, setActiveTab] = useState<'liste' | 'sirkusu'>('liste');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('TÜMÜ');
  const [haftaBilgisi, setHaftaBilgisi] = useState('');
  const [tarihBilgisi, setTarihBilgisi] = useState('…… / …… / 2026');

  const filteredTeachers = useMemo(() => {
    return teachers.filter((t) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        t.teacherName.toLowerCase().includes(q) ||
        t.className.toLowerCase().includes(q) ||
        t.branch.toLowerCase().includes(q);

      let matchesGroup = true;
      if (selectedGroup === '1. Sınıflar') matchesGroup = t.className.startsWith('1/');
      else if (selectedGroup === '2. Sınıflar') matchesGroup = t.className.startsWith('2/');
      else if (selectedGroup === '3. Sınıflar') matchesGroup = t.className.startsWith('3/');
      else if (selectedGroup === '4. Sınıflar') matchesGroup = t.className.startsWith('4/');
      else if (selectedGroup === 'Anasınıfı') matchesGroup = t.className.toLowerCase().includes('anasınıf');
      else if (selectedGroup === 'Branş & Diğer') {
        matchesGroup =
          !t.className.match(/^[1-4]\//) && !t.className.toLowerCase().includes('anasınıf');
      }

      return matchesSearch && matchesGroup;
    });
  }, [teachers, searchQuery, selectedGroup]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      id="teacher-list-modal"
      className="fixed inset-0 z-[900] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
    >
      <div
        className="w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] border overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
      >
        {/* Header (Screen only) */}
        <div
          className="no-print flex items-center justify-between px-5 py-4 border-b shrink-0"
          style={{ borderColor: 'var(--line)', background: 'var(--paper)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-teal-800 border"
              style={{ background: 'var(--teal-tint)', borderColor: 'var(--teal-border)' }}
            >
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-stone-900 leading-tight">
                {schoolName} Öğretmen Listesi
              </h2>
              <p className="text-xs text-stone-600">
                Sınıf ve branş öğretmenleri kadrosu ({teachers.length} Öğretmen)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-300">
              <button
                type="button"
                onClick={() => setActiveTab('liste')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'liste'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Öğretmen Kartları
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('sirkusu')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'sirkusu'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                İmza Sirküsü Görünümü
              </button>
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-teal-800 hover:bg-teal-900 text-white transition-colors shadow-xs"
              title="A4 Yatay İmza Sirküsü Yazdır veya PDF Kaydet"
            >
              <Printer className="w-4 h-4" />
              <span>Yazdır / PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-stone-200 text-stone-600 transition-colors"
              aria-label="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters & Search (Screen only) */}
        {activeTab === 'liste' && (
          <div
            className="no-print px-5 py-3 border-b flex flex-wrap items-center justify-between gap-3 shrink-0"
            style={{ borderColor: 'var(--line)', background: 'var(--paper-2)' }}
          >
            {/* Search Input */}
            <div className="relative flex-1 min-w-[220px] max-w-md">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Öğretmen veya sınıf adı ara (örn: Gül Alibaş, 1/G, 2/A)..."
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-stone-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-700"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
              {[
                'TÜMÜ',
                '1. Sınıflar',
                '2. Sınıflar',
                '3. Sınıflar',
                '4. Sınıflar',
                'Anasınıfı',
                'Branş & Diğer',
              ].map((grp) => (
                <button
                  key={grp}
                  type="button"
                  onClick={() => setSelectedGroup(grp)}
                  className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                    selectedGroup === grp
                      ? 'bg-stone-900 text-white'
                      : 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-100'
                  }`}
                >
                  {grp}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tab 1: List / Grid of Teachers */}
        {activeTab === 'liste' && (
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3">
            {filteredTeachers.length === 0 ? (
              <div className="text-center py-12 text-stone-500 text-sm">
                Aramanıza uygun öğretmen veya sınıf bulunamadı.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredTeachers.map((t, idx) => {
                  const is1G = t.className === '1/G';
                  return (
                    <div
                      key={t.id}
                      className={`p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                        is1G
                          ? 'bg-teal-50/70 border-teal-300 ring-1 ring-teal-400'
                          : 'bg-white border-stone-200 hover:border-stone-300 shadow-2xs'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                              is1G
                                ? 'bg-teal-700 text-white'
                                : t.className.startsWith('1/') || t.className.startsWith('2/')
                                ? 'bg-amber-100 text-amber-900'
                                : t.className.startsWith('3/') || t.className.startsWith('4/')
                                ? 'bg-sky-100 text-sky-900'
                                : 'bg-stone-100 text-stone-800'
                            }`}
                          >
                            {t.className}
                          </span>
                          <span className="text-[10px] text-stone-500 font-medium uppercase tracking-wider">
                            {t.group === 'SABAH'
                              ? 'Sabahçı'
                              : t.group === 'ÖĞLE'
                              ? 'Öğlenci'
                              : 'Tam Gün'}
                          </span>
                          {is1G && (
                            <span className="text-[10px] font-bold text-teal-800 flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3 text-teal-600" />
                              Özel
                            </span>
                          )}
                        </div>

                        <div className="font-bold text-sm text-stone-900 truncate">
                          {t.teacherName}
                        </div>
                        <div className="text-xs text-stone-600 truncate">{t.branch}</div>
                      </div>

                      <div className="text-right shrink-0 text-stone-400 text-xs font-mono font-bold">
                        #{idx + 1}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Printable İmza Sirküsü (Direct A4 Landscape representation) */}
        {activeTab === 'sirkusu' && (
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-stone-100 print:bg-white print:p-0">
            <div className="bg-white max-w-4xl mx-auto p-6 sm:p-8 rounded-xl shadow-xs border border-stone-300 print:shadow-none print:border-none print:p-0">
              {/* Sirkü Başlık */}
              <div className="text-center mb-4">
                <h1 className="text-lg sm:text-xl font-bold uppercase tracking-wider text-stone-900">
                  {schoolName} Öğretmen İmza Sirküsü
                </h1>
                <div className="h-0.5 bg-stone-900 my-2"></div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs sm:text-sm text-left font-medium text-stone-800 my-3">
                  <div>
                    <span className="font-bold">Okul:</span> {schoolName}
                  </div>
                  <div>
                    <span className="font-bold">Eğitim Yılı:</span> 2026-2027
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-bold">Hafta:</span>
                    <input
                      type="text"
                      value={haftaBilgisi}
                      onChange={(e) => setHaftaBilgisi(e.target.value)}
                      placeholder="……"
                      className="w-16 border-b border-stone-400 bg-transparent text-center focus:outline-hidden text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-bold">Tarih:</span>
                    <input
                      type="text"
                      value={tarihBilgisi}
                      onChange={(e) => setTarihBilgisi(e.target.value)}
                      placeholder="…… / …… / 2026"
                      className="w-28 border-b border-stone-400 bg-transparent text-center focus:outline-hidden text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Tablo */}
              <div className="overflow-x-auto border border-stone-900">
                <table className="w-full text-[11px] sm:text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-200 text-stone-900 border-b border-stone-900 font-bold text-center">
                      <th className="border-r border-stone-900 p-1.5 w-8">Sıra</th>
                      <th className="border-r border-stone-900 p-1.5 w-44 text-left">Adı Soyadı</th>
                      <th className="border-r border-stone-900 p-1.5 w-44 text-left">Görevi / Şubesi</th>
                      <th className="border-r border-stone-900 p-1.5 w-16">Pazartesi</th>
                      <th className="border-r border-stone-900 p-1.5 w-16">Salı</th>
                      <th className="border-r border-stone-900 p-1.5 w-16">Çarşamba</th>
                      <th className="border-r border-stone-900 p-1.5 w-16">Perşembe</th>
                      <th className="p-1.5 w-16">Cuma</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teachers.map((t, i) => (
                      <tr
                        key={t.id}
                        className={`border-b border-stone-900 ${
                          i % 2 === 1 ? 'bg-stone-50' : 'bg-white'
                        }`}
                      >
                        <td className="border-r border-stone-900 p-1.5 text-center font-bold text-stone-700">
                          {i + 1}
                        </td>
                        <td className="border-r border-stone-900 p-1.5 font-semibold text-stone-900">
                          {t.teacherName}
                        </td>
                        <td className="border-r border-stone-900 p-1.5 text-stone-700">
                          {t.branch || `${t.className} Sınıfı Öğretmeni`}
                        </td>
                        <td className="border-r border-stone-900 p-1.5"></td>
                        <td className="border-r border-stone-900 p-1.5"></td>
                        <td className="border-r border-stone-900 p-1.5"></td>
                        <td className="border-r border-stone-900 p-1.5"></td>
                        <td className="p-1.5"></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 text-[11px] text-stone-500 italic print:mt-6">
                Not: İmza sütunları resmi haftalık imza sirküsü için hazırlanmıştır. Bu sayfayı doğrudan
                A4 Yatay olarak yazdırabilir veya PDF olarak kaydedebilirsiniz.
              </div>
            </div>
          </div>
        )}

        {/* Footer (Screen only) */}
        <div
          className="no-print px-5 py-3 border-t flex items-center justify-between shrink-0"
          style={{ borderColor: 'var(--line)', background: 'var(--paper)' }}
        >
          <div className="text-xs text-stone-600">
            Toplam <strong>{filteredTeachers.length}</strong> öğretmen listeleniyor.
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-teal-800 hover:bg-teal-900 text-white shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Yazdır / PDF Al</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-stone-300 bg-white hover:bg-stone-50 text-stone-800"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
