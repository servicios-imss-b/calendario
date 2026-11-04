/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Festivo } from '../types';

/**
 * Calculates the Nth occurrence of a specific weekday in a month.
 * @param year e.g. 2026
 * @param month 0-indexed (0 = Jan, 1 = Feb, etc.)
 * @param dayOfWeek 0 = Sunday, 1 = Monday, ..., 6 = Saturday
 * @param n 1 for 1st, 2 for 2nd, 3 for 3rd, etc.
 */
function getNthDayOfMonth(year: number, month: number, dayOfWeek: number, n: number): number {
  let count = 0;
  for (let day = 1; day <= 31; day++) {
    const d = new Date(year, month, day);
    if (d.getMonth() !== month) break;
    if (d.getDay() === dayOfWeek) {
      count++;
      if (count === n) {
        return day;
      }
    }
  }
  return 1;
}

function formatDate(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

/**
 * Generates all Mexican holidays for a given year based on Art. 74 of the LFT
 * and traditional Mexican cultural celebrations.
 */
export function getMexicanHolidays(year: number): Festivo[] {
  const holidays: Festivo[] = [];

  // 1. DÍAS FESTIVOS OFICIALES (Descanso obligatorio según Art. 74 LFT)
  
  // 1 de enero: Año Nuevo
  holidays.push({
    id: `oficial-${year}-01-01`,
    fecha: formatDate(year, 0, 1),
    nombre: 'Año Nuevo (Oficial)',
    tipo: 'oficial',
    año: year,
  });

  // Primer lunes de febrero en conmemoración del 5 de febrero (Constitución)
  const firstMonFeb = getNthDayOfMonth(year, 1, 1, 1);
  holidays.push({
    id: `oficial-${year}-02-${firstMonFeb}`,
    fecha: formatDate(year, 1, firstMonFeb),
    nombre: 'Día de la Constitución (Oficial)',
    tipo: 'oficial',
    año: year,
  });

  // Tercer lunes de marzo en conmemoración del 21 de marzo (Natalicio de Benito Juárez)
  const thirdMonMar = getNthDayOfMonth(year, 2, 1, 3);
  holidays.push({
    id: `oficial-${year}-03-${thirdMonMar}`,
    fecha: formatDate(year, 2, thirdMonMar),
    nombre: 'Natalicio de Benito Juárez (Oficial)',
    tipo: 'oficial',
    año: year,
  });

  // 1 de mayo: Día del Trabajo
  holidays.push({
    id: `oficial-${year}-05-01`,
    fecha: formatDate(year, 4, 1),
    nombre: 'Día del Trabajo (Oficial)',
    tipo: 'oficial',
    año: year,
  });

  // 16 de septiembre: Día de la Independencia de México
  holidays.push({
    id: `oficial-${year}-09-16`,
    fecha: formatDate(year, 8, 16),
    nombre: 'Día de la Independencia (Oficial)',
    tipo: 'oficial',
    año: year,
  });

  // 1 de octubre cada 6 años (Transmisión del Poder Ejecutivo Federal: 2024, 2030, etc.)
  if ((year - 2024) % 6 === 0) {
    holidays.push({
      id: `oficial-${year}-10-01`,
      fecha: formatDate(year, 9, 1),
      nombre: 'Transmisión del Poder Ejecutivo Federal (Oficial)',
      tipo: 'oficial',
      año: year,
    });
  }

  // Tercer lunes de noviembre en conmemoración del 20 de noviembre (Revolución Mexicana)
  const thirdMonNov = getNthDayOfMonth(year, 10, 1, 3);
  holidays.push({
    id: `oficial-${year}-11-${thirdMonNov}`,
    fecha: formatDate(year, 10, thirdMonNov),
    nombre: 'Día de la Revolución Mexicana (Oficial)',
    tipo: 'oficial',
    año: year,
  });

  // 25 de diciembre: Navidad
  holidays.push({
    id: `oficial-${year}-12-25`,
    fecha: formatDate(year, 11, 25),
    nombre: 'Navidad (Oficial)',
    tipo: 'oficial',
    año: year,
  });

  // 2. CELEBRACIONES CULTURALES Y TRADICIONALES
  holidays.push(
    {
      id: `cultural-${year}-01-06`,
      fecha: formatDate(year, 0, 6),
      nombre: 'Día de Reyes',
      tipo: 'cultural',
      año: year,
    },
    {
      id: `cultural-${year}-02-14`,
      fecha: formatDate(year, 1, 14),
      nombre: 'Día del Amor y la Amistad',
      tipo: 'cultural',
      año: year,
    },
    {
      id: `cultural-${year}-02-24`,
      fecha: formatDate(year, 1, 24),
      nombre: 'Día de la Bandera',
      tipo: 'cultural',
      año: year,
    },
    {
      id: `cultural-${year}-04-30`,
      fecha: formatDate(year, 3, 30),
      nombre: 'Día del Niño',
      tipo: 'cultural',
      año: year,
    },
    {
      id: `cultural-${year}-05-05`,
      fecha: formatDate(year, 4, 5),
      nombre: 'Batalla de Puebla',
      tipo: 'cultural',
      año: year,
    },
    {
      id: `cultural-${year}-05-10`,
      fecha: formatDate(year, 4, 10),
      nombre: 'Día de las Madres',
      tipo: 'cultural',
      año: year,
    },
    {
      id: `cultural-${year}-11-01`,
      fecha: formatDate(year, 10, 1),
      nombre: 'Día de Todos los Santos',
      tipo: 'cultural',
      año: year,
    },
    {
      id: `cultural-${year}-11-02`,
      fecha: formatDate(year, 10, 2),
      nombre: 'Día de Muertos',
      tipo: 'cultural',
      año: year,
    },
    {
      id: `cultural-${year}-12-12`,
      fecha: formatDate(year, 11, 12),
      nombre: 'Día de la Virgen de Guadalupe',
      tipo: 'cultural',
      año: year,
    },
    {
      id: `cultural-${year}-12-24`,
      fecha: formatDate(year, 11, 24),
      nombre: 'Nochebuena',
      tipo: 'cultural',
      año: year,
    },
    {
      id: `cultural-${year}-12-31`,
      fecha: formatDate(year, 11, 31),
      nombre: 'Fin de Año',
      tipo: 'cultural',
      año: year,
    }
  );

  return holidays;
}

/**
 * Calculates working days between two dates.
 * Excludes Saturdays, Sundays, and Official Mexican holidays (Art. 74 LFT).
 */
export function calculateWorkingDays(
  startDateStr: string,
  endDateStr: string,
  allHolidays: Festivo[] = [],
  excludeWeekends = true,
  excludeHolidays = true
): {
  workingDays: number;
  totalCalendarDays: number;
  workingDates: string[];
  weekendDaysCount: number;
  holidayDaysCount: number;
  holidayDetails: { fecha: string; nombre: string }[];
} {
  if (!startDateStr || !endDateStr) {
    return {
      workingDays: 0,
      totalCalendarDays: 0,
      workingDates: [],
      weekendDaysCount: 0,
      holidayDaysCount: 0,
      holidayDetails: [],
    };
  }

  // Parse YYYY-MM-DD reliably without time zone shift
  const [sYear, sMonth, sDay] = startDateStr.split('-').map(Number);
  const [eYear, eMonth, eDay] = endDateStr.split('-').map(Number);

  const start = new Date(sYear, sMonth - 1, sDay);
  const end = new Date(eYear, eMonth - 1, eDay);

  if (start > end) {
    return {
      workingDays: 0,
      totalCalendarDays: 0,
      workingDates: [],
      weekendDaysCount: 0,
      holidayDaysCount: 0,
      holidayDetails: [],
    };
  }

  // Build a set of official holiday date strings
  const officialHolidayMap = new Map<string, string>();
  allHolidays
    .filter((h) => h.tipo === 'oficial')
    .forEach((h) => {
      officialHolidayMap.set(h.fecha, h.nombre);
    });

  let workingDays = 0;
  let totalCalendarDays = 0;
  let weekendDaysCount = 0;
  let holidayDaysCount = 0;
  const workingDates: string[] = [];
  const holidayDetails: { fecha: string; nombre: string }[] = [];

  const curr = new Date(start);
  while (curr <= end) {
    totalCalendarDays++;
    const y = curr.getFullYear();
    const m = String(curr.getMonth() + 1).padStart(2, '0');
    const d = String(curr.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;
    const dayOfWeek = curr.getDay(); // 0 is Sunday, 6 is Saturday

    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = officialHolidayMap.has(dateStr);

    if (excludeWeekends && isWeekend) {
      weekendDaysCount++;
    } else if (excludeHolidays && isHoliday) {
      holidayDaysCount++;
      holidayDetails.push({ fecha: dateStr, nombre: officialHolidayMap.get(dateStr)! });
    } else {
      workingDays++;
      workingDates.push(dateStr);
    }

    curr.setDate(curr.getDate() + 1);
  }

  return {
    workingDays,
    totalCalendarDays,
    workingDates,
    weekendDaysCount,
    holidayDaysCount,
    holidayDetails,
  };
}
