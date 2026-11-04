/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import JSZip from 'jszip';
import vacationTemplateUrl from '../../INCIDENCIA_RETARDO_PAOLA.xlsx?url';
import { Download, FileSpreadsheet } from 'lucide-react';

const monthNames = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];
const spreadsheetNamespace = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const relationshipNamespace = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const packageRelationshipNamespace = 'http://schemas.openxmlformats.org/package/2006/relationships';

function parseXml(xml: string): Document {
  const document = new DOMParser().parseFromString(xml, 'application/xml');
  if (document.getElementsByTagName('parsererror').length > 0) {
    throw new Error('La plantilla de vacaciones contiene XML no válido.');
  }
  return document;
}

function findWorksheetPath(workbook: Document, relationships: Document): { path: string; index: number } {
  const sheets = Array.from(workbook.getElementsByTagNameNS(spreadsheetNamespace, 'sheet'));
  const index = sheets.findIndex((sheet) => sheet.getAttribute('name') === 'vacaciones');
  if (index < 0) throw new Error('La plantilla no contiene la hoja vacaciones.');

  const relationshipId = sheets[index].getAttributeNS(relationshipNamespace, 'id');
  const relationship = Array.from(relationships.getElementsByTagNameNS(packageRelationshipNamespace, 'Relationship'))
    .find((item) => item.getAttribute('Id') === relationshipId);
  const target = relationship?.getAttribute('Target');
  if (!target) throw new Error('No se encontró el XML de la hoja vacaciones.');

  return {
    path: target.startsWith('/') ? target.slice(1) : `xl/${target}`,
    index,
  };
}

function getWorksheetCell(document: Document, reference: string): Element {
  const cell = Array.from(document.getElementsByTagNameNS(spreadsheetNamespace, 'c'))
    .find((item) => item.getAttribute('r') === reference);
  if (!cell) throw new Error(`No se encontró la celda ${reference} en la plantilla.`);
  return cell;
}

function clearCellContents(cell: Element): void {
  Array.from(cell.childNodes).forEach((child) => {
    if (child.nodeType === 1 && ['f', 'v', 'is'].includes((child as Element).localName)) {
      cell.removeChild(child);
    }
  });
}

function setInlineText(document: Document, cell: Element, value: string): void {
  clearCellContents(cell);
  cell.setAttribute('t', 'inlineStr');
  const inlineString = document.createElementNS(spreadsheetNamespace, 'is');
  const text = document.createElementNS(spreadsheetNamespace, 't');
  text.textContent = value;
  inlineString.appendChild(text);
  cell.appendChild(inlineString);
}

function setNumber(document: Document, cell: Element, value: number): void {
  clearCellContents(cell);
  cell.removeAttribute('t');
  const content = document.createElementNS(spreadsheetNamespace, 'v');
  content.textContent = String(value);
  cell.appendChild(content);
}

function setFormula(document: Document, cell: Element, formula: string, result: number): void {
  clearCellContents(cell);
  cell.removeAttribute('t');
  const expression = document.createElementNS(spreadsheetNamespace, 'f');
  expression.textContent = formula;
  const value = document.createElementNS(spreadsheetNamespace, 'v');
  value.textContent = String(result);
  cell.appendChild(expression);
  cell.appendChild(value);
}

function displayDateRange(startDate: string, endDate: string): string {
  const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
  const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
  if (startYear === endYear && startMonth === endMonth) {
    return `${startDay} al ${endDay} de ${monthNames[startMonth - 1]}`;
  }
  return `${startDay} de ${monthNames[startMonth - 1]} al ${endDay} de ${monthNames[endMonth - 1]}`;
}

export const VacationFormatTab: React.FC = () => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentPeriod = `${now.getMonth() < 6 ? '1er' : '2do'} periodo ${currentYear}`;
  const today = `${currentYear}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const [name, setName] = useState('');
  const [rfc, setRfc] = useState('');
  const [documentDate, setDocumentDate] = useState(today);
  const [period, setPeriod] = useState(currentPeriod);
  const [daysAuthorized, setDaysAuthorized] = useState(0);
  const [vacationStart, setVacationStart] = useState('');
  const [vacationEnd, setVacationEnd] = useState('');
  const [observations, setObservations] = useState('');
  const [approverPosition, setApproverPosition] = useState('Jefe de Área Administrativa');
  const [errorMessage, setErrorMessage] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  const pendingDays = 10 - daysAuthorized;
  const years = Array.from({ length: 5 }, (_, index) => currentYear - 2 + index);
  const periods = years.flatMap((year) => [`1er periodo ${year}`, `2do periodo ${year}`]);

  const handleDownload = async () => {
    setErrorMessage('');
    if (!name.trim()) {
      setErrorMessage('Escribe el nombre que aparecerá en el formato.');
      return;
    }
    if (!rfc.trim()) {
      setErrorMessage('Escribe el RFC para incluirlo en esta descarga.');
      return;
    }
    if (!documentDate || !vacationStart || !vacationEnd || vacationStart > vacationEnd) {
      setErrorMessage('Completa la fecha del formato y un periodo vacacional válido.');
      return;
    }
    if (!Number.isInteger(daysAuthorized) || daysAuthorized < 0 || daysAuthorized > 10) {
      setErrorMessage('Los días autorizados deben estar entre 0 y 10.');
      return;
    }

    setIsDownloading(true);
    try {
      const response = await fetch(vacationTemplateUrl);
      if (!response.ok) throw new Error('No se pudo cargar la plantilla de vacaciones.');

      const archive = await JSZip.loadAsync(await response.arrayBuffer());
      const workbookFile = archive.file('xl/workbook.xml');
      const relationshipsFile = archive.file('xl/_rels/workbook.xml.rels');
      if (!workbookFile || !relationshipsFile) throw new Error('El archivo no contiene la estructura de Excel esperada.');

      const workbookDocument = parseXml(await workbookFile.async('string'));
      const relationshipsDocument = parseXml(await relationshipsFile.async('string'));
      const { path: worksheetPath, index: sheetIndex } = findWorksheetPath(workbookDocument, relationshipsDocument);
      const worksheetFile = archive.file(worksheetPath);
      if (!worksheetFile) throw new Error('No se pudo abrir la hoja vacaciones.');
      const worksheetDocument = parseXml(await worksheetFile.async('string'));

      const [year, month, day] = documentDate.split('-').map(Number);
      setNumber(worksheetDocument, getWorksheetCell(worksheetDocument, 'M9'), day);
      setInlineText(worksheetDocument, getWorksheetCell(worksheetDocument, 'O9'), monthNames[month - 1].toUpperCase());
      setNumber(worksheetDocument, getWorksheetCell(worksheetDocument, 'T9'), year);
      setInlineText(worksheetDocument, getWorksheetCell(worksheetDocument, 'E11'), name.trim());
      setInlineText(worksheetDocument, getWorksheetCell(worksheetDocument, 'P13'), rfc.trim().toUpperCase());
      setNumber(worksheetDocument, getWorksheetCell(worksheetDocument, 'H24'), daysAuthorized);
      setFormula(worksheetDocument, getWorksheetCell(worksheetDocument, 'P24'), '10-H24', pendingDays);
      setInlineText(worksheetDocument, getWorksheetCell(worksheetDocument, 'L26'), period);
      setInlineText(worksheetDocument, getWorksheetCell(worksheetDocument, 'F33'), displayDateRange(vacationStart, vacationEnd));
      setInlineText(worksheetDocument, getWorksheetCell(worksheetDocument, 'F35'), observations.trim());
      setInlineText(worksheetDocument, getWorksheetCell(worksheetDocument, 'M51'), approverPosition.trim());

      const signatureCell = getWorksheetCell(worksheetDocument, 'M58');
      const signatureFormula = signatureCell.getElementsByTagNameNS(spreadsheetNamespace, 'f')[0]?.textContent;
      if (signatureFormula !== 'E11') throw new Error('La plantilla no tiene la fórmula esperada para la firma.');
      const signatureResult = signatureCell.getElementsByTagNameNS(spreadsheetNamespace, 'v')[0];
      if (signatureResult) signatureResult.textContent = name.trim();

      const calculation = workbookDocument.getElementsByTagNameNS(spreadsheetNamespace, 'calcPr')[0];
      calculation?.setAttribute('calcMode', 'auto');
      calculation?.setAttribute('fullCalcOnLoad', '1');
      calculation?.setAttribute('forceFullCalc', '1');

      archive.file(worksheetPath, new XMLSerializer().serializeToString(worksheetDocument));
      const workbookView = workbookDocument.getElementsByTagNameNS(spreadsheetNamespace, 'workbookView')[0];
      workbookView?.setAttribute('activeTab', String(sheetIndex));
      archive.file('xl/workbook.xml', new XMLSerializer().serializeToString(workbookDocument));

      const xlsxBytes = await archive.generateAsync({
        type: 'arraybuffer',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      });
      const blob = new Blob([xlsxBytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `Formato_Vacaciones_${name.trim().replace(/[^a-z0-9_-]/gi, '_')}_${documentDate}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo generar el formato.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <section className="max-w-3xl border-y border-slate-200 bg-white">
      <div className="px-4 py-3 border-b border-slate-100">
        <h2 className="text-sm font-bold text-slate-900">Formato de vacaciones</h2>
        <p className="text-xs text-slate-500">Llena el formato y descarga una copia de Excel. No se guarda en el calendario.</p>
      </div>

      <div className="p-4 sm:p-6 space-y-5">
        {errorMessage && <p role="alert" className="p-3 text-sm text-rose-800 bg-rose-50 border border-rose-200 rounded-lg">{errorMessage}</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="text-xs font-semibold text-slate-700">Fecha del formato
            <input type="date" value={documentDate} onChange={(event) => setDocumentDate(event.target.value)} className="mt-1.5 w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-white" required />
          </label>
          <label className="text-xs font-semibold text-slate-700">Nombre
            <input type="text" value={name} onChange={(event) => setName(event.target.value)} maxLength={100} className="mt-1.5 w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-white" required />
          </label>
          <label className="text-xs font-semibold text-slate-700">RFC
            <input type="text" value={rfc} onChange={(event) => setRfc(event.target.value.toUpperCase())} maxLength={13} autoComplete="off" className="mt-1.5 w-full px-3 py-2.5 border border-slate-300 rounded-lg uppercase" />
            <span className="mt-1 block text-[11px] font-normal text-slate-500">Solo se incluye en el archivo descargado; no se guarda.</span>
          </label>
          <label className="text-xs font-semibold text-slate-700">Periodo vacacional
            <select value={period} onChange={(event) => setPeriod(event.target.value)} className="mt-1.5 w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-white">
              {periods.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="text-xs font-semibold text-slate-700">Días autorizados
            <input type="number" min="0" max="10" step="1" value={daysAuthorized} onChange={(event) => setDaysAuthorized(Math.min(10, Math.max(0, Number(event.target.value) || 0)))} className="mt-1.5 w-full px-3 py-2.5 border border-slate-300 rounded-lg font-mono" />
          </label>
          <div className="text-xs font-semibold text-slate-700">Días pendientes
            <output className="mt-1.5 block w-full px-3 py-2.5 border border-slate-200 rounded-lg bg-slate-50 font-mono text-slate-800">{pendingDays}</output>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="text-xs font-semibold text-slate-700">Inicio de vacaciones
            <input type="date" value={vacationStart} onChange={(event) => setVacationStart(event.target.value)} className="mt-1.5 w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-white" required />
          </label>
          <label className="text-xs font-semibold text-slate-700">Fin de vacaciones
            <input type="date" min={vacationStart} value={vacationEnd} onChange={(event) => setVacationEnd(event.target.value)} className="mt-1.5 w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-white" required />
          </label>
        </div>

        <label className="block text-xs font-semibold text-slate-700">Observaciones
          <textarea value={observations} onChange={(event) => setObservations(event.target.value)} rows={2} className="mt-1.5 w-full px-3 py-2.5 border border-slate-300 rounded-lg resize-y" />
        </label>

        <label className="block text-xs font-semibold text-slate-700">Puesto de autorización
          <input type="text" value={approverPosition} onChange={(event) => setApproverPosition(event.target.value)} maxLength={100} className="mt-1.5 w-full px-3 py-2.5 border border-slate-300 rounded-lg" />
        </label>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <p className="text-xs text-slate-500">Días pendientes = 10 − días autorizados. La firma toma el nombre automáticamente.</p>
          <button type="button" onClick={() => void handleDownload()} disabled={isDownloading} className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 rounded-lg">
            <Download className="w-4 h-4" /><FileSpreadsheet className="w-4 h-4" />
            {isDownloading ? 'Generando...' : 'Descargar formato Excel'}
          </button>
        </div>
      </div>
    </section>
  );
};