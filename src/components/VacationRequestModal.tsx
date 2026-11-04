/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { storage } from '../services/storageService';
import { calculateWorkingDays } from '../utils/mexicanHolidays';
import { Festivo, VacationDayType } from '../types';
import { X, Calendar as CalendarIcon, Info, AlertCircle, CheckCircle2 } from 'lucide-react';

interface VacationRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  initialDate?: string;
  holidays: Festivo[];
}

export const VacationRequestModal: React.FC<VacationRequestModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialDate,
  holidays,
}) => {
  const { currentUser, allUsers } = useAuth();

  const [selectedUserId, setSelectedUserId] = useState('');
  const [fechaInicio, setFechaInicio] = useState(initialDate || '');
  const [fechaFin, setFechaFin] = useState(initialDate || '');
  const [tipoSaldo, setTipoSaldo] = useState<VacationDayType>('ordinarios');
  const [diasOrdinariosAUsar, setDiasOrdinariosAUsar] = useState<number>(0);
  const [diasCompensatoriosAUsar, setDiasCompensatoriosAUsar] = useState<number>(0);
  const [observaciones, setObservaciones] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isPublicRequest = Boolean(storage.getAppsScriptUrl());
  const requestUser = isPublicRequest
    ? allUsers.find((user) => user.id_usuario === selectedUserId && user.estado === 'activo')
    : currentUser;

  useEffect(() => {
    if (initialDate) {
      setFechaInicio(initialDate);
      setFechaFin(initialDate);
    } else {
      // Default to next Monday
      const today = new Date();
      const nextMon = new Date(today);
      nextMon.setDate(today.getDate() + ((1 + 7 - today.getDay()) % 7 || 7));
      const str = nextMon.toISOString().split('T')[0];
      setFechaInicio(str);
      setFechaFin(str);
    }
  }, [initialDate, isOpen]);

  useEffect(() => {
    if (isPublicRequest && !allUsers.some((user) => user.id_usuario === selectedUserId && user.estado === 'activo')) {
      setSelectedUserId(allUsers.find((user) => user.estado === 'activo')?.id_usuario || '');
    }
  }, [allUsers, isPublicRequest, selectedUserId]);

  // Current balance
  const balance = useMemo(() => {
    if (!requestUser) return null;
    return storage.getBalances().find((item) => item.id_usuario === requestUser.id_usuario) || null;
  }, [requestUser, isOpen]);

  // Calculate working days
  const calculation = useMemo(() => {
    if (!fechaInicio || !fechaFin) {
      return { workingDays: 0, totalCalendarDays: 0, weekendDaysCount: 0, holidayDaysCount: 0, holidayDetails: [] };
    }
    return calculateWorkingDays(fechaInicio, fechaFin, holidays, true, true);
  }, [fechaInicio, fechaFin, holidays]);

  // Auto-allocate day types when working days change
  useEffect(() => {
    const totalWorking = calculation.workingDays;
    if (!balance && !isPublicRequest) return;

    if (tipoSaldo === 'ordinarios') {
      setDiasOrdinariosAUsar(totalWorking);
      setDiasCompensatoriosAUsar(0);
    } else if (tipoSaldo === 'compensatorios') {
      setDiasOrdinariosAUsar(0);
      setDiasCompensatoriosAUsar(totalWorking);
    } else if (tipoSaldo === 'mixto') {
      // Prioritize ordinaries then compensatory
      const ord = Math.min(totalWorking, balance?.dias_disponibles || 0);
      const comp = Math.max(0, totalWorking - ord);
      setDiasOrdinariosAUsar(ord);
      setDiasCompensatoriosAUsar(comp);
    }
  }, [calculation.workingDays, tipoSaldo, balance, isPublicRequest]);

  if (!isOpen || !requestUser || (!balance && !isPublicRequest)) return null;

  const totalDisponible = balance ? balance.dias_disponibles + balance.saldo_compensatorio : 0;
  const isDaysExceeded = !isPublicRequest && Boolean(balance) && (
    diasOrdinariosAUsar > balance!.dias_disponibles ||
    diasCompensatoriosAUsar > balance!.saldo_compensatorio ||
    calculation.workingDays > totalDisponible
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fechaInicio || !fechaFin) {
      setErrorMsg('Selecciona las fechas de inicio y fin');
      return;
    }

    if (fechaInicio > fechaFin) {
      setErrorMsg('La fecha de fin debe ser posterior o igual a la fecha de inicio');
      return;
    }

    if (calculation.workingDays <= 0) {
      setErrorMsg('El rango seleccionado no contiene ningún día hábil laboral (son solo fines de semana o días festivos)');
      return;
    }

    if (diasOrdinariosAUsar + diasCompensatoriosAUsar !== calculation.workingDays) {
      setErrorMsg(`La suma de días (${diasOrdinariosAUsar} ord + ${diasCompensatoriosAUsar} comp) debe coincidir con los ${calculation.workingDays} días hábiles.`);
      return;
    }

    if (!isPublicRequest && balance && diasOrdinariosAUsar > balance.dias_disponibles) {
      setErrorMsg(`No tienes suficientes días ordinarios disponibles (${balance.dias_disponibles} disponibles)`);
      return;
    }

    if (!isPublicRequest && balance && diasCompensatoriosAUsar > balance.saldo_compensatorio) {
      setErrorMsg(`No tienes suficientes días compensatorios disponibles (${balance.saldo_compensatorio} disponibles)`);
      return;
    }

    setIsSubmitting(true);
    try {
      const request = {
        id_usuario: requestUser.id_usuario,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        cantidad_dias: calculation.workingDays,
        dias_ordinarios: diasOrdinariosAUsar,
        dias_compensatorios: diasCompensatoriosAUsar,
        tipo_dias: tipoSaldo,
        observaciones: observaciones.trim(),
      };
      if (isPublicRequest) {
        await storage.submitPublicRequest('request_vacation', request);
      } else {
        storage.requestVacation(request);
      }

      onSuccess(
        isPublicRequest
          ? `Solicitud pública enviada para ${requestUser.nombre}. Queda pendiente de aprobación; el nombre no se verifica.`
          : `Solicitud enviada para ${calculation.workingDays} día(s) hábiles. Pendiente de aprobación administrativa.`
      );
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al registrar solicitud');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>🏖️</span>
              <span>Solicitar Periodo de Vacaciones</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Solicitud de descanso para {requestUser.nombre}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isPublicRequest && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
              <label className="block font-semibold" htmlFor="public-vacation-user">Enviar solicitud para</label>
              <select
                id="public-vacation-user"
                value={selectedUserId}
                onChange={(event) => setSelectedUserId(event.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-amber-300 bg-white text-slate-800"
                required
              >
                {allUsers.filter((user) => user.estado === 'activo').map((user) => (
                  <option key={user.id_usuario} value={user.id_usuario}>{user.nombre}</option>
                ))}
              </select>
              <p>La identidad no se verifica. La solicitud quedará pendiente de aprobación.</p>
            </div>
          )}

          {/* Current balance indicator cards */}
          {balance && <div className="grid grid-cols-3 gap-2.5">
            <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-150">
              <span className="text-[11px] font-semibold text-blue-700 block">Días Ordinarios</span>
              <span className="text-xl font-bold text-blue-900 font-mono tabular-nums">
                {balance.dias_disponibles}
              </span>
              <span className="text-[10px] text-blue-600/80 block">de {balance.dias_asignados} asignados</span>
            </div>

            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-150">
              <span className="text-[11px] font-semibold text-amber-700 block">Compensatorios</span>
              <span className="text-xl font-bold text-amber-900 font-mono tabular-nums">
                {balance.saldo_compensatorio}
              </span>
              <span className="text-[10px] text-amber-600/80 block">autorizados disp.</span>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-150">
              <span className="text-[11px] font-semibold text-emerald-700 block">Total Disponible</span>
              <span className="text-xl font-bold text-emerald-900 font-mono tabular-nums">
                {totalDisponible}
              </span>
              <span className="text-[10px] text-emerald-600/80 block">días hábiles</span>
            </div>
          </div>}

          {/* Date Range Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Fecha Inicial
              </label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-hidden font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Fecha Final
              </label>
              <input
                type="date"
                value={fechaFin}
                min={fechaInicio}
                onChange={(e) => setFechaFin(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-hidden font-medium"
              />
            </div>
          </div>

          {/* Calculation breakdown banner */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
            <div className="flex items-center justify-between font-semibold text-slate-800">
              <span>Días hábiles a descontar:</span>
              <span className="text-base text-blue-700 font-mono font-bold">
                {calculation.workingDays} día(s)
              </span>
            </div>
            <div className="text-slate-500 flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
              <span>Calendario total: {calculation.totalCalendarDays} días</span>
              <span>Fines de semana excluidos: {calculation.weekendDaysCount}</span>
              {calculation.holidayDaysCount > 0 && (
                <span className="text-amber-700 font-medium">
                  Festivos oficiales excluidos: {calculation.holidayDaysCount} (
                  {calculation.holidayDetails.map((h) => h.nombre).join(', ')})
                </span>
              )}
            </div>
          </div>

          {/* Type of balance to use */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Tipo de saldo que deseas utilizar
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTipoSaldo('ordinarios')}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-colors ${
                  tipoSaldo === 'ordinarios'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Días Ordinarios
              </button>
              <button
                type="button"
                onClick={() => setTipoSaldo('compensatorios')}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-colors ${
                  tipoSaldo === 'compensatorios'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Compensatorios
              </button>
              <button
                type="button"
                onClick={() => setTipoSaldo('mixto')}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-colors ${
                  tipoSaldo === 'mixto'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Combinado (Mixto)
              </button>
            </div>

            {/* Custom split if mixto */}
            {tipoSaldo === 'mixto' && balance && (
              <div className="grid grid-cols-2 gap-3 mt-3 p-3 bg-indigo-50/50 rounded-xl border border-indigo-150">
                <div>
                  <label className="block text-[11px] font-semibold text-indigo-900 mb-1">
                    Días ordinarios a usar:
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={balance.dias_disponibles}
                    value={diasOrdinariosAUsar}
                    onChange={(e) => {
                      const val = Math.max(0, Number(e.target.value));
                      setDiasOrdinariosAUsar(val);
                      setDiasCompensatoriosAUsar(Math.max(0, calculation.workingDays - val));
                    }}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-indigo-900 mb-1">
                    Días compensatorios a usar:
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={balance.saldo_compensatorio}
                    value={diasCompensatoriosAUsar}
                    onChange={(e) => {
                      const val = Math.max(0, Number(e.target.value));
                      setDiasCompensatoriosAUsar(val);
                      setDiasOrdinariosAUsar(Math.max(0, calculation.workingDays - val));
                    }}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Observaciones (Opcional)
            </label>
            <textarea
              rows={2}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Ej: Salida de fin de año con familia, pendiente guardia."
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-hidden"
            />
          </div>

          {/* Important Rule Notice */}
          <div className="p-3 rounded-xl bg-sky-50 border border-sky-150 text-[11px] text-sky-900 space-y-1">
            <p className="font-semibold flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-sky-700" />
              <span>Reglas de aplicación:</span>
            </p>
            <ul className="list-disc list-inside space-y-0.5 text-sky-800">
              <li>Los días se descuentan de tu saldo únicamente al ser aprobados por el administrador.</li>
              <li>Puedes coincidir libremente con otros compañeros de equipo.</li>
              <li>Los fines de semana y festivos oficiales mexicanos no descuentan días de tu saldo.</li>
            </ul>
          </div>

          {/* Submit */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isDaysExceeded || calculation.workingDays <= 0 || !requestUser}
              className={`px-5 py-2.5 text-xs font-semibold text-white rounded-xl shadow-xs transition-all ${
                isDaysExceeded || calculation.workingDays <= 0
                  ? 'bg-slate-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
              }`}
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Solicitud'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
