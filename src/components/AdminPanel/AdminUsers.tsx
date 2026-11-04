/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Usuario, UserRole, UserStatus } from '../../types';
import { storage } from '../../services/storageService';
import { USER_COLOR_PALETTE, isColorAvailable } from '../../utils/userColors';
import {
  Users,
  UserPlus,
  Edit,
  Power,
  Key,
  Shield,
  History,
  X,
  AlertCircle,
  Check,
  Search,
} from 'lucide-react';

interface AdminUsersProps {
  users: Usuario[];
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
  onRefresh: () => void;
}

export const AdminUsers: React.FC<AdminUsersProps> = ({
  users,
  onSuccess,
  onError,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<Usuario | null>(null);
  const [resetPassUser, setResetPassUser] = useState<Usuario | null>(null);
  const [historyUser, setHistoryUser] = useState<Usuario | null>(null);

  // Form states for Create User
  const [newNombre, setNewNombre] = useState('');
  const [newColor, setNewColor] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRol, setNewRol] = useState<UserRole>('usuario');

  // Form states for Edit User
  const [editNombre, setEditNombre] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editRol, setEditRol] = useState<UserRole>('usuario');

  // Form states for Password Reset
  const [newPassInput, setNewPassInput] = useState('');

  const usedColors = users.map((u) => u.color);

  // Filtered users
  const filteredUsers = users.filter((u) =>
    u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.rol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.estado.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      storage.createUser({
        nombre: newNombre.trim(),
        color: newColor,
        password_hash: newPassword || '1234',
        rol: newRol,
        estado: 'activo',
      }, 'Administrador');

      onSuccess(`Usuario ${newNombre} creado con éxito con sus 10 días iniciales.`);
      setIsCreateOpen(false);
      setNewNombre('');
      setNewColor('');
      setNewPassword('');
      onRefresh();
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : 'Error al crear usuario');
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    try {
      storage.updateUser(
        editUser.id_usuario,
        {
          nombre: editNombre.trim(),
          color: editColor,
          rol: editRol,
        },
        'Administrador'
      );
      onSuccess(`Usuario ${editNombre} actualizado con éxito.`);
      setEditUser(null);
      onRefresh();
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : 'Error al actualizar usuario');
    }
  };

  const handleToggleStatus = (u: Usuario) => {
    try {
      storage.toggleUserStatus(u.id_usuario, 'Administrador');
      onSuccess(`Usuario ${u.nombre} marcado como ${u.estado === 'activo' ? 'inactivo' : 'activo'}.`);
      onRefresh();
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : 'Error al cambiar estado');
    }
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPassUser) return;
    try {
      storage.resetUserPassword(resetPassUser.id_usuario, newPassInput, 'Administrador');
      onSuccess(`Contraseña restablecida para ${resetPassUser.nombre}`);
      setResetPassUser(null);
      setNewPassInput('');
      onRefresh();
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : 'Error al restablecer contraseña');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>Gestión de Usuarios</span>
          </h3>
          <p className="text-xs text-slate-500">
            Administra roles, colores bloqueados, contraseñas y estado de los colaboradores
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar colaborador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:border-blue-500 outline-hidden w-48 sm:w-60"
            />
          </div>

          <button
            onClick={() => {
              setNewNombre('');
              setNewColor('');
              setNewPassword('');
              setIsCreateOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" />
            <span>Crear usuario</span>
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Usuario</th>
                <th className="py-3 px-4">Color</th>
                <th className="py-3 px-4">Registro</th>
                <th className="py-3 px-4">Rol</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Días Disp.</th>
                <th className="py-3 px-4 text-right">Compensatorios</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u) => {
                const bal = storage.getUserBalance(u.id_usuario);
                return (
                  <tr key={u.id_usuario} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-2xs"
                          style={{ backgroundColor: u.color }}
                        >
                          {u.nombre.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block">{u.nombre}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{u.id_usuario}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-slate-200"
                          style={{ backgroundColor: u.color }}
                        />
                        <span className="font-mono text-[11px] text-slate-600">{u.color}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-500">
                      {new Date(u.fecha_registro).toLocaleDateString('es-MX')}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          u.rol === 'admin'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {u.rol === 'admin' ? 'Administrador' : 'Colaborador'}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          u.estado === 'activo'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {u.estado}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-blue-700">
                      {bal.dias_disponibles}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-amber-700">
                      {bal.saldo_compensatorio}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            setEditUser(u);
                            setEditNombre(u.nombre);
                            setEditColor(u.color);
                            setEditRol(u.rol);
                          }}
                          title="Editar usuario"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            setResetPassUser(u);
                            setNewPassInput('');
                          }}
                          title="Restablecer contraseña"
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Key className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setHistoryUser(u)}
                          title="Ver historial individual"
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <History className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleToggleStatus(u)}
                          title={u.estado === 'activo' ? 'Desactivar usuario' : 'Reactivar usuario'}
                          className={`p-1.5 rounded-lg transition-colors ${
                            u.estado === 'activo'
                              ? 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                              : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: CREATE USER */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h4 className="text-sm font-bold text-slate-900">Crear Nuevo Usuario</h4>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre (un solo nombre)</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Martin, Carlos..."
                  value={newNombre}
                  onChange={(e) => setNewNombre(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-blue-500 outline-hidden font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Color exclusivo</label>
                <div className="grid grid-cols-4 gap-2">
                  {USER_COLOR_PALETTE.map((c) => {
                    const available = isColorAvailable(c.hex, usedColors);
                    const isSelected = newColor.toLowerCase() === c.hex.toLowerCase();
                    return (
                      <button
                        key={c.hex}
                        type="button"
                        disabled={!available}
                        onClick={() => setNewColor(c.hex)}
                        className={`p-1.5 rounded-lg border flex flex-col items-center gap-1 ${
                          isSelected ? 'border-blue-600 ring-2 ring-blue-500/20' : ''
                        } ${!available ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-50'}`}
                      >
                        <span className="w-5 h-5 rounded-full" style={{ backgroundColor: c.hex }} />
                        <span className="text-[9px] truncate w-full">{c.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contraseña</label>
                <input
                  type="password"
                  placeholder="Por defecto: 1234"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-blue-500 outline-hidden font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Rol en el sistema</label>
                <select
                  value={newRol}
                  onChange={(e) => setNewRol(e.target.value as UserRole)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white font-medium"
                >
                  <option value="usuario">Colaborador (Usuario estándar)</option>
                  <option value="admin">Administrador (Control total)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!newNombre || !newColor}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl disabled:bg-slate-300"
                >
                  Crear Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT USER */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h4 className="text-sm font-bold text-slate-900">Editar Usuario: {editUser.nombre}</h4>
              <button onClick={() => setEditUser(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-blue-500 outline-hidden font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Color exclusivo</label>
                <div className="grid grid-cols-4 gap-2">
                  {USER_COLOR_PALETTE.map((c) => {
                    const available = isColorAvailable(c.hex, usedColors, editUser.id_usuario, editUser.color);
                    const isSelected = editColor.toLowerCase() === c.hex.toLowerCase();
                    return (
                      <button
                        key={c.hex}
                        type="button"
                        disabled={!available}
                        onClick={() => setEditColor(c.hex)}
                        className={`p-1.5 rounded-lg border flex flex-col items-center gap-1 ${
                          isSelected ? 'border-blue-600 ring-2 ring-blue-500/20' : ''
                        } ${!available ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-50'}`}
                      >
                        <span className="w-5 h-5 rounded-full" style={{ backgroundColor: c.hex }} />
                        <span className="text-[9px] truncate w-full">{c.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Rol</label>
                <select
                  value={editRol}
                  onChange={(e) => setEditRol(e.target.value as UserRole)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white font-medium"
                >
                  <option value="usuario">Colaborador</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setEditUser(null)} className="px-3 py-1.5 text-xs text-slate-600">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl">
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: RESET PASSWORD */}
      {resetPassUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h4 className="text-sm font-bold text-slate-900">Restablecer Contraseña</h4>
              <button onClick={() => setResetPassUser(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="p-6 space-y-4">
              <p className="text-xs text-slate-600">
                Ingresa la nueva contraseña para <strong>{resetPassUser.nombre}</strong>.
              </p>
              <div>
                <input
                  type="password"
                  required
                  placeholder="Nueva contraseña..."
                  value={newPassInput}
                  onChange={(e) => setNewPassInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-blue-500 outline-hidden font-medium"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setResetPassUser(null)} className="px-3 py-1.5 text-xs text-slate-600">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl">
                  Actualizar Contraseña
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: INDIVIDUAL USER HISTORY */}
      {historyUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h4 className="text-sm font-bold text-slate-900">
                Historial de Movimientos: {historyUser.nombre}
              </h4>
              <button onClick={() => setHistoryUser(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3">
              {storage
                .getMovements()
                .filter((m) => m.id_usuario === historyUser.id_usuario).length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-8">
                  No hay movimientos registrados para este usuario.
                </p>
              ) : (
                storage
                  .getMovements()
                  .filter((m) => m.id_usuario === historyUser.id_usuario)
                  .map((m) => (
                    <div key={m.id_movimiento} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-blue-700 capitalize">{m.tipo_movimiento.replace(/_/g, ' ')}</span>
                        <span className="font-mono text-slate-500">
                          {m.saldo_anterior}d → {m.saldo_posterior}d ({m.cantidad_dias > 0 ? `+${m.cantidad_dias}` : m.cantidad_dias})
                        </span>
                      </div>
                      <p className="text-xs text-slate-700">{m.motivo}</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                        <span>{new Date(m.fecha).toLocaleString('es-MX')}</span>
                        {m.administrador_responsable && (
                          <span>Resp: {m.administrador_responsable}</span>
                        )}
                      </div>
                    </div>
                  ))
              )}
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setHistoryUser(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
