/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SeasonalTheme {
  monthIndex: number; // 0-11
  monthName: string;
  themeName: string;
  tagline: string;
  emoji: string;
  primaryTone: string;
  headerGradient: string;
  cardAccent: string;
  badgeBg: string;
  badgeText: string;
  decorativeElements: string[];
  bannerPattern: string;
}

export const SEASONAL_THEMES: Record<number, SeasonalTheme> = {
  0: {
    monthIndex: 0,
    monthName: 'Enero',
    themeName: 'Invierno y Año Nuevo',
    tagline: 'Comenzando un nuevo ciclo lleno de metas y propósitos',
    emoji: '❄️',
    primaryTone: 'from-blue-600 via-sky-600 to-indigo-700',
    headerGradient: 'bg-gradient-to-r from-blue-700 via-sky-600 to-blue-800',
    cardAccent: 'border-sky-200 bg-sky-50/50',
    badgeBg: 'bg-sky-100 text-sky-800 border-sky-300',
    badgeText: 'text-sky-700',
    decorativeElements: ['❄️', '✨', '🎆', '⛄', '⭐'],
    bannerPattern: 'radial-gradient(ellipse at top right, rgba(56, 189, 248, 0.15), transparent 70%)',
  },
  1: {
    monthIndex: 1,
    monthName: 'Febrero',
    themeName: 'Amistad y Compañerismo',
    tagline: 'Celebrando los lazos y el trabajo en equipo',
    emoji: '💖',
    primaryTone: 'from-blue-600 via-indigo-600 to-rose-600',
    headerGradient: 'bg-gradient-to-r from-blue-800 via-indigo-700 to-rose-600',
    cardAccent: 'border-rose-200 bg-rose-50/40',
    badgeBg: 'bg-rose-100 text-rose-800 border-rose-300',
    badgeText: 'text-rose-700',
    decorativeElements: ['💖', '🤝', '💌', '✨', '🎁'],
    bannerPattern: 'radial-gradient(ellipse at top right, rgba(244, 63, 94, 0.12), transparent 70%)',
  },
  2: {
    monthIndex: 2,
    monthName: 'Marzo',
    themeName: 'Primavera y Renovación',
    tagline: 'Florecen nuevas ideas y proyectos compartidos',
    emoji: '🌱',
    primaryTone: 'from-blue-600 via-teal-600 to-emerald-600',
    headerGradient: 'bg-gradient-to-r from-blue-700 via-teal-600 to-emerald-700',
    cardAccent: 'border-teal-200 bg-teal-50/40',
    badgeBg: 'bg-teal-100 text-teal-800 border-teal-300',
    badgeText: 'text-teal-700',
    decorativeElements: ['🌱', '🌿', '🦋', '☀️', '🌸'],
    bannerPattern: 'radial-gradient(ellipse at top right, rgba(20, 184, 166, 0.15), transparent 70%)',
  },
  3: {
    monthIndex: 3,
    monthName: 'Abril',
    themeName: 'Primavera y Alegría',
    tagline: 'Días luminosos y energía para seguir creciendo',
    emoji: '🌸',
    primaryTone: 'from-blue-600 via-sky-500 to-emerald-500',
    headerGradient: 'bg-gradient-to-r from-blue-700 via-sky-600 to-emerald-600',
    cardAccent: 'border-emerald-200 bg-emerald-50/40',
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    badgeText: 'text-emerald-700',
    decorativeElements: ['🌸', '🌷', '🎈', '☀️', '🍃'],
    bannerPattern: 'radial-gradient(ellipse at top right, rgba(16, 185, 129, 0.15), transparent 70%)',
  },
  4: {
    monthIndex: 4,
    monthName: 'Mayo',
    themeName: 'Flores y Homenajes',
    tagline: 'Tiempo de reconocer a quienes dan vida al equipo',
    emoji: '🌺',
    primaryTone: 'from-blue-700 via-indigo-600 to-pink-600',
    headerGradient: 'bg-gradient-to-r from-blue-800 via-indigo-600 to-pink-700',
    cardAccent: 'border-pink-200 bg-pink-50/40',
    badgeBg: 'bg-pink-100 text-pink-800 border-pink-300',
    badgeText: 'text-pink-700',
    decorativeElements: ['🌺', '💐', '🌻', '✨', '🌼'],
    bannerPattern: 'radial-gradient(ellipse at top right, rgba(236, 72, 153, 0.12), transparent 70%)',
  },
  5: {
    monthIndex: 5,
    monthName: 'Junio',
    themeName: 'Verano y Solsticio',
    tagline: 'Cierre del primer semestre y plenitud solar',
    emoji: '☀️',
    primaryTone: 'from-blue-600 via-cyan-600 to-amber-500',
    headerGradient: 'bg-gradient-to-r from-blue-700 via-cyan-600 to-amber-600',
    cardAccent: 'border-cyan-200 bg-cyan-50/40',
    badgeBg: 'bg-cyan-100 text-cyan-800 border-cyan-300',
    badgeText: 'text-cyan-700',
    decorativeElements: ['☀️', '🌊', '🕶️', '🌴', '⛵'],
    bannerPattern: 'radial-gradient(ellipse at top right, rgba(6, 182, 212, 0.15), transparent 70%)',
  },
  6: {
    monthIndex: 6,
    monthName: 'Julio',
    themeName: 'Vacaciones y Desconexión',
    tagline: 'Disfruta el descanso merecido y recarga energías',
    emoji: '🏖️',
    primaryTone: 'from-blue-700 via-sky-600 to-cyan-500',
    headerGradient: 'bg-gradient-to-r from-blue-800 via-sky-600 to-cyan-600',
    cardAccent: 'border-sky-200 bg-sky-50/50',
    badgeBg: 'bg-sky-100 text-sky-800 border-sky-300',
    badgeText: 'text-sky-700',
    decorativeElements: ['🏖️', '🌴', '🌊', '🍹', '✈️'],
    bannerPattern: 'radial-gradient(ellipse at top right, rgba(14, 165, 233, 0.16), transparent 70%)',
  },
  7: {
    monthIndex: 7,
    monthName: 'Agosto',
    themeName: 'Verano y Calidez',
    tagline: 'Aprovechando el calor y los planes al aire libre',
    emoji: '🌴',
    primaryTone: 'from-blue-700 via-indigo-600 to-amber-600',
    headerGradient: 'bg-gradient-to-r from-blue-800 via-indigo-700 to-amber-600',
    cardAccent: 'border-amber-200 bg-amber-50/40',
    badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
    badgeText: 'text-amber-700',
    decorativeElements: ['🌴', '🍉', '🏄‍♂️', '☀️', '🍧'],
    bannerPattern: 'radial-gradient(ellipse at top right, rgba(245, 158, 11, 0.14), transparent 70%)',
  },
  8: {
    monthIndex: 8,
    monthName: 'Septiembre',
    themeName: 'México y Fiestas Patrias',
    tagline: '¡Viva México! Orgullo patrio, tradición y convivencia',
    emoji: '🇲🇽',
    primaryTone: 'from-green-700 via-blue-800 to-red-700',
    headerGradient: 'bg-gradient-to-r from-emerald-800 via-blue-900 to-rose-800',
    cardAccent: 'border-emerald-200 bg-emerald-50/30',
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    badgeText: 'text-emerald-700',
    decorativeElements: ['🇲🇽', '🔔', '🎺', '🎉', '🎊'],
    bannerPattern: 'radial-gradient(ellipse at top right, rgba(16, 185, 129, 0.12), transparent 70%)',
  },
  9: {
    monthIndex: 9,
    monthName: 'Octubre',
    themeName: 'Halloween y Misticismo',
    tagline: 'Colores otoñales, misterio y noches estrelladas',
    emoji: '🎃',
    primaryTone: 'from-blue-900 via-purple-900 to-orange-700',
    headerGradient: 'bg-gradient-to-r from-slate-900 via-purple-900 to-orange-800',
    cardAccent: 'border-orange-200 bg-orange-50/40',
    badgeBg: 'bg-orange-100 text-orange-800 border-orange-300',
    badgeText: 'text-orange-700',
    decorativeElements: ['🎃', '🦇', '🍁', '🕯️', '🌙'],
    bannerPattern: 'radial-gradient(ellipse at top right, rgba(249, 115, 22, 0.15), transparent 70%)',
  },
  10: {
    monthIndex: 10,
    monthName: 'Noviembre',
    themeName: 'Día de Muertos y Tradición',
    tagline: 'Flores de cempasúchil, memoria y honra a nuestras raíces',
    emoji: '💀',
    primaryTone: 'from-indigo-950 via-purple-900 to-amber-700',
    headerGradient: 'bg-gradient-to-r from-indigo-950 via-purple-900 to-amber-800',
    cardAccent: 'border-purple-200 bg-purple-50/40',
    badgeBg: 'bg-purple-100 text-purple-800 border-purple-300',
    badgeText: 'text-purple-700',
    decorativeElements: ['💀', '🌼', '🕯️', '🪦', '🍞'],
    bannerPattern: 'radial-gradient(ellipse at top right, rgba(168, 85, 247, 0.15), transparent 70%)',
  },
  11: {
    monthIndex: 11,
    monthName: 'Diciembre',
    themeName: 'Navidad y Fin de Año',
    tagline: 'Paz, celebración y gratitud por lo compartido este año',
    emoji: '🎄',
    primaryTone: 'from-blue-900 via-indigo-900 to-emerald-800',
    headerGradient: 'bg-gradient-to-r from-blue-950 via-indigo-900 to-emerald-900',
    cardAccent: 'border-blue-200 bg-blue-50/40',
    badgeBg: 'bg-blue-100 text-blue-800 border-blue-300',
    badgeText: 'text-blue-700',
    decorativeElements: ['🎄', '⭐', '🎁', '❄️', '🔔'],
    bannerPattern: 'radial-gradient(ellipse at top right, rgba(59, 130, 246, 0.15), transparent 70%)',
  },
};

export function getSeasonalTheme(monthIndex: number): SeasonalTheme {
  const norm = ((monthIndex % 12) + 12) % 12;
  return SEASONAL_THEMES[norm] || SEASONAL_THEMES[0];
}
