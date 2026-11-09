/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Usuario, Vacacion, Cumpleanos, Festivo } from '../types';
import { getSeasonalTheme } from '../utils/seasonalTheme';
import { getMexicanHolidays } from '../utils/mexicanHolidays';
import dayOfDeadBackground from '../../fondos/dia-de-muertos.avif';
import revolutionBackground from '../../fondos/revolución_mexicana.jpg';
import christmasBackground from '../../fondos/navidad.webp';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Calendar as CalendarIcon,
  Sparkles,
  Cake,
  Palmtree,
  PlusCircle,
  Clock,
  Filter,
} from 'lucide-react';

interface CalendarViewProps {
  currentYear: number;
  currentMonth: number; // 0-11
  onChangeYear: (year: number) => void;
  onChangeMonth: (month: number) => void;
  users: Usuario[];
  vacations: Vacacion[];
  birthdays: Cumpleanos[];
  onSelectDate: (dateStr: string) => void;
  onRequestVacation: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  currentYear,
  currentMonth,
  onChangeYear,
  onChangeMonth,
  users,
  vacations,
  birthdays,
  onSelectDate,
  onRequestVacation,
}) => {
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'agenda'>('grid');
  const [revolutionThemeDate, setRevolutionThemeDate] = useState<string | null>(null);

  const theme = useMemo(() => getSeasonalTheme(currentMonth), [currentMonth]);
  const holidays = useMemo(() => getMexicanHolidays(currentYear), [currentYear]);
  const isRevolutionBackgroundActive = currentMonth === 10 &&
    revolutionThemeDate === `${currentYear}-11-16`;
  const calendarBackground = currentMonth === 11
    ? christmasBackground
    : currentMonth === 10
    ? isRevolutionBackgroundActive
      ? revolutionBackground
      : dayOfDeadBackground
    : undefined;

  // Days in current month
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday
    // Adjust so Monday is 0 or Sunday is 0? In Mexico standard work calendar, Monday is start of week or Sunday.
    // Let's standard Monday start: Monday=0, Tuesday=1, ..., Sunday=6
    const adjustedFirstDay = (firstDayIndex + 6) % 7;
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const cells: {
      day: number;
      monthOffset: number; // -1 = prev, 0 = current, 1 = next
      dateStr: string;
      isWeekend: boolean;
      isToday: boolean;
    }[] = [];

    const todayStr = new Date().toISOString().split('T')[0];

    // Previous month padding
    for (let i = adjustedFirstDay - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevM = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevY = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${prevY}-${String(prevM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayOfWeek = new Date(prevY, prevM, d).getDay();
      cells.push({
        day: d,
        monthOffset: -1,
        dateStr,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
        isToday: dateStr === todayStr,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayOfWeek = new Date(currentYear, currentMonth, d).getDay();
      cells.push({
        day: d,
        monthOffset: 0,
        dateStr,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
        isToday: dateStr === todayStr,
      });
    }

    // Next month padding to complete rows
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextM = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextY = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateStr = `${nextY}-${String(nextM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayOfWeek = new Date(nextY, nextM, d).getDay();
      cells.push({
        day: d,
        monthOffset: 1,
        dateStr,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
        isToday: dateStr === todayStr,
      });
    }

    return cells;
  }, [currentYear, currentMonth]);

  // Filter approved vacations
  const approvedVacations = useMemo(() => {
    return vacations.filter((v) => {
      if (v.estado !== 'aprobada') return false;
      if (selectedUserFilter !== 'all' && v.id_usuario !== selectedUserFilter) return false;
      return true;
    });
  }, [vacations, selectedUserFilter]);

  // Map of events by date
  const eventsByDate = useMemo(() => {
    const map = new Map<
      string,
      {
        holidays: Festivo[];
        birthdays: { user: Usuario; date: string }[];
        vacations: { user: Usuario; vac: Vacacion }[];
      }
    >();

    const usersMap = new Map<string, Usuario>();
    users.forEach((u) => usersMap.set(u.id_usuario, u));

    // Holidays
    holidays.forEach((h) => {
      if (!map.has(h.fecha)) {
        map.set(h.fecha, { holidays: [], birthdays: [], vacations: [] });
      }
      map.get(h.fecha)!.holidays.push(h);
    });

    // Birthdays (repeats every year!)
    birthdays.forEach((b) => {
      if (!b.fecha_cumpleaños) return;
      const user = usersMap.get(b.id_usuario);
      if (!user) return;
      if (selectedUserFilter !== 'all' && b.id_usuario !== selectedUserFilter) return;

      const parts = b.fecha_cumpleaños.split('-');
      const bMonth = Number(parts[parts.length - 2]);
      const bDay = Number(parts[parts.length - 1]);

      const thisYearDateStr = `${currentYear}-${String(bMonth).padStart(2, '0')}-${String(bDay).padStart(2, '0')}`;
      if (!map.has(thisYearDateStr)) {
        map.set(thisYearDateStr, { holidays: [], birthdays: [], vacations: [] });
      }
      map.get(thisYearDateStr)!.birthdays.push({ user, date: b.fecha_cumpleaños });
    });

    // Vacations
    approvedVacations.forEach((v) => {
      const user = usersMap.get(v.id_usuario);
      if (!user) return;

      // Span each day
      const [sy, sm, sd] = v.fecha_inicio.split('-').map(Number);
      const [ey, em, ed] = v.fecha_fin.split('-').map(Number);
      const s = new Date(sy, sm - 1, sd);
      const e = new Date(ey, em - 1, ed);

      const cur = new Date(s);
      while (cur <= e) {
        const y = cur.getFullYear();
        const m = String(cur.getMonth() + 1).padStart(2, '0');
        const d = String(cur.getDate()).padStart(2, '0');
        const dt = `${y}-${m}-${d}`;
        const isWeekend = cur.getDay() === 0 || cur.getDay() === 6;
        const isHoliday = (y === currentYear ? holidays : getMexicanHolidays(y))
          .some((holiday) => holiday.tipo === 'oficial' && holiday.fecha === dt);

        if (!isWeekend && !isHoliday) {
          if (!map.has(dt)) {
            map.set(dt, { holidays: [], birthdays: [], vacations: [] });
          }
          map.get(dt)!.vacations.push({ user, vac: v });
        }
        cur.setDate(cur.getDate() + 1);
      }
    });

    return map;
  }, [holidays, birthdays, approvedVacations, users, currentYear, selectedUserFilter]);

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      onChangeYear(currentYear - 1);
      onChangeMonth(11);
    } else {
      onChangeMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      onChangeYear(currentYear + 1);
      onChangeMonth(0);
    } else {
      onChangeMonth(currentMonth + 1);
    }
  };

  const handleToday = () => {
    const now = new Date();
    onChangeYear(now.getFullYear());
    onChangeMonth(now.getMonth());
  };

  const handleSelectDate = (dateStr: string) => {
    setRevolutionThemeDate(dateStr === `${currentYear}-11-16` ? dateStr : null);
    onSelectDate(dateStr);
  };

  const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  // Agenda events for this month
  const monthAgenda = useMemo(() => {
    const list: {
      dateStr: string;
      dayNum: number;
      dayOfWeek: string;
      isWeekend: boolean;
      holidays: Festivo[];
      birthdays: { user: Usuario; date: string }[];
      vacations: { user: Usuario; vac: Vacacion }[];
    }[] = [];

    calendarDays
      .filter((c) => c.monthOffset === 0)
      .forEach((c) => {
        const ev = eventsByDate.get(c.dateStr);
        if (ev && (ev.holidays.length > 0 || ev.birthdays.length > 0 || ev.vacations.length > 0)) {
          const dt = new Date(c.dateStr + 'T12:00:00');
          list.push({
            dateStr: c.dateStr,
            dayNum: c.day,
            dayOfWeek: dt.toLocaleDateString('es-MX', { weekday: 'short' }),
            isWeekend: c.isWeekend,
            holidays: ev.holidays,
            birthdays: ev.birthdays,
            vacations: ev.vacations,
          });
        }
      });

    return list;
  }, [calendarDays, eventsByDate]);

  return (
    <div className="space-y-6">
      
      {/* SEASONAL BANNER & CONTROLS */}
      <div
        className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs"
        style={{ backgroundImage: theme.bannerPattern }}
      >
        {/* Subtle decorative seasonal floating icons in background */}
        <div className="absolute right-4 top-3 flex gap-2 select-none pointer-events-none opacity-20 text-3xl sm:text-4xl">
          {theme.decorativeElements.slice(0, 4).map((el, i) => (
            <span key={i} className="animate-pulse" style={{ animationDelay: `${i * 300}ms` }}>
              {el}
            </span>
          ))}
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Month & Seasonal Badge */}
          <div>
            <div className="flex items-center gap-2.5">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${theme.badgeBg}`}>
                <span>{theme.emoji}</span>
                <span>{theme.themeName}</span>
              </span>
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                {theme.tagline}
              </span>
            </div>

            <div className="flex items-baseline gap-3 mt-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                {monthNames[currentMonth]}
              </h1>
              <span className="text-xl sm:text-2xl font-bold text-slate-400 font-mono">
                {currentYear}
              </span>
            </div>
          </div>

          {/* Navigation and selectors */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Quick jump to Today */}
            <button
              onClick={handleToday}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors"
            >
              Hoy
            </button>

            {/* Month & Year Dropdowns */}
            <select
              value={currentMonth}
              onChange={(e) => onChangeMonth(Number(e.target.value))}
              className="px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg shadow-2xs focus:border-blue-500 outline-hidden"
            >
              {monthNames.map((name, idx) => (
                <option key={name} value={idx}>
                  {name}
                </option>
              ))}
            </select>

            <select
              value={currentYear}
              onChange={(e) => onChangeYear(Number(e.target.value))}
              className="px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg shadow-2xs focus:border-blue-500 outline-hidden font-mono"
            >
              {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>

            {/* Stepper Buttons */}
            <div className="flex items-center rounded-lg border border-slate-200 bg-white shadow-2xs overflow-hidden">
              <button
                onClick={() => onChangeYear(currentYear - 1)}
                title="Año anterior"
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handlePrevMonth}
                title="Mes anterior"
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors border-l border-slate-100"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                title="Mes siguiente"
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors border-l border-slate-100"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onChangeYear(currentYear + 1)}
                title="Año siguiente"
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors border-l border-slate-100"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center p-0.5 rounded-lg border border-slate-200 bg-slate-100 text-xs">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Cuadrícula
              </button>
              <button
                onClick={() => setViewMode('agenda')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  viewMode === 'agenda'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Agenda
              </button>
            </div>

          </div>
        </div>

        {/* Filter bar by teammate */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1">
            <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] shrink-0">
              Filtrar por:
            </span>
            <button
              onClick={() => setSelectedUserFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all shrink-0 ${
                selectedUserFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todos los compañeros
            </button>
            {users.map((u) => (
              <button
                key={u.id_usuario}
                onClick={() => setSelectedUserFilter(u.id_usuario)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all shrink-0 border ${
                  selectedUserFilter === u.id_usuario
                    ? 'border-slate-800 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: u.color }}
                />
                <span>{u.nombre}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>🎂 Cumpleaños</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              <span>🏖️ Vacaciones</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>🇲🇽 Festivo oficial</span>
            </span>
          </div>
        </div>
      </div>

      {/* CALENDAR VIEW */}
      {viewMode === 'grid' ? (
        <div
          className={`rounded-2xl border border-slate-200 shadow-xs overflow-hidden ${calendarBackground ? 'bg-cover bg-center' : 'bg-white'}`}
          style={calendarBackground ? { backgroundImage: `url("${calendarBackground}")` } : undefined}
        >
          
          {/* Days of week header */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80 text-center text-xs font-semibold text-slate-600 py-3">
            {weekDays.map((name, i) => {
              const isWeekend = i === 5 || i === 6; // Sáb, Dom
              return (
                <div key={name} className={isWeekend ? 'text-blue-700 font-bold' : ''}>
                  {name}
                  {isWeekend && <span className="hidden sm:inline text-[10px] text-blue-500 ml-1">(Descanso)</span>}
                </div>
              );
            })}
          </div>

          {/* Month Grid Cells */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
            {calendarDays.map((cell) => {
              const eventData = eventsByDate.get(cell.dateStr);
              const holidaysList = eventData?.holidays || [];
              const birthdaysList = eventData?.birthdays || [];
              const vacationsList = eventData?.vacations || [];
              const hasEvents = holidaysList.length > 0 || birthdaysList.length > 0 || vacationsList.length > 0;
              const hasOfficialHoliday = holidaysList.some((h) => h.tipo === 'oficial');

              return (
                <div
                  key={cell.dateStr}
                  onClick={() => handleSelectDate(cell.dateStr)}
                  className={`min-h-[110px] sm:min-h-[125px] p-1.5 sm:p-2 flex flex-col justify-between transition-colors cursor-pointer group relative ${
                    cell.monthOffset !== 0
                      ? 'bg-slate-50/50 text-slate-400 opacity-60'
                      : cell.isWeekend
                      ? 'bg-slate-50/70'
                      : 'bg-white/80 hover:bg-blue-50/70'
                  } ${cell.isToday ? 'ring-2 ring-blue-600 ring-inset' : ''} ${
                    hasOfficialHoliday ? 'bg-amber-50/30' : ''
                  }`}
                >
                  {/* Cell Top Header */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold rounded-lg w-6 h-6 flex items-center justify-center font-mono ${
                        cell.isToday
                          ? 'bg-blue-600 text-white shadow-xs'
                          : cell.isWeekend
                          ? 'text-blue-800'
                          : cell.monthOffset === 0
                          ? 'text-slate-800'
                          : 'text-slate-400'
                      }`}
                    >
                      {cell.day}
                    </span>

                    {/* Quick indicator badges on top right */}
                    <div className="flex items-center gap-1">
                      {hasOfficialHoliday && (
                        <span
                          title={holidaysList.find((h) => h.tipo === 'oficial')?.nombre}
                          className="w-2 h-2 rounded-full bg-amber-500"
                        />
                      )}
                      {birthdaysList.length > 0 && (
                        <span title="Cumpleaños hoy" className="text-xs">
                          🎂
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Cell Content (Events Stack) */}
                  <div className="my-1 space-y-1 flex-1 overflow-hidden">
                    
                    {/* Official / Cultural Holiday Tag */}
                    {holidaysList.map((h) => (
                      <div
                        key={h.id || h.nombre}
                        title={h.nombre}
                        className={`truncate text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded font-medium ${
                          h.tipo === 'oficial'
                            ? 'bg-amber-100/90 text-amber-900 border border-amber-200'
                            : 'bg-indigo-50 text-indigo-800 border border-indigo-150'
                        }`}
                      >
                        {h.tipo === 'oficial' ? '🇲🇽 ' : '✨ '}
                        {h.nombre}
                      </div>
                    ))}

                    {/* Birthdays */}
                    {birthdaysList.map((b) => (
                      <div
                        key={b.user.id_usuario}
                        title={`Cumpleaños de ${b.user.nombre}`}
                        className="truncate text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded font-bold border border-rose-200 bg-rose-50 text-rose-800 flex items-center gap-1"
                      >
                        <span>🎂</span>
                        <span className="truncate">{b.user.nombre}</span>
                      </div>
                    ))}

                    {/* Vacations (Allows multiple users to coincide without limits!) */}
                    {vacationsList.map((v) => (
                      <div
                        key={`${v.user.id_usuario}_${v.vac.id_vacacion}`}
                        title={`🏖️ Vacaciones: ${v.user.nombre}`}
                        className="truncate text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded font-semibold text-white flex items-center gap-1 shadow-2xs"
                        style={{ backgroundColor: v.user.color }}
                      >
                        <span>🏖️</span>
                        <span className="truncate">{v.user.nombre}</span>
                      </div>
                    ))}
                  </div>

                  {/* Cell Bottom Action */}
                  <div className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity text-right">
                    Ver día →
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      ) : (
        /* AGENDA LIST VIEW */
        <div
          className={`rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4 ${calendarBackground ? 'bg-white/85 backdrop-blur-[2px]' : 'bg-white'}`}
          style={calendarBackground ? { backgroundImage: `url("${calendarBackground}")`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">
              Agenda de eventos · {monthNames[currentMonth]} {currentYear}
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              {monthAgenda.length} días con eventos programados
            </span>
          </div>

          {monthAgenda.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              No hay eventos ni vacaciones programadas para este mes.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {monthAgenda.map((item) => (
                <div
                  key={item.dateStr}
                  onClick={() => handleSelectDate(item.dateStr)}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 p-2 rounded-xl transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 text-center shrink-0">
                      <span className="block text-xl font-bold font-mono text-slate-900">
                        {item.dayNum}
                      </span>
                      <span className="block text-[11px] font-semibold text-slate-500 uppercase">
                        {item.dayOfWeek}
                      </span>
                    </div>

                    <div className="space-y-1">
                      {item.holidays.map((h) => (
                        <div key={h.id || h.nombre} className="text-xs font-semibold text-amber-800 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                          <span>{h.nombre}</span>
                        </div>
                      ))}

                      {item.birthdays.map((b) => (
                        <div key={b.user.id_usuario} className="text-xs font-semibold text-rose-700 flex items-center gap-1.5">
                          <Cake className="w-3.5 h-3.5 text-rose-500" />
                          <span>¡Cumpleaños de {b.user.nombre}!</span>
                        </div>
                      ))}

                      {item.vacations.map((v) => (
                        <div key={v.user.id_usuario} className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                          <Palmtree className="w-3.5 h-3.5 text-blue-600" />
                          <span
                            className="px-2 py-0.5 rounded text-white text-[11px]"
                            style={{ backgroundColor: v.user.color }}
                          >
                            🏖️ {v.user.nombre}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            (del {v.vac.fecha_inicio} al {v.vac.fecha_fin})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button className="text-xs font-semibold text-blue-600 hover:text-blue-800 self-start sm:self-center">
                    Ver detalle →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick Vacation Callout Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center text-xl shrink-0">
            🏖️
          </div>
          <div>
            <h4 className="text-sm font-bold">¿Planeando tus próximas vacaciones?</h4>
            <p className="text-xs text-blue-100">
              Recuerda que tienes 10 días ordinarios por semestre más tus días compensatorios autorizados.
            </p>
          </div>
        </div>
        <button
          onClick={onRequestVacation}
          className="px-4 py-2 text-xs font-bold text-blue-900 bg-white hover:bg-blue-50 active:bg-blue-100 rounded-xl shadow-xs transition-colors whitespace-nowrap shrink-0"
        >
          Solicitar Vacaciones
        </button>
      </div>

    </div>
  );
};
