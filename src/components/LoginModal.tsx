/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, LogIn, AlertCircle } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  onSwitchToRegister: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onSwitchToRegister,
}) => {
  const { login, allUsers, switchUser } = useAuth();
  const [nombre, setNombre] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!nombre.trim()) {
      setErrorMsg('Ingresa tu nombre');
      return;
    }

    setIsSubmitting(true);
    const res = await login(nombre.trim(), password);
    setIsSubmitting(false);

    if (res.success) {
      onSuccess(`¡Bienvenido de vuelta, ${nombre}!`);
      onClose();
    } else {
      setErrorMsg(res.error || 'Credenciales no válidas');
    }
  };

  const handleQuickLogin = async (userNombre: string, defaultPass: string) => {
    setIsSubmitting(true);
    const res = await login(userNombre, defaultPass);
    setIsSubmitting(false);
    if (res.success) {
      onSuccess(`Sesión iniciada como ${userNombre}`);
      onClose();
    } else {
      setErrorMsg(res.error || 'Error al iniciar');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <LogIn className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Iniciar Sesión</h3>
              <p className="text-xs text-slate-500">Accede a Mi Calendario</p>
            </div>
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
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Nombre de usuario
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Martin"
              required
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-hidden font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-hidden font-medium"
            />
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              Registrar nuevo usuario
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
            >
              {isSubmitting ? 'Verificando...' : 'Entrar'}
            </button>
          </div>

          {/* Quick profile switcher */}
          {allUsers.some((user) => user.password_hash) && (
            <div className="pt-4 border-t border-slate-100">
              <p className="text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                Acceso rápido demo
              </p>
              <div className="flex flex-wrap gap-1.5">
                {allUsers.filter((user) => user.password_hash).map((u) => (
                  <button
                    key={u.id_usuario}
                    type="button"
                    onClick={() => handleQuickLogin(u.nombre, u.password_hash || '1234')}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-white text-slate-700 transition-colors"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: u.color }}
                    />
                    <span className="font-medium">{u.nombre}</span>
                    {u.rol === 'admin' && (
                      <span className="text-[9px] text-amber-700 bg-amber-100/60 px-1 rounded">Admin</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </form>

      </div>
    </div>
  );
};
