/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { CalendarView } from './CalendarView';
import { DayDetailModal } from './DayDetailModal';
import { BirthdayModal } from './BirthdayModal';
import { SimpleVacationModal } from './SimpleVacationModal';
import { storage } from '../services/storageService';
import { getMexicanHolidays } from '../utils/mexicanHolidays';
import { getSeasonalTheme } from '../utils/seasonalTheme';
import { Cumpleanos, Usuario, Vacacion } from '../types';
import { VacationFormatTab } from './VacationFormatTab';
import { CalendarDays, FileSpreadsheet, Link2, Palmtree, Trash2, UserRoundPlus, UsersRound, X } from 'lucide-react';

type CalendarTab = 'calendario' | 'usuarios' | 'formato';

export const SimpleCalendar: React.FC = () => {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [activeTab, setActiveTab] = useState<CalendarTab>('calendario');
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [vacationDate, setVacationDate] = useState<string | undefined>();
  const [isVacationOpen, setIsVacationOpen] = useState(false);
  const [isBirthdayOpen, setIsBirthdayOpen] = useState(false);
  const [isPersonOpen, setIsPersonOpen] = useState(false);
  const [personName, setPersonName] = useState('');
  const [personColor, setPersonColor] = useState('#0f766e');
  const [personBirthday, setPersonBirthday] = useState('');
  const [message, setMessage] = useState('');
  const [isAddingPerson, setIsAddingPerson] = useState(false);
  const [removingPersonId, setRemovingPersonId] = useState<string | null>(null);
  const [isConnectionOpen, setIsConnectionOpen] = useState(false);
  const [appsScriptUrl, setAppsScriptUrl] = useState(storage.getAppsScriptUrl());
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSheetsConnected, setIsSheetsConnected] = useState(Boolean(storage.getAppsScriptUrl()));

  useEffect(() => {
    let active = true;
    const refreshFromSheets = async () => {
      try {
        const loaded = await storage.loadSharedData();
        if (loaded && active) setRefreshKey((key) => key + 1);
      } catch (error) {
        console.error('No se pudieron cargar los datos compartidos:', error);
      }
    };
    void refreshFromSheets();
    const intervalId = window.setInterval(refreshFromSheets, 30000);
    window.addEventListener('focus', refreshFromSheets);
    return () => {
      active = false;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refreshFromSheets);
    };
  }, []);

  const users: Usuario[] = storage.getUsers();
  const vacations: Vacacion[] = storage.getVacations();
  const birthdays: Cumpleanos[] = storage.getBirthdays();
  const holidays = getMexicanHolidays(currentYear);
  const period = `${currentYear}-S${currentMonth < 6 ? 1 : 2}`;
  const balances = storage.getBalances();
  const theme = getSeasonalTheme(currentMonth);
  const personColors = ['#2563eb', '#0d9488', '#d97706', '#7c3aed', '#e11d48', '#0891b2', '#4d7c0f', '#9333ea'];

  const notify = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(''), 4000);
  };

  const openAddPerson = () => {
    const availableColor = personColors.find((color) => !users.some((user) => user.color.toLowerCase() === color));
    if (availableColor) setPersonColor(availableColor);
    setIsPersonOpen(true);
  };

  const handleAddPerson = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsAddingPerson(true);
    try {
      const sharedMode = Boolean(storage.getAppsScriptUrl());
      const personId = `person_${crypto.randomUUID()}`;
      const name = personName.trim();
      if (sharedMode) {
        await storage.submitSharedAction('add_person', {
          id_persona: personId,
          nombre: name,
          color: personColor,
        });
        if (personBirthday) {
          await storage.submitSharedAction('set_birthday', {
            id_persona: personId,
            fecha_cumpleaños: personBirthday,
          });
        }
      } else {
        const person = storage.createUser({
          nombre: name,
          color: personColor,
          password_hash: '',
          rol: 'usuario',
          estado: 'activo',
        }, 'Calendario');
        if (personBirthday) storage.setBirthday(person.id_usuario, personBirthday);
      }
      setPersonName('');
      setPersonBirthday('');
      setIsPersonOpen(false);
      setRefreshKey((key) => key + 1);
      notify(sharedMode
        ? `${name} se agregó al calendario compartido.`
        : `${name} se agregó solo en este navegador; conecta Google Sheets para compartirlo.`);
    } catch (error: unknown) {
      notify(error instanceof Error ? error.message : 'No se pudo agregar a la persona.');
    } finally {
      setIsAddingPerson(false);
    }
  };

  const handleRemovePerson = async (person: Usuario) => {
    const confirmed = window.confirm(
      `¿Quitar a ${person.nombre}? Se eliminarán también su cumpleaños, vacaciones y saldos. Cualquier visitante puede realizar esta acción.`
    );
    if (!confirmed) return;

    setRemovingPersonId(person.id_usuario);
    try {
      if (storage.getAppsScriptUrl()) {
        await storage.submitSharedAction('delete_person', { id_persona: person.id_usuario });
      } else {
        storage.removePerson(person.id_usuario);
      }
      setRefreshKey((key) => key + 1);
      notify(`${person.nombre} se quitó del calendario.`);
    } catch (error: unknown) {
      notify(error instanceof Error ? error.message : 'No se pudo quitar a la persona.');
    } finally {
      setRemovingPersonId(null);
    }
  };

  const handleConnectSheets = async (event: React.FormEvent) => {
    event.preventDefault();
    const url = appsScriptUrl.trim();
    if (!url) {
      notify('Pega la URL de la aplicación web de Apps Script que termina en /exec.');
      return;
    }

    const previousUrl = storage.getAppsScriptUrl();
    setIsConnecting(true);
    storage.setAppsScriptUrl(url);
    try {
      await storage.loadSharedData(url);
      setIsSheetsConnected(true);
      setRefreshKey((key) => key + 1);
      setIsConnectionOpen(false);
      notify('Google Sheets conectado. Los cambios se comparten entre dispositivos.');
    } catch (error: unknown) {
      storage.setAppsScriptUrl(previousUrl);
      setIsSheetsConnected(Boolean(previousUrl));
      notify(error instanceof Error ? error.message : 'No se pudo conectar con Google Sheets.');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="min-h-12 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-xl" aria-hidden="true">{theme.emoji}</span>
            <div className="leading-tight">
              <h1 className="text-base font-bold text-slate-900">Mi Calendario</h1>
              <p className="hidden sm:block text-[11px] text-slate-500">Vacaciones y cumpleaños</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setAppsScriptUrl(storage.getAppsScriptUrl());
                  setIsConnectionOpen(true);
                }}
                title={isSheetsConnected ? 'Configurar Google Sheets' : 'Conectar Google Sheets'}
                className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold border rounded-lg ${isSheetsConnected ? 'text-emerald-800 border-emerald-200 bg-emerald-50 hover:bg-emerald-100' : 'text-slate-700 border-slate-300 hover:bg-slate-50'}`}
              >
                <Link2 className="w-4 h-4" />
                <span className="hidden sm:inline">{isSheetsConnected ? 'Sheets conectado' : 'Conectar Sheets'}</span>
              </button>
            <button onClick={openAddPerson} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-700 border border-slate-300 hover:bg-slate-50 rounded-lg">
              <UserRoundPlus className="w-4 h-4" /><span className="hidden sm:inline">Agregar persona</span><span className="sm:hidden">Persona</span>
            </button>
            {activeTab === 'calendario' && <button onClick={() => { setVacationDate(undefined); setIsVacationOpen(true); }} disabled={!users.length} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 rounded-lg">
              <Palmtree className="w-4 h-4" /><span className="hidden sm:inline">Registrar vacaciones</span><span className="sm:hidden">Vacaciones</span>
            </button>}
          </div>
          </div>
          <nav aria-label="Secciones del calendario" className="mt-2 flex gap-1 border-t border-slate-100 pt-2">
            <button
              role="tab"
              aria-selected={activeTab === 'calendario'}
              onClick={() => setActiveTab('calendario')}
              className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg ${activeTab === 'calendario' ? 'bg-blue-50 text-blue-800' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <CalendarDays className="w-4 h-4" /> Calendario
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'usuarios'}
              onClick={() => setActiveTab('usuarios')}
              className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg ${activeTab === 'usuarios' ? 'bg-blue-50 text-blue-800' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <UsersRound className="w-4 h-4" /> Usuarios
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'formato'}
              onClick={() => setActiveTab('formato')}
              className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg ${activeTab === 'formato' ? 'bg-blue-50 text-blue-800' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <FileSpreadsheet className="w-4 h-4" /> Formato de vacaciones
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {activeTab === 'usuarios' && <section className="border-y border-slate-200 bg-white">
          <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Usuarios</h2>
              <p className="text-xs text-slate-500">{period} · 10 días ordinarios por semestre</p>
            </div>
          </div>
          {users.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-slate-500">Agrega a la primera persona para comenzar.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-sm">
                <thead className="bg-slate-50 text-left text-xs text-slate-500">
                  <tr><th className="px-4 py-2 font-semibold">Persona</th><th className="px-4 py-2 font-semibold">Asignados</th><th className="px-4 py-2 font-semibold">Usados</th><th className="px-4 py-2 font-semibold">Restantes</th><th className="px-4 py-2 font-semibold">Acciones</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.filter((user) => user.estado === 'activo').map((user) => {
                    const balance = balances.find((item) => item.id_usuario === user.id_usuario && item.periodo === period);
                    return (
                      <tr key={user.id_usuario}>
                        <th scope="row" className="px-4 py-2.5 text-left font-semibold text-slate-800"><span className="inline-block w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: user.color }} />{user.nombre}</th>
                        <td className="px-4 py-2.5 font-mono">{balance?.dias_asignados ?? 10}</td>
                        <td className="px-4 py-2.5 font-mono">{balance?.dias_utilizados ?? 0}</td>
                        <td className="px-4 py-2.5 font-mono font-bold text-emerald-800">{balance?.dias_disponibles ?? 10}</td>
                        <td className="px-4 py-2.5">
                          <button
                            type="button"
                            title={`Quitar a ${user.nombre}`}
                            aria-label={`Quitar a ${user.nombre}`}
                            disabled={removingPersonId === user.id_usuario}
                            onClick={() => void handleRemovePerson(user)}
                            className="p-2 text-rose-700 hover:bg-rose-50 disabled:opacity-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>}

        {activeTab === 'calendario' && <CalendarView
          key={refreshKey}
          currentYear={currentYear}
          currentMonth={currentMonth}
          onChangeYear={setCurrentYear}
          onChangeMonth={setCurrentMonth}
          users={users}
          vacations={vacations}
          birthdays={birthdays}
          onSelectDate={setSelectedDate}
          onRequestVacation={() => { setVacationDate(undefined); setIsVacationOpen(true); }}
        />}

        {activeTab === 'formato' && <VacationFormatTab />}
      </main>

      {message && <div role="status" className="fixed bottom-4 right-4 z-[60] max-w-sm px-4 py-3 text-sm text-white bg-slate-900 rounded-lg shadow-lg">{message}</div>}

      {isConnectionOpen && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
        <div className="w-full max-w-lg bg-white rounded-xl border border-slate-200 shadow-2xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
            <h2 className="text-base font-bold text-slate-900">Conectar Google Sheets</h2>
            <button onClick={() => setIsConnectionOpen(false)} aria-label="Cerrar" className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4" /></button>
          </div>
          <form onSubmit={handleConnectSheets} className="p-5 space-y-4">
            <label className="block text-xs font-semibold text-slate-700">URL de la aplicación web de Apps Script
              <input type="url" value={appsScriptUrl} onChange={(event) => setAppsScriptUrl(event.target.value)} placeholder="https://script.google.com/macros/s/.../exec" className="mt-1.5 w-full px-3 py-2.5 border border-slate-300 rounded-lg font-mono" required />
            </label>
            <p className="text-xs text-slate-500">Usa la URL /exec del despliegue. Para compartir desde GitHub Pages en todos los dispositivos, configura también VITE_APPS_SCRIPT_URL en el repositorio.</p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setIsConnectionOpen(false)} className="px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg">Cancelar</button>
              <button type="submit" disabled={isConnecting} className="px-4 py-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 rounded-lg">{isConnecting ? 'Conectando...' : 'Probar y conectar'}</button>
            </div>
          </form>
        </div>
      </div>}

      {selectedDate && <DayDetailModal
        dateStr={selectedDate}
        isOpen
        onClose={() => setSelectedDate(null)}
        users={users}
        vacations={vacations}
        birthdays={birthdays}
        holidays={holidays}
        onRequestVacationForDate={(date) => { setVacationDate(date); setIsVacationOpen(true); }}
        onAddBirthdayForDate={(date) => { setPersonBirthday(date); setIsBirthdayOpen(true); }}
      />}

      <BirthdayModal
        isOpen={isBirthdayOpen}
        onClose={() => setIsBirthdayOpen(false)}
        onSuccess={(text) => { notify(text); setRefreshKey((key) => key + 1); }}
        initialDate={personBirthday}
        users={users}
      />

      <SimpleVacationModal
        isOpen={isVacationOpen}
        onClose={() => setIsVacationOpen(false)}
        onSuccess={(text) => { notify(text); setRefreshKey((key) => key + 1); }}
        initialDate={vacationDate}
        users={users}
        holidays={holidays}
      />

      {isPersonOpen && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
        <div className="w-full max-w-md bg-white rounded-xl border border-slate-200 shadow-2xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
            <h2 className="text-base font-bold text-slate-900">Agregar persona</h2>
            <button onClick={() => setIsPersonOpen(false)} aria-label="Cerrar" className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4" /></button>
          </div>
          <form onSubmit={handleAddPerson} className="p-5 space-y-4">
            <label className="block text-xs font-semibold text-slate-700">Nombre<input autoFocus value={personName} onChange={(event) => setPersonName(event.target.value)} maxLength={60} required className="mt-1.5 w-full px-3 py-2.5 border border-slate-300 rounded-lg" /></label>
            <label className="block text-xs font-semibold text-slate-700">Color del calendario<input type="color" value={personColor} onChange={(event) => setPersonColor(event.target.value)} className="mt-1.5 block w-14 h-10 border border-slate-300 rounded-lg bg-white p-1" /></label>
            <label className="block text-xs font-semibold text-slate-700">Cumpleaños (opcional)<input type="date" value={personBirthday} onChange={(event) => setPersonBirthday(event.target.value)} className="mt-1.5 w-full px-3 py-2.5 border border-slate-300 rounded-lg" /></label>
            <p className="text-xs text-slate-500">Se asignan 10 días de vacaciones por semestre.</p>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setIsPersonOpen(false)} className="px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg">Cancelar</button>
              <button type="submit" disabled={isAddingPerson} className="px-4 py-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:bg-slate-400 rounded-lg">{isAddingPerson ? 'Agregando...' : 'Agregar'}</button>
            </div>
          </form>
        </div>
      </div>}
    </div>
  );
};