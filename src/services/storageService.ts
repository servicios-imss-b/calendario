/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Usuario,
  Cumpleanos,
  Vacacion,
  Saldo,
  Movimiento,
  Auditoria,
  Configuracion,
  Festivo,
  CompensatorioSolicitud,
} from '../types';
import { getMexicanHolidays } from '../utils/mexicanHolidays';

const STORAGE_KEYS = {
  USERS: 'mi_calendario_usuarios_v1',
  BIRTHDAYS: 'mi_calendario_cumpleanos_v1',
  VACATIONS: 'mi_calendario_vacaciones_v1',
  BALANCES: 'mi_calendario_saldos_v1',
  MOVEMENTS: 'mi_calendario_movimientos_v1',
  AUDIT: 'mi_calendario_auditoria_v1',
  CONFIG: 'mi_calendario_config_v1',
  COMPENSATORY_REQUESTS: 'mi_calendario_comp_solicitudes_v1',
  APPS_SCRIPT_URL: 'mi_calendario_apps_script_url_v1',
};

const DEFAULT_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyrjCGkq_s2r0_fQxb85UsT9tMHAydOPv_zWYtVlVeCGh0VJuT7jhM_juvgknElWsi0VA/exec';

// Initial Seed Data complying with user request
const INITIAL_USERS: Usuario[] = [
  {
    id_usuario: 'usr_martin',
    nombre: 'Martin',
    color: '#2563EB', // Sapphire Blue
    password_hash: '',
    rol: 'admin',
    estado: 'activo',
    fecha_registro: '2026-01-10T09:00:00.000Z',
  },
  {
    id_usuario: 'usr_ana',
    nombre: 'Ana',
    color: '#0D9488', // Emerald Teal
    password_hash: '',
    rol: 'usuario',
    estado: 'activo',
    fecha_registro: '2026-01-15T10:30:00.000Z',
  },
  {
    id_usuario: 'usr_carlos',
    nombre: 'Carlos',
    color: '#D97706', // Warm Amber
    password_hash: '',
    rol: 'usuario',
    estado: 'activo',
    fecha_registro: '2026-02-01T11:15:00.000Z',
  },
  {
    id_usuario: 'usr_sofia',
    nombre: 'Sofia',
    color: '#7C3AED', // Royal Violet
    password_hash: '',
    rol: 'usuario',
    estado: 'activo',
    fecha_registro: '2026-02-15T08:45:00.000Z',
  },
];

const INITIAL_BIRTHDAYS: Cumpleanos[] = [
  {
    id_evento: 'bday_martin',
    id_usuario: 'usr_martin',
    fecha_cumpleaños: '1992-03-15',
    fecha_registro: '2026-01-10T09:00:00.000Z',
  },
  {
    id_evento: 'bday_ana',
    id_usuario: 'usr_ana',
    fecha_cumpleaños: '1995-07-22',
    fecha_registro: '2026-01-15T10:30:00.000Z',
  },
  {
    id_evento: 'bday_carlos',
    id_usuario: 'usr_carlos',
    fecha_cumpleaños: '1990-11-18',
    fecha_registro: '2026-02-01T11:15:00.000Z',
  },
  {
    id_evento: 'bday_sofia',
    id_usuario: 'usr_sofia',
    fecha_cumpleaños: '1994-05-10',
    fecha_registro: '2026-02-15T08:45:00.000Z',
  },
];

// Matching the prompt's exact example:
// Diciembre 2026:
// 10: 🏖️ Martin, 🏖️ Ana
// 11: 🏖️ Martin, 🏖️ Ana, 🏖️ Carlos
// 12: 🏖️ Martin, 🏖️ Ana, 🏖️ Carlos
// 13: 🏖️ Martin, 🏖️ Carlos
const INITIAL_VACATIONS: Vacacion[] = [
  {
    id_vacacion: 'vac_martin_1',
    id_usuario: 'usr_martin',
    fecha_inicio: '2026-12-10',
    fecha_fin: '2026-12-13',
    cantidad_dias: 2, // Dec 10 (Thu), Dec 11 (Fri) are working days; Dec 12 & 13 are Sat/Sun!
    dias_ordinarios: 2,
    dias_compensatorios: 0,
    tipo_dias: 'ordinarios',
    estado: 'aprobada',
    observaciones: 'Vacaciones de fin de año compartidas',
    fecha_solicitud: '2026-10-15T10:00:00.000Z',
    fecha_resolucion: '2026-10-16T12:00:00.000Z',
    administrador_responsable: 'Martin',
  },
  {
    id_vacacion: 'vac_ana_1',
    id_usuario: 'usr_ana',
    fecha_inicio: '2026-12-10',
    fecha_fin: '2026-12-12',
    cantidad_dias: 2, // Dec 10, Dec 11
    dias_ordinarios: 2,
    dias_compensatorios: 0,
    tipo_dias: 'ordinarios',
    estado: 'aprobada',
    observaciones: 'Descanso de invierno',
    fecha_solicitud: '2026-10-20T11:00:00.000Z',
    fecha_resolucion: '2026-10-21T09:30:00.000Z',
    administrador_responsable: 'Martin',
  },
  {
    id_vacacion: 'vac_carlos_1',
    id_usuario: 'usr_carlos',
    fecha_inicio: '2026-12-11',
    fecha_fin: '2026-12-13',
    cantidad_dias: 1, // Dec 11 (Fri) working day
    dias_ordinarios: 1,
    dias_compensatorios: 0,
    tipo_dias: 'ordinarios',
    estado: 'aprobada',
    observaciones: 'Salida de fin de semana largo',
    fecha_solicitud: '2026-10-25T14:20:00.000Z',
    fecha_resolucion: '2026-10-26T16:00:00.000Z',
    administrador_responsable: 'Martin',
  },
  {
    id_vacacion: 'vac_sofia_pending',
    id_usuario: 'usr_sofia',
    fecha_inicio: '2026-12-28',
    fecha_fin: '2026-12-30',
    cantidad_dias: 3,
    dias_ordinarios: 3,
    dias_compensatorios: 0,
    tipo_dias: 'ordinarios',
    estado: 'pendiente',
    observaciones: 'Días de cierre de año para viaje familiar',
    fecha_solicitud: '2026-11-01T10:15:00.000Z',
  },
];

// Saldo exacto del ejemplo de Martin:
// Martin: Días ordinarios: 10, utilizados: 8, disponibles: 2, compensatorios autorizados: 5, utilizados: 0. Total: 7.
const INITIAL_BALANCES: Saldo[] = [
  {
    id_usuario: 'usr_martin',
    periodo: '2026-S2',
    dias_asignados: 10,
    dias_utilizados: 8,
    dias_disponibles: 2,
    dias_compensatorios_autorizados: 5,
    dias_compensatorios_utilizados: 0,
    saldo_compensatorio: 5,
  },
  {
    id_usuario: 'usr_ana',
    periodo: '2026-S2',
    dias_asignados: 10,
    dias_utilizados: 2,
    dias_disponibles: 8,
    dias_compensatorios_autorizados: 2,
    dias_compensatorios_utilizados: 0,
    saldo_compensatorio: 2,
  },
  {
    id_usuario: 'usr_carlos',
    periodo: '2026-S2',
    dias_asignados: 10,
    dias_utilizados: 1,
    dias_disponibles: 9,
    dias_compensatorios_autorizados: 1,
    dias_compensatorios_utilizados: 0,
    saldo_compensatorio: 1,
  },
  {
    id_usuario: 'usr_sofia',
    periodo: '2026-S2',
    dias_asignados: 10,
    dias_utilizados: 0,
    dias_disponibles: 10,
    dias_compensatorios_autorizados: 0,
    dias_compensatorios_utilizados: 0,
    saldo_compensatorio: 0,
  },
];

const INITIAL_COMPENSATORY_REQUESTS: CompensatorioSolicitud[] = [
  {
    id_solicitud: 'comp_carlos_1',
    id_usuario: 'usr_carlos',
    cantidad_dias: 2,
    motivo: 'Migración y mantenimiento de servidores en fin de semana sin remuneración extra',
    fecha_trabajada: '2026-10-24',
    fecha_solicitud: '2026-10-26T09:00:00.000Z',
    estado: 'pendiente',
  },
  {
    id_solicitud: 'comp_martin_1',
    id_usuario: 'usr_martin',
    cantidad_dias: 5,
    motivo: 'Cobertura de guardia directiva y soporte crítico en festivos',
    fecha_trabajada: '2026-09-16',
    fecha_solicitud: '2026-09-18T10:00:00.000Z',
    estado: 'autorizado',
    administrador_responsable: 'Martin',
    fecha_resolucion: '2026-09-18T10:30:00.000Z',
  },
];

const INITIAL_MOVEMENTS: Movimiento[] = [
  {
    id_movimiento: 'mov_init_martin',
    id_usuario: 'usr_martin',
    tipo_movimiento: 'asignacion_inicial',
    cantidad_dias: 10,
    saldo_anterior: 0,
    saldo_posterior: 10,
    motivo: 'Asignación ordinaria Semestre 2 2026',
    fecha: '2026-07-01T08:00:00.000Z',
    administrador_responsable: 'Sistema',
  },
  {
    id_movimiento: 'mov_comp_martin',
    id_usuario: 'usr_martin',
    tipo_movimiento: 'autorizacion_compensatorio',
    cantidad_dias: 5,
    saldo_anterior: 0,
    saldo_posterior: 5,
    motivo: 'Autorización de 5 días compensatorios por guardias extraordinarias',
    fecha: '2026-09-18T10:30:00.000Z',
    administrador_responsable: 'Martin',
  },
  {
    id_movimiento: 'mov_vac_martin_1',
    id_usuario: 'usr_martin',
    tipo_movimiento: 'aprobacion_vacaciones',
    cantidad_dias: 2,
    saldo_anterior: 4,
    saldo_posterior: 2,
    motivo: 'Aprobación de vacaciones 10 al 13 de diciembre (2 días hábiles)',
    fecha: '2026-10-16T12:00:00.000Z',
    administrador_responsable: 'Martin',
  },
];

const INITIAL_AUDIT: Auditoria[] = [
  {
    id_evento: 'aud_1',
    usuario: 'Martin',
    accion: 'SISTEMA_INICIALIZADO',
    descripcion: 'Puesta en marcha de Mi Calendario con regla de 10 días por semestre',
    fecha_hora: '2026-07-01T08:00:00.000Z',
  },
  {
    id_evento: 'aud_2',
    usuario: 'Martin',
    accion: 'AUTORIZACION_COMPENSATORIO',
    descripcion: 'Autorización de 5 días compensatorios para Martin',
    fecha_hora: '2026-09-18T10:30:00.000Z',
  },
  {
    id_evento: 'aud_3',
    usuario: 'Martin',
    accion: 'APROBACION_VACACIONES',
    descripcion: 'Aprobación de solicitud de vacaciones para Martin (2 días)',
    fecha_hora: '2026-10-16T12:00:00.000Z',
  },
];

const INITIAL_CONFIG: Configuracion[] = [
  {
    parametro: 'dias_ordinarios_semestre',
    valor: '10',
    descripcion: 'Días ordinarios de vacaciones otorgados por cada semestre',
  },
  {
    parametro: 'periodo_actual',
    valor: '2026-S2',
    descripcion: 'Periodo semestral activo (S1: Enero-Junio, S2: Julio-Diciembre)',
  },
  {
    parametro: 'excluir_fines_semana',
    valor: 'true',
    descripcion: 'No contabilizar sábados ni domingos al deducir días de vacaciones',
  },
  {
    parametro: 'excluir_festivos_mexico',
    valor: 'true',
    descripcion: 'No contabilizar días festivos obligatorios conforme a la LFT',
  },
  {
    parametro: 'permitir_coincidencias',
    valor: 'true',
    descripcion: 'Permitir que múltiples colaboradores coincidan en vacaciones sin bloqueo',
  },
];

class StorageService {
  constructor() {
    this.ensureInitialized();
  }

  private ensureInitialized() {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      this.resetToDefaults();
    }
  }

  public resetToDefaults() {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.BIRTHDAYS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.VACATIONS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.BALANCES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.COMPENSATORY_REQUESTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(INITIAL_CONFIG));
  }

  // --- USERS ---
  public getUsers(): Usuario[] {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    return data ? JSON.parse(data) : INITIAL_USERS;
  }

  public getUser(id: string): Usuario | undefined {
    return this.getUsers().find((u) => u.id_usuario === id);
  }

  public removePerson(userId: string): void {
    if (!this.getUser(userId)) throw new Error('Persona no encontrada');

    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(this.getUsers().filter((user) => user.id_usuario !== userId)));
    localStorage.setItem(STORAGE_KEYS.BIRTHDAYS, JSON.stringify(this.getBirthdays().filter((birthday) => birthday.id_usuario !== userId)));
    localStorage.setItem(STORAGE_KEYS.VACATIONS, JSON.stringify(this.getVacations().filter((vacation) => vacation.id_usuario !== userId)));
    localStorage.setItem(STORAGE_KEYS.BALANCES, JSON.stringify(this.getBalances().filter((balance) => balance.id_usuario !== userId)));
    localStorage.setItem(STORAGE_KEYS.COMPENSATORY_REQUESTS, JSON.stringify(this.getCompensatoryRequests().filter((request) => request.id_usuario !== userId)));
    localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(this.getMovements().filter((movement) => movement.id_usuario !== userId)));
  }

  public createUser(user: Omit<Usuario, 'id_usuario' | 'fecha_registro'>, adminName = 'Sistema'): Usuario {
    const users = this.getUsers();
    // Validate unique single name
    const cleanName = user.nombre.trim();
    if (users.some((u) => u.nombre.toLowerCase() === cleanName.toLowerCase())) {
      throw new Error(`El nombre "${cleanName}" ya está registrado. Cada usuario debe tener un nombre único.`);
    }

    // Validate unique color
    if (users.some((u) => u.color.toLowerCase() === user.color.toLowerCase())) {
      throw new Error(`El color seleccionado ya está en uso por otro compañero. Por favor selecciona otro color.`);
    }

    const newUser: Usuario = {
      ...user,
      nombre: cleanName,
      id_usuario: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      fecha_registro: new Date().toISOString(),
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    // Initialize balance
    const balances = this.getBalances();
    const config = this.getConfigMap();
    const diasPorSemestre = Number(config.dias_ordinarios_semestre) || 10;
    const now = new Date();
    const periodo = `${now.getFullYear()}-S${now.getMonth() < 6 ? 1 : 2}`;

    const newBalance: Saldo = {
      id_usuario: newUser.id_usuario,
      periodo,
      dias_asignados: diasPorSemestre,
      dias_utilizados: 0,
      dias_disponibles: diasPorSemestre,
      dias_compensatorios_autorizados: 0,
      dias_compensatorios_utilizados: 0,
      saldo_compensatorio: 0,
    };
    balances.push(newBalance);
    localStorage.setItem(STORAGE_KEYS.BALANCES, JSON.stringify(balances));

    // Audit log
    this.addAuditLog(
      adminName,
      'CREACION_USUARIO',
      `Se registró al usuario ${newUser.nombre} con rol ${newUser.rol}`,
      undefined,
      JSON.stringify(newUser)
    );

    return newUser;
  }

  public updateUser(
    userId: string,
    updates: Partial<Pick<Usuario, 'nombre' | 'color' | 'rol' | 'estado'>>,
    adminName = 'Sistema'
  ): Usuario {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id_usuario === userId);
    if (idx === -1) throw new Error('Usuario no encontrado');

    const oldUser = { ...users[idx] };

    // Check unique name if changing
    if (updates.nombre && updates.nombre.trim().toLowerCase() !== oldUser.nombre.toLowerCase()) {
      const cleanName = updates.nombre.trim();
      if (users.some((u) => u.id_usuario !== userId && u.nombre.toLowerCase() === cleanName.toLowerCase())) {
        throw new Error(`El nombre "${cleanName}" ya está registrado.`);
      }
      users[idx].nombre = cleanName;
    }

    // Check unique color if changing
    if (updates.color && updates.color.toLowerCase() !== oldUser.color.toLowerCase()) {
      if (users.some((u) => u.id_usuario !== userId && u.color.toLowerCase() === updates.color!.toLowerCase())) {
        throw new Error('El color seleccionado ya está en uso por otro usuario.');
      }
      users[idx].color = updates.color;
    }

    if (updates.rol !== undefined) users[idx].rol = updates.rol;
    if (updates.estado !== undefined) users[idx].estado = updates.estado;

    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    this.addAuditLog(
      adminName,
      'MODIFICACION_USUARIO',
      `Actualización de datos para usuario ${users[idx].nombre}`,
      JSON.stringify(oldUser),
      JSON.stringify(users[idx])
    );

    return users[idx];
  }

  public resetUserPassword(userId: string, newPasswordHash: string, adminName = 'Sistema') {
    const users = this.getUsers();
    const user = users.find((u) => u.id_usuario === userId);
    if (!user) throw new Error('Usuario no encontrado');

    user.password_hash = newPasswordHash;
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    this.addAuditLog(
      adminName,
      'RESTABLECER_CONTRASENA',
      `Se restableció la contraseña para el usuario ${user.nombre}`
    );
  }

  public toggleUserStatus(userId: string, adminName = 'Sistema'): Usuario {
    const users = this.getUsers();
    const user = users.find((u) => u.id_usuario === userId);
    if (!user) throw new Error('Usuario no encontrado');

    // Rule: Don't allow hard delete if has history, allow deactivate/reactivate
    user.estado = user.estado === 'activo' ? 'inactivo' : 'activo';
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    this.addAuditLog(
      adminName,
      user.estado === 'activo' ? 'REACTIVACION_USUARIO' : 'DESACTIVACION_USUARIO',
      `El usuario ${user.nombre} pasó a estado ${user.estado}`
    );

    return user;
  }

  // --- BIRTHDAYS ---
  public getBirthdays(): Cumpleanos[] {
    const data = localStorage.getItem(STORAGE_KEYS.BIRTHDAYS);
    return data ? JSON.parse(data) : INITIAL_BIRTHDAYS;
  }

  public setBirthday(userId: string, dateStr: string): Cumpleanos {
    const bdays = this.getBirthdays();
    const existingIdx = bdays.findIndex((b) => b.id_usuario === userId);
    const user = this.getUser(userId);

    let event: Cumpleanos;
    if (existingIdx !== -1) {
      bdays[existingIdx].fecha_cumpleaños = dateStr;
      event = bdays[existingIdx];
    } else {
      event = {
        id_evento: `bday_${userId}_${Date.now()}`,
        id_usuario: userId,
        fecha_cumpleaños: dateStr,
        fecha_registro: new Date().toISOString(),
      };
      bdays.push(event);
    }

    localStorage.setItem(STORAGE_KEYS.BIRTHDAYS, JSON.stringify(bdays));

    if (user) {
      this.addAuditLog(user.nombre, 'REGISTRO_CUMPLEANOS', `Cumpleaños registrado para el ${dateStr}`);
    }

    return event;
  }

  // --- BALANCES ---
  public getBalances(): Saldo[] {
    const data = localStorage.getItem(STORAGE_KEYS.BALANCES);
    return data ? JSON.parse(data) : INITIAL_BALANCES;
  }

  public getUserBalance(userId: string, period = this.getPeriodForDate(new Date())): Saldo {
    const balances = this.getBalances();
    let balance = balances.find((b) => b.id_usuario === userId && b.periodo === period);
    if (!balance) {
      const config = this.getConfigMap();
      const diasPorSemestre = Number(config.dias_ordinarios_semestre) || 10;
      balance = {
        id_usuario: userId,
        periodo: period,
        dias_asignados: diasPorSemestre,
        dias_utilizados: 0,
        dias_disponibles: diasPorSemestre,
        dias_compensatorios_autorizados: 0,
        dias_compensatorios_utilizados: 0,
        saldo_compensatorio: 0,
      };
      balances.push(balance);
      localStorage.setItem(STORAGE_KEYS.BALANCES, JSON.stringify(balances));
    }
    return balance;
  }

  private getPeriodForDate(date: Date): string {
    return `${date.getFullYear()}-S${date.getMonth() < 6 ? 1 : 2}`;
  }

  private saveBalances(balances: Saldo[]) {
    localStorage.setItem(STORAGE_KEYS.BALANCES, JSON.stringify(balances));
  }

  // --- VACATIONS ---
  public getVacations(): Vacacion[] {
    const data = localStorage.getItem(STORAGE_KEYS.VACATIONS);
    return data ? JSON.parse(data) : INITIAL_VACATIONS;
  }

  public requestVacation(params: {
    id_usuario: string;
    fecha_inicio: string;
    fecha_fin: string;
    cantidad_dias: number;
    dias_ordinarios: number;
    dias_compensatorios: number;
    tipo_dias: 'ordinarios' | 'compensatorios' | 'mixto';
    observaciones?: string;
    periodo?: string;
  }): Vacacion {
    const user = this.getUser(params.id_usuario);
    if (!user) throw new Error('Usuario no válido');
    if (user.estado !== 'activo') throw new Error('El usuario está inactivo');

    // Balance pre-validation
    const period = params.periodo || this.getPeriodForDate(new Date(`${params.fecha_inicio}T12:00:00`));
    const balance = this.getUserBalance(params.id_usuario, period);
    if (params.dias_ordinarios > balance.dias_disponibles) {
      throw new Error(`Días ordinarios insuficientes (Disponibles: ${balance.dias_disponibles}, solicitados: ${params.dias_ordinarios})`);
    }
    if (params.dias_compensatorios > balance.saldo_compensatorio) {
      throw new Error(`Días compensatorios insuficientes (Disponibles: ${balance.saldo_compensatorio}, solicitados: ${params.dias_compensatorios})`);
    }

    const vacations = this.getVacations();
    const newVacation: Vacacion = {
      id_vacacion: `vac_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      id_usuario: params.id_usuario,
      fecha_inicio: params.fecha_inicio,
      fecha_fin: params.fecha_fin,
      cantidad_dias: params.cantidad_dias,
      dias_ordinarios: params.dias_ordinarios,
      dias_compensatorios: params.dias_compensatorios,
      tipo_dias: params.tipo_dias,
      periodo: period,
      estado: 'pendiente',
      observaciones: params.observaciones || '',
      fecha_solicitud: new Date().toISOString(),
    };

    vacations.push(newVacation);
    localStorage.setItem(STORAGE_KEYS.VACATIONS, JSON.stringify(vacations));

    this.addAuditLog(
      user.nombre,
      'SOLICITUD_VACACIONES',
      `Solicitud de ${params.cantidad_dias} días hábiles del ${params.fecha_inicio} al ${params.fecha_fin} (${params.dias_ordinarios} ordinarios, ${params.dias_compensatorios} compensatorios)`
    );

    return newVacation;
  }

  public approveVacation(vacationId: string, adminName: string): Vacacion {
    const vacations = this.getVacations();
    const vac = vacations.find((v) => v.id_vacacion === vacationId);
    if (!vac) throw new Error('Solicitud no encontrada');
    if (vac.estado !== 'pendiente' && vac.estado !== 'cancelacion_solicitada') {
      throw new Error(`La solicitud no está pendiente (estado actual: ${vac.estado})`);
    }

    const user = this.getUser(vac.id_usuario);
    if (!user) throw new Error('Usuario de la vacación no encontrado');

    // Re-validate balance before deducting!
    const balances = this.getBalances();
    let bIdx = balances.findIndex((b) => b.id_usuario === vac.id_usuario && b.periodo === (vac.periodo || this.getPeriodForDate(new Date(`${vac.fecha_inicio}T12:00:00`))));
    if (bIdx === -1) {
      balances.push(this.getUserBalance(vac.id_usuario, vac.periodo));
      bIdx = balances.length - 1;
    }

    const bal = balances[bIdx];
    if (vac.dias_ordinarios > bal.dias_disponibles) {
      throw new Error(`Saldo ordinario insuficiente al aprobar. Disponibles: ${bal.dias_disponibles}, solicitados: ${vac.dias_ordinarios}`);
    }
    if (vac.dias_compensatorios > bal.saldo_compensatorio) {
      throw new Error(`Saldo compensatorio insuficiente al aprobar. Disponibles: ${bal.saldo_compensatorio}, solicitados: ${vac.dias_compensatorios}`);
    }

    const saldoAnteriorTotal = bal.dias_disponibles + bal.saldo_compensatorio;

    // Deduct
    bal.dias_utilizados += vac.dias_ordinarios;
    bal.dias_disponibles -= vac.dias_ordinarios;
    bal.dias_compensatorios_utilizados += vac.dias_compensatorios;
    bal.saldo_compensatorio -= vac.dias_compensatorios;

    const saldoPosteriorTotal = bal.dias_disponibles + bal.saldo_compensatorio;
    this.saveBalances(balances);

    // Update vacation status
    vac.estado = 'aprobada';
    vac.fecha_resolucion = new Date().toISOString();
    vac.administrador_responsable = adminName;
    localStorage.setItem(STORAGE_KEYS.VACATIONS, JSON.stringify(vacations));

    // Register movement
    this.addMovement({
      id_usuario: vac.id_usuario,
      tipo_movimiento: 'aprobacion_vacaciones',
      cantidad_dias: vac.cantidad_dias,
      saldo_anterior: saldoAnteriorTotal,
      saldo_posterior: saldoPosteriorTotal,
      motivo: `Aprobación de vacaciones del ${vac.fecha_inicio} al ${vac.fecha_fin} (${vac.dias_ordinarios} ord, ${vac.dias_compensatorios} comp)`,
      administrador_responsable: adminName,
    });

    // Audit log
    this.addAuditLog(
      adminName,
      'APROBACION_VACACIONES',
      `Aprobada solicitud de vacaciones para ${user.nombre} (${vac.cantidad_dias} días hábiles)`
    );

    return vac;
  }

  public rejectVacation(vacationId: string, motivo: string, adminName: string): Vacacion {
    const vacations = this.getVacations();
    const vac = vacations.find((v) => v.id_vacacion === vacationId);
    if (!vac) throw new Error('Solicitud no encontrada');
    if (vac.estado !== 'pendiente') throw new Error('Solo se pueden rechazar solicitudes pendientes');

    const user = this.getUser(vac.id_usuario);

    vac.estado = 'rechazada';
    vac.motivo_rechazo = motivo;
    vac.fecha_resolucion = new Date().toISOString();
    vac.administrador_responsable = adminName;
    localStorage.setItem(STORAGE_KEYS.VACATIONS, JSON.stringify(vacations));

    // Notice: NO days are deducted, balance intact!
    this.addAuditLog(
      adminName,
      'RECHAZO_VACACIONES',
      `Rechazada solicitud de vacaciones de ${user ? user.nombre : vac.id_usuario}. Motivo: ${motivo}`
    );

    return vac;
  }

  public cancelVacation(vacationId: string, currentUserId: string, isAdmin: boolean): Vacacion {
    const vacations = this.getVacations();
    const vac = vacations.find((v) => v.id_vacacion === vacationId);
    if (!vac) throw new Error('Solicitud no encontrada');

    if (vac.id_usuario !== currentUserId && !isAdmin) {
      throw new Error('No tienes permisos para cancelar solicitudes de otro usuario');
    }

    const user = this.getUser(vac.id_usuario);
    const userName = user ? user.nombre : 'Usuario';

    if (vac.estado === 'pendiente') {
      // Direct cancellation of pending request
      vac.estado = 'cancelada';
      vac.fecha_resolucion = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.VACATIONS, JSON.stringify(vacations));

      this.addAuditLog(
        userName,
        'CANCELACION_SOLICITUD',
        `El usuario canceló su solicitud pendiente de vacaciones del ${vac.fecha_inicio} al ${vac.fecha_fin}`
      );
      return vac;
    } else if (vac.estado === 'aprobada') {
      if (isAdmin) {
        // Admin direct cancellation of approved vacation -> Restore days to balance!
        const balances = this.getBalances();
        const bal = balances.find((b) => b.id_usuario === vac.id_usuario);
        if (bal) {
          const saldoAnt = bal.dias_disponibles + bal.saldo_compensatorio;
          bal.dias_utilizados = Math.max(0, bal.dias_utilizados - vac.dias_ordinarios);
          bal.dias_disponibles += vac.dias_ordinarios;
          bal.dias_compensatorios_utilizados = Math.max(0, bal.dias_compensatorios_utilizados - vac.dias_compensatorios);
          bal.saldo_compensatorio += vac.dias_compensatorios;
          const saldoPost = bal.dias_disponibles + bal.saldo_compensatorio;
          this.saveBalances(balances);

          this.addMovement({
            id_usuario: vac.id_usuario,
            tipo_movimiento: 'cancelacion_vacaciones',
            cantidad_dias: vac.cantidad_dias,
            saldo_anterior: saldoAnt,
            saldo_posterior: saldoPost,
            motivo: `Restitución de días por cancelación de vacaciones aprobadas (${vac.fecha_inicio} al ${vac.fecha_fin})`,
            administrador_responsable: userName,
          });
        }
        vac.estado = 'cancelada';
        vac.fecha_resolucion = new Date().toISOString();
        localStorage.setItem(STORAGE_KEYS.VACATIONS, JSON.stringify(vacations));

        this.addAuditLog(
          userName,
          'CANCELACION_VACACIONES_APROBADAS',
          `Cancelación autorizada de vacaciones previamente aprobadas para ${userName}. Días devueltos al saldo.`
        );
        return vac;
      } else {
        // Regular user requests cancellation of already approved vacation
        vac.estado = 'cancelacion_solicitada';
        localStorage.setItem(STORAGE_KEYS.VACATIONS, JSON.stringify(vacations));

        this.addAuditLog(
          userName,
          'SOLICITUD_CANCELACION_VACACIONES',
          `El usuario solicitó cancelar sus vacaciones aprobadas del ${vac.fecha_inicio} al ${vac.fecha_fin}. Pendiente de confirmación del administrador.`
        );
        return vac;
      }
    }

    throw new Error('No es posible cancelar una solicitud con estado: ' + vac.estado);
  }

  // --- COMPENSATORY DAYS ---
  public getCompensatoryRequests(): CompensatorioSolicitud[] {
    const data = localStorage.getItem(STORAGE_KEYS.COMPENSATORY_REQUESTS);
    return data ? JSON.parse(data) : INITIAL_COMPENSATORY_REQUESTS;
  }

  public requestCompensatory(userId: string, cantidad: number, motivo: string, fechaTrabajada?: string): CompensatorioSolicitud {
    const user = this.getUser(userId);
    if (!user) throw new Error('Usuario no encontrado');

    const requests = this.getCompensatoryRequests();
    const newReq: CompensatorioSolicitud = {
      id_solicitud: `comp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      id_usuario: userId,
      cantidad_dias: cantidad,
      motivo,
      fecha_trabajada: fechaTrabajada || '',
      fecha_solicitud: new Date().toISOString(),
      estado: 'pendiente',
    };

    requests.push(newReq);
    localStorage.setItem(STORAGE_KEYS.COMPENSATORY_REQUESTS, JSON.stringify(requests));

    this.addAuditLog(
      user.nombre,
      'SOLICITUD_DIAS_COMPENSATORIOS',
      `Solicitud de ${cantidad} día(s) compensatorio(s). Motivo: ${motivo}`
    );

    return newReq;
  }

  public approveCompensatory(requestId: string, adminName: string): CompensatorioSolicitud {
    const requests = this.getCompensatoryRequests();
    const req = requests.find((r) => r.id_solicitud === requestId);
    if (!req) throw new Error('Solicitud compensatoria no encontrada');
    if (req.estado !== 'pendiente') throw new Error('Solo se pueden autorizar solicitudes pendientes');

    const user = this.getUser(req.id_usuario);
    if (!user) throw new Error('Usuario no encontrado');

    // Add days to balance
    const balances = this.getBalances();
    const bal = balances.find((b) => b.id_usuario === req.id_usuario);
    if (!bal) throw new Error('Saldo no encontrado');

    const saldoAnt = bal.dias_disponibles + bal.saldo_compensatorio;
    bal.dias_compensatorios_autorizados += req.cantidad_dias;
    bal.saldo_compensatorio += req.cantidad_dias;
    const saldoPost = bal.dias_disponibles + bal.saldo_compensatorio;
    this.saveBalances(balances);

    req.estado = 'autorizado';
    req.administrador_responsable = adminName;
    req.fecha_resolucion = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.COMPENSATORY_REQUESTS, JSON.stringify(requests));

    // Register movement
    this.addMovement({
      id_usuario: req.id_usuario,
      tipo_movimiento: 'autorizacion_compensatorio',
      cantidad_dias: req.cantidad_dias,
      saldo_anterior: saldoAnt,
      saldo_posterior: saldoPost,
      motivo: `Autorización de días compensatorios: ${req.motivo}`,
      administrador_responsable: adminName,
    });

    this.addAuditLog(
      adminName,
      'AUTORIZACION_COMPENSATORIO',
      `Se autorizaron ${req.cantidad_dias} día(s) compensatorio(s) a ${user.nombre}`
    );

    return req;
  }

  public rejectCompensatory(requestId: string, motivoRechazo: string, adminName: string): CompensatorioSolicitud {
    const requests = this.getCompensatoryRequests();
    const req = requests.find((r) => r.id_solicitud === requestId);
    if (!req) throw new Error('Solicitud compensatoria no encontrada');
    if (req.estado !== 'pendiente') throw new Error('Solo se pueden rechazar solicitudes pendientes');

    const user = this.getUser(req.id_usuario);

    req.estado = 'rechazado';
    req.motivo_rechazo = motivoRechazo;
    req.administrador_responsable = adminName;
    req.fecha_resolucion = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.COMPENSATORY_REQUESTS, JSON.stringify(requests));

    this.addAuditLog(
      adminName,
      'RECHAZO_COMPENSATORIO',
      `Rechazada solicitud de compensatorios de ${user ? user.nombre : req.id_usuario}. Motivo: ${motivoRechazo}`
    );

    return req;
  }

  public addDirectCompensatory(
    userId: string,
    dias: number,
    motivo: string,
    adminName: string
  ) {
    const user = this.getUser(userId);
    if (!user) throw new Error('Usuario no encontrado');

    const balances = this.getBalances();
    const bal = balances.find((b) => b.id_usuario === userId);
    if (!bal) throw new Error('Saldo no encontrado');

    const saldoAnt = bal.dias_disponibles + bal.saldo_compensatorio;
    bal.dias_compensatorios_autorizados += dias;
    bal.saldo_compensatorio += dias;
    const saldoPost = bal.dias_disponibles + bal.saldo_compensatorio;
    this.saveBalances(balances);

    this.addMovement({
      id_usuario: userId,
      tipo_movimiento: 'alta_compensatorio',
      cantidad_dias: dias,
      saldo_anterior: saldoAnt,
      saldo_posterior: saldoPost,
      motivo: `Asignación directa por administrador: ${motivo}`,
      administrador_responsable: adminName,
    });

    this.addAuditLog(
      adminName,
      'ALTA_DIRECTA_COMPENSATORIO',
      `El administrador asignó ${dias} día(s) compensatorio(s) a ${user.nombre}. Motivo: ${motivo}`
    );
  }

  public adjustBalance(
    userId: string,
    nuevoOrdinariosDisponibles: number,
    nuevoCompensatorioSaldo: number,
    justificacion: string,
    adminName: string
  ) {
    const user = this.getUser(userId);
    if (!user) throw new Error('Usuario no encontrado');

    const balances = this.getBalances();
    const bal = balances.find((b) => b.id_usuario === userId);
    if (!bal) throw new Error('Saldo no encontrado');

    const saldoAnt = bal.dias_disponibles + bal.saldo_compensatorio;
    const datosAnteriores = JSON.stringify(bal);

    bal.dias_disponibles = nuevoOrdinariosDisponibles;
    bal.saldo_compensatorio = nuevoCompensatorioSaldo;
    bal.dias_compensatorios_autorizados = nuevoCompensatorioSaldo + bal.dias_compensatorios_utilizados;

    const saldoPost = bal.dias_disponibles + bal.saldo_compensatorio;
    this.saveBalances(balances);

    this.addMovement({
      id_usuario: userId,
      tipo_movimiento: 'ajuste_saldo',
      cantidad_dias: saldoPost - saldoAnt,
      saldo_anterior: saldoAnt,
      saldo_posterior: saldoPost,
      motivo: `Ajuste manual de saldo justificado: ${justificacion}`,
      administrador_responsable: adminName,
    });

    this.addAuditLog(
      adminName,
      'AJUSTE_MANUAL_SALDO',
      `Ajuste de saldo para ${user.nombre}. Justificación: ${justificacion}`,
      datosAnteriores,
      JSON.stringify(bal)
    );
  }

  // --- MOVEMENTS & AUDIT ---
  public getMovements(): Movimiento[] {
    const data = localStorage.getItem(STORAGE_KEYS.MOVEMENTS);
    return data ? JSON.parse(data) : INITIAL_MOVEMENTS;
  }

  public addMovement(movement: Omit<Movimiento, 'id_movimiento' | 'fecha'>): Movimiento {
    const list = this.getMovements();
    const newMov: Movimiento = {
      ...movement,
      id_movimiento: `mov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      fecha: new Date().toISOString(),
    };
    list.unshift(newMov);
    localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(list));
    return newMov;
  }

  public getAuditLogs(): Auditoria[] {
    const data = localStorage.getItem(STORAGE_KEYS.AUDIT);
    return data ? JSON.parse(data) : INITIAL_AUDIT;
  }

  public addAuditLog(
    usuario: string,
    accion: string,
    descripcion: string,
    datos_anteriores?: string,
    datos_nuevos?: string
  ): Auditoria {
    const list = this.getAuditLogs();
    const log: Auditoria = {
      id_evento: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      usuario,
      accion,
      descripcion,
      fecha_hora: new Date().toISOString(),
      datos_anteriores,
      datos_nuevos,
    };
    list.unshift(log);
    localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(list));
    return log;
  }

  // --- CONFIGURATION ---
  public getConfig(): Configuracion[] {
    const data = localStorage.getItem(STORAGE_KEYS.CONFIG);
    return data ? JSON.parse(data) : INITIAL_CONFIG;
  }

  public getConfigMap(): Record<string, string> {
    const configs = this.getConfig();
    const map: Record<string, string> = {};
    configs.forEach((c) => {
      map[c.parametro] = c.valor;
    });
    return map;
  }

  public updateConfig(parametro: string, valor: string, adminName = 'Administrador') {
    const configs = this.getConfig();
    const item = configs.find((c) => c.parametro === parametro);
    const oldVal = item ? item.valor : '';
    if (item) {
      item.valor = valor;
    } else {
      configs.push({
        parametro,
        valor,
        descripcion: 'Parámetro de configuración',
      });
    }
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(configs));

    this.addAuditLog(
      adminName,
      'CONFIGURACION_MODIFICADA',
      `Cambio en parámetro [${parametro}]: "${oldVal}" -> "${valor}"`
    );
  }

  // --- APPS SCRIPT URL ---
  public getAppsScriptUrl(): string {
    return import.meta.env.VITE_APPS_SCRIPT_URL || DEFAULT_APPS_SCRIPT_URL;
  }

  public setAppsScriptUrl(url: string) {
    localStorage.setItem(STORAGE_KEYS.APPS_SCRIPT_URL, url.trim());
  }

  private async requestAppsScriptData(url: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
    data?: Record<string, Record<string, unknown>[]>;
  }> {
    const separator = url.includes('?') ? '&' : '?';
    const response = await fetch(`${url}${separator}action=get_all&_=${Date.now()}`, { mode: 'cors' });
    if (!response.ok) throw new Error(`Google Apps Script respondió HTTP ${response.status}`);
    return response.json();
  }

  public async loadSharedData(url = this.getAppsScriptUrl()): Promise<boolean> {
    const targetUrl = url.trim();
    if (!targetUrl) return false;

    const response = await this.requestAppsScriptData(targetUrl);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Google Apps Script no pudo entregar los datos');
    }

    const data = response.data;
    if (![data.personas, data.cumpleanos, data.vacaciones, data.saldos].every(Array.isArray)) {
      throw new Error('La URL apunta a un Apps Script incompatible. Actualiza Code.gs con la versión de cuatro hojas.');
    }
    const users = (data.personas || []).map((person) => ({
      id_usuario: String(person.id_persona || ''),
      nombre: String(person.nombre || ''),
      color: String(person.color || '#0f766e'),
      password_hash: '',
      rol: 'usuario' as const,
      estado: 'activo' as const,
      fecha_registro: String(person.fecha_alta || ''),
    }));
    const birthdays = (data.cumpleanos || []).map((birthday) => ({
      id_evento: `bday_${String(birthday.id_persona || '')}`,
      id_usuario: String(birthday.id_persona || ''),
      fecha_cumpleaños: String(birthday.fecha_cumpleaños || ''),
      fecha_registro: '',
    }));
    const vacations = (data.vacaciones || []).map((vacation) => ({
      id_vacacion: String(vacation.id_vacacion || ''),
      id_usuario: String(vacation.id_persona || ''),
      fecha_inicio: String(vacation.fecha_inicio || ''),
      fecha_fin: String(vacation.fecha_fin || ''),
      cantidad_dias: Number(vacation.dias_usados || 0),
      dias_ordinarios: Number(vacation.dias_usados || 0),
      dias_compensatorios: 0,
      tipo_dias: 'ordinarios' as const,
      estado: 'aprobada' as const,
      observaciones: String(vacation.nota || ''),
      fecha_solicitud: String(vacation.fecha_registro || ''),
      periodo: String(vacation.periodo || ''),
    }));
    const balances = (data.saldos || []).map((balance) => ({
      id_usuario: String(balance.id_persona || ''),
      periodo: String(balance.periodo || ''),
      dias_asignados: Number(balance.dias_asignados || 10),
      dias_utilizados: Number(balance.dias_usados || 0),
      dias_disponibles: Number(balance.dias_disponibles || 0),
      dias_compensatorios_autorizados: 0,
      dias_compensatorios_utilizados: 0,
      saldo_compensatorio: 0,
    }));

    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    localStorage.setItem(STORAGE_KEYS.BIRTHDAYS, JSON.stringify(birthdays));
    localStorage.setItem(STORAGE_KEYS.VACATIONS, JSON.stringify(vacations));
    localStorage.setItem(STORAGE_KEYS.BALANCES, JSON.stringify(balances));
    localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.COMPENSATORY_REQUESTS, JSON.stringify([]));
    window.dispatchEvent(new Event('mi-calendario-shared-data'));
    return true;
  }

  public async submitSharedAction(
    action: 'add_person' | 'set_birthday' | 'register_vacation' | 'delete_person',
    data: Record<string, string | number>
  ): Promise<void> {
    const targetUrl = this.getAppsScriptUrl();
    if (!targetUrl) throw new Error('Configura primero la URL de Apps Script');

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, data }),
    });
    if (!response.ok) throw new Error(`Google Apps Script respondió HTTP ${response.status}`);
    const result = await response.json() as { success?: boolean; error?: string };
    if (!result.success) throw new Error(result.error || 'Google Apps Script rechazó la operación');

    await this.loadSharedData(targetUrl);

    if (action === 'add_person' && !this.getUsers().some((person) => person.id_usuario === data.id_persona)) {
      throw new Error('No se pudo confirmar la persona en Google Sheets. Revisa la implementación de Apps Script.');
    }
    if (action === 'register_vacation' && !this.getVacations().some((vacation) => vacation.id_vacacion === data.id_vacacion)) {
      throw new Error('No se pudo confirmar las vacaciones en Google Sheets. Revisa el saldo o la implementación.');
    }
    if (action === 'set_birthday' && !this.getBirthdays().some((birthday) => birthday.id_usuario === data.id_persona)) {
      throw new Error('No se pudo confirmar el cumpleaños en Google Sheets. Revisa la implementación.');
    }
    if (action === 'delete_person' && this.getUsers().some((person) => person.id_usuario === data.id_persona)) {
      throw new Error('No se pudo confirmar la eliminación en Google Sheets. Revisa la implementación.');
    }
  }

  public async submitPublicRequest(
    action: 'request_vacation' | 'request_compensatory',
    payload: Record<string, string | number>
  ): Promise<void> {
    const targetUrl = this.getAppsScriptUrl();
    if (!targetUrl) throw new Error('Google Sheets aún no está conectado');

    await fetch(targetUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, payload }),
    });
  }

  // Initial import to the Apps Script web app; ADMIN_TOKEN is never persisted.
  public async syncWithAppsScript(url: string, adminToken: string): Promise<{ success: boolean; message: string }> {
    const targetUrl = url.trim() || this.getAppsScriptUrl();
    if (!targetUrl) {
      throw new Error('Debes ingresar la URL de tu Web App de Google Apps Script');
    }
    if (!adminToken.trim()) throw new Error('Ingresa el token de administrador configurado en Apps Script');

    const payload = {
      action: 'batch_sync',
      adminToken: adminToken.trim(),
      payload: {
        usuarios: this.getUsers().map(({ password_hash: _passwordHash, ...user }) => user),
        cumpleanos: this.getBirthdays(),
        vacaciones: this.getVacations(),
        saldos: this.getBalances(),
        movimientos: this.getMovements(),
        auditoria: this.getAuditLogs().map(({ datos_anteriores: _oldData, datos_nuevos: _newData, ...entry }) => entry),
        configuracion: this.getConfig(),
        festivos: getMexicanHolidays(new Date().getFullYear()),
        solicitudes_compensatorios: this.getCompensatoryRequests(),
      },
    };

    await fetch(targetUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });
    this.setAppsScriptUrl(targetUrl);
    return { success: true, message: 'Carga inicial enviada a Google Sheets. La respuesta del navegador es opaca; confirma las filas en la hoja.' };
  }

  // Export any table to CSV format
  public exportToCsv(tableName: 'AUDITORIA' | 'VACACIONES' | 'USUARIOS' | 'MOVIMIENTOS' | 'SALDOS'): string {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];

    switch (tableName) {
      case 'AUDITORIA': {
        const data = this.getAuditLogs();
        headers = ['ID Evento', 'Usuario', 'Acción', 'Descripción', 'Fecha y Hora'];
        rows = data.map((d) => [d.id_evento, d.usuario, d.accion, d.descripcion, d.fecha_hora]);
        break;
      }
      case 'VACACIONES': {
        const data = this.getVacations();
        const users = this.getUsers();
        headers = ['ID', 'Usuario', 'Inicio', 'Fin', 'Días Hábiles', 'Ordinarios', 'Compensatorios', 'Estado', 'Solicitud', 'Resolución'];
        rows = data.map((v) => {
          const u = users.find((usr) => usr.id_usuario === v.id_usuario);
          return [
            v.id_vacacion,
            u ? u.nombre : v.id_usuario,
            v.fecha_inicio,
            v.fecha_fin,
            v.cantidad_dias,
            v.dias_ordinarios,
            v.dias_compensatorios,
            v.estado,
            v.fecha_solicitud,
            v.fecha_resolucion || '-',
          ];
        });
        break;
      }
      case 'USUARIOS': {
        const data = this.getUsers();
        headers = ['ID Usuario', 'Nombre', 'Color', 'Rol', 'Estado', 'Fecha Registro'];
        rows = data.map((u) => [u.id_usuario, u.nombre, u.color, u.rol, u.estado, u.fecha_registro]);
        break;
      }
      case 'MOVIMIENTOS': {
        const data = this.getMovements();
        const users = this.getUsers();
        headers = ['ID Movimiento', 'Usuario', 'Tipo', 'Cantidad Días', 'Saldo Anterior', 'Saldo Posterior', 'Motivo', 'Fecha', 'Admin'];
        rows = data.map((m) => {
          const u = users.find((usr) => usr.id_usuario === m.id_usuario);
          return [
            m.id_movimiento,
            u ? u.nombre : m.id_usuario,
            m.tipo_movimiento,
            m.cantidad_dias,
            m.saldo_anterior,
            m.saldo_posterior,
            m.motivo,
            m.fecha,
            m.administrador_responsable || '-',
          ];
        });
        break;
      }
      case 'SALDOS': {
        const data = this.getBalances();
        const users = this.getUsers();
        headers = ['Usuario', 'Periodo', 'Asignados', 'Utilizados', 'Disponibles', 'Comp. Autorizados', 'Comp. Utilizados', 'Saldo Comp.'];
        rows = data.map((s) => {
          const u = users.find((usr) => usr.id_usuario === s.id_usuario);
          return [
            u ? u.nombre : s.id_usuario,
            s.periodo,
            s.dias_asignados,
            s.dias_utilizados,
            s.dias_disponibles,
            s.dias_compensatorios_autorizados,
            s.dias_compensatorios_utilizados,
            s.saldo_compensatorio,
          ];
        });
        break;
      }
    }

    const csvContent = [
      headers.join(','),
      ...rows.map((r) =>
        r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    return csvContent;
  }
}

export const storage = new StorageService();
