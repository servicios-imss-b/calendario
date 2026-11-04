/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { SimpleCalendar } from './components/SimpleCalendar';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar, ActiveTab } from './components/Navbar';
import { CalendarView } from './components/CalendarView';
import { HomeView } from './components/HomeView';
import { MySpaceView } from './components/MySpaceView';
import { MyRequestsView } from './components/MyRequestsView';
import { ParticipantsView } from './components/ParticipantsView';
import { AdminPanel } from './components/AdminPanel/AdminPanel';
import { DayDetailModal } from './components/DayDetailModal';
import { VacationRequestModal } from './components/VacationRequestModal';
import { CompensatoryRequestModal } from './components/CompensatoryRequestModal';
import { BirthdayModal } from './components/BirthdayModal';
import { LoginModal } from './components/LoginModal';
import { RegisterModal } from './components/RegisterModal';
import { ToastContainer } from './components/ToastNotification';
import { storage } from './services/storageService';
import { getMexicanHolidays } from './utils/mexicanHolidays';
import { ToastMessage, Usuario, Vacacion, Cumpleanos, CompensatorioSolicitud } from './types';

function MainApp() {
  const { currentUser, isAdmin } = useAuth();

  // Current year & month for calendar navigation (default: 2026, 11 for December to demonstrate prompt's example or current date)
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(2026);
  // Default to December (11) as in prompt: "Diciembre de 2026: 10: Martin, Ana; 11: Martin, Ana, Carlos..."
  const [currentMonth, setCurrentMonth] = useState(11);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('calendario');

  // Trigger for state updates
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    let active = true;
    const refreshFromSheets = async () => {
      try {
        const loaded = await storage.loadSharedData();
        if (loaded && active) refresh();
      } catch (error) {
        console.error('No se pudieron cargar los datos compartidos de Google Sheets:', error);
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
  }, [refresh]);

  // Modals state
  const [dayDetailDate, setDayDetailDate] = useState<string | null>(null);
  const [isVacationModalOpen, setIsVacationModalOpen] = useState(false);
  const [vacationModalInitialDate, setVacationModalInitialDate] = useState<string | undefined>(undefined);
  const [isCompensatoryModalOpen, setIsCompensatoryModalOpen] = useState(false);
  const [isBirthdayModalOpen, setIsBirthdayModalOpen] = useState(false);
  const [birthdayModalInitialDate, setBirthdayModalInitialDate] = useState<string | undefined>(undefined);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    const newToast: ToastMessage = { id, type, title, message };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Cached data from storage
  const users: Usuario[] = storage.getUsers();
  const vacations: Vacacion[] = storage.getVacations();
  const birthdays: Cumpleanos[] = storage.getBirthdays();
  const compensatoryRequests: CompensatorioSolicitud[] = storage.getCompensatoryRequests();
  const holidays = getMexicanHolidays(currentYear);

  const handleOpenVacationForDate = (dateStr: string) => {
    if (!currentUser) {
      addToast('info', 'Inicio de sesión requerido', 'Inicia sesión para registrar tus solicitudes.');
      setIsLoginModalOpen(true);
      return;
    }
    setVacationModalInitialDate(dateStr);
    setIsVacationModalOpen(true);
  };

  const handleOpenBirthdayForDate = (dateStr: string) => {
    if (!currentUser) {
      addToast('info', 'Inicio de sesión requerido', 'Inicia sesión para registrar tu cumpleaños.');
      setIsLoginModalOpen(true);
      return;
    }
    setBirthdayModalInitialDate(dateStr);
    setIsBirthdayModalOpen(true);
  };

  const handleRequestVacation = () => {
    if (!currentUser && !storage.getAppsScriptUrl()) {
      setIsLoginModalOpen(true);
      return;
    }
    setVacationModalInitialDate(undefined);
    setIsVacationModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 antialiased selection:bg-blue-100 selection:text-blue-900">
      
      {/* GLOBAL TOP NAVIGATION */}
      <Navbar
        currentMonth={currentMonth}
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (tab === 'admin' && !isAdmin) {
            addToast('warning', 'Acceso no autorizado', 'El panel administrativo es exclusivo para administradores.');
            return;
          }
          setActiveTab(tab);
        }}
        onRequestVacation={handleRequestVacation}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onOpenRegister={() => setIsRegisterModalOpen(true)}
      />

      {/* MAIN VIEW CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'inicio' && (
          <HomeView
            onNavigateToCalendar={() => setActiveTab('calendario')}
            onNavigateToMySpace={() => setActiveTab('mi-espacio')}
            onRequestVacation={handleRequestVacation}
            onOpenBirthdayModal={() => setIsBirthdayModalOpen(true)}
            users={users}
            vacations={vacations}
            birthdays={birthdays}
            holidays={holidays}
          />
        )}

        {activeTab === 'calendario' && (
          <CalendarView
            currentYear={currentYear}
            currentMonth={currentMonth}
            onChangeYear={setCurrentYear}
            onChangeMonth={setCurrentMonth}
            users={users}
            vacations={vacations}
            birthdays={birthdays}
            onSelectDate={(dateStr) => setDayDetailDate(dateStr)}
            onRequestVacation={handleRequestVacation}
          />
        )}

        {activeTab === 'mi-espacio' && (
          <MySpaceView
            onNavigateToCalendar={() => setActiveTab('calendario')}
            onNavigateToMyRequests={() => setActiveTab('mis-solicitudes')}
            onRequestVacation={handleRequestVacation}
            onOpenBirthdayModal={() => setIsBirthdayModalOpen(true)}
            onOpenCompensatoryModal={() => setIsCompensatoryModalOpen(true)}
            onSuccess={(msg) => {
              addToast('success', 'Operación exitosa', msg);
              refresh();
            }}
            onError={(msg) => addToast('error', 'Error', msg)}
            refreshTrigger={refreshKey}
          />
        )}

        {activeTab === 'mis-solicitudes' && (
          <MyRequestsView
            onRequestVacation={() => {
              setVacationModalInitialDate(undefined);
              setIsVacationModalOpen(true);
            }}
            onSuccess={(msg) => {
              addToast('success', 'Operación exitosa', msg);
              refresh();
            }}
            onError={(msg) => addToast('error', 'Error', msg)}
            refreshTrigger={refreshKey}
          />
        )}

        {activeTab === 'participantes' && (
          <ParticipantsView
            users={users}
            birthdays={birthdays}
            vacations={vacations}
            onSelectUserToViewCalendar={(userId) => {
              setActiveTab('calendario');
            }}
          />
        )}

        {activeTab === 'admin' && (
          <AdminPanel
            onBackToApp={() => setActiveTab('calendario')}
            users={users}
            vacations={vacations}
            birthdays={birthdays}
            compensatoryRequests={compensatoryRequests}
            onSuccess={(msg) => {
              addToast('success', 'Actualización guardada', msg);
              refresh();
            }}
            onError={(msg) => addToast('error', 'Error administrativo', msg)}
            onRefresh={refresh}
          />
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">Mi Calendario</span>
            <span>·</span>
            <span>Sistema compartido de cumpleaños, vacaciones y días compensatorios</span>
          </div>
          <div className="text-slate-400">
            Conectado a Google Sheets mediante Google Apps Script · Ley Federal del Trabajo Art. 74
          </div>
        </div>
      </footer>

      {/* MODALS */}
      {dayDetailDate && (
        <DayDetailModal
          dateStr={dayDetailDate}
          isOpen={Boolean(dayDetailDate)}
          onClose={() => setDayDetailDate(null)}
          users={users}
          vacations={vacations}
          birthdays={birthdays}
          holidays={holidays}
          onRequestVacationForDate={handleOpenVacationForDate}
          onAddBirthdayForDate={handleOpenBirthdayForDate}
          currentUserId={currentUser?.id_usuario}
        />
      )}

      {isVacationModalOpen && (
        <VacationRequestModal
          isOpen={isVacationModalOpen}
          onClose={() => setIsVacationModalOpen(false)}
          onSuccess={(msg) => {
            addToast('success', 'Solicitud enviada', msg);
            refresh();
          }}
          initialDate={vacationModalInitialDate}
          holidays={holidays}
        />
      )}

      {isCompensatoryModalOpen && (
        <CompensatoryRequestModal
          isOpen={isCompensatoryModalOpen}
          onClose={() => setIsCompensatoryModalOpen(false)}
          onSuccess={(msg) => {
            addToast('success', 'Solicitud enviada', msg);
            refresh();
          }}
        />
      )}

      {isBirthdayModalOpen && (
        <BirthdayModal
          isOpen={isBirthdayModalOpen}
          onClose={() => setIsBirthdayModalOpen(false)}
          onSuccess={(msg) => {
            addToast('success', 'Cumpleaños guardado', msg);
            refresh();
          }}
          initialDate={birthdayModalInitialDate}
        />
      )}

      {isLoginModalOpen && (
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onSuccess={(msg) => {
            addToast('success', 'Sesión iniciada', msg);
            refresh();
          }}
          onSwitchToRegister={() => {
            setIsLoginModalOpen(false);
            setIsRegisterModalOpen(true);
          }}
        />
      )}

      {isRegisterModalOpen && (
        <RegisterModal
          isOpen={isRegisterModalOpen}
          onClose={() => setIsRegisterModalOpen(false)}
          onSuccess={(msg) => {
            addToast('success', 'Registro exitoso', msg);
            refresh();
          }}
          onSwitchToLogin={() => {
            setIsRegisterModalOpen(false);
            setIsLoginModalOpen(true);
          }}
        />
      )}

      {/* TOAST NOTIFICATIONS CONTAINER */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

    </div>
  );
}

export default function App() {
  return <SimpleCalendar />;
}
