/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ColorOption {
  hex: string;
  name: string;
  bgLight: string;
  textColor: string;
  borderColor: string;
}

export const USER_COLOR_PALETTE: ColorOption[] = [
  {
    hex: '#2563EB',
    name: 'Azul Zafiro',
    bgLight: '#EFF6FF',
    textColor: '#1D4ED8',
    borderColor: '#93C5FD',
  },
  {
    hex: '#0D9488',
    name: 'Verde Esmeralda',
    bgLight: '#F0FDFA',
    textColor: '#0F766E',
    borderColor: '#99F6E4',
  },
  {
    hex: '#D97706',
    name: 'Ámbar Cálido',
    bgLight: '#FFFBEB',
    textColor: '#B45309',
    borderColor: '#FDE68A',
  },
  {
    hex: '#7C3AED',
    name: 'Violeta Real',
    bgLight: '#F5F3FF',
    textColor: '#6D28D9',
    borderColor: '#DDD6FE',
  },
  {
    hex: '#E11D48',
    name: 'Carmesí',
    bgLight: '#FFF1F2',
    textColor: '#BE123C',
    borderColor: '#FECDD3',
  },
  {
    hex: '#0891B2',
    name: 'Cian Océano',
    bgLight: '#ECFEFF',
    textColor: '#0E7490',
    borderColor: '#A5F3FC',
  },
  {
    hex: '#4F46E5',
    name: 'Índigo Profundo',
    bgLight: '#EEF2FF',
    textColor: '#4338CA',
    borderColor: '#C7D2FE',
  },
  {
    hex: '#16A34A',
    name: 'Verde Bosque',
    bgLight: '#F0FDF4',
    textColor: '#15803D',
    borderColor: '#BBF7D0',
  },
  {
    hex: '#C026D3',
    name: 'Fucsia Magenta',
    bgLight: '#FDF4FF',
    textColor: '#A21CAF',
    borderColor: '#F5D0FE',
  },
  {
    hex: '#EA580C',
    name: 'Naranja Fuego',
    bgLight: '#FFF7ED',
    textColor: '#C2410C',
    borderColor: '#FED7AA',
  },
  {
    hex: '#0284C7',
    name: 'Azul Celeste',
    bgLight: '#F0F9FF',
    textColor: '#0369A1',
    borderColor: '#BAE6FD',
  },
  {
    hex: '#9333EA',
    name: 'Púrpura Eléctrico',
    bgLight: '#FAF5FF',
    textColor: '#7E22CE',
    borderColor: '#E9D5FF',
  },
  {
    hex: '#059669',
    name: 'Menta Jade',
    bgLight: '#ECFDF5',
    textColor: '#047857',
    borderColor: '#A7F3D0',
  },
  {
    hex: '#64748B',
    name: 'Pizarra Grafito',
    bgLight: '#F8FAFC',
    textColor: '#334155',
    borderColor: '#CBD5E1',
  },
  {
    hex: '#DB2777',
    name: 'Rosa Intenso',
    bgLight: '#FDF2F8',
    textColor: '#BE185D',
    borderColor: '#FBCFE8',
  },
  {
    hex: '#4338CA',
    name: 'Azul Marino Real',
    bgLight: '#EEF2FF',
    textColor: '#3730A3',
    borderColor: '#C7D2FE',
  },
];

export function getColorOption(hex: string): ColorOption {
  const match = USER_COLOR_PALETTE.find((c) => c.hex.toLowerCase() === hex.toLowerCase());
  if (match) return match;
  return {
    hex,
    name: 'Personalizado',
    bgLight: '#F1F5F9',
    textColor: hex,
    borderColor: '#CBD5E1',
  };
}

export function isColorAvailable(hex: string, usedColors: string[], currentUserId?: string, userCurrentColor?: string): boolean {
  if (currentUserId && userCurrentColor && userCurrentColor.toLowerCase() === hex.toLowerCase()) {
    return true; // user can keep their existing color
  }
  return !usedColors.some((c) => c.toLowerCase() === hex.toLowerCase());
}
