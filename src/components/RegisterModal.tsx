/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { USER_COLOR_PALETTE, isColorAvailable } from '../utils/userColors';
import { X, UserPlus, Lock, AlertCircle, Check } from 'lucide-react';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  onSwitchToLogin: () => void;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onSwitchToLogin,
}) => {
  const { register, allUsers } = useAuth();
  const [nombre, setNombre] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const usedColors = allUsers.map((u) => u.color);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const clean = nombre.trim();
    if (!clean) {
      setErrorMsg('Ingresa tu nombre');
      return;
    }
    if (clean.includes(' ')) {
      setErrorMsg('Ingresa un solo nombre sin apellidos ni espacios (ej: Martin, Sofia, Carlos)');
      return;
    }
    if (!selectedColor) {
      setErrorMsg('Selecciona un color identificador exclusivo');
      return;
    }
    if (!password || password.length < 4) {
      setErrorMsg('La contraseña debe tener mínimo 4 caracteres');
      return;
    }

    setIsSubmitting(true);
    const res = await register(clean, selectedColor, password);
    setIsSubmitting(false);

    if (res.success) {
      onSuccess(`¡Bienvenido a Mi Calendario, ${clean}!`);
      onClose();
    } else {
      setErrorMsg(res.error || 'Error al crear cuenta');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-blue-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Registro de Usuario</h3>
              <p className="text-xs text-slate-500">Únete al calendario del equipo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Nombre (Un solo nombre)
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Martin, Sofia, Diego..."
              required
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-hidden font-medium"
            />
            <p className="text-[11px] text-slate-400 mt-1">Los nombres deben ser únicos en la plataforma.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Color de identificación exclusivo
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-4 gap-2">
              {USER_COLOR_PALETTE.map((color) => {
                const available = isColorAvailable(color.hex, usedColors);
                const isSelected = selectedColor.toLowerCase() === color.hex.toLowerCase();

                return (
                  <button
                    key={color.hex}
                    type="button"
                    disabled={!available}
                    onClick={() => available && setSelectedColor(color.hex)}
                    className={`relative p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-center ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20'
                        : available
                        ? 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        : 'border-slate-100 bg-slate-100/70 opacity-40 cursor-not-allowed'
                    }`}
                  >
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white shadow-xs"
                      style={{ backgroundColor: color.hex }}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-3" />}
                      {!available && <Lock className="w-3 h-3 text-white" />}
                    </div>
                    <span className="text-[10px] font-medium text-slate-700 truncate w-full">
                      {color.name}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              🔒 Los colores utilizados por otros compañeros quedan bloqueados.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Contraseña segura
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 4 caracteres"
              required
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-hidden font-medium"
            />
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              ¿Ya tienes cuenta? Ingresar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedColor || !nombre.trim()}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Registrando...' : 'Completar Registro'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
