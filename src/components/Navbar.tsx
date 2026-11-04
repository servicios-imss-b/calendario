/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getSeasonalTheme } from '../utils/seasonalTheme';
import {
  Calendar as CalendarIcon,
  Home,
  User,
  FileText,
  Users,
  ShieldAlert,
  Menu,
  X,
  PlusCircle,
  LogIn,
  LogOut,
  ChevronDown,
} from 'lucide-react';

export type ActiveTab = 'inicio' | 'calendario' | 'mi-espacio' | 'mis-solicitudes' | 'participantes' | 'admin';

interface NavbarProps {
  currentMonth: number;
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onRequestVacation: () => void;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentMonth,
  activeTab,
  onSelectTab,
  onRequestVacation,
  onOpenLogin,
  onOpenRegister,
}) => {
  const { currentUser, isAdmin, logout, switchUser, allUsers } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const seasonalEmoji = getSeasonalTheme(currentMonth).emoji;

  const navItems = [
    { id: 'inicio' as ActiveTab, label: 'Inicio', icon: Home },
    { id: 'calendario' as ActiveTab, label: 'Calendario', icon: CalendarIcon },
    { id: 'mi-espacio' as ActiveTab, label: 'Mi espacio', icon: User },
    { id: 'mis-solicitudes' as ActiveTab, label: 'Mis solicitudes', icon: FileText },
    { id: 'participantes' as ActiveTab, label: 'Participantes', icon: Users },
  ];

  if (isAdmin) {
    navItems.push({
      id: 'admin' as ActiveTab,
      label: 'Panel administrativo',
      icon: ShieldAlert,
    });
  }

  const handleNavClick = (tab: ActiveTab) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* ZONE 1: BRAND */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => handleNavClick('calendario')}
              className="flex items-center gap-2.5 text-left group focus:outline-hidden"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-xl shadow-sm group-hover:bg-blue-100 transition-colors">
                <span aria-hidden="true">{seasonalEmoji}</span>
              </div>
              <div className="leading-tight">
                <span className="text-base font-bold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                  Mi Calendario
                </span>
                <span className="hidden sm:block text-[11px] text-slate-500 font-medium">
                  Cumpleaños y Vacaciones
                </span>
              </div>
            </button>
          </div>

          {/* ZONE 2: NAVIGATION LINKS (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const isAdminTab = item.id === 'admin';

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap shrink-0 ${
                    isActive
                      ? isAdminTab
                        ? 'bg-amber-50 text-amber-900 font-semibold shadow-xs'
                        : 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      isActive
                        ? isAdminTab
                          ? 'text-amber-700'
                          : 'text-blue-600'
                        : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* ZONE 3: ACTIONS & USER PROFILE */}
          <div className="flex items-center gap-2.5 shrink-0">
            {currentUser && (
              <button
                onClick={onRequestVacation}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-xs shadow-blue-600/20 transition-all whitespace-nowrap"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Solicitar vacaciones</span>
              </button>
            )}

            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 transition-colors"
                  aria-expanded={userDropdownOpen}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-xs shrink-0"
                    style={{ backgroundColor: currentUser.color }}
                  >
                    {currentUser.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden sm:flex flex-col text-left leading-tight">
                    <span className="text-xs font-semibold text-slate-800">{currentUser.nombre}</span>
                    <span className="text-[10px] text-slate-500 capitalize">
                      {currentUser.rol === 'admin' ? 'Administrador' : 'Colaborador'}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-2"
                    onMouseLeave={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-3.5 py-2 border-b border-slate-100">
                      <p className="text-xs font-medium text-slate-500">Sesión actual</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div
                          className="w-3.5 h-3.5 rounded-full"
                          style={{ backgroundColor: currentUser.color }}
                        />
                        <span className="text-sm font-semibold text-slate-900">{currentUser.nombre}</span>
                      </div>
                    </div>

                    <div className="px-2 py-1">
                      <p className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Cambiar de compañero
                      </p>
                      <div className="max-h-36 overflow-y-auto space-y-0.5">
                        {allUsers
                          .filter((u) => u.id_usuario !== currentUser.id_usuario && u.estado === 'activo')
                          .map((u) => (
                            <button
                              key={u.id_usuario}
                              onClick={() => {
                                switchUser(u.id_usuario);
                                setUserDropdownOpen(false);
                              }}
                              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded-lg text-left transition-colors"
                            >
                              <div
                                className="w-4 h-4 rounded-full text-white flex items-center justify-center text-[9px] font-bold"
                                style={{ backgroundColor: u.color }}
                              >
                                {u.nombre.charAt(0)}
                              </div>
                              <span className="truncate">{u.nombre}</span>
                              {u.rol === 'admin' && (
                                <span className="ml-auto text-[10px] text-amber-700 font-medium">Admin</span>
                              )}
                            </button>
                          ))}
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-1 mt-1 px-1">
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onOpenRegister();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded-lg text-left transition-colors"
                      >
                        <PlusCircle className="w-3.5 h-3.5 text-slate-500" />
                        <span>Registrar nuevo usuario</span>
                      </button>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg text-left transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Cerrar sesión</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenLogin}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-lg transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Ingresar</span>
                </button>
                <button
                  onClick={onOpenRegister}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  <span>Registrarme</span>
                </button>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Abrir menú"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2 animate-in slide-in-from-top-2">
          {currentUser && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onRequestVacation();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 mb-3 text-sm font-semibold text-white bg-blue-600 rounded-xl shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Solicitar vacaciones</span>
            </button>
          )}

          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const isAdminTab = item.id === 'admin';

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                    isActive
                      ? isAdminTab
                        ? 'bg-amber-50 text-amber-900 font-semibold'
                        : 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      isActive
                        ? isAdminTab
                          ? 'text-amber-700'
                          : 'text-blue-600'
                        : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};
