/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { storage } from '../../services/storageService';
import { GOOGLE_APPS_SCRIPT_TEMPLATE } from '../../services/appsScriptCode';
import {
  FileSpreadsheet,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Database,
} from 'lucide-react';

interface AdminSheetsSyncProps {
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export const AdminSheetsSync: React.FC<AdminSheetsSyncProps> = ({ onSuccess, onError }) => {
  const [appsScriptUrl, setAppsScriptUrl] = useState(storage.getAppsScriptUrl());
  const [adminToken, setAdminToken] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<string | null>(null);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
      onSuccess('Código de Google Apps Script copiado al portapapeles.');
    } catch {
      onError('No se pudo copiar automáticamente. Puedes seleccionarlo manualmente.');
    }
  };

  const handleSaveAndSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appsScriptUrl.trim()) {
      onError('Ingresa la URL de la aplicación web de Google Apps Script');
      return;
    }
    if (!adminToken.trim()) {
      onError('Ingresa el token de administrador configurado en Apps Script');
      return;
    }
    if (!window.confirm('Esta carga reemplazará las filas de datos de las pestañas con los datos locales de este navegador. ¿Deseas continuar?')) {
      return;
    }

    setIsSyncing(true);
    try {
      const res = await storage.syncWithAppsScript(appsScriptUrl.trim(), adminToken.trim());
      setAdminToken('');
      setLastSyncResult(res.message);
      onSuccess('Importación enviada. Verifica las filas en Google Sheets.');
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : 'Error al sincronizar');
    } finally {
      setIsSyncing(false);
    }
  };

  const sheetsList = [
    { name: 'USUARIOS', desc: 'id_usuario, nombre, color, password_hash, rol, estado, fecha_registro' },
    { name: 'CUMPLEAÑOS', desc: 'id_evento, id_usuario, fecha_cumpleaños, fecha_registro' },
    { name: 'VACACIONES', desc: 'id_vacacion, id_usuario, fecha_inicio, fecha_fin, cantidad_dias, dias_ordinarios, dias_compensatorios, estado...' },
    { name: 'SALDOS', desc: 'id_usuario, periodo, dias_asignados, dias_utilizados, dias_disponibles, dias_compensatorios...' },
    { name: 'MOVIMIENTOS', desc: 'id_movimiento, id_usuario, tipo_movimiento, cantidad_dias, saldo_anterior, saldo_posterior, motivo, fecha...' },
    { name: 'AUDITORIA', desc: 'id_evento, usuario, accion, descripcion, fecha_hora, datos_anteriores, datos_nuevos' },
    { name: 'CONFIGURACION', desc: 'parametro, valor, descripcion' },
    { name: 'FESTIVOS', desc: 'fecha, nombre, tipo, año' },
    { name: 'COMPENSATORIOS', desc: 'Solicitudes de días compensatorios y estado de aprobación' },
  ];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <span>Conexión con Google Sheets & Google Apps Script</span>
          </h3>
          <p className="text-xs text-slate-500">
            Lectura compartida y solicitudes pendientes mediante Apps Script con 9 pestañas
          </p>
        </div>

        <div className="flex items-center gap-2">
          {appsScriptUrl ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Conexión Configurada</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
              <Database className="w-3.5 h-3.5 text-blue-600" />
              <span>Modo Local Persistente Activo</span>
            </span>
          )}
        </div>
      </div>

      {/* URL INPUT & SYNC FORM */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <h4 className="text-sm font-bold text-slate-900">
          Importación inicial a Google Sheets (Apps Script Web App)
        </h4>

        <form onSubmit={handleSaveAndSync} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="url"
              placeholder="https://script.google.com/macros/s/.../exec"
              value={appsScriptUrl}
              onChange={(e) => setAppsScriptUrl(e.target.value)}
              className="flex-1 px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-blue-500 outline-hidden font-mono"
            />
            <input
              type="password"
              autoComplete="new-password"
              placeholder="ADMIN_TOKEN"
              value={adminToken}
              onChange={(e) => setAdminToken(e.target.value)}
              className="flex-1 px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-blue-500 outline-hidden font-mono"
            />
            <button
              type="submit"
              disabled={isSyncing}
              className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 shrink-0 disabled:bg-slate-300"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Importando...' : 'Importar datos locales'}</span>
            </button>
          </div>

          {lastSyncResult && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              <span>{lastSyncResult}</span>
            </div>
          )}

          <p className="text-[11px] text-slate-500">
            El token solo se usa para esta carga y no se guarda. Las solicitudes públicas se agregan como pendientes; no pueden aprobarse ni cambiar saldos desde el navegador.
          </p>
        </form>
      </div>

      {/* STEP-BY-STEP INSTRUCTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Setup Guide */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4 text-xs">
          <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
            Configuración de Google Apps Script
          </h4>

          <ol className="list-decimal list-inside space-y-2.5 text-slate-700">
            <li className="pl-1">
              <strong>Crea una Hoja de Cálculo:</strong> En Google Sheets crea una nueva hoja llamada <span className="font-mono bg-slate-100 px-1 py-0.5 rounded">Mi Calendario DB</span>.
            </li>
            <li className="pl-1">
              <strong>Abre el Editor de Scripts:</strong> En el menú superior ve a <em>Extensiones &gt; Apps Script</em>.
            </li>
            <li className="pl-1">
              <strong>Pega el Código:</strong> Reemplaza el archivo <span className="font-mono bg-slate-100 px-1 py-0.5 rounded">Code.gs</span> con el código oficial que puedes copiar a la derecha.
            </li>
            <li className="pl-1">
              <strong>Ejecuta setupSheets():</strong> En la barra superior selecciona la función <span className="font-mono bg-slate-100 px-1 py-0.5 rounded">setupSheets</span> y haz clic en <em>Ejecutar</em>. Esto creará automáticamente las 8 pestañas con sus columnas.
            </li>
            <li className="pl-1">
              <strong>Implementar como Web App:</strong> Clic en <em>Implementar &gt; Nueva implementación</em>.
              <ul className="list-disc list-inside pl-4 mt-1 space-y-0.5 text-slate-600">
                <li>Tipo: Aplicación web (Web app).</li>
                <li>Ejecutar como: <strong>Yo (tu cuenta)</strong>.</li>
                <li>Quién tiene acceso: <strong>Cualquier usuario (Anyone)</strong>.</li>
              </ul>
            </li>
            <li className="pl-1">
              <strong>Pega la URL arriba:</strong> Copia la URL terminada en <span className="font-mono bg-slate-100 px-1 py-0.5 rounded">/exec</span> y pégala en el campo superior.
            </li>
          </ol>
        </div>

        {/* Right: The 8 Sheets Specification */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="text-sm font-bold text-slate-900">
              Estructura de las 9 Hojas Oficiales
            </h4>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
              9 Pestañas
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto text-xs">
            {sheetsList.map((s) => (
              <div key={s.name} className="py-2.5">
                <span className="font-bold text-slate-900 font-mono text-[11px] block">{s.name}</span>
                <span className="text-[11px] text-slate-500 font-mono block mt-0.5">{s.desc}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* CODE PREVIEW & COPY BUTTON */}
      <div className="bg-slate-900 rounded-2xl text-slate-100 p-6 space-y-3 shadow-md">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-emerald-400">Code.gs</span>
            <span className="text-xs text-slate-400">· Google Apps Script Backend con LockService</span>
          </div>

          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-lg transition-colors"
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">¡Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar Código Completo</span>
              </>
            )}
          </button>
        </div>

        <pre className="text-[11px] font-mono text-slate-300 max-h-60 overflow-y-auto p-3 bg-black/40 rounded-xl leading-relaxed">
          {GOOGLE_APPS_SCRIPT_TEMPLATE.substring(0, 1500)}...
        </pre>
      </div>

    </div>
  );
};
