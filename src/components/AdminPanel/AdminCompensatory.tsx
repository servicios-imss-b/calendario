/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Usuario, CompensatorioSolicitud } from '../../types';
import { storage } from '../../services/storageService';
import {
  Award,
  CheckCircle2,
  XCircle,
  PlusCircle,
  Clock,
  Sliders,
  AlertCircle,
  X,
  History,
} from 'lucide-react';

interface AdminCompensatoryProps {
  compensatoryRequests: CompensatorioSolicitud[];
  users: Usuario[];
  adminName: string;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
  onRefresh: () => void;
}

export const AdminCompensatory: React.FC<AdminCompensatoryProps> = ({
  compensatoryRequests,
  users,
  adminName,
  onSuccess,
  onError,
  onRefresh,
}) => {
  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [rejectingReq, setRejectingReq] = useState<CompensatorioSolicitud | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Form: Add Direct Compensatory Days
  const [targetUserId, setTargetUserId] = useState(users[0]?.id_usuario || '');
  const [addDays, setAddDays] = useState(1);
  const [addMotivo, setAddMotivo] = useState('');

  // Form: Adjust Balance with Justification
  const [adjustUserId, setAdjustUserId] = useState(users[0]?.id_usuario || '');
  const [adjustOrdinarios, setAdjustOrdinarios] = useState(10);
  const [adjustCompensatorios, setAdjustCompensatorios] = useState(0);
  const [adjustJustificacion, setAdjustJustificacion] = useState('');

  const getUser = (id: string) => users.find((u) => u.id_usuario === id);

  const pendingRequests = compensatoryRequests.filter((r) => r.estado === 'pendiente');
  const pastRequests = compensatoryRequests.filter((r) => r.estado !== 'pendiente');

  const handleApprove = (req: CompensatorioSolicitud) => {
    try {
      storage.approveCompensatory(req.id_solicitud, adminName);
      const user = getUser(req.id_usuario);
      onSuccess(`Autorizados ${req.cantidad_dias} día(s) compensatorios para ${user?.nombre}`);
      onRefresh();
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : 'Error al autorizar');
    }
  };

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingReq) return;
    try {
      storage.rejectCompensatory(rejectingReq.id_solicitud, rejectReason.trim(), adminName);
      const user = getUser(rejectingReq.id_usuario);
      onSuccess(`Solicitud compensatoria de ${user?.nombre} rechazada`);
      setRejectingReq(null);
      setRejectReason('');
      onRefresh();
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : 'Error al rechazar');
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addMotivo.trim()) {
      onError('Ingresa el motivo del reconocimiento');
      return;
    }
    try {
      storage.addDirectCompensatory(targetUserId, addDays, addMotivo.trim(), adminName);
      const user = getUser(targetUserId);
      onSuccess(`Se agregaron ${addDays} día(s) compensatorios a ${user?.nombre}`);
      setIsAddOpen(false);
      setAddMotivo('');
      setAddDays(1);
      onRefresh();
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : 'Error al agregar');
    }
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustJustificacion.trim()) {
      onError('Debes ingresar una justificación obligatoria para la auditoría');
      return;
    }
    try {
      storage.adjustBalance(
        adjustUserId,
        adjustOrdinarios,
        adjustCompensatorios,
        adjustJustificacion.trim(),
        adminName
      );
      const user = getUser(adjustUserId);
      onSuccess(`Saldo corregido para ${user?.nombre} con registro en auditoría`);
      setIsAdjustOpen(false);
      setAdjustJustificacion('');
      onRefresh();
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : 'Error al ajustar saldo');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-600" />
            <span>Administración de Días Compensatorios</span>
          </h3>
          <p className="text-xs text-slate-500">
            Autorización de jornadas no remuneradas previamente y control de saldos auditados
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsAdjustOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors shadow-2xs"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            <span>Corregir saldo con justificación</span>
          </button>

          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-colors whitespace-nowrap"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Agregar días compensatorios</span>
          </button>
        </div>
      </div>

      {/* PENDING REQUESTS INBOX */}
      <div className="bg-white rounded-2xl border border-amber-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 bg-amber-50/60 border-b border-amber-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-700" />
            <h4 className="text-sm font-bold text-amber-950">
              Días pendientes de autorización ({pendingRequests.length})
            </h4>
          </div>
          <span className="text-[11px] font-medium text-amber-800">
            Requiere visto bueno del administrador para sumarse al saldo
          </span>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No hay solicitudes de compensatorios pendientes de autorización en este momento.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pendingRequests.map((req) => {
              const user = getUser(req.id_usuario);
              return (
                <div key={req.id_solicitud} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-2xs shrink-0 mt-0.5"
                      style={{ backgroundColor: user?.color }}
                    >
                      {user?.nombre.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{user?.nombre}</span>
                        <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-amber-100 text-amber-800">
                          +{req.cantidad_dias} día(s)
                        </span>
                        {req.fecha_trabajada && (
                          <span className="text-[11px] text-slate-500">
                            Laborado el: {req.fecha_trabajada}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-700 mt-1">{req.motivo}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Solicitado el: {new Date(req.fecha_solicitud).toLocaleString('es-MX')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => {
                        setRejectingReq(req);
                        setRejectReason('');
                      }}
                      className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Rechazar</span>
                    </button>

                    <button
                      onClick={() => handleApprove(req)}
                      className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Autorizar e incorporar</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* COMPENSATORY HISTORY */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <h4 className="text-sm font-bold text-slate-900">
          Movimientos Compensatorios Previos
        </h4>

        {pastRequests.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            Sin movimientos compensatorios previos registrados.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {pastRequests.map((r) => {
              const user = getUser(r.id_usuario);
              return (
                <div key={r.id_solicitud} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">{user?.nombre}</span>
                      <span className="font-mono text-slate-600">({r.cantidad_dias} días)</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          r.estado === 'autorizado'
                            ? 'bg-emerald-50 text-emerald-800'
                            : 'bg-rose-50 text-rose-800'
                        }`}
                      >
                        {r.estado}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-0.5">{r.motivo}</p>
                    {r.motivo_rechazo && (
                      <p className="text-rose-700 mt-0.5">Motivo de rechazo: {r.motivo_rechazo}</p>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 text-right">
                    <span>{new Date(r.fecha_solicitud).toLocaleDateString('es-MX')}</span>
                    {r.administrador_responsable && (
                      <span className="block">Por: {r.administrador_responsable}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL 1: ADD DIRECT COMPENSATORY DAYS */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-amber-50">
              <h4 className="text-sm font-bold text-amber-950">Agregar Días Compensatorios Directos</h4>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Colaborador</label>
                <select
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white font-medium"
                >
                  {users.map((u) => (
                    <option key={u.id_usuario} value={u.id_usuario}>
                      {u.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cantidad de días a otorgar</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={addDays}
                  onChange={(e) => setAddDays(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-amber-500 outline-hidden font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Motivo / Jornada reconocida</label>
                <textarea
                  required
                  rows={3}
                  value={addMotivo}
                  onChange={(e) => setAddMotivo(e.target.value)}
                  placeholder="Ej: Reconocimiento por guardia extraordinaria en festivo no pagado previamente."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-amber-500 outline-hidden"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsAddOpen(false)} className="px-3 py-1.5 text-xs text-slate-600">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs">
                  Guardar y Asignar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADJUST BALANCE WITH AUDITED JUSTIFICATION */}
      {isAdjustOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h4 className="text-sm font-bold text-slate-900">Corregir Saldo con Justificación</h4>
              <button onClick={() => setIsAdjustOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="p-6 space-y-4">
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-150 text-[11px] text-blue-900">
                Toda modificación de saldos genera un registro inmutable en el historial de auditoría.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Colaborador</label>
                <select
                  value={adjustUserId}
                  onChange={(e) => {
                    const uId = e.target.value;
                    setAdjustUserId(uId);
                    const b = storage.getUserBalance(uId);
                    setAdjustOrdinarios(b.dias_disponibles);
                    setAdjustCompensatorios(b.saldo_compensatorio);
                  }}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white font-medium"
                >
                  {users.map((u) => (
                    <option key={u.id_usuario} value={u.id_usuario}>
                      {u.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nuevo Saldo Ordinario
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={adjustOrdinarios}
                    onChange={(e) => setAdjustOrdinarios(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nuevo Saldo Compensatorio
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={adjustCompensatorios}
                    onChange={(e) => setAdjustCompensatorios(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Justificación detallada de la corrección:
                </label>
                <textarea
                  required
                  rows={3}
                  value={adjustJustificacion}
                  onChange={(e) => setAdjustJustificacion(e.target.value)}
                  placeholder="Ej: Corrección por error de captura en migración anterior o recálculo acordado..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-hidden"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsAdjustOpen(false)} className="px-3 py-1.5 text-xs text-slate-600">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl">
                  Registrar Corrección
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectingReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-rose-50">
              <h4 className="text-sm font-bold text-rose-950">Rechazar Solicitud Compensatoria</h4>
              <button onClick={() => setRejectingReq(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRejectSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Motivo del rechazo:
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Ej: No se encuentra registro de autorización de horas extra..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-rose-500 outline-hidden"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setRejectingReq(null)} className="px-3 py-1.5 text-xs text-slate-600">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl">
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
