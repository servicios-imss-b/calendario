/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Usuario, Vacacion, Cumpleanos, CompensatorioSolicitud } from '../../types';
import {
  LayoutDashboard,
  Users,
  FileText,
  Award,
  Settings,
  ShieldCheck,
  FileSpreadsheet,
  ShieldAlert,
  ArrowLeft,
} from 'lucide-react';
import { AdminDashboard } from './AdminDashboard';
import { AdminUsers } from './AdminUsers';
import { AdminRequests } from './AdminRequests';
import { AdminCompensatory } from './AdminCompensatory';
import { AdminPeriods } from './AdminPeriods';
import { AdminAudit } from './AdminAudit';
import { AdminSheetsSync } from './AdminSheetsSync';

interface AdminPanelProps {
  onBackToApp: () => void;
  users: Usuario[];
  vacations: Vacacion[];
  birthdays: Cumpleanos[];
  compensatoryRequests: CompensatorioSolicitud[];
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
  onRefresh: () => void;
}

export type AdminSubtab =
  | 'dashboard'
  | 'usuarios'
  | 'solicitudes'
  | 'compensatorios'
  | 'periodos'
  | 'auditoria'
  | 'sheets';

export const AdminPanel: React.FC<AdminPanelProps> = ({
  onBackToApp,
  users,
  vacations,
  birthdays,
  compensatoryRequests,
  onSuccess,
  onError,
  onRefresh,
}) => {
  const { currentUser, isAdmin } = useAuth();
  const [activeSubtab, setActiveSubtab] = useState<AdminSubtab>('dashboard');

  // Security guard: Only admins allowed
  if (!isAdmin || !currentUser) {
    return (
      <div className="py-20 max-w-lg mx-auto text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">Acceso Restringido</h3>
        <p className="text-sm text-slate-600">
          Esta sección es exclusiva para usuarios con rol de <strong>Administrador</strong>.
          Los usuarios estándar no tienen acceso al panel administrativo conforme a las políticas del sistema.
        </p>
        <button
          onClick={onBackToApp}
          className="px-5 py-2.5 text-xs font-bold text-white bg-slate-900 rounded-xl"
        >
          Volver a Mi Calendario
        </button>
      </div>
    );
  }

  const menuItems = [
    { id: 'dashboard' as AdminSubtab, label: 'Dashboard General', icon: LayoutDashboard },
    { id: 'solicitudes' as AdminSubtab, label: 'Bandeja de Solicitudes', icon: FileText, badge: vacations.filter((v) => v.estado === 'pendiente' || v.estado === 'cancelacion_solicitada').length },
    { id: 'compensatorios' as AdminSubtab, label: 'Días Compensatorios', icon: Award, badge: compensatoryRequests.filter((r) => r.estado === 'pendiente').length },
    { id: 'usuarios' as AdminSubtab, label: 'Gestión de Usuarios', icon: Users },
    { id: 'periodos' as AdminSubtab, label: 'Configuración de Periodos', icon: Settings },
    { id: 'auditoria' as AdminSubtab, label: 'Registro de Actividad', icon: ShieldCheck },
    { id: 'sheets' as AdminSubtab, label: 'Google Sheets & Apps Script', icon: FileSpreadsheet },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-6 pb-16">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-full lg:w-64 shrink-0 space-y-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                Administración
              </span>
              <h2 className="text-base font-bold text-slate-900 mt-1">
                Panel de Control
              </h2>
            </div>
            <button
              onClick={onBackToApp}
              title="Volver a la vista del usuario"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSubtab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSubtab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl transition-all text-left ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                        isActive ? 'bg-white text-blue-700' : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Admin status pill */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-xs text-slate-600 space-y-1">
          <div className="flex items-center gap-2">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
              style={{ backgroundColor: currentUser.color }}
            >
              {currentUser.nombre.charAt(0)}
            </div>
            <span className="font-bold text-slate-900">{currentUser.nombre}</span>
            <span className="text-[10px] text-amber-700 font-semibold ml-auto">Super Admin</span>
          </div>
          <p className="text-[11px] text-slate-400 pt-1">
            Operaciones registradas con sello de tiempo y trazabilidad en auditoría.
          </p>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <main className="flex-1 min-w-0">
        {activeSubtab === 'dashboard' && (
          <AdminDashboard
            users={users}
            vacations={vacations}
            birthdays={birthdays}
            compensatoryRequests={compensatoryRequests}
            onNavigateSubtab={(sub) => setActiveSubtab(sub as AdminSubtab)}
          />
        )}

        {activeSubtab === 'usuarios' && (
          <AdminUsers
            users={users}
            onSuccess={onSuccess}
            onError={onError}
            onRefresh={onRefresh}
          />
        )}

        {activeSubtab === 'solicitudes' && (
          <AdminRequests
            vacations={vacations}
            users={users}
            adminName={currentUser.nombre}
            onSuccess={onSuccess}
            onError={onError}
            onRefresh={onRefresh}
          />
        )}

        {activeSubtab === 'compensatorios' && (
          <AdminCompensatory
            compensatoryRequests={compensatoryRequests}
            users={users}
            adminName={currentUser.nombre}
            onSuccess={onSuccess}
            onError={onError}
            onRefresh={onRefresh}
          />
        )}

        {activeSubtab === 'periodos' && (
          <AdminPeriods
            adminName={currentUser.nombre}
            onSuccess={onSuccess}
            onError={onError}
            onRefresh={onRefresh}
          />
        )}

        {activeSubtab === 'auditoria' && <AdminAudit users={users} />}

        {activeSubtab === 'sheets' && (
          <AdminSheetsSync onSuccess={onSuccess} onError={onError} />
        )}
      </main>

    </div>
  );
};
