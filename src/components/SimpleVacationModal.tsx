/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Usuario, Festivo } from '../types';
import { storage } from '../services/storageService';
import { calculateWorkingDays } from '../utils/mexicanHolidays';
import { X, Palmtree, AlertCircle } from 'lucide-react';

interface SimpleVacationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  initialDate?: string;
  users: Usuario[];
  holidays: Festivo[];
}

export const SimpleVacationModal: React.FC<SimpleVacationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialDate,
  users,
  holidays,
}) => {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [fechaInicio, setFechaInicio] = useState(initialDate || '');
  const [fechaFin, setFechaFin] = useState(initialDate || '');
  const [observaciones, setObservaciones] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!users.some((user) => user.id_usuario === selectedUserId && user.estado === 'activo')) {
      setSelectedUserId(users.find((user) => user.estado === 'activo')?.id_usuario || '');
    }
    if (initialDate) {
      setFechaInicio(initialDate);
      setFechaFin(initialDate);
    } else if (isOpen && !fechaInicio) {
      const nextDay = new Date();
      nextDay.setDate(nextDay.getDate() + 1);
      const date = nextDay.toISOString().slice(0, 10);
      setFechaInicio(date);
      setFechaFin(date);
    }
  }, [fechaInicio, initialDate, isOpen, selectedUserId, users]);

  const activeUser = users.find((user) => user.id_usuario === selectedUserId && user.estado === 'activo');
  const semesterForStart = fechaInicio
    ? `${fechaInicio.slice(0, 4)}-S${Number(fechaInicio.slice(5, 7)) <= 6 ? 1 : 2}`
    : '';
  const semesterForEnd = fechaFin
    ? `${fechaFin.slice(0, 4)}-S${Number(fechaFin.slice(5, 7)) <= 6 ? 1 : 2}`
    : '';
  const balance = useMemo(() => {
    if (!activeUser || !semesterForStart) return null;
    return storage.getUserBalance(activeUser.id_usuario, semesterForStart);
  }, [activeUser, semesterForStart]);
  const calculation = useMemo(() => {
    if (!fechaInicio || !fechaFin) return { workingDays: 0 };
    return calculateWorkingDays(fechaInicio, fechaFin, holidays, true, true);
  }, [fechaInicio, fechaFin, holidays]);
  const crossesSemester = Boolean(semesterForEnd && semesterForStart !== semesterForEnd);

  if (!isOpen || !activeUser || !balance) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg('');
    if (crossesSemester) {
      setErrorMsg('El periodo de vacaciones debe quedar dentro del mismo semestre.');
      return;
    }
    if (fechaInicio > fechaFin || calculation.workingDays <= 0) {
      setErrorMsg('Selecciona un rango que incluya al menos un día hábil.');
      return;
    }
    if (calculation.workingDays > balance.dias_disponibles) {
      setErrorMsg(`Solo quedan ${balance.dias_disponibles} día(s) disponibles este semestre.`);
      return;
    }

    setIsSubmitting(true);
    try {
      if (storage.getAppsScriptUrl()) {
        await storage.submitSharedAction('register_vacation', {
          id_persona: activeUser.id_usuario,
          id_vacacion: `vac_${crypto.randomUUID()}`,
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
          dias_usados: calculation.workingDays,
          nota: observaciones.trim(),
        });
      } else {
        const vacation = storage.requestVacation({
          id_usuario: activeUser.id_usuario,
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
          cantidad_dias: calculation.workingDays,
          dias_ordinarios: calculation.workingDays,
          dias_compensatorios: 0,
          tipo_dias: 'ordinarios',
          observaciones: observaciones.trim(),
          periodo: semesterForStart,
        });
        storage.approveVacation(vacation.id_vacacion, 'Calendario compartido');
      }
      onSuccess(`${activeUser.nombre}: se registraron ${calculation.workingDays} día(s) de vacaciones.`);
      onClose();
    } catch (error: unknown) {
      setErrorMsg(error instanceof Error ? error.message : 'No se pudieron registrar las vacaciones.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2"><Palmtree className="w-4 h-4 text-emerald-700" /> Registrar vacaciones</h2>
            <p className="text-xs text-slate-500 mt-1">{semesterForStart || 'Elige las fechas'} · saldo disponible: {balance.dias_disponibles} días</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg" aria-label="Cerrar"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMsg && <p className="p-3 text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-lg flex gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{errorMsg}</p>}
          <label className="block text-xs font-semibold text-slate-700">Persona
            <select value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)} className="mt-1.5 w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-white" required>
              {users.filter((user) => user.estado === 'activo').map((user) => <option key={user.id_usuario} value={user.id_usuario}>{user.nombre}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-semibold text-slate-700">Desde<input type="date" value={fechaInicio} onChange={(event) => setFechaInicio(event.target.value)} required className="mt-1.5 w-full px-3 py-2.5 border border-slate-300 rounded-lg" /></label>
            <label className="block text-xs font-semibold text-slate-700">Hasta<input type="date" min={fechaInicio} value={fechaFin} onChange={(event) => setFechaFin(event.target.value)} required className="mt-1.5 w-full px-3 py-2.5 border border-slate-300 rounded-lg" /></label>
          </div>
          <div className="flex items-center justify-between py-2 border-y border-slate-100 text-sm"><span className="text-slate-600">Días hábiles a descontar</span><strong className="font-mono text-slate-900">{calculation.workingDays} / {balance.dias_disponibles} restantes</strong></div>
          <label className="block text-xs font-semibold text-slate-700">Nota (opcional)<textarea value={observaciones} onChange={(event) => setObservaciones(event.target.value)} maxLength={500} rows={2} className="mt-1.5 w-full px-3 py-2.5 border border-slate-300 rounded-lg resize-y" /></label>
          <p className="text-[11px] text-slate-500">Al guardar, los días se descuentan inmediatamente del saldo del semestre.</p>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg">Cancelar</button>
            <button type="submit" disabled={isSubmitting || !calculation.workingDays || crossesSemester} className="px-4 py-2 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 rounded-lg">{isSubmitting ? 'Guardando...' : 'Guardar vacaciones'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};