/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { Usuario, Vacacion, Cumpleanos, CompensatorioSolicitud } from '../../types';
import { storage } from '../../services/storageService';
import {
  Users,
  UserCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Palmtree,
  Cake,
  Award,
  TrendingUp,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

interface AdminDashboardProps {
  users: Usuario[];
  vacations: Vacacion[];
  birthdays: Cumpleanos[];
  compensatoryRequests: CompensatorioSolicitud[];
  onNavigateSubtab: (subtab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  users,
  vacations,
  birthdays,
  compensatoryRequests,
  onNavigateSubtab,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // 1. STATS METRICS
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.estado === 'activo').length;
  const pendingRequests = vacations.filter((v) => v.estado === 'pendiente' || v.estado === 'cancelacion_solicitada').length;
  const approvedRequests = vacations.filter((v) => v.estado === 'aprobada').length;
  const rejectedRequests = vacations.filter((v) => v.estado === 'rechazada').length;
  const onVacationNow = vacations.filter(
    (v) => v.estado === 'aprobada' && todayStr >= v.fecha_inicio && todayStr <= v.fecha_fin
  ).length;
  const pendingCompensatory = compensatoryRequests.filter((r) => r.estado === 'pendiente').length;

  // 2. CHART 1: Vacation requests by month (12 months)
  const monthlyVacationData = useMemo(() => {
    const months = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
    ];
    const data = months.map((m, idx) => ({ name: m, aprobadas: 0, pendientes: 0 }));

    vacations.forEach((v) => {
      if (v.fecha_inicio) {
        const mIdx = Number(v.fecha_inicio.split('-')[1]) - 1;
        if (mIdx >= 0 && mIdx < 12) {
          if (v.estado === 'aprobada') {
            data[mIdx].aprobadas += v.cantidad_dias;
          } else if (v.estado === 'pendiente') {
            data[mIdx].pendientes += v.cantidad_dias;
          }
        }
      }
    });

    return data;
  }, [vacations]);

  // 3. CHART 2: Days used by user
  const userUsageData = useMemo(() => {
    const balances = storage.getBalances();
    return users.map((u) => {
      const bal = balances.find((b) => b.id_usuario === u.id_usuario);
      return {
        nombre: u.nombre,
        utilizados: bal ? bal.dias_utilizados : 0,
        disponibles: bal ? bal.dias_disponibles : 10,
        color: u.color,
      };
    });
  }, [users, vacations]);

  // 4. CHART 3: Compensatory days authorized per user
  const compensatoryData = useMemo(() => {
    const balances = storage.getBalances();
    return users.map((u) => {
      const bal = balances.find((b) => b.id_usuario === u.id_usuario);
      return {
        nombre: u.nombre,
        autorizados: bal ? bal.dias_compensatorios_autorizados : 0,
        saldo: bal ? bal.saldo_compensatorio : 0,
      };
    });
  }, [users]);

  // 5. CHART 4: Vacation distribution by semester / quarter
  const distributionData = useMemo(() => {
    let s1 = 0; // Ene - Jun
    let s2 = 0; // Jul - Dic

    vacations.forEach((v) => {
      if (v.estado === 'aprobada' && v.fecha_inicio) {
        const m = Number(v.fecha_inicio.split('-')[1]);
        if (m <= 6) s1 += v.cantidad_dias;
        else s2 += v.cantidad_dias;
      }
    });

    return [
      { name: 'Semestre 1 (Ene - Jun)', value: s1 || 0, color: '#2563EB' },
      { name: 'Semestre 2 (Jul - Dic)', value: s2 || 0, color: '#4F46E5' },
    ];
  }, [vacations]);

  return (
    <div className="space-y-6">
      
      {/* 5.1 DASHBOARD PRINCIPAL INDICATORS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3.5">
        
        <div
          onClick={() => onNavigateSubtab('usuarios')}
          className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-blue-400 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Usuarios Totales</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">{totalUsers}</span>
            <span className="text-[11px] font-medium text-emerald-600">{activeUsers} activos</span>
          </div>
        </div>

        <div
          onClick={() => onNavigateSubtab('solicitudes')}
          className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-amber-400 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Solicitudes Pendientes</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono tabular-nums text-amber-700">{pendingRequests}</span>
            <span className="text-[11px] text-slate-400">por evaluar</span>
          </div>
        </div>

        <div
          onClick={() => onNavigateSubtab('solicitudes')}
          className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-emerald-400 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Solicitudes Aprobadas</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono tabular-nums text-emerald-700">{approvedRequests}</span>
            <span className="text-[11px] text-rose-600">{rejectedRequests} rechazadas</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">De Vacaciones Hoy</span>
            <Palmtree className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono tabular-nums text-blue-700">{onVacationNow}</span>
            <span className="text-[11px] text-slate-400">colaboradores</span>
          </div>
        </div>

        <div
          onClick={() => onNavigateSubtab('compensatorios')}
          className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-amber-400 cursor-pointer transition-all col-span-2 sm:col-span-4 lg:col-span-4 flex items-center justify-between bg-amber-50/40"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">
                Días compensatorios pendientes de autorización: <span className="text-amber-800 font-mono font-extrabold text-sm">{pendingCompensatory} solicitud(es)</span>
              </p>
              <p className="text-[11px] text-slate-500">
                Jornadas extraordinarias reportadas por colaboradores pendientes de tu visto bueno.
              </p>
            </div>
          </div>
          <button className="px-3.5 py-1.5 text-xs font-bold text-amber-900 bg-white border border-amber-300 hover:bg-amber-100 rounded-lg shadow-xs transition-colors">
            Revisar bandeja →
          </button>
        </div>

      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CHART 1: Vacation days by month */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900">
              Días de vacaciones solicitados por mes
            </h4>
            <span className="text-xs text-slate-400">Total días hábiles</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyVacationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                <Bar dataKey="aprobadas" name="Días Aprobados" fill="#2563EB" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pendientes" name="Días Pendientes" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: Days used vs available by user */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900">
              Días ordinarios utilizados por usuario
            </h4>
            <span className="text-xs text-slate-400">Periodo activo</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={userUsageData} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} domain={[0, 10]} />
                <YAxis dataKey="nombre" type="category" tick={{ fontSize: 11, fill: '#1e293b' }} width={60} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                <Bar dataKey="utilizados" name="Días Utilizados" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                <Bar dataKey="disponibles" name="Días Disponibles" fill="#CBD5E1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 3: Compensatory days authorized */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900">
              Días compensatorios autorizados por colaborador
            </h4>
            <span className="text-xs text-slate-400">Jornadas recuperables</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={compensatoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="nombre" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                <Bar dataKey="autorizados" name="Total Autorizados" fill="#D97706" radius={[4, 4, 0, 0]} />
                <Bar dataKey="saldo" name="Saldo Actual Disponible" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 4: Semester distribution */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900">
              Distribución de vacaciones durante el año
            </h4>
            <span className="text-xs text-slate-400">Semestre 1 vs Semestre 2</span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {distributionData.every((d) => d.value === 0) ? (
              <div className="text-center text-xs text-slate-400">
                Sin días aprobados aún en los periodos del año
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    label={({ name, percent }: { name?: string; percent?: number }) =>
                      `${(name || '').split(' ')[0]}: ${((percent || 0) * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
