/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { storage } from '../services/storageService';
import { Vacacion, Cumpleanos, Movimiento } from '../types';
import {
  Calendar as CalendarIcon,
  Cake,
  Palmtree,
  PlusCircle,
  Clock,
  Award,
  FileText,
  AlertCircle,
  XCircle,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';

interface MySpaceViewProps {
  onNavigateToCalendar: () => void;
  onNavigateToMyRequests: () => void;
  onRequestVacation: () => void;
  onOpenBirthdayModal: () => void;
  onOpenCompensatoryModal: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
  refreshTrigger: number;
}

export const MySpaceView: React.FC<MySpaceViewProps> = ({
  onNavigateToCalendar,
  onNavigateToMyRequests,
  onRequestVacation,
  onOpenBirthdayModal,
  onOpenCompensatoryModal,
  onSuccess,
  onError,
  refreshTrigger,
}) => {
  const { currentUser, isAdmin } = useAuth();

  const balance = useMemo(() => {
    if (!currentUser) return null;
    return storage.getUserBalance(currentUser.id_usuario);
  }, [currentUser, refreshTrigger]);

  const userVacations = useMemo(() => {
    if (!currentUser) return [];
    return storage
      .getVacations()
      .filter((v) => v.id_usuario === currentUser.id_usuario)
      .sort((a, b) => b.fecha_solicitud.localeCompare(a.fecha_solicitud));
  }, [currentUser, refreshTrigger]);

  const pendingRequests = useMemo(() => {
    return userVacations.filter((v) => v.estado === 'pendiente' || v.estado === 'cancelacion_solicitada');
  }, [userVacations]);

  const approvedVacations = useMemo(() => {
    return userVacations.filter((v) => v.estado === 'aprobada');
  }, [userVacations]);

  const userBirthday = useMemo(() => {
    if (!currentUser) return null;
    return storage.getBirthdays().find((b) => b.id_usuario === currentUser.id_usuario);
  }, [currentUser, refreshTrigger]);

  const userMovements = useMemo(() => {
    if (!currentUser) return [];
    return storage
      .getMovements()
      .filter((m) => m.id_usuario === currentUser.id_usuario)
      .slice(0, 5);
  }, [currentUser, refreshTrigger]);

  if (!currentUser || !balance) {
    if (storage.getAppsScriptUrl()) {
      return (
        <div className="py-16 text-center space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Solicitudes públicas</h2>
            <p className="mt-1 text-sm text-slate-500">
              Elige un usuario al enviar. Las solicitudes quedan pendientes y no verifican identidad.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={onRequestVacation}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
            >
              <PlusCircle className="w-4 h-4" />
              Solicitar vacaciones
            </button>
            <button
              onClick={onOpenCompensatoryModal}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-lg"
            >
              <Award className="w-4 h-4" />
              Solicitar compensatorios
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-slate-500">Inicia sesión para ver tu espacio personal.</p>
      </div>
    );
  }

  const handleCancelPending = (vacId: string) => {
    try {
      storage.cancelVacation(vacId, currentUser.id_usuario, isAdmin);
      onSuccess('Solicitud cancelada exitosamente.');
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : 'Error al cancelar');
    }
  };

  const handleRequestCancelApproved = (vacId: string) => {
    try {
      storage.cancelVacation(vacId, currentUser.id_usuario, isAdmin);
      if (isAdmin) {
        onSuccess('Vacación cancelada y días restituidos a tu saldo.');
      } else {
        onSuccess('Solicitud de cancelación enviada al administrador.');
      }
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : 'Error al solicitar cancelación');
    }
  };

  const totalDisponible = balance.dias_disponibles + balance.saldo_compensatorio;

  return (
    <div className="space-y-6 pb-12">
      
      {/* USER PROFILE HEADER CARD */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-md shrink-0"
            style={{ backgroundColor: currentUser.color }}
          >
            {currentUser.nombre.charAt(0)}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {currentUser.nombre}
              </h2>
              <span
                className="w-3.5 h-3.5 rounded-full border-2 border-white shadow-xs"
                style={{ backgroundColor: currentUser.color }}
                title={`Color exclusivo: ${currentUser.color}`}
              />
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 capitalize">
                {currentUser.rol === 'admin' ? 'Administrador' : 'Colaborador'}
              </span>
            </div>

            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <span>Miembro desde {new Date(currentUser.fecha_registro).toLocaleDateString('es-MX', { year: 'numeric', month: 'long' })}</span>
              <span>·</span>
              <span className="font-mono text-slate-400">ID: {currentUser.id_usuario}</span>
            </p>

            {userBirthday ? (
              <p className="text-xs font-medium text-rose-700 flex items-center gap-1 pt-0.5">
                <Cake className="w-3.5 h-3.5" />
                <span>Cumpleaños: {userBirthday.fecha_cumpleaños} (se repite cada año)</span>
              </p>
            ) : (
              <p className="text-xs text-slate-400 flex items-center gap-1 pt-0.5">
                <Cake className="w-3.5 h-3.5" />
                <span>No has registrado tu fecha de cumpleaños</span>
              </p>
            )}
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onRequestVacation}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Solicitar vacaciones</span>
          </button>
          <button
            onClick={onOpenCompensatoryModal}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors"
          >
            <Award className="w-4 h-4 text-amber-600" />
            <span>Solicitar compensatorios</span>
          </button>
          <button
            onClick={onOpenBirthdayModal}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
          >
            <Cake className="w-4 h-4 text-rose-600" />
            <span>Cumpleaños</span>
          </button>
        </div>
      </div>

      {/* DETAILED BALANCES BREAKDOWN */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Control Individual de Saldos · Periodo {balance.periodo}
            </h3>
            <p className="text-xs text-slate-500">
              Regla de 10 días por semestre más días compensatorios independientes
            </p>
          </div>
          <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">
            10 días / semestre
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
          
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-medium text-slate-600 block">Días Asignados</span>
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {balance.dias_asignados}
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5">Semestre ordinario</span>
          </div>

          <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-150">
            <span className="text-xs font-medium text-blue-800 block">Ordinarios Utilizados</span>
            <span className="text-2xl font-bold text-blue-950 font-mono tabular-nums">
              {balance.dias_utilizados}
            </span>
            <span className="text-[11px] text-blue-600 block mt-0.5">Días disfrutados</span>
          </div>

          <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200">
            <span className="text-xs font-bold text-blue-900 block">Ordinarios Disponibles</span>
            <span className="text-2xl font-extrabold text-blue-700 font-mono tabular-nums">
              {balance.dias_disponibles}
            </span>
            <span className="text-[11px] text-blue-600 block mt-0.5">Saldo ordinario</span>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-150">
            <span className="text-xs font-medium text-amber-800 block">Compensatorios Disp.</span>
            <span className="text-2xl font-bold text-amber-950 font-mono tabular-nums">
              {balance.saldo_compensatorio}
            </span>
            <span className="text-[11px] text-amber-700 block mt-0.5">
              {balance.dias_compensatorios_autorizados} autorizados
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 col-span-2 md:col-span-1">
            <span className="text-xs font-bold text-emerald-900 block">Total Disponible</span>
            <span className="text-3xl font-extrabold text-emerald-700 font-mono tabular-nums">
              {totalDisponible}
            </span>
            <span className="text-[11px] text-emerald-700 block mt-0.5">Días hábiles listos</span>
          </div>

        </div>
      </div>

      {/* QUICK ACCESS BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={onNavigateToCalendar}
          className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/20 text-left transition-all shadow-xs group"
        >
          <CalendarIcon className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform mb-2" />
          <span className="block text-xs font-bold text-slate-800">Consultar Calendario</span>
          <span className="block text-[11px] text-slate-500">Ver eventos y vacaciones compartidas</span>
        </button>

        <button
          onClick={onNavigateToMyRequests}
          className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/20 text-left transition-all shadow-xs group"
        >
          <FileText className="w-5 h-5 text-indigo-600 group-hover:scale-110 transition-transform mb-2" />
          <span className="block text-xs font-bold text-slate-800">Mis Solicitudes</span>
          <span className="block text-[11px] text-slate-500">Bandeja de estado y seguimiento</span>
        </button>

        <button
          onClick={onRequestVacation}
          className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/20 text-left transition-all shadow-xs group"
        >
          <Palmtree className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform mb-2" />
          <span className="block text-xs font-bold text-slate-800">Solicitar Vacaciones</span>
          <span className="block text-[11px] text-slate-500">Nuevo periodo vacacional</span>
        </button>

        <button
          onClick={onOpenCompensatoryModal}
          className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/20 text-left transition-all shadow-xs group"
        >
          <Award className="w-5 h-5 text-amber-600 group-hover:scale-110 transition-transform mb-2" />
          <span className="block text-xs font-bold text-slate-800">Días Compensatorios</span>
          <span className="block text-[11px] text-slate-500">Reclamar jornada extraordinaria</span>
        </button>
      </div>

      {/* PENDING REQUESTS SECTION */}
      {pendingRequests.length > 0 && (
        <div className="bg-white rounded-2xl border border-amber-200/80 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-amber-100">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <h3 className="text-base font-bold text-slate-900">
                Solicitudes Pendientes de Resolución ({pendingRequests.length})
              </h3>
            </div>
            <span className="text-xs text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md font-medium">
              En revisión por administración
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {pendingRequests.map((req) => (
              <div key={req.id_vacacion} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      Del {req.fecha_inicio} al {req.fecha_fin}
                    </span>
                    <span className="text-[11px] font-mono font-semibold px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md">
                      {req.cantidad_dias} días hábiles
                    </span>
                    <span className="text-[11px] text-slate-500">
                      ({req.dias_ordinarios} ord. + {req.dias_compensatorios} comp.)
                    </span>
                  </div>
                  {req.observaciones && (
                    <p className="text-xs text-slate-600 italic">"{req.observaciones}"</p>
                  )}
                  <p className="text-[11px] text-slate-400">
                    Solicitado el {new Date(req.fecha_solicitud).toLocaleDateString('es-MX')}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCancelPending(req.id_vacacion)}
                    className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Cancelar solicitud</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VACATION HISTORY & MOVEMENTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Vacation History */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">
              Historial de Vacaciones Aprobadas
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              {approvedVacations.length} periodo(s)
            </span>
          </div>

          {approvedVacations.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No tienes periodos vacacionales aprobados aún.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {approvedVacations.map((v) => (
                <div key={v.id_vacacion} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      🏖️ {v.fecha_inicio} al {v.fecha_fin}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {v.cantidad_dias} días hábiles ({v.dias_ordinarios} ord. / {v.dias_compensatorios} comp.)
                    </p>
                    {v.administrador_responsable && (
                      <p className="text-[10px] text-emerald-700">
                        Aprobado por: {v.administrador_responsable}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => handleRequestCancelApproved(v.id_vacacion)}
                    title="Solicitar cancelación al administrador"
                    className="text-[11px] text-slate-500 hover:text-rose-600 underline"
                  >
                    {isAdmin ? 'Cancelar periodo' : 'Solicitar cancelación'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Movements Audit for User */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">
              Últimos Movimientos de Saldo
            </h3>
            <span className="text-xs text-slate-400 font-mono">Auditable</span>
          </div>

          {userMovements.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              Sin movimientos registrados en este periodo.
            </div>
          ) : (
            <div className="space-y-2.5">
              {userMovements.map((m) => (
                <div key={m.id_movimiento} className="p-3 rounded-xl bg-slate-50 border border-slate-150 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 capitalize">
                      {m.tipo_movimiento.replace(/_/g, ' ')}
                    </span>
                    <span className="font-mono text-slate-500 text-[11px]">
                      {m.saldo_anterior}d → {m.saldo_posterior}d
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">{m.motivo}</p>
                  <p className="text-[10px] text-slate-400">
                    {new Date(m.fecha).toLocaleDateString('es-MX')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
