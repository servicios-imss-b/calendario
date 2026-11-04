/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Usuario, Vacacion, Cumpleanos, Festivo } from '../types';
import { getSeasonalTheme } from '../utils/seasonalTheme';
import { storage } from '../services/storageService';
import {
  Calendar as CalendarIcon,
  Cake,
  Palmtree,
  PlusCircle,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  UserCheck,
} from 'lucide-react';

interface HomeViewProps {
  onNavigateToCalendar: () => void;
  onNavigateToMySpace: () => void;
  onRequestVacation: () => void;
  onOpenBirthdayModal: () => void;
  users: Usuario[];
  vacations: Vacacion[];
  birthdays: Cumpleanos[];
  holidays: Festivo[];
}

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigateToCalendar,
  onNavigateToMySpace,
  onRequestVacation,
  onOpenBirthdayModal,
  users,
  vacations,
  birthdays,
  holidays,
}) => {
  const { currentUser } = useAuth();
  const today = new Date();
  const currentMonth = today.getMonth();
  const todayStr = today.toISOString().split('T')[0];

  const theme = useMemo(() => getSeasonalTheme(currentMonth), [currentMonth]);

  // Current balance for logged in user
  const balance = useMemo(() => {
    if (!currentUser) return null;
    return storage.getUserBalance(currentUser.id_usuario);
  }, [currentUser]);

  // Who is currently on vacation today
  const currentlyOnVacation = useMemo(() => {
    return vacations
      .filter((v) => v.estado === 'aprobada' && todayStr >= v.fecha_inicio && todayStr <= v.fecha_fin)
      .map((v) => {
        const u = users.find((usr) => usr.id_usuario === v.id_usuario);
        return { vacation: v, user: u };
      })
      .filter((item) => item.user !== undefined);
  }, [vacations, users, todayStr]);

  // Next upcoming birthdays (next 3)
  const upcomingBirthdays = useMemo(() => {
    const list: { user: Usuario; dateStr: string; daysRemaining: number }[] = [];
    const thisYear = today.getFullYear();

    birthdays.forEach((b) => {
      const u = users.find((usr) => usr.id_usuario === b.id_usuario);
      if (!u || !b.fecha_cumpleaños) return;

      const parts = b.fecha_cumpleaños.split('-');
      const m = Number(parts[parts.length - 2]);
      const d = Number(parts[parts.length - 1]);

      let bdayDate = new Date(thisYear, m - 1, d);
      // If already passed this year, look at next year
      if (bdayDate < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
        bdayDate = new Date(thisYear + 1, m - 1, d);
      }

      const diffMs = bdayDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      list.push({
        user: u,
        dateStr: `${bdayDate.getDate()} de ${bdayDate.toLocaleDateString('es-MX', { month: 'long' })}`,
        daysRemaining: diffDays,
      });
    });

    list.sort((a, b) => a.daysRemaining - b.daysRemaining);
    return list.slice(0, 4);
  }, [birthdays, users]);

  // Next upcoming Mexican holiday
  const upcomingHoliday = useMemo(() => {
    const future = holidays.filter((h) => h.fecha >= todayStr && h.tipo === 'oficial');
    future.sort((a, b) => a.fecha.localeCompare(b.fecha));
    return future[0];
  }, [holidays, todayStr]);

  return (
    <div className="space-y-8 pb-12">
      
      {/* HERO BANNER WITH SEASONAL BACKDROP */}
      <div
        className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 md:p-10 shadow-sm"
        style={{ backgroundImage: theme.bannerPattern }}
      >
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold border shadow-2xs bg-white text-slate-800">
            <span>{theme.emoji}</span>
            <span>Temática de {theme.monthName}: {theme.themeName}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Mi Calendario
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            Plataforma compartida del equipo para coordinar vacaciones sin bloqueos, celebrar los cumpleaños de todos y administrar días compensatorios con total transparencia.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={onNavigateToCalendar}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all"
            >
              <CalendarIcon className="w-4 h-4" />
              <span>Ver Calendario Compartido</span>
            </button>

            <button
              onClick={onRequestVacation}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4 text-blue-600" />
              <span>Solicitar Vacaciones</span>
            </button>

            {currentUser && (
              <button
                onClick={onNavigateToMySpace}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:text-blue-900 transition-colors"
              >
                <span>Mi espacio personal</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Floating Seasonal Emoji Watermark */}
        <div className="absolute right-6 -bottom-6 select-none pointer-events-none opacity-10 text-8xl sm:text-9xl">
          {theme.emoji}
        </div>
      </div>

      {/* PERSONAL BALANCE CARD (IF LOGGED IN) */}
      {currentUser && balance && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-base font-bold shadow-xs shrink-0"
                style={{ backgroundColor: currentUser.color }}
              >
                {currentUser.nombre.charAt(0)}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Hola, {currentUser.nombre}
                </h3>
                <p className="text-xs text-slate-500">
                  Resumen de tus saldos para el periodo {balance.periodo}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onOpenBirthdayModal}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Cake className="w-3.5 h-3.5 text-rose-500" />
                <span>Actualizar mi cumpleaños</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
            <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-150">
              <span className="text-xs font-medium text-blue-700 block">Días Ordinarios Disponibles</span>
              <span className="text-2xl font-bold text-blue-900 font-mono tabular-nums">
                {balance.dias_disponibles}
              </span>
              <span className="text-[11px] text-blue-600/80 block mt-0.5">
                {balance.dias_utilizados} utilizados de {balance.dias_asignados}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-150">
              <span className="text-xs font-medium text-amber-700 block">Compensatorios Disponibles</span>
              <span className="text-2xl font-bold text-amber-900 font-mono tabular-nums">
                {balance.saldo_compensatorio}
              </span>
              <span className="text-[11px] text-amber-600/80 block mt-0.5">
                {balance.dias_compensatorios_autorizados} autorizados
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-150">
              <span className="text-xs font-medium text-emerald-700 block">Total Disponible</span>
              <span className="text-2xl font-bold text-emerald-900 font-mono tabular-nums">
                {balance.dias_disponibles + balance.saldo_compensatorio}
              </span>
              <span className="text-[11px] text-emerald-600/80 block mt-0.5">
                Días hábiles para disfrutar
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-150 flex flex-col justify-between">
              <span className="text-xs font-medium text-indigo-700 block">Acción Rápida</span>
              <button
                onClick={onRequestVacation}
                className="w-full mt-2 py-1.5 px-3 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
              >
                Solicitar ahora
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2-COLUMN SECTION: VACATIONS RIGHT NOW & UPCOMING BIRTHDAYS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* On Vacation Right Now */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Palmtree className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                De vacaciones hoy
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {currentlyOnVacation.length} persona(s)
            </span>
          </div>

          {currentlyOnVacation.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              🏖️ Nadie del equipo se encuentra de vacaciones hoy. ¡Todos activos!
            </div>
          ) : (
            <div className="space-y-2.5">
              {currentlyOnVacation.map(({ vacation, user }) => (
                <div
                  key={vacation.id_vacacion}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-150 bg-slate-50/50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-xs shrink-0"
                      style={{ backgroundColor: user?.color }}
                    >
                      {user?.nombre.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {user?.nombre}
                      </p>
                      <p className="text-xs text-slate-500">
                        Hasta el {vacation.fecha_fin} ({vacation.cantidad_dias} días)
                      </p>
                    </div>
                  </div>
                  <span
                    className="px-2.5 py-1 text-[11px] font-semibold text-white rounded-lg shadow-2xs"
                    style={{ backgroundColor: user?.color }}
                  >
                    Disfrutando 🏖️
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Birthdays */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <Cake className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Próximos cumpleaños
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Se repiten cada año
            </span>
          </div>

          {upcomingBirthdays.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No hay cumpleaños registrados aún.
            </div>
          ) : (
            <div className="space-y-2.5">
              {upcomingBirthdays.map((item) => (
                <div
                  key={item.user.id_usuario}
                  className="flex items-center justify-between p-3 rounded-xl border border-rose-100 bg-rose-50/40"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-xs shrink-0"
                      style={{ backgroundColor: item.user.color }}
                    >
                      {item.user.nombre.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        🎂 {item.user.nombre}
                      </p>
                      <p className="text-xs text-rose-700">
                        {item.dateStr}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-mono font-semibold text-rose-800 bg-rose-100/70 px-2.5 py-1 rounded-lg">
                    {item.daysRemaining === 0
                      ? '¡Es hoy! 🎉'
                      : item.daysRemaining === 1
                      ? 'Mañana'
                      : `En ${item.daysRemaining} días`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* MEXICAN HOLIDAYS PREVIEW */}
      {upcomingHoliday && (
        <div className="p-4 sm:p-5 rounded-2xl border border-amber-200 bg-amber-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center text-lg font-bold">
              🇲🇽
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-800">
                Próximo día festivo oficial (Art. 74 LFT)
              </span>
              <h4 className="text-base font-bold text-amber-950">
                {upcomingHoliday.nombre} · {upcomingHoliday.fecha}
              </h4>
              <p className="text-xs text-amber-800/80">
                Día no laborable de descanso obligatorio oficial en toda la República Mexicana.
              </p>
            </div>
          </div>
          <button
            onClick={onNavigateToCalendar}
            className="px-4 py-2 text-xs font-bold text-amber-900 bg-white border border-amber-300 hover:bg-amber-100 rounded-xl shadow-xs transition-colors shrink-0"
          >
            Ver en calendario
          </button>
        </div>
      )}

    </div>
  );
};
