/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'admin' | 'usuario';
export type UserStatus = 'activo' | 'inactivo';

export interface Usuario {
  id_usuario: string;
  nombre: string;
  color: string;
  password_hash: string;
  rol: UserRole;
  estado: UserStatus;
  fecha_registro: string;
}

export interface Cumpleanos {
  id_evento: string;
  id_usuario: string;
  fecha_cumpleaños: string; // ISO string or MM-DD / YYYY-MM-DD
  fecha_registro: string;
}

export type VacationStatus = 'pendiente' | 'aprobada' | 'rechazada' | 'cancelada' | 'cancelacion_solicitada';
export type VacationDayType = 'ordinarios' | 'compensatorios' | 'mixto';

export interface Vacacion {
  id_vacacion: string;
  id_usuario: string;
  fecha_inicio: string; // YYYY-MM-DD
  fecha_fin: string; // YYYY-MM-DD
  cantidad_dias: number;
  dias_ordinarios: number;
  dias_compensatorios: number;
  periodo?: string;
  tipo_dias?: VacationDayType;
  estado: VacationStatus;
  observaciones?: string;
  fecha_solicitud: string;
  fecha_resolucion?: string;
  administrador_responsable?: string;
  motivo_rechazo?: string;
}

export interface Saldo {
  id_usuario: string;
  periodo: string; // e.g. "2026-S1" or "2026-S2"
  dias_asignados: number; // default 10
  dias_utilizados: number;
  dias_disponibles: number;
  dias_compensatorios_autorizados: number;
  dias_compensatorios_utilizados: number;
  saldo_compensatorio: number; // autorizados - utilizados
}

export type MovimientoTipo =
  | 'asignacion_inicial'
  | 'solicitud_vacaciones'
  | 'aprobacion_vacaciones'
  | 'rechazo_vacaciones'
  | 'cancelacion_vacaciones'
  | 'alta_compensatorio'
  | 'autorizacion_compensatorio'
  | 'rechazo_compensatorio'
  | 'ajuste_saldo';

export interface Movimiento {
  id_movimiento: string;
  id_usuario: string;
  tipo_movimiento: MovimientoTipo;
  cantidad_dias: number;
  saldo_anterior: number;
  saldo_posterior: number;
  motivo: string;
  fecha: string;
  administrador_responsable?: string;
}

export interface Auditoria {
  id_evento: string;
  usuario: string;
  accion: string;
  descripcion: string;
  fecha_hora: string;
  datos_anteriores?: string;
  datos_nuevos?: string;
}

export interface Configuracion {
  parametro: string;
  valor: string;
  descripcion: string;
}

export type HolidayType = 'oficial' | 'cultural';

export interface Festivo {
  id?: string;
  fecha: string; // YYYY-MM-DD
  nombre: string;
  tipo: HolidayType;
  año: number;
}

export interface CompensatorioSolicitud {
  id_solicitud: string;
  id_usuario: string;
  cantidad_dias: number;
  motivo: string;
  fecha_trabajada?: string;
  fecha_solicitud: string;
  estado: 'pendiente' | 'autorizado' | 'rechazado';
  administrador_responsable?: string;
  fecha_resolucion?: string;
  motivo_rechazo?: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
}
