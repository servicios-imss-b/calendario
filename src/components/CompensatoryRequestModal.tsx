/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { storage } from '../services/storageService';
import { X, Award, AlertCircle } from 'lucide-react';

interface CompensatoryRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export const CompensatoryRequestModal: React.FC<CompensatoryRequestModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentUser, allUsers } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [motivo, setMotivo] = useState('');
  const [fechaTrabajada, setFechaTrabajada] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isPublicRequest = Boolean(storage.getAppsScriptUrl());
  const requestUser = isPublicRequest
    ? allUsers.find((user) => user.id_usuario === selectedUserId && user.estado === 'activo')
    : currentUser;

  useEffect(() => {
    if (isPublicRequest && !allUsers.some((user) => user.id_usuario === selectedUserId && user.estado === 'activo')) {
      setSelectedUserId(allUsers.find((user) => user.estado === 'activo')?.id_usuario || '');
    }
  }, [allUsers, isPublicRequest, selectedUserId]);

  if (!isOpen || !requestUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (cantidad <= 0) {
      setErrorMsg('La cantidad de días debe ser mayor a 0');
      return;
    }
    if (!motivo.trim() || motivo.trim().length < 8) {
      setErrorMsg('Por favor describe detalladamente la jornada o motivo trabajado');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isPublicRequest) {
        await storage.submitPublicRequest('request_compensatory', {
          id_usuario: requestUser.id_usuario,
          cantidad_dias: cantidad,
          motivo: motivo.trim(),
          fecha_trabajada: fechaTrabajada,
        });
      } else {
        storage.requestCompensatory(
          requestUser.id_usuario,
          cantidad,
          motivo.trim(),
          fechaTrabajada
        );
      }
      onSuccess(
        isPublicRequest
          ? `Solicitud pública enviada para ${requestUser.nombre}. Queda pendiente de aprobación; el nombre no se verifica.`
          : `Solicitud de ${cantidad} día(s) compensatorio(s) enviada al administrador para autorización.`
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
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-600" />
              <span>Solicitar Días Compensatorios</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Por jornadas extraordinarias trabajadas no remuneradas
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isPublicRequest && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
              <label className="block font-semibold" htmlFor="public-compensatory-user">Enviar solicitud para</label>
              <select
                id="public-compensatory-user"
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

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Cantidad de días a compensar
            </label>
            <input
              type="number"
              min="1"
              max="15"
              value={cantidad}
              onChange={(e) => setCantidad(Number(e.target.value))}
              required
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-hidden font-mono font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Fecha en que se laboró (Opcional)
            </label>
            <input
              type="date"
              value={fechaTrabajada}
              onChange={(e) => setFechaTrabajada(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-hidden font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Motivo o Justificación detallada
            </label>
            <textarea
              rows={3}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: Soporte en sitio de emergencia durante el fin de semana, guardia festiva o despliegue fuera de horario."
              required
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-hidden"
            />
          </div>

          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900">
            Los días compensatorios deben ser autorizados por el administrador antes de sumarse a tu saldo disponible.
          </div>

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
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-xl shadow-xs transition-colors"
            >
              {isSubmitting ? 'Enviando...' : 'Enviar para Autorización'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
