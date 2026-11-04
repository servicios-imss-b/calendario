/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { storage } from '../../services/storageService';
import { Settings, Save, AlertCircle, CheckCircle2, Calendar } from 'lucide-react';
import { getMexicanHolidays } from '../../utils/mexicanHolidays';

interface AdminPeriodsProps {
  adminName: string;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
  onRefresh: () => void;
}

export const AdminPeriods: React.FC<AdminPeriodsProps> = ({
  adminName,
  onSuccess,
  onError,
  onRefresh,
}) => {
  const configMap = storage.getConfigMap();

  const [diasSemestre, setDiasSemestre] = useState(configMap.dias_ordinarios_semestre || '10');
  const [periodoActual, setPeriodoActual] = useState(configMap.periodo_actual || '2026-S2');
  const [excluirFines, setExcluirFines] = useState(configMap.excluir_fines_semana !== 'false');
  const [excluirFestivos, setExcluirFestivos] = useState(configMap.excluir_festivos_mexico !== 'false');
  const [permitirCoincidencias, setPermitirCoincidencias] = useState(configMap.permitir_coincidencias !== 'false');

  const mexicanHolidays2026 = getMexicanHolidays(2026).filter((h) => h.tipo === 'oficial');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      storage.updateConfig('dias_ordinarios_semestre', String(diasSemestre), adminName);
      storage.updateConfig('periodo_actual', periodoActual, adminName);
      storage.updateConfig('excluir_fines_semana', String(excluirFines), adminName);
      storage.updateConfig('excluir_festivos_mexico', String(excluirFestivos), adminName);
      storage.updateConfig('permitir_coincidencias', String(permitirCoincidencias), adminName);

      onSuccess('Configuración de periodos y reglas guardada correctamente.');
      onRefresh();
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : 'Error al guardar configuración');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600" />
          <span>Configuración de Periodos y Reglas</span>
        </h3>
        <p className="text-xs text-slate-500">
          Ajusta los días ordinarios por semestre, reglas de deducción de vacaciones y días festivos aplicables
        </p>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Period & Days rules */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
          <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
            Parámetros del Periodo Semestral
          </h4>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Días ordinarios por semestre (Base legal / Política interna)
            </label>
            <input
              type="number"
              min="1"
              max="30"
              value={diasSemestre}
              onChange={(e) => setDiasSemestre(e.target.value)}
              required
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:border-blue-500 outline-hidden font-mono font-bold"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              El valor predeterminado del sistema es de 10 días por semestre (Enero-Junio y Julio-Diciembre).
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Periodo semestral en curso
            </label>
            <select
              value={periodoActual}
              onChange={(e) => setPeriodoActual(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-white font-medium"
            >
              <option value="2026-S1">2026-S1 (Enero a Junio 2026)</option>
              <option value="2026-S2">2026-S2 (Julio a Diciembre 2026)</option>
              <option value="2027-S1">2027-S1 (Enero a Junio 2027)</option>
              <option value="2027-S2">2027-S2 (Julio a Diciembre 2027)</option>
            </select>
          </div>

          {/* Toggle Switches */}
          <div className="space-y-3 pt-2">
            <h5 className="text-xs font-bold text-slate-800">Reglas de Conteo y Coincidencia:</h5>

            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={excluirFines}
                onChange={(e) => setExcluirFines(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 mt-0.5"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-900 block">Excluir fines de semana</span>
                <span className="text-slate-500 text-[11px]">
                  No contabilizar sábados ni domingos dentro del saldo de vacaciones.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={excluirFestivos}
                onChange={(e) => setExcluirFestivos(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 mt-0.5"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-900 block">Excluir días festivos de México (Art. 74 LFT)</span>
                <span className="text-slate-500 text-[11px]">
                  Los días de descanso obligatorio oficial no descuentan días del saldo.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={permitirCoincidencias}
                onChange={(e) => setPermitirCoincidencias(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 mt-0.5"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-900 block">Permitir coincidencia ilimitada</span>
                <span className="text-slate-500 text-[11px]">
                  No bloquear fechas por coincidencia con otros compañeros de equipo.
                </span>
              </div>
            </label>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Reglas de Periodo</span>
            </button>
          </div>
        </div>

        {/* Right Column: Mexican Official Holidays Active Reference */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Días de Descanso Obligatorio en México (2026)
              </h4>
              <p className="text-[11px] text-slate-500">Conforme al Artículo 74 de la Ley Federal del Trabajo</p>
            </div>
            <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md">
              Ley Federal del Trabajo
            </span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {mexicanHolidays2026.map((h) => (
              <div key={h.id || h.fecha} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">🇲🇽</span>
                  <div>
                    <span className="font-semibold text-slate-800 block">{h.nombre}</span>
                    <span className="text-[11px] text-slate-400">Descanso oficial en toda la República</span>
                  </div>
                </div>
                <span className="font-mono font-bold text-slate-700 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">
                  {h.fecha}
                </span>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
            💡 El sistema recalcula automáticamente los días festivos oficiales móviles (como el primer lunes de febrero y los terceros lunes de marzo y noviembre) cada vez que el usuario navega a un año diferente.
          </div>
        </div>

      </form>

    </div>
  );
};
