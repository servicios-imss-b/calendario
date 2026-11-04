/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const GOOGLE_APPS_SCRIPT_TEMPLATE = `/**
 * =========================================================================
 * MI CALENDARIO - BACKEND GOOGLE APPS SCRIPT API
 * Sistema compartido de cumpleaños, vacaciones y días compensatorios
 * =========================================================================
 * CONFIGURACIÓN:
 * 1. En Extensiones > Apps Script, pega este código en Code.gs.
 * 2. En Configuración del proyecto > Propiedades del script, crea ADMIN_TOKEN
 *    con una contraseña larga que solo conservará el administrador.
 * 3. Ejecuta setupSheets una vez; crea las pestañas faltantes sin borrar datos.
 * 4. Implementa como Aplicación web, ejecutar como tú y acceso "Cualquier usuario".
 *    La lectura del calendario es pública; las escrituras requieren ADMIN_TOKEN.
 * 5. Copia la URL /exec al panel de administración del calendario.
 * =========================================================================
 */

// El API nunca expone ni almacena credenciales de usuario.
var SHEETS = {
  USUARIOS: 'USUARIOS',
  CUMPLEANOS: 'CUMPLEAÑOS',
  VACACIONES: 'VACACIONES',
  SALDOS: 'SALDOS',
  MOVIMIENTOS: 'MOVIMIENTOS',
  AUDITORIA: 'AUDITORIA',
  CONFIGURACION: 'CONFIGURACION',
  FESTIVOS: 'FESTIVOS',
  COMPENSATORIOS: 'COMPENSATORIOS'
};

var HEADERS = {};
HEADERS[SHEETS.USUARIOS] = ['id_usuario', 'nombre', 'color', 'rol', 'estado', 'fecha_registro'];
HEADERS[SHEETS.CUMPLEANOS] = ['id_evento', 'id_usuario', 'fecha_cumpleaños', 'fecha_registro'];
HEADERS[SHEETS.VACACIONES] = ['id_vacacion', 'id_usuario', 'fecha_inicio', 'fecha_fin', 'cantidad_dias', 'dias_ordinarios', 'dias_compensatorios', 'tipo_dias', 'estado', 'observaciones', 'fecha_solicitud', 'fecha_resolucion', 'administrador_responsable', 'motivo_rechazo'];
HEADERS[SHEETS.SALDOS] = ['id_usuario', 'periodo', 'dias_asignados', 'dias_utilizados', 'dias_disponibles', 'dias_compensatorios_autorizados', 'dias_compensatorios_utilizados', 'saldo_compensatorio'];
HEADERS[SHEETS.MOVIMIENTOS] = ['id_movimiento', 'id_usuario', 'tipo_movimiento', 'cantidad_dias', 'saldo_anterior', 'saldo_posterior', 'motivo', 'fecha', 'administrador_responsable'];
HEADERS[SHEETS.AUDITORIA] = ['id_evento', 'usuario', 'accion', 'descripcion', 'fecha_hora', 'datos_anteriores', 'datos_nuevos'];
HEADERS[SHEETS.CONFIGURACION] = ['parametro', 'valor', 'descripcion'];
HEADERS[SHEETS.FESTIVOS] = ['fecha', 'nombre', 'tipo', 'año'];
HEADERS[SHEETS.COMPENSATORIOS] = ['id_solicitud', 'id_usuario', 'cantidad_dias', 'motivo', 'fecha_trabajada', 'fecha_solicitud', 'estado', 'administrador_responsable', 'fecha_resolucion', 'motivo_rechazo'];

function setupSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(SHEETS).forEach(function(key) {
    var name = SHEETS[key];
    var sheet = ss.getSheetByName(name) || ss.insertSheet(name);
    if (sheet.getLastRow() === 0) {
      var headers = HEADERS[name];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#E2E8F0');
      sheet.autoResizeColumns(1, headers.length);
    }
  });
  Logger.log('Pestañas creadas o verificadas sin borrar datos.');
}

/**
 * Helper: Lee una hoja completa y la devuelve como lista de objetos
 */
function readSheetAsJson(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  var headers = data[0];
  var result = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      var val = row[j];
      if (val instanceof Date) {
        val = val.toISOString().split('T')[0];
      }
      obj[headers[j]] = val;
    }
    result.push(obj);
  }
  return result;
}

function withoutPasswords(users) {
  return users.map(function(user) {
    delete user.password_hash;
    delete user.password;
    return user;
  });
}

function withoutAuditSnapshots(records) {
  return records.map(function(record) {
    delete record.datos_anteriores;
    delete record.datos_nuevos;
    return record;
  });
}

function apiOutput(payload, callback) {
  var json = JSON.stringify(payload);
  if (callback && /^[A-Za-z_$][0-9A-Za-z_$.]*$/.test(callback)) {
    return ContentService.createTextOutput(callback + '(' + json + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  var callback = e && e.parameter ? e.parameter.callback : '';
  try {
    var params = e && e.parameter ? e.parameter : {};
    var action = params.action || 'get_all';
    var responseData = {};

    if (action === 'get_all') {
      responseData = {
        usuarios: withoutPasswords(readSheetAsJson(SHEETS.USUARIOS)),
        cumpleanos: readSheetAsJson(SHEETS.CUMPLEANOS),
        vacaciones: readSheetAsJson(SHEETS.VACACIONES),
        saldos: readSheetAsJson(SHEETS.SALDOS),
        movimientos: readSheetAsJson(SHEETS.MOVIMIENTOS),
        auditoria: withoutAuditSnapshots(readSheetAsJson(SHEETS.AUDITORIA)),
        configuracion: readSheetAsJson(SHEETS.CONFIGURACION),
        festivos: readSheetAsJson(SHEETS.FESTIVOS),
        solicitudes_compensatorios: readSheetAsJson(SHEETS.COMPENSATORIOS)
      };
    } else if (params.sheet) {
      responseData = readSheetAsJson(params.sheet);
      if (params.sheet === SHEETS.USUARIOS) responseData = withoutPasswords(responseData);
      if (params.sheet === SHEETS.AUDITORIA) responseData = withoutAuditSnapshots(responseData);
    }

    return apiOutput({ success: true, timestamp: new Date().toISOString(), data: responseData }, callback);
  } catch (error) {
    return apiOutput({ success: false, error: error.toString() }, callback);
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  var lockAcquired = false;
  try {
    var body = JSON.parse(e.postData.contents);
    var publicRequest = body.action === 'request_vacation' || body.action === 'request_compensatory';
    if (!publicRequest) {
      var expectedToken = PropertiesService.getScriptProperties().getProperty('ADMIN_TOKEN');
      if (!expectedToken || body.adminToken !== expectedToken) {
        throw new Error('No autorizado para modificar el calendario');
      }
    }

    lock.waitLock(30000);
    lockAcquired = true;
    var payload = body.payload || {};
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var result = { success: true };

    if (publicRequest) {
      var user = readSheetAsJson(SHEETS.USUARIOS).find(function(item) {
        return item.id_usuario === payload.id_usuario && item.estado === 'activo';
      });
      if (!user) throw new Error('Usuario no válido o inactivo');

      var cacheKey = 'public_request_' + body.action + '_' + payload.id_usuario;
      var cache = CacheService.getScriptCache();
      if (cache.get(cacheKey)) throw new Error('Espera unos segundos antes de enviar otra solicitud');
      cache.put(cacheKey, '1', 10);

      if (body.action === 'request_vacation') {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(payload.fecha_inicio) ||
            !/^\d{4}-\d{2}-\d{2}$/.test(payload.fecha_fin) ||
            payload.fecha_inicio > payload.fecha_fin ||
            Number(payload.cantidad_dias) < 1 || Number(payload.cantidad_dias) > 31) {
          throw new Error('Rango de vacaciones no válido');
        }
        appendObject(SHEETS.VACACIONES, {
          id_vacacion: Utilities.getUuid(),
          id_usuario: payload.id_usuario,
          fecha_inicio: payload.fecha_inicio,
          fecha_fin: payload.fecha_fin,
          cantidad_dias: Number(payload.cantidad_dias),
          dias_ordinarios: Number(payload.dias_ordinarios) || 0,
          dias_compensatorios: Number(payload.dias_compensatorios) || 0,
          tipo_dias: payload.tipo_dias || 'ordinarios',
          estado: 'pendiente',
          observaciones: String(payload.observaciones || '').slice(0, 500),
          fecha_solicitud: new Date().toISOString()
        });
      } else {
        var cantidad = Number(payload.cantidad_dias);
        var motivo = String(payload.motivo || '').trim();
        if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 15 || motivo.length < 8 || motivo.length > 1000) {
          throw new Error('Solicitud de días compensatorios no válida');
        }
        appendObject(SHEETS.COMPENSATORIOS, {
          id_solicitud: Utilities.getUuid(),
          id_usuario: payload.id_usuario,
          cantidad_dias: cantidad,
          motivo: motivo,
          fecha_trabajada: String(payload.fecha_trabajada || ''),
          fecha_solicitud: new Date().toISOString(),
          estado: 'pendiente'
        });
      }
      result.message = 'Solicitud registrada como pendiente de aprobación';
    } else if (body.action === 'batch_sync') {
      if (payload.usuarios) replaceSheetData(SHEETS.USUARIOS, withoutPasswords(payload.usuarios));
      if (payload.cumpleanos) replaceSheetData(SHEETS.CUMPLEANOS, payload.cumpleanos);
      if (payload.vacaciones) replaceSheetData(SHEETS.VACACIONES, payload.vacaciones);
      if (payload.saldos) replaceSheetData(SHEETS.SALDOS, payload.saldos);
      if (payload.movimientos) replaceSheetData(SHEETS.MOVIMIENTOS, payload.movimientos);
      if (payload.auditoria) replaceSheetData(SHEETS.AUDITORIA, withoutAuditSnapshots(payload.auditoria));
      if (payload.configuracion) replaceSheetData(SHEETS.CONFIGURACION, payload.configuracion);
      if (payload.festivos) replaceSheetData(SHEETS.FESTIVOS, payload.festivos);
      if (payload.solicitudes_compensatorios) replaceSheetData(SHEETS.COMPENSATORIOS, payload.solicitudes_compensatorios);
      result.message = 'Sincronización completada';
    } else if (body.action === 'append_row') {
      var sheet = ss.getSheetByName(body.sheet);
      if (!sheet) throw new Error('Hoja no encontrada: ' + body.sheet);
      sheet.appendRow(body.row);
      result.message = 'Fila agregada';
    } else {
      throw new Error('Acción no soportada: ' + body.action);
    }

    return apiOutput(result);
  } catch (error) {
    return apiOutput({ success: false, error: error.toString() });
  } finally {
    if (lockAcquired) lock.releaseLock();
  }
}

function replaceSheetData(sheetName, items) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) throw new Error('Hoja no encontrada: ' + sheetName);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) sheet.getRange(2, 1, lastRow - 1, headers.length).clearContent();
  if (!items || items.length === 0) return;

  var rows = items.map(function(item) {
    return headers.map(function(header) {
      return item[header] !== undefined ? item[header] : '';
    });
  });
  sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
}

function appendObject(sheetName, item) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) throw new Error('Hoja no encontrada: ' + sheetName);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  sheet.appendRow(headers.map(function(header) {
    return item[header] !== undefined ? item[header] : '';
  }));
}
`;
