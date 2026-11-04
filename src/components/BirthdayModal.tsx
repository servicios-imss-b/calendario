/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { storage } from '../services/storageService';
import { Usuario } from '../types';
import { X, Cake, AlertCircle } from 'lucide-react';

interface BirthdayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  initialDate?: string;
  users?: Usuario[];
}

export const BirthdayModal: React.FC<BirthdayModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialDate,
  users = storage.getUsers(),
}) => {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [fecha, setFecha] = useState(initialDate || '1995-05-15');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!users.some((user) => user.id_usuario === selectedUserId)) {
      setSelectedUserId(users.find((user) => user.estado === 'activo')?.id_usuario || '');
    }
    if (initialDate) setFecha(initialDate);
  }, [initialDate, isOpen, selectedUserId, users]);

  const selectedUser = users.find((user) => user.id_usuario === selectedUserId);
  if (!isOpen || !selectedUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fecha) {
      setErrorMsg('Selecciona una fecha de cumpleaños');
      return;
    }

    try {
      if (storage.getAppsScriptUrl()) {
        await storage.submitSharedAction('set_birthday', {
          id_persona: selectedUser.id_usuario,
          fecha_cumpleaños: fecha,
        });
      } else {
        storage.setBirthday(selectedUser.id_usuario, fecha);
      }
      onSuccess(`¡Cumpleaños registrado con éxito! Se repetirá automáticamente cada año.`);
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al guardar');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-rose-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
              <Cake className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Registrar Cumpleaños</h3>
              <p className="text-xs text-slate-500">Para {selectedUser.nombre}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="birthday-person">
              Persona
            </label>
            <select
              id="birthday-person"
              value={selectedUserId}
              onChange={(event) => setSelectedUserId(event.target.value)}
              className="mb-4 w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white"
            >
              {users.filter((user) => user.estado === 'activo').map((user) => (
                <option key={user.id_usuario} value={user.id_usuario}>{user.nombre}</option>
              ))}
            </select>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Fecha de cumpleaños
            </label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-hidden font-medium"
            />
            <p className="text-[11px] text-slate-500 mt-1.5">
              🎂 Aparecerá de forma automática en el calendario compartido todos los años.
            </p>
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
              className="px-5 py-2.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors"
            >
              Guardar Cumpleaños
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
