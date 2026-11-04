/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const SIMPLE_APPS_SCRIPT_TEMPLATE = `// Mi Calendario: almacenamiento compartido sin cuentas ni contraseñas.
var SPREADSHEET_ID = '1D_2g_s8R2ffs4lAhDB9_rQ15S6jatbIazEvX58ImHok';
var SHEETS = {
  PERSONAS: 'PERSONAS',
  CUMPLEANOS: 'CUMPLEAÑOS',
  VACACIONES: 'VACACIONES',
  SALDOS: 'SALDOS'
};

var HEADERS = {};
HEADERS[SHEETS.PERSONAS] = ['id_persona', 'nombre', 'color', 'fecha_alta'];
HEADERS[SHEETS.CUMPLEANOS] = ['id_persona', 'fecha_cumpleaños'];
HEADERS[SHEETS.VACACIONES] = ['id_vacacion', 'id_persona', 'fecha_inicio', 'fecha_fin', 'dias_usados', 'periodo', 'nota', 'fecha_registro'];
HEADERS[SHEETS.SALDOS] = ['id_persona', 'periodo', 'dias_asignados', 'dias_usados', 'dias_disponibles'];

function spreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function setupSheets() {
  var book = spreadsheet();
  Object.keys(SHEETS).forEach(function(key) {
    var name = SHEETS[key];
    var sheet = book.getSheetByName(name) || book.insertSheet(name);
    if (sheet.getLastRow() === 0) {
      var headers = HEADERS[name];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#E2E8F0');
      sheet.autoResizeColumns(1, headers.length);
    }
  });
}

function readSheet(name) {
  var sheet = spreadsheet().getSheetByName(name);
  if (!sheet || sheet.getLastRow() < 2) return [];
  var values = sheet.getDataRange().getValues();
  var headers = values[0];
  return values.slice(1).map(function(row) {
    var item = {};
    headers.forEach(function(header, index) {
      var value = row[index];
      item[header] = value instanceof Date ? Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd') : value;
    });
    return item;
  });
}

function output(data, callback) {
  var json = JSON.stringify(data);
  if (callback && /^[A-Za-z_$][0-9A-Za-z_$.]*$/.test(callback)) {
    return ContentService.createTextOutput(callback + '(' + json + ');').setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  try {
    return output({
      success: true,
      data: {
        personas: readSheet(SHEETS.PERSONAS),
        cumpleanos: readSheet(SHEETS.CUMPLEANOS),
        vacaciones: readSheet(SHEETS.VACACIONES),
        saldos: readSheet(SHEETS.SALDOS)
      }
    }, e && e.parameter ? e.parameter.callback : '');
  } catch (error) {
    return output({ success: false, error: String(error) }, e && e.parameter ? e.parameter.callback : '');
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  var locked = false;
  try {
    lock.waitLock(30000);
    locked = true;
    var request = JSON.parse(e.postData.contents);
    var data = request.data || {};
    var result;
    if (request.action === 'add_person') result = addPerson(data);
    else if (request.action === 'set_birthday') result = setBirthday(data);
    else if (request.action === 'register_vacation') result = registerVacation(data);
    else if (request.action === 'delete_person') result = deletePerson(data);
    else throw new Error('Acción no reconocida');
    return output({ success: true, data: result });
  } catch (error) {
    return output({ success: false, error: String(error) });
  } finally {
    if (locked) lock.releaseLock();
  }
}

function addPerson(data) {
  var name = String(data.nombre || '').trim();
  var id = String(data.id_persona || '').trim();
  var color = String(data.color || '').trim();
  if (!id || !name || name.length > 60 || !/^#[0-9A-Fa-f]{6}$/.test(color)) throw new Error('Nombre o color no válido');
  var people = readSheet(SHEETS.PERSONAS);
  if (people.some(function(person) { return person.id_persona === id || person.nombre.toLowerCase() === name.toLowerCase(); })) {
    return { duplicate: true };
  }
  appendObject(SHEETS.PERSONAS, { id_persona: id, nombre: name, color: color, fecha_alta: new Date().toISOString() });
  var now = new Date();
  var currentPeriod = periodForDate(now);
  ensureBalance(id, currentPeriod);
  var nextPeriod = currentPeriod.slice(-2) === 'S1' ? currentPeriod.slice(0, 4) + '-S2' : (now.getFullYear() + 1) + '-S1';
  ensureBalance(id, nextPeriod);
  return { id_persona: id };
}

function setBirthday(data) {
  var id = String(data.id_persona || '').trim();
  var birthday = String(data.fecha_cumpleaños || '').trim();
  requirePerson(id);
  if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(birthday)) throw new Error('Fecha de cumpleaños no válida');
  var sheet = spreadsheet().getSheetByName(SHEETS.CUMPLEANOS);
  var rows = readSheet(SHEETS.CUMPLEANOS);
  var index = rows.findIndex(function(item) { return item.id_persona === id; });
  if (index >= 0) sheet.getRange(index + 2, 2).setValue(birthday);
  else appendObject(SHEETS.CUMPLEANOS, { id_persona: id, fecha_cumpleaños: birthday });
  return { id_persona: id, fecha_cumpleaños: birthday };
}

function registerVacation(data) {
  var id = String(data.id_persona || '').trim();
  var vacationId = String(data.id_vacacion || '').trim();
  var start = String(data.fecha_inicio || '');
  var end = String(data.fecha_fin || '');
  requirePerson(id);
  if (!vacationId || !validDate(start) || !validDate(end) || start > end) throw new Error('Rango de vacaciones no válido');
  if (periodForDate(new Date(start + 'T12:00:00')) !== periodForDate(new Date(end + 'T12:00:00'))) {
    throw new Error('Las vacaciones deben quedar dentro del mismo semestre');
  }
  if (readSheet(SHEETS.VACACIONES).some(function(item) { return item.id_vacacion === vacationId; })) return { duplicate: true };

  var period = periodForDate(new Date(start + 'T12:00:00'));
  var days = countBusinessDays(start, end);
  if (days < 1 || days > 10) throw new Error('El rango no tiene días hábiles válidos');
  var balance = ensureBalance(id, period);
  if (days > Number(balance.dias_disponibles)) throw new Error('Saldo semestral insuficiente');

  updateBalance(id, period, Number(balance.dias_usados) + days);
  appendObject(SHEETS.VACACIONES, {
    id_vacacion: vacationId,
    id_persona: id,
    fecha_inicio: start,
    fecha_fin: end,
    dias_usados: days,
    periodo: period,
    nota: String(data.nota || '').slice(0, 500),
    fecha_registro: new Date().toISOString()
  });
  return { id_vacacion: vacationId, dias_usados: days, periodo: period };
}

function requirePerson(id) {
  if (!id || !readSheet(SHEETS.PERSONAS).some(function(person) { return person.id_persona === id; })) {
    throw new Error('Persona no encontrada');
  }
}

function deletePerson(data) {
  var id = String(data.id_persona || '').trim();
  var people = readSheet(SHEETS.PERSONAS);
  var personIndex = people.findIndex(function(person) { return person.id_persona === id; });
  if (personIndex < 0) throw new Error('Persona no encontrada');

  [SHEETS.CUMPLEANOS, SHEETS.VACACIONES, SHEETS.SALDOS].forEach(function(sheetName) {
    var sheet = spreadsheet().getSheetByName(sheetName);
    var rows = readSheet(sheetName);
    for (var index = rows.length - 1; index >= 0; index--) {
      if (rows[index].id_persona === id) sheet.deleteRow(index + 2);
    }
  });

  spreadsheet().getSheetByName(SHEETS.PERSONAS).deleteRow(personIndex + 2);
  return { id_persona: id };
}

function ensureBalance(id, period) {
  var balances = readSheet(SHEETS.SALDOS);
  var balance = balances.find(function(item) { return item.id_persona === id && item.periodo === period; });
  if (balance) return balance;
  balance = { id_persona: id, periodo: period, dias_asignados: 10, dias_usados: 0, dias_disponibles: 10 };
  appendObject(SHEETS.SALDOS, balance);
  return balance;
}

function updateBalance(id, period, usedDays) {
  var sheet = spreadsheet().getSheetByName(SHEETS.SALDOS);
  var balances = readSheet(SHEETS.SALDOS);
  var index = balances.findIndex(function(item) { return item.id_persona === id && item.periodo === period; });
  if (index < 0) throw new Error('Saldo semestral no encontrado');
  sheet.getRange(index + 2, 4, 1, 2).setValues([[usedDays, 10 - usedDays]]);
}

function appendObject(sheetName, data) {
  var sheet = spreadsheet().getSheetByName(sheetName);
  var headers = HEADERS[sheetName];
  sheet.appendRow(headers.map(function(header) { return data[header] !== undefined ? data[header] : ''; }));
}

function validDate(value) {
  return /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value) && !isNaN(new Date(value + 'T12:00:00').getTime());
}

function periodForDate(date) {
  return date.getFullYear() + '-S' + (date.getMonth() < 6 ? '1' : '2');
}

function dateKey(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function nthWeekday(year, month, weekday, occurrence) {
  var first = new Date(year, month - 1, 1);
  return 1 + (weekday - first.getDay() + 7) % 7 + (occurrence - 1) * 7;
}

function isOfficialHoliday(date) {
  var year = date.getFullYear();
  var month = date.getMonth() + 1;
  var day = date.getDate();
  return (month === 1 && day === 1) ||
    (month === 2 && day === nthWeekday(year, 2, 1, 1)) ||
    (month === 3 && day === nthWeekday(year, 3, 1, 3)) ||
    (month === 5 && day === 1) ||
    (month === 10 && day === 1 && (year - 2024) % 6 === 0) ||
    (month === 9 && day === 16) ||
    (month === 11 && day === nthWeekday(year, 11, 1, 3)) ||
    (month === 12 && day === 25);
}

function countBusinessDays(start, end) {
  var from = new Date(start + 'T12:00:00');
  var to = new Date(end + 'T12:00:00');
  var count = 0;
  for (var date = new Date(from); date <= to; date.setDate(date.getDate() + 1)) {
    var weekday = date.getDay();
    if (weekday !== 0 && weekday !== 6 && !isOfficialHoliday(date)) count++;
  }
  return count;
}
`;