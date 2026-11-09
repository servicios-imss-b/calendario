/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Usuario, Vacacion, Cumpleanos, Festivo } from '../types';
import { X, Calendar as CalendarIcon, Cake, Palmtree, Sparkles, PlusCircle } from 'lucide-react';

interface DayDetailModalProps {
  dateStr: string; // YYYY-MM-DD
  isOpen: boolean;
  onClose: () => void;
  users: Usuario[];
  vacations: Vacacion[];
  birthdays: Cumpleanos[];
  holidays: Festivo[];
  onRequestVacationForDate: (dateStr: string) => void;
  onAddBirthdayForDate: (dateStr: string) => void;
  currentUserId?: string;
}

export const DayDetailModal: React.FC<DayDetailModalProps> = ({
  dateStr,
  isOpen,
  onClose,
  users,
  vacations,
  birthdays,
  holidays,
  onRequestVacationForDate,
  onAddBirthdayForDate,
  currentUserId,
}) => {
  if (!isOpen || !dateStr) return null;

  const [year, month, day] = dateStr.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  const dayOfWeek = dateObj.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  const formattedDate = dateObj.toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Find holidays on this date
  const dayHolidays = holidays.filter((h) => h.fecha === dateStr);

  // Find birthdays on this date (month & day match, repeating every year!)
  const dayBirthdays = birthdays.filter((b) => {
    if (!b.fecha_cumpleaños) return false;
    const parts = b.fecha_cumpleaños.split('-');
    const bMonth = Number(parts[parts.length - 2]);
    const bDay = Number(parts[parts.length - 1]);
    return bMonth === month && bDay === day;
  });

  const isOfficialHoliday = dayHolidays.some((holiday) => holiday.tipo === 'oficial');
  const dayVacations = isWeekend || isOfficialHoliday
    ? []
    : vacations.filter((vacation) =>
      vacation.estado === 'aprobada' && dateStr >= vacation.fecha_inicio && dateStr <= vacation.fecha_fin
    );

  const getUserById = (id: string) => users.find((u) => u.id_usuario === id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Detalle del día</span>
              {isWeekend && (
                <span className="text-[11px] font-medium text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-md">
                  Fin de semana
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-slate-900 capitalize mt-1">
              {formattedDate}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-6 overflow-y-auto space-y-5">
          
          {/* Holidays */}
          {dayHolidays.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Festividades y Descansos
              </h4>
              <div className="space-y-1.5">
                {dayHolidays.map((h) => (
                  <div
                    key={h.id || h.nombre}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-sm ${
                      h.tipo === 'oficial'
                        ? 'bg-amber-50/80 border-amber-200 text-amber-950 font-medium'
                        : 'bg-indigo-50/70 border-indigo-150 text-indigo-950'
                    }`}
                  >
                    <Sparkles
                      className={`w-4 h-4 shrink-0 ${
                        h.tipo === 'oficial' ? 'text-amber-600' : 'text-indigo-600'
                      }`}
                    />
                    <div className="flex-1">
                      <span className="font-semibold">{h.nombre}</span>
                      <span className="block text-xs opacity-75">
                        {h.tipo === 'oficial'
                          ? 'Día de descanso obligatorio (Art. 74 LFT)'
                          : 'Celebración cultural tradicional'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Birthdays */}
          {dayBirthdays.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Cake className="w-3.5 h-3.5 text-rose-500" />
                <span>Cumpleaños de hoy</span>
              </h4>
              <div className="grid gap-2">
                {dayBirthdays.map((b) => {
                  const user = getUserById(b.id_usuario);
                  if (!user) return null;
                  return (
                    <div
                      key={b.id_evento}
                      className="flex items-center justify-between p-3 rounded-xl border border-rose-150 bg-rose-50/60"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-xs"
                          style={{ backgroundColor: user.color }}
                        >
                          {user.nombre.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">🎂 ¡Cumpleaños de {user.nombre}!</p>
                          <p className="text-xs text-rose-700">Se celebra anualmente</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Vacations */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Palmtree className="w-3.5 h-3.5 text-blue-500" />
              <span>Compañeros de vacaciones</span>
            </h4>
            {dayVacations.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-slate-400 text-xs">
                No hay vacaciones programadas para este día
              </div>
            ) : (
              <div className="grid gap-2">
                {dayVacations.map((v) => {
                  const user = getUserById(v.id_usuario);
                  if (!user) return null;
                  return (
                    <div
                      key={v.id_vacacion}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white shadow-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-xs"
                          style={{ backgroundColor: user.color }}
                        >
                          {user.nombre.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-900">
                              🏖️ {user.nombre}
                            </span>
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: user.color }}
                            />
                          </div>
                          <p className="text-xs text-slate-500">
                            Del {v.fecha_inicio} al {v.fecha_fin} · {v.cantidad_dias} día(s) hábiles
                          </p>
                          {v.observaciones && (
                            <p className="text-xs text-slate-600 italic mt-0.5">"{v.observaciones}"</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-2.5 justify-end">
          <button
            onClick={() => {
              onClose();
              onAddBirthdayForDate(dateStr);
            }}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:border-slate-300 rounded-xl transition-colors"
          >
            Registrar cumpleaños
          </button>
          <button
            onClick={() => {
              onClose();
              onRequestVacationForDate(dateStr);
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Solicitar vacaciones aquí</span>
          </button>
        </div>

      </div>
    </div>
  );
};
