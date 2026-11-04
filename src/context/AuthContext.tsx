/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Usuario } from '../types';
import { storage } from '../services/storageService';

interface AuthContextType {
  currentUser: Usuario | null;
  isAdmin: boolean;
  login: (nombre: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (nombre: string, color: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchUser: (userId: string) => void;
  refreshUser: () => void;
  allUsers: Usuario[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CURRENT_USER_KEY = 'mi_calendario_current_user_id';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
  const [allUsers, setAllUsers] = useState<Usuario[]>([]);

  const reloadUsers = () => {
    const users = storage.getUsers();
    setAllUsers(users);
    return users;
  };

  useEffect(() => {
    const users = reloadUsers();
    if (storage.getAppsScriptUrl()) {
      localStorage.removeItem(CURRENT_USER_KEY);
      setCurrentUser(null);
      const handleSharedData = () => {
        reloadUsers();
        localStorage.removeItem(CURRENT_USER_KEY);
        setCurrentUser(null);
      };
      window.addEventListener('mi-calendario-shared-data', handleSharedData);
      return () => window.removeEventListener('mi-calendario-shared-data', handleSharedData);
    }

    const savedUserId = localStorage.getItem(CURRENT_USER_KEY);
    
    if (savedUserId) {
      const found = users.find((u) => u.id_usuario === savedUserId && u.estado === 'activo');
      if (found) {
        setCurrentUser(found);
        return;
      }
    }

    // Default to Martin as specified in prompt: "El primer usuario será Martin."
    const martin = users.find((u) => u.nombre.toLowerCase() === 'martin');
    if (martin && martin.estado === 'activo') {
      setCurrentUser(martin);
      localStorage.setItem(CURRENT_USER_KEY, martin.id_usuario);
    } else if (users.length > 0 && users[0].estado === 'activo') {
      setCurrentUser(users[0]);
      localStorage.setItem(CURRENT_USER_KEY, users[0].id_usuario);
    }
  }, []);

  const login = async (nombre: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (storage.getAppsScriptUrl()) {
      return { success: false, error: 'El acceso público está en modo consulta; el inicio de sesión no está habilitado.' };
    }
    const users = reloadUsers();
    const cleanName = nombre.trim();
    const user = users.find((u) => u.nombre.toLowerCase() === cleanName.toLowerCase());

    if (!user) {
      return { success: false, error: 'Usuario no encontrado. Verifica el nombre o regístrate.' };
    }

    if (user.estado !== 'activo') {
      return { success: false, error: 'Este usuario se encuentra inactivo. Contacta al administrador.' };
    }

    if (!user.password_hash) {
      return { success: false, error: 'Esta cuenta no tiene contraseña configurada. Contacta al administrador.' };
    }

    // Password validation
    if (user.password_hash !== password) {
      return { success: false, error: 'Contraseña incorrecta. Inténtalo de nuevo.' };
    }

    setCurrentUser(user);
    localStorage.setItem(CURRENT_USER_KEY, user.id_usuario);
    storage.addAuditLog(user.nombre, 'INICIO_SESION', `Inicio de sesión exitoso`);
    return { success: true };
  };

  const register = async (nombre: string, color: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (storage.getAppsScriptUrl()) {
      return { success: false, error: 'El registro público no está habilitado en esta conexión.' };
    }
    try {
      const cleanName = nombre.trim();
      if (!cleanName) {
        return { success: false, error: 'Ingresa un nombre.' };
      }
      if (cleanName.includes(' ')) {
        return { success: false, error: 'Por favor ingresa un solo nombre (sin apellidos ni espacios).' };
      }
      if (!color) {
        return { success: false, error: 'Selecciona un color identificador.' };
      }
      if (!password || password.length < 4) {
        return { success: false, error: 'La contraseña debe tener al menos 4 caracteres.' };
      }

      const users = storage.getUsers();
      // First user registered is admin, subsequent are usuarios
      const role = users.length === 0 ? 'admin' : 'usuario';

      const newUser = storage.createUser({
        nombre: cleanName,
        color,
        password_hash: password,
        rol: role,
        estado: 'activo',
      });

      reloadUsers();
      setCurrentUser(newUser);
      localStorage.setItem(CURRENT_USER_KEY, newUser.id_usuario);
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al registrar usuario';
      return { success: false, error: msg };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(CURRENT_USER_KEY);
  };

  const switchUser = (userId: string) => {
    const users = reloadUsers();
    const target = users.find((u) => u.id_usuario === userId && u.estado === 'activo');
    if (target) {
      setCurrentUser(target);
      localStorage.setItem(CURRENT_USER_KEY, target.id_usuario);
    }
  };

  const refreshUser = () => {
    const users = reloadUsers();
    if (currentUser) {
      const updated = users.find((u) => u.id_usuario === currentUser.id_usuario);
      if (updated) setCurrentUser(updated);
    }
  };

  const isAdmin = currentUser?.rol === 'admin';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAdmin,
        login,
        register,
        logout,
        switchUser,
        refreshUser,
        allUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
