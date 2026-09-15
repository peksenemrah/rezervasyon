import React, { useState, useMemo } from 'react';
import { TeacherClassItem } from '../types';
import { X, Search, Printer, Users } from 'lucide-react';
import { sortTeachers } from '../data/defaultTeachers';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('TÜMÜ');

  const filteredTeachers = useMemo(() => {
    const sorted = sortTeachers(teachers);
    return sorted.filter((t) => {
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
            <button
              type="button"
              onClick={handlePrint}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-teal-800 hover:bg-teal-900 text-white transition-colors shadow-xs"
              title="Öğretmen Listesini Yazdır veya PDF Kaydet"
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

        {/* List / Grid of Teachers */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3">
          {filteredTeachers.length === 0 ? (
            <div className="text-center py-12 text-stone-500 text-sm">
              Aramanıza uygun öğretmen veya sınıf bulunamadı.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredTeachers.map((t, idx) => {
                return (
                  <div
                    key={t.id}
                    className="p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 bg-white border-stone-200 hover:border-stone-300 shadow-2xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                            t.className.startsWith('1/') || t.className.startsWith('2/')
                              ? 'bg-amber-100 text-amber-900'
                              : t.className.startsWith('3/') || t.className.startsWith('4/')
                              ? 'bg-sky-100 text-sky-900'
                              : t.className.toLowerCase().includes('ana')
                              ? 'bg-purple-100 text-purple-900'
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
