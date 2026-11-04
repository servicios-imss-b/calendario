/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Usuario, Vacacion, VacationStatus } from '../../types';
import { storage } from '../../services/storageService';
import {
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  AlertCircle,
  X,
  User,
  Calendar,
} from 'lucide-react';

interface AdminRequestsProps {
  vacations: Vacacion[];
  users: Usuario[];
  adminName: string;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
  onRefresh: () => void;
}

export const AdminRequests: React.FC<AdminRequestsProps> = ({
  vacations,
  users,
  adminName,
  onSuccess,
  onError,
  onRefresh,
}) => {
  const [filterState, setFilterState] = useState<string>('todas');
  const [detailVacation, setDetailVacation] = useState<Vacacion | null>(null);
  const [rejectingVacation, setRejectingVacation] = useState<Vacacion | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const getUser = (id: string) => users.find((u) => u.id_usuario === id);

  const filteredVacations = vacations
    .filter((v) => {
      if (filterState === 'todas') return true;
      if (filterState === 'pendiente') return v.estado === 'pendiente' || v.estado === 'cancelacion_solicitada';
      return v.estado === filterState;
    })
    .sort((a, b) => b.fecha_solicitud.localeCompare(a.fecha_solicitud));

  const handleApprove = (v: Vacacion) => {
    try {
      storage.approveVacation(v.id_vacacion, adminName);
      const user = getUser(v.id_usuario);
      onSuccess(
        `Solicitud de ${v.cantidad_dias} días para ${user ? user.nombre : 'el usuario'} aprobada y descontada del saldo.`
      );
      onRefresh();
      if (detailVacation?.id_vacacion === v.id_vacacion) {
        setDetailVacation(null);
      }
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : 'Error al aprobar solicitud');
    }
  };

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingVacation) return;
    if (!rejectionReason.trim()) {
      onError('Debes ingresar un motivo para el rechazo.');
      return;
    }

    try {
      storage.rejectVacation(rejectingVacation.id_vacacion, rejectionReason.trim(), adminName);
      const user = getUser(rejectingVacation.id_usuario);
      onSuccess(
        `Solicitud de ${user ? user.nombre : 'usuario'} rechazada. No se descontaron días de su saldo.`
      );
      setRejectingVacation(null);
      setRejectionReason('');
      onRefresh();
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : 'Error al rechazar solicitud');
    }
  };

  const getStatusBadge = (estado: VacationStatus) => {
    switch (estado) {
      case 'aprobada':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">Aprobada</span>;
      case 'pendiente':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">Pendiente</span>;
      case 'cancelacion_solicitada':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-50 text-purple-800 border border-purple-200">Cancelación Solicitada</span>;
      case 'rechazada':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-50 text-rose-800 border border-rose-200">Rechazada</span>;
      case 'cancelada':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-600 border border-slate-200">Cancelada</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span>Gestión de Solicitudes de Vacaciones</span>
          </h3>
          <p className="text-xs text-slate-500">
            Revisión, aprobación y rechazo de periodos vacacionales con validación de saldos
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          {[
            { id: 'todas', label: 'Todas' },
            { id: 'pendiente', label: 'Pendientes' },
            { id: 'aprobada', label: 'Aprobadas' },
            { id: 'rechazada', label: 'Rechazadas' },
            { id: 'cancelada', label: 'Canceladas' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterState(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                filterState === tab.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Usuario</th>
                <th className="py-3 px-4">Periodo Solicitado</th>
                <th className="py-3 px-4 text-center">Días Hábiles</th>
                <th className="py-3 px-4">Tipo de Días</th>
                <th className="py-3 px-4">Fecha Solicitud</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVacations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No hay solicitudes registradas con este filtro.
                  </td>
                </tr>
              ) : (
                filteredVacations.map((v) => {
                  const user = getUser(v.id_usuario);
                  const isPending = v.estado === 'pendiente' || v.estado === 'cancelacion_solicitada';

                  return (
                    <tr key={v.id_vacacion} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-2xs"
                            style={{ backgroundColor: user?.color || '#3b82f6' }}
                          >
                            {user?.nombre.charAt(0) || '?'}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{user?.nombre || v.id_usuario}</span>
                            <span className="text-[10px] text-slate-400 capitalize">{user?.rol || 'usuario'}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-800">
                        Del {v.fecha_inicio} al {v.fecha_fin}
                      </td>

                      <td className="py-3 px-4 text-center font-mono font-bold text-blue-700">
                        {v.cantidad_dias}
                      </td>

                      <td className="py-3 px-4 text-slate-600 capitalize">
                        {v.dias_ordinarios} ord. / {v.dias_compensatorios} comp.
                      </td>

                      <td className="py-3 px-4 text-slate-500">
                        {new Date(v.fecha_solicitud).toLocaleDateString('es-MX')}
                      </td>

                      <td className="py-3 px-4">{getStatusBadge(v.estado)}</td>

                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setDetailVacation(v)}
                            title="Consultar detalle"
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {isPending && (
                            <>
                              <button
                                onClick={() => handleApprove(v)}
                                title="Aprobar solicitud"
                                className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Aprobar</span>
                              </button>

                              <button
                                onClick={() => {
                                  setRejectingVacation(v);
                                  setRejectionReason('');
                                }}
                                title="Rechazar solicitud"
                                className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Rechazar</span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {detailVacation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h4 className="text-sm font-bold text-slate-900">Detalle de Solicitud de Vacaciones</h4>
              <button onClick={() => setDetailVacation(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-xs shrink-0"
                  style={{ backgroundColor: getUser(detailVacation.id_usuario)?.color }}
                >
                  {getUser(detailVacation.id_usuario)?.nombre.charAt(0)}
                </div>
                <div>
                  <h5 className="text-sm font-bold text-slate-900">{getUser(detailVacation.id_usuario)?.nombre}</h5>
                  <p className="text-slate-500">ID de vacación: {detailVacation.id_vacacion}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50">
                  <span className="text-slate-400 block text-[11px]">Periodo de descanso</span>
                  <span className="font-bold text-slate-800 text-sm">
                    {detailVacation.fecha_inicio} al {detailVacation.fecha_fin}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-150">
                  <span className="text-blue-700 block text-[11px]">Días hábiles calculados</span>
                  <span className="font-bold text-blue-900 text-sm font-mono">
                    {detailVacation.cantidad_dias} días
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 space-y-1">
                <span className="text-slate-500 block font-semibold">Desglose de días:</span>
                <p className="text-slate-700">
                  Días ordinarios a descontar: <strong>{detailVacation.dias_ordinarios}</strong>
                </p>
                <p className="text-slate-700">
                  Días compensatorios a descontar: <strong>{detailVacation.dias_compensatorios}</strong>
                </p>
              </div>

              {detailVacation.observaciones && (
                <div className="p-3 rounded-xl bg-slate-50">
                  <span className="text-slate-500 font-semibold block mb-0.5">Observaciones del colaborador:</span>
                  <p className="text-slate-700 italic">"{detailVacation.observaciones}"</p>
                </div>
              )}

              {detailVacation.motivo_rechazo && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800">
                  <span className="font-semibold block mb-0.5">Motivo del rechazo:</span>
                  <p>{detailVacation.motivo_rechazo}</p>
                </div>
              )}

              <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 space-y-0.5">
                <p>Fecha de solicitud: {new Date(detailVacation.fecha_solicitud).toLocaleString('es-MX')}</p>
                {detailVacation.fecha_resolucion && (
                  <p>Resolución: {new Date(detailVacation.fecha_resolucion).toLocaleString('es-MX')} por {detailVacation.administrador_responsable}</p>
                )}
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setDetailVacation(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg"
              >
                Cerrar
              </button>
              {(detailVacation.estado === 'pendiente' || detailVacation.estado === 'cancelacion_solicitada') && (
                <>
                  <button
                    onClick={() => {
                      setRejectingVacation(detailVacation);
                      setDetailVacation(null);
                    }}
                    className="px-3.5 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg"
                  >
                    Rechazar
                  </button>
                  <button
                    onClick={() => handleApprove(detailVacation)}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
                  >
                    Aprobar Solicitud
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* REJECTION REASON MODAL */}
      {rejectingVacation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-rose-50">
              <h4 className="text-sm font-bold text-rose-950">Rechazar Solicitud de Vacaciones</h4>
              <button onClick={() => setRejectingVacation(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRejectSubmit} className="p-6 space-y-4">
              <p className="text-xs text-slate-600">
                Indica el motivo por el cual no es posible autorizar esta solicitud para <strong>{getUser(rejectingVacation.id_usuario)?.nombre}</strong>. El saldo del usuario permanecerá intacto.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Motivo o justificación del rechazo:
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Ej: Cobertura crítica requerida en esas fechas para entregable..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-rose-500 outline-hidden"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectingVacation(null)}
                  className="px-3 py-1.5 text-xs text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs"
                >
                  Confirmar Rechazo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
