import React, { useRef } from 'react';
import { DayInfo, Lesson, Booking, Talep, Role, EditingCell } from '../types';
import { Calendar, ChevronLeft, ChevronRight, Plus, Bell } from 'lucide-react';
import {
  DAY_LABELS,
  DAY_SHORT,
  MONTH_OPTIONS,
  SISTEM_BASLANGIC,
  pickHolidayForBlock,
  trUpper,
} from '../constants';

interface ScheduleGridProps {
  activeLocation: string;
  headerDateString: string;
  activeBlock: 'SABAH' | 'ÖĞLE';
  setActiveBlock: (b: 'SABAH' | 'ÖĞLE') => void;
  currentDate: Date;
  setCurrentDate: (d: Date) => void;
  canGoPrevWeek: boolean;
  canGoNextWeek: boolean;
  gotoPrevWeek: () => void;
  gotoNextWeek: () => void;
  weekDays: DayInfo[];
  morningLessons: Lesson[];
  afternoonLessons: Lesson[];
  findBooking: (day: DayInfo, lesson: Lesson) => Booking | null;
  /** Bir hücredeki tüm kayıtlar — kapasitesi 1'den büyük yerler için */
  findBookings: (day: DayInfo, lesson: Lesson) => Booking[];
  /** Aynı saate kaç kayıt sığar (bahçede 2-3, diğerlerinde 1) */
  slotKapasitesi: number;
  findTalep: (day: DayInfo, lesson: Lesson) => Talep | null;
  onCellClick: (cell: EditingCell) => void;
  role: Role;
  isSnapshotMode: boolean;
}

/* Kapasitesi 1'den büyük yerlerde (bahçe) bir hücrede birden fazla şube
   olur. Hepsini küçük satırlar hâlinde ve "2/2" sayacıyla gösteriyoruz. */
const CokluHucre: React.FC<{ kayitlar: Booking[]; kapasite: number }> = ({ kayitlar, kapasite }) => {
  if (kayitlar.length === 0) return null;
  const doluMu = kayitlar.length >= kapasite;
  return (
    <div className="w-full px-1 space-y-0.5">
      {kayitlar.map((b) => (
        <div
          key={b.id}
          className="text-[11px] sm:text-xs font-bold leading-tight truncate text-center"
          style={{ color: 'var(--ink)' }}
          title={`${b.teacher}${b.activity ? ' — ' + b.activity : ''}`}
        >
          {trUpper(b.teacher)}
        </div>
      ))}
      <div
        className="text-[10px] font-bold text-center mt-0.5"
        style={{ color: doluMu ? 'var(--brick)' : 'var(--teal-dark)' }}
      >
        {kayitlar.length}/{kapasite}
      </div>
    </div>
  );
};

export const ScheduleGrid: React.FC<ScheduleGridProps> = ({
  activeLocation,
  headerDateString,
  activeBlock,
  setActiveBlock,
  currentDate,
  setCurrentDate,
  canGoPrevWeek,
  canGoNextWeek,
  gotoPrevWeek,
  gotoNextWeek,
  weekDays,
  morningLessons,
  afternoonLessons,
  findBooking,
  findBookings,
  slotKapasitesi,
  findTalep,
  onCellClick,
  role,
  isSnapshotMode,
}) => {
  const activeLessons = activeBlock === 'SABAH' ? morningLessons : afternoonLessons;

  // Touch swiping on mobile
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) < 55 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    if (dx < 0) {
      if (canGoNextWeek) gotoNextWeek();
    } else {
      if (canGoPrevWeek) gotoPrevWeek();
    }
  };

  return (
    <div
      id="printable-table-area"
      className="table-wrapper rounded-3xl border shadow-sm overflow-hidden"
      style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
    >
      {/* Top Banner inside table */}
      <div className="px-3 sm:px-6 py-2.5 sm:py-3.5 shrink-0" style={{ background: 'var(--teal-dark)' }}>
        <div className="flex flex-col items-center gap-1 sm:gap-2">
          <h2
            className={`${
              isSnapshotMode ? 'block' : 'hidden sm:block'
            } text-white font-display font-bold text-xl sm:text-3xl tracking-wide leading-tight text-center`}
          >
            {trUpper(activeLocation)}
          </h2>
          <span
            id="current-week-label"
            className="inline-flex items-center justify-center gap-2 px-3.5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-mono font-bold whitespace-nowrap shadow-sm"
            style={{ background: 'var(--panel)', color: 'var(--teal-dark)' }}
          >
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span>{headerDateString} · {activeBlock === 'SABAH' ? 'Sabah' : 'Öğle'}</span>
          </span>
        </div>

        <div className="no-snapshot flex flex-nowrap items-center justify-between gap-2 sm:gap-4 mt-2 sm:mt-3">
          {/* Sabah / Öğle toggle pills */}
          <div
            id="block-toggle-pills"
            className="flex gap-1 p-1 rounded-xl shrink-0"
            style={{ background: 'rgba(255,255,255,0.18)' }}
          >
            {(['SABAH', 'ÖĞLE'] as const).map((block) => (
              <button
                key={block}
                id={`btn-block-${block.toLowerCase()}`}
                onClick={() => setActiveBlock(block)}
                className="compact-pill-btn px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold tracking-wide transition-all"
                style={
                  activeBlock === block
                    ? { background: 'var(--panel)', color: 'var(--teal-dark)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }
                    : { color: 'white' }
                }
              >
                {block === 'SABAH' ? 'Sabah' : 'Öğle'}
              </button>
            ))}
          </div>

          {/* Week navigation & month picker */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              id="btn-prev-week"
              disabled={!canGoPrevWeek}
              onClick={gotoPrevWeek}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center disabled:opacity-30 shrink-0 hover:bg-white/25 transition-colors"
              style={{ background: 'rgba(255,255,255,0.18)' }}
              title="Önceki Hafta"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </button>

            <select
              id="month-dropdown-picker"
              value={`${currentDate.getFullYear()}-${currentDate.getMonth()}`}
              onChange={(e) => {
                const [y, m] = e.target.value.split('-').map(Number);
                let target = new Date(y, m, 1);
                if (target < SISTEM_BASLANGIC) target = new Date(SISTEM_BASLANGIC);
                setCurrentDate(target);
              }}
              className="hidden sm:block select-chevron-light appearance-none text-center px-3 py-1.5 text-sm font-mono font-bold outline-none bg-transparent cursor-pointer text-white rounded-lg border border-white/20 shrink-0"
              style={{ background: 'rgba(255,255,255,0.15)' }}
            >
              {MONTH_OPTIONS.map((o) => (
                <option key={`${o.year}-${o.month}`} value={`${o.year}-${o.month}`} style={{ color: 'var(--ink)' }}>
                  {o.label}
                </option>
              ))}
            </select>

            <button
              id="btn-next-week"
              disabled={!canGoNextWeek}
              onClick={gotoNextWeek}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center disabled:opacity-30 shrink-0 hover:bg-white/25 transition-colors"
              style={{ background: 'rgba(255,255,255,0.18)' }}
              title="Sonraki Hafta"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Desktop / Print Layout (CSS Grid) */}
      <div className={isSnapshotMode ? 'block' : 'hidden md:block overflow-x-auto'}>
        <div
          id="desktop-grid-schedule"
          className="text-center"
          style={{
            display: 'grid',
            gridTemplateColumns: '120px 140px repeat(5, minmax(150px, 1fr))',
            minWidth: '960px',
            gap: '1px',
            background: 'var(--line-strong)',
          }}
        >
          {/* Header Row */}
          <div
            className="sticky left-0 z-20 p-3.5 text-sm font-bold flex items-center justify-center tracking-wider uppercase"
            style={{ background: 'var(--teal-tint)', color: 'var(--teal-dark)' }}
          >
            Ders
          </div>
          <div
            className="sticky left-[120px] z-20 p-3.5 text-sm font-mono font-bold flex items-center justify-center tracking-wider uppercase"
            style={{ background: 'var(--paper-2)', color: 'var(--ink)' }}
          >
            Saat
          </div>
          {weekDays.map((day, idx) => {
            const headerHoliday = pickHolidayForBlock(day.dayHolidays, activeBlock);
            return (
              <div
                key={day.dateStr}
                className="p-3"
                style={{
                  background: !day.valid
                    ? 'var(--paper-2)'
                    : headerHoliday
                    ? 'var(--ochre-tint)'
                    : 'var(--panel)',
                }}
              >
                <div className="font-display font-bold text-lg sm:text-xl" style={{ color: 'var(--ink)' }}>
                  {DAY_LABELS[idx]}
                </div>
                <div
                  className="inline-block text-xs font-mono font-semibold mt-1 px-2.5 py-0.5 rounded-full"
                  style={{ color: 'var(--ink)', background: 'rgba(32,38,31,0.08)' }}
                >
                  {day.display}
                </div>
                {!day.valid && (
                  <div className="text-[11px] font-bold mt-1 text-red-700">Dönem Dışı</div>
                )}
                {day.valid && headerHoliday && (
                  <div
                    className="text-xs font-bold mt-1 px-1 truncate text-amber-800"
                    title={headerHoliday.name}
                  >
                    {headerHoliday.name}
                  </div>
                )}
              </div>
            );
          })}

          {/* Lesson Rows */}
          {activeLessons.map((lesson, idx) => (
            <React.Fragment key={`row-${idx}`}>
              <div
                className="sticky left-0 z-10 p-3 text-sm font-bold flex items-center justify-center"
                style={{
                  background: 'var(--teal-tint)',
                  color: 'var(--teal-dark)',
                  minHeight: '4.5rem',
                }}
              >
                {lesson.label}
              </div>
              <div
                className="sticky left-[120px] z-10 p-3 text-xs font-mono font-semibold flex items-center justify-center"
                style={{
                  background: 'var(--paper-2)',
                  color: 'var(--ink)',
                  minHeight: '4.5rem',
                }}
              >
                {lesson.start}–{lesson.end}
              </div>
              {weekDays.map((day) => {
                const kayitlar = slotKapasitesi > 1 ? findBookings(day, lesson) : [];
                const b = slotKapasitesi > 1 ? (kayitlar[0] || null) : findBooking(day, lesson);
                const cokluDolu = slotKapasitesi > 1 && kayitlar.length >= slotKapasitesi;
                const t = findTalep(day, lesson);
                const holiday = pickHolidayForBlock(day.dayHolidays, lesson.block);
                const clickable = day.valid;
                const bg = !day.valid
                  ? 'var(--paper-2)'
                  : slotKapasitesi > 1 && kayitlar.length > 0
                  ? (cokluDolu ? 'var(--ochre-tint)' : 'var(--teal-tint)')
                  : b
                  ? 'var(--ochre-tint)'
                  : t
                  ? 'var(--teal-tint)'
                  : holiday
                  ? 'var(--brick-tint)'
                  : 'var(--panel)';

                return (
                  <div
                    key={`${day.dateStr}-${lesson.label}`}
                    onClick={() =>
                      clickable && onCellClick({ ...day, lesson, valid: day.valid, holiday })
                    }
                    className="p-2.5 cell-tap flex flex-col items-center justify-center transition-colors group relative"
                    style={{
                      background: bg,
                      cursor: day.valid ? 'pointer' : 'not-allowed',
                      opacity: day.valid ? 1 : 0.45,
                      minHeight: '4.5rem',
                    }}
                  >
                    {slotKapasitesi > 1 && kayitlar.length > 0 ? (
                      <CokluHucre kayitlar={kayitlar} kapasite={slotKapasitesi} />
                    ) : b ? (
                      <div className="text-center w-full px-1">
                        <div
                          className="text-sm font-bold leading-snug truncate"
                          style={{ color: 'var(--ink)' }}
                          title={b.teacher}
                        >
                          {trUpper(b.teacher)}
                        </div>
                        <div
                          className="text-xs font-medium mt-0.5 leading-snug truncate"
                          style={{ color: 'var(--ink-soft)' }}
                          title={b.activity}
                        >
                          {b.activity}
                        </div>
                      </div>
                    ) : t ? (
                      <div className="flex flex-col items-center justify-center px-1 text-center">
                        <span
                          className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md"
                          style={{ background: 'var(--panel)', color: 'var(--teal-dark)' }}
                        >
                          <Bell className="w-3 h-3 text-teal-600" />
                          <span>Talep Bekliyor</span>
                        </span>
                        <span className="text-[11px] font-semibold mt-0.5 truncate max-w-full" style={{ color: 'var(--teal-dark)' }}>
                          {t.teacher}
                        </span>
                      </div>
                    ) : day.valid && holiday ? (
                      <div className="w-full min-w-0 px-1 text-center">
                        <span
                          className="text-xs font-bold leading-snug text-red-800 line-clamp-2"
                          title={holiday.name}
                        >
                          {holiday.name}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        {day.valid ? (
                          <div className="flex items-center gap-1.5 opacity-35 group-hover:opacity-100 transition-all">
                            <span className="w-6 h-6 rounded-full flex items-center justify-center bg-teal-100 text-teal-800">
                              <Plus className="w-3.5 h-3.5" />
                            </span>
                            <span className="text-[11px] font-bold text-teal-900 hidden lg:inline">
                              Rezervasyon
                            </span>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Mobile Schedule Grid (Responsive, whole week at a glance) */}
      <div
        id="mobile-schedule-view"
        className={`${isSnapshotMode ? 'hidden' : 'flex flex-col md:hidden'} mobile-schedule-view`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="mobile-week-grid grid gap-1.5 p-2.5"
          style={{
            gridTemplateColumns: '42px repeat(5, 1fr)',
            gridTemplateRows: 'auto repeat(6, 1fr)',
          }}
        >
          {/* Top-left corner */}
          <div></div>
          {/* Day Headers */}
          {weekDays.map((day, idx) => {
            const stripHoliday = pickHolidayForBlock(day.dayHolidays, activeBlock);
            return (
              <div
                key={day.dateStr}
                className="text-center rounded-lg py-1 border"
                style={
                  !day.valid
                    ? { background: 'var(--paper-2)', borderColor: 'var(--line)', color: 'var(--ink-soft)', opacity: 0.5 }
                    : stripHoliday
                    ? { background: 'var(--ochre-tint)', borderColor: 'var(--ochre)', color: '#7A5A1E' }
                    : { background: 'var(--panel)', borderColor: 'var(--line)', color: 'var(--ink)' }
                }
              >
                <div className="text-[11px] font-bold">{DAY_SHORT[idx]}</div>
                <div className="text-[9px] font-mono font-medium opacity-80">{day.display}</div>
              </div>
            );
          })}

          {/* Lesson Rows */}
          {activeLessons.map((lesson) => (
            <React.Fragment key={lesson.label}>
              <div className="flex flex-col items-center justify-center text-center px-0.5" style={{ color: 'var(--ink-soft)' }}>
                <div className="text-[10px] font-bold leading-none">{lesson.label.replace('. Ders', '')}</div>
                <div className="text-[8px] font-mono leading-none mt-1 opacity-80">{lesson.start}</div>
              </div>
              {weekDays.map((day) => {
                const kayitlar = slotKapasitesi > 1 ? findBookings(day, lesson) : [];
                const b = slotKapasitesi > 1 ? (kayitlar[0] || null) : findBooking(day, lesson);
                const cokluDolu = slotKapasitesi > 1 && kayitlar.length >= slotKapasitesi;
                const t = findTalep(day, lesson);
                const holiday = pickHolidayForBlock(day.dayHolidays, lesson.block);
                const clickable = day.valid;
                const bg = !day.valid
                  ? 'var(--paper-2)'
                  : slotKapasitesi > 1 && kayitlar.length > 0
                  ? (cokluDolu ? 'var(--brick-tint)' : 'var(--teal-tint)')
                  : b
                  ? 'var(--brick-tint)'
                  : t
                  ? 'var(--teal-tint)'
                  : holiday
                  ? 'var(--ochre-tint)'
                  : 'var(--green-tint)';
                const bd = !day.valid
                  ? 'var(--line)'
                  : b
                  ? 'var(--brick)'
                  : t
                  ? 'var(--teal-dark)'
                  : holiday
                  ? 'var(--ochre)'
                  : 'var(--green)';
                const txt = !day.valid
                  ? 'var(--ink-soft)'
                  : b
                  ? 'var(--brick)'
                  : t
                  ? 'var(--teal-dark)'
                  : holiday
                  ? '#7A5A1E'
                  : 'var(--green)';

                return (
                  <div
                    key={`${day.dateStr}-${lesson.label}`}
                    onClick={() =>
                      clickable && onCellClick({ ...day, lesson, valid: day.valid, holiday })
                    }
                    className="mobile-week-cell rounded-lg border cell-tap flex items-center justify-center overflow-hidden px-1 py-1.5 min-h-[48px]"
                    style={{ background: bg, borderColor: bd, opacity: day.valid ? 1 : 0.45 }}
                  >
                    {slotKapasitesi > 1 && kayitlar.length > 0 ? (
                      <div className="w-full text-center leading-tight">
                        {kayitlar.slice(0, 2).map((k) => (
                          <div key={k.id} className="text-[8px] font-bold truncate" style={{ color: txt }}>
                            {trUpper(k.teacher)}
                          </div>
                        ))}
                        <div className="text-[7.5px] font-bold" style={{ color: txt }}>
                          {kayitlar.length}/{slotKapasitesi}
                        </div>
                      </div>
                    ) : b ? (
                      <div className="w-full text-center leading-tight">
                        <div className="text-[8.5px] font-bold truncate" style={{ color: txt }}>
                          {trUpper(b.teacher)}
                        </div>
                        {b.activity && (
                          <div className="text-[7.5px] font-medium opacity-85 truncate" style={{ color: txt }}>
                            {b.activity}
                          </div>
                        )}
                      </div>
                    ) : t ? (
                      <div className="flex items-center justify-center">
                        <Bell className="w-3.5 h-3.5" style={{ color: txt }} />
                      </div>
                    ) : holiday ? (
                      <div className="w-full min-w-0 text-center">
                        <span className="text-[7px] font-bold leading-tight line-clamp-2" style={{ color: txt }}>
                          {holiday.name}
                        </span>
                      </div>
                    ) : day.valid ? (
                      <span className="text-[9.5px] font-bold flex items-center justify-center gap-0.5" style={{ color: txt }}>
                        <Plus className="w-2.5 h-2.5" /> Boş
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>

        {/* Legend */}
        <div className="no-snapshot flex items-center justify-center gap-3 py-2 border-t shrink-0" style={{ borderColor: 'var(--line)' }}>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: 'var(--ink-soft)' }}>
            <span className="w-2.5 h-2.5 rounded-xs" style={{ background: 'var(--green-tint)', border: '1px solid var(--green)' }} />
            Boş
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: 'var(--ink-soft)' }}>
            <span className="w-2.5 h-2.5 rounded-xs" style={{ background: 'var(--teal-tint)', border: '1px solid var(--teal-dark)' }} />
            Beklemede
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: 'var(--ink-soft)' }}>
            <span className="w-2.5 h-2.5 rounded-xs" style={{ background: 'var(--brick-tint)', border: '1px solid var(--brick)' }} />
            Dolu
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: 'var(--ink-soft)' }}>
            <span className="w-2.5 h-2.5 rounded-xs" style={{ background: 'var(--ochre-tint)', border: '1px solid var(--ochre)' }} />
            Tatil
          </span>
        </div>
      </div>
    </div>
  );
};
