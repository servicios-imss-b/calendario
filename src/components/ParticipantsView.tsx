/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Usuario, Cumpleanos, Vacacion } from '../types';
import { storage } from '../services/storageService';
import { Users, Cake, Palmtree, UserCheck, Shield } from 'lucide-react';

interface ParticipantsViewProps {
  users: Usuario[];
  birthdays: Cumpleanos[];
  vacations: Vacacion[];
  onSelectUserToViewCalendar: (userId: string) => void;
}

export const ParticipantsView: React.FC<ParticipantsViewProps> = ({
  users,
  birthdays,
  vacations,
  onSelectUserToViewCalendar,
}) => {
  const { currentUser, switchUser } = useAuth();
  const todayStr = new Date().toISOString().split('T')[0];

  const participantsData = useMemo(() => {
    return users.map((u) => {
      const bday = birthdays.find((b) => b.id_usuario === u.id_usuario);
      const balance = storage.getUserBalance(u.id_usuario);
      const userVacations = vacations.filter((v) => v.id_usuario === u.id_usuario && v.estado === 'aprobada');
      const isOnVacationNow = userVacations.some((v) => todayStr >= v.fecha_inicio && todayStr <= v.fecha_fin);
      const nextVacation = userVacations
        .filter((v) => v.fecha_inicio >= todayStr)
        .sort((a, b) => a.fecha_inicio.localeCompare(b.fecha_inicio))[0];

      return {
        user: u,
        bday,
        balance,
        isOnVacationNow,
        nextVacation,
        totalVacations: userVacations.length,
      };
    });
  }, [users, birthdays, vacations, todayStr]);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>Participantes y Equipo</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Directorio compartido donde cada colaborador tiene su color exclusivo y calendario personal
          </p>
        </div>
        <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl self-start sm:self-auto">
          {users.length} miembros registrados
        </span>
      </div>

      {/* Grid of Users */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {participantsData.map((item) => {
          const isCurrent = currentUser?.id_usuario === item.user.id_usuario;

          return (
            <div
              key={item.user.id_usuario}
              className={`bg-white rounded-2xl border shadow-xs p-5 flex flex-col justify-between transition-all ${
                isCurrent
                  ? 'border-blue-400 ring-2 ring-blue-500/10'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="space-y-4">
                {/* User Top info */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-xs shrink-0"
                      style={{ backgroundColor: item.user.color }}
                    >
                      {item.user.nombre.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-base font-bold text-slate-900">
                          {item.user.nombre}
                        </h3>
                        {item.user.rol === 'admin' && (
                          <span title="Administrador" className="text-amber-600">
                            <Shield className="w-4 h-4 fill-amber-100" />
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block"
                          style={{ backgroundColor: item.user.color }}
                          title={`Color: ${item.user.color}`}
                        />
                        <span className="text-xs text-slate-400 capitalize">
                          {item.user.rol === 'admin' ? 'Administrador' : 'Colaborador'}
                        </span>
                        <span className="text-slate-300">·</span>
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                            item.user.estado === 'activo'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {item.user.estado}
                        </span>
                      </div>
                    </div>
                  </div>

                  {item.isOnVacationNow && (
                    <span className="px-2 py-0.5 text-[10px] font-bold text-white bg-blue-600 rounded-md shadow-2xs">
                      En Vacaciones 🏖️
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1 text-slate-500">
                      <Cake className="w-3.5 h-3.5 text-rose-500" />
                      <span>Cumpleaños:</span>
                    </span>
                    <span className="font-semibold text-slate-800">
                      {item.bday?.fecha_cumpleaños || 'No registrado'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-500">Días ordinarios disponibles:</span>
                    <span className="font-mono font-bold text-blue-700">
                      {item.balance.dias_disponibles} días
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-500">Días compensatorios disponibles:</span>
                    <span className="font-mono font-bold text-amber-700">
                      {item.balance.saldo_compensatorio} días
                    </span>
                  </div>

                  {item.nextVacation && (
                    <div className="p-2 rounded-lg bg-blue-50/70 text-[11px] text-blue-900">
                      <span className="font-bold">Próximas vacaciones: </span>
                      <span>{item.nextVacation.fecha_inicio} al {item.nextVacation.fecha_fin}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Card Footer */}
              <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => onSelectUserToViewCalendar(item.user.id_usuario)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  Ver en calendario →
                </button>

                {!isCurrent && item.user.estado === 'activo' && (
                  <button
                    onClick={() => switchUser(item.user.id_usuario)}
                    className="px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    Probar como {item.user.nombre}
                  </button>
                )}
                {isCurrent && (
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    Tu sesión actual
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
