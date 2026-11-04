/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Auditoria, Movimiento, Usuario } from '../../types';
import { storage } from '../../services/storageService';
import { ShieldCheck, Download, Filter, Search, Calendar, FileSpreadsheet } from 'lucide-react';

interface AdminAuditProps {
  users: Usuario[];
}

export const AdminAudit: React.FC<AdminAuditProps> = ({ users }) => {
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [viewTab, setViewTab] = useState<'movimientos' | 'auditoria'>('movimientos');

  const movements = storage.getMovements();
  const auditLogs = storage.getAuditLogs();

  const getUserName = (id: string) => {
    const u = users.find((usr) => usr.id_usuario === id);
    return u ? u.nombre : id;
  };

  // Filtered movements
  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      if (selectedUser !== 'all' && m.id_usuario !== selectedUser) return false;
      if (selectedAction !== 'all' && m.tipo_movimiento !== selectedAction) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const userName = getUserName(m.id_usuario).toLowerCase();
        const motive = m.motivo.toLowerCase();
        const type = m.tipo_movimiento.toLowerCase();
        return userName.includes(term) || motive.includes(term) || type.includes(term);
      }
      return true;
    });
  }, [movements, selectedUser, selectedAction, searchTerm, users]);

  // Filtered audit logs
  const filteredAudit = useMemo(() => {
    return auditLogs.filter((a) => {
      if (selectedUser !== 'all' && a.usuario.toLowerCase() !== getUserName(selectedUser).toLowerCase()) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          a.usuario.toLowerCase().includes(term) ||
          a.accion.toLowerCase().includes(term) ||
          a.descripcion.toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [auditLogs, selectedUser, searchTerm, users]);

  const handleExportCsv = (type: 'MOVIMIENTOS' | 'AUDITORIA') => {
    const csvData = storage.exportToCsv(type);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `mi_calendario_${type.toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <span>Registro de Actividad y Auditoría</span>
          </h3>
          <p className="text-xs text-slate-500">
            Libro mayor inmutable con registro cronológico de saldos, aprobaciones y modificaciones
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExportCsv('MOVIMIENTOS')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Exportar Movimientos (CSV)</span>
          </button>

          <button
            onClick={() => handleExportCsv('AUDITORIA')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors shadow-2xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
            <span>Exportar Bitácora Completa</span>
          </button>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Sub-tab view switch */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl w-fit">
            <button
              onClick={() => setViewTab('movimientos')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                viewTab === 'movimientos'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Movimientos de Saldos ({movements.length})
            </button>
            <button
              onClick={() => setViewTab('auditoria')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                viewTab === 'auditoria'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bitácora de Eventos ({auditLogs.length})
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar en el registro..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:border-blue-500 outline-hidden w-full sm:w-56"
            />
          </div>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="font-semibold text-slate-400 text-[11px] uppercase tracking-wider">
            Filtrar:
          </span>

          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white font-medium"
          >
            <option value="all">Todos los colaboradores</option>
            {users.map((u) => (
              <option key={u.id_usuario} value={u.id_usuario}>
                {u.nombre}
              </option>
            ))}
          </select>

          {viewTab === 'movimientos' && (
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white font-medium"
            >
              <option value="all">Todos los tipos de movimiento</option>
              <option value="asignacion_inicial">Asignación inicial</option>
              <option value="solicitud_vacaciones">Solicitud de vacaciones</option>
              <option value="aprobacion_vacaciones">Aprobación de vacaciones</option>
              <option value="rechazo_vacaciones">Rechazo de vacaciones</option>
              <option value="cancelacion_vacaciones">Cancelación de vacaciones</option>
              <option value="alta_compensatorio">Alta de compensatorios</option>
              <option value="autorizacion_compensatorio">Autorización compensatoria</option>
              <option value="ajuste_saldo">Ajuste manual de saldo</option>
            </select>
          )}

          {(selectedUser !== 'all' || selectedAction !== 'all' || searchTerm) && (
            <button
              onClick={() => {
                setSelectedUser('all');
                setSelectedAction('all');
                setSearchTerm('');
              }}
              className="text-blue-600 hover:text-blue-800 text-xs font-semibold ml-auto"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* TABLE DATA */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {viewTab === 'movimientos' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Fecha y Hora</th>
                  <th className="py-3 px-4">Usuario</th>
                  <th className="py-3 px-4">Tipo de Movimiento</th>
                  <th className="py-3 px-4 text-center">Días</th>
                  <th className="py-3 px-4 text-center">Saldo Anterior</th>
                  <th className="py-3 px-4 text-center">Saldo Posterior</th>
                  <th className="py-3 px-4">Motivo / Justificación</th>
                  <th className="py-3 px-4">Admin Responsable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredMovements.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No hay movimientos que coincidan con los filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  filteredMovements.map((m) => (
                    <tr key={m.id_movimiento} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap font-mono">
                        {new Date(m.fecha).toLocaleString('es-MX')}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {getUserName(m.id_usuario)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 capitalize">
                          {m.tipo_movimiento.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold">
                        {m.cantidad_dias > 0 ? `+${m.cantidad_dias}` : m.cantidad_dias}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-500">
                        {m.saldo_anterior}d
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-blue-700">
                        {m.saldo_posterior}d
                      </td>
                      <td className="py-3 px-4 text-slate-700 max-w-xs truncate" title={m.motivo}>
                        {m.motivo}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {m.administrador_responsable || 'Sistema'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Fecha y Hora</th>
                  <th className="py-3 px-4">Usuario / Actor</th>
                  <th className="py-3 px-4">Acción</th>
                  <th className="py-3 px-4">Descripción del Suceso</th>
                  <th className="py-3 px-4">ID Evento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredAudit.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      No hay registros de auditoría que coincidan con la búsqueda.
                    </td>
                  </tr>
                ) : (
                  filteredAudit.map((a) => (
                    <tr key={a.id_evento} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap font-mono">
                        {new Date(a.fecha_hora).toLocaleString('es-MX')}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{a.usuario}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-blue-50 text-blue-800">
                          {a.accion}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700">{a.descripcion}</td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-[10px]">{a.id_evento}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="text-[11px] text-slate-400 text-center">
        🔒 Los registros de auditoría y movimientos son inmutables conforme a las normas de seguridad del sistema.
      </div>

    </div>
  );
};
