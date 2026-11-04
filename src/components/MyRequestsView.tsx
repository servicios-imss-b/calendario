/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { storage } from '../services/storageService';
import { Vacacion, VacationStatus } from '../types';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  PlusCircle,
  Calendar,
  Filter,
} from 'lucide-react';

interface MyRequestsViewProps {
  onRequestVacation: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
  refreshTrigger: number;
}

export const MyRequestsView: React.FC<MyRequestsViewProps> = ({
  onRequestVacation,
  onSuccess,
  onError,
  refreshTrigger,
}) => {
  const { currentUser, isAdmin } = useAuth();
  const [filterStatus, setFilterStatus] = useState<string>('todas');

  const userVacations = useMemo(() => {
    if (!currentUser) return [];
    return storage
      .getVacations()
      .filter((v) => v.id_usuario === currentUser.id_usuario)
      .sort((a, b) => b.fecha_solicitud.localeCompare(a.fecha_solicitud));
  }, [currentUser, refreshTrigger]);

  const filtered = useMemo(() => {
    if (filterStatus === 'todas') return userVacations;
    return userVacations.filter((v) => v.estado === filterStatus);
  }, [userVacations, filterStatus]);

  if (!currentUser) {
    return (
      <div className="py-16 text-center text-slate-500">
        Inicia sesión para consultar tus solicitudes.
      </div>
    );
  }

  const handleCancel = (vacId: string, currentStatus: VacationStatus) => {
    try {
      storage.cancelVacation(vacId, currentUser.id_usuario, isAdmin);
      if (currentStatus === 'pendiente') {
        onSuccess('Solicitud cancelada con éxito.');
      } else {
        onSuccess(isAdmin ? 'Vacación cancelada y días restituidos.' : 'Solicitud de cancelación enviada.');
      }
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : 'Error al procesar cancelación');
    }
  };

  const getStatusBadge = (estado: VacationStatus) => {
    switch (estado) {
      case 'aprobada':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Aprobada</span>
          </span>
        );
      case 'pendiente':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Pendiente de autorización</span>
          </span>
        );
      case 'cancelacion_solicitada':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200">
            <Clock className="w-3.5 h-3.5 text-purple-600" />
            <span>Cancelación solicitada</span>
          </span>
        );
      case 'rechazada':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Rechazada</span>
          </span>
        );
      case 'cancelada':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <span>Cancelada</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span>Bandeja de Mis Solicitudes</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Histórico y estado de todas tus solicitudes de vacaciones registradas
          </p>
        </div>

        <button
          onClick={onRequestVacation}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Nueva Solicitud</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto">
        {[
          { id: 'todas', label: 'Todas' },
          { id: 'pendiente', label: 'Pendientes' },
          { id: 'aprobada', label: 'Aprobadas' },
          { id: 'rechazada', label: 'Rechazadas' },
          { id: 'cancelada', label: 'Canceladas' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shrink-0 ${
              filterStatus === tab.id
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm space-y-2">
            <FileText className="w-8 h-8 mx-auto text-slate-300" />
            <p>No tienes solicitudes con el estado seleccionado.</p>
          </div>
        ) : (
          filtered.map((req) => (
            <div key={req.id_vacacion} className="p-5 sm:p-6 space-y-3 hover:bg-slate-50/50 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="text-base font-bold text-slate-900">
                    Del {req.fecha_inicio} al {req.fecha_fin}
                  </span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 bg-blue-50 text-blue-800 rounded-md">
                    {req.cantidad_dias} día(s) hábiles
                  </span>
                </div>
                <div>{getStatusBadge(req.estado)}</div>
              </div>

              {/* Details breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600 pt-1">
                <div>
                  <span className="text-slate-400 block text-[11px]">Desglose de días:</span>
                  <span className="font-medium text-slate-800">
                    {req.dias_ordinarios} ordinarios · {req.dias_compensatorios} compensatorios
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Fecha de solicitud:</span>
                  <span className="font-medium text-slate-800">
                    {new Date(req.fecha_solicitud).toLocaleDateString('es-MX', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Resolución:</span>
                  <span className="font-medium text-slate-800">
                    {req.fecha_resolucion
                      ? `${new Date(req.fecha_resolucion).toLocaleDateString('es-MX')}${
                          req.administrador_responsable ? ` (por ${req.administrador_responsable})` : ''
                        }`
                      : 'Pendiente de evaluación'}
                  </span>
                </div>
              </div>

              {/* Notes or Rejection Reason */}
              {req.observaciones && (
                <div className="p-2.5 rounded-lg bg-slate-50 text-xs text-slate-600">
                  <span className="font-semibold text-slate-700">Observaciones: </span>
                  {req.observaciones}
                </div>
              )}

              {req.motivo_rechazo && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
                  <span className="font-semibold">Motivo del rechazo: </span>
                  {req.motivo_rechazo}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                {req.estado === 'pendiente' && (
                  <button
                    onClick={() => handleCancel(req.id_vacacion, req.estado)}
                    className="px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Cancelar solicitud</span>
                  </button>
                )}

                {req.estado === 'aprobada' && (
                  <button
                    onClick={() => handleCancel(req.id_vacacion, req.estado)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg transition-colors"
                  >
                    {isAdmin ? 'Cancelar periodo vacacional' : 'Solicitar cancelación de periodo aprobado'}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};
