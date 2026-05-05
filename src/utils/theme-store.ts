import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ThemeColor = 'orange' | 'blue' | 'rose' | 'violet' | 'green' | 'amber' | 'cyan' | 'pink' | 'emerald' | 'indigo' | 'cherry' | 'solid-blue' | 'solid-zinc' | 'solid-rose' | 'solid-green' | 'solid-orange';

/**
 * Each theme has a gradient pair (from → to) used for:
 * - Buttons (default variant)
 * - Sidebar active pill
 * - Badges
 * - Any element using var(--gradient-from) / var(--gradient-to)
 */
const THEME_PALETTES: Record<ThemeColor, {
  primary: string;
  ring: string;
  gradientFrom: string;
  gradientTo: string;
  sidebarFrom: string;
  sidebarVia: string;
  sidebarTo: string;
  bubbleFrom: string;
  bubbleTo: string;
}> = {
  orange:  { primary: '#f97316', ring: '#f97316', gradientFrom: '#f97316', gradientTo: '#06b6d4', sidebarFrom: '#f97316', sidebarVia: '#06b6d4', sidebarTo: '#06b6d4', bubbleFrom: '#c85c12', bubbleTo: '#0592aa' },
  blue:    { primary: '#2563eb', ring: '#2563eb', gradientFrom: '#2563eb', gradientTo: '#06b6d4', sidebarFrom: '#2563eb', sidebarVia: '#38bdf8', sidebarTo: '#06b6d4', bubbleFrom: '#1d4fc2', bubbleTo: '#0592aa' },
  rose:    { primary: '#e11d48', ring: '#e11d48', gradientFrom: '#e11d48', gradientTo: '#f97316', sidebarFrom: '#e11d48', sidebarVia: '#fb7185', sidebarTo: '#f97316', bubbleFrom: '#b4183a', bubbleTo: '#c85c12' },
  violet:  { primary: '#7c3aed', ring: '#7c3aed', gradientFrom: '#7c3aed', gradientTo: '#ec4899', sidebarFrom: '#7c3aed', sidebarVia: '#a78bfa', sidebarTo: '#ec4899', bubbleFrom: '#6330be', bubbleTo: '#bd3a7a' },
  green:   { primary: '#16a34a', ring: '#16a34a', gradientFrom: '#16a34a', gradientTo: '#06b6d4', sidebarFrom: '#16a34a', sidebarVia: '#34d399', sidebarTo: '#06b6d4', bubbleFrom: '#12823b', bubbleTo: '#0592aa' },
  amber:   { primary: '#d97706', ring: '#d97706', gradientFrom: '#d97706', gradientTo: '#f97316', sidebarFrom: '#d97706', sidebarVia: '#fbbf24', sidebarTo: '#f97316', bubbleFrom: '#ae5f05', bubbleTo: '#c85c12' },
  cyan:    { primary: '#0891b2', ring: '#0891b2', gradientFrom: '#0891b2', gradientTo: '#2563eb', sidebarFrom: '#0891b2', sidebarVia: '#22d3ee', sidebarTo: '#2563eb', bubbleFrom: '#07748e', bubbleTo: '#1d4fc2' },
  pink:    { primary: '#db2777', ring: '#db2777', gradientFrom: '#db2777', gradientTo: '#7c3aed', sidebarFrom: '#db2777', sidebarVia: '#f472b6', sidebarTo: '#7c3aed', bubbleFrom: '#af1f5f', bubbleTo: '#6330be' },
  emerald: { primary: '#059669', ring: '#059669', gradientFrom: '#059669', gradientTo: '#0891b2', sidebarFrom: '#059669', sidebarVia: '#34d399', sidebarTo: '#0891b2', bubbleFrom: '#047854', bubbleTo: '#07748e' },
  indigo:  { primary: '#4f46e5', ring: '#4f46e5', gradientFrom: '#4f46e5', gradientTo: '#06b6d4', sidebarFrom: '#4f46e5', sidebarVia: '#818cf8', sidebarTo: '#06b6d4', bubbleFrom: '#3f38b7', bubbleTo: '#0592aa' },
  cherry:  { primary: '#be123c', ring: '#be123c', gradientFrom: '#be123c', gradientTo: '#d97706', sidebarFrom: '#be123c', sidebarVia: '#fb7185', sidebarTo: '#d97706', bubbleFrom: '#980e30', bubbleTo: '#ae5f05' },
  
  // Solid Colors
  'solid-blue':    { primary: '#2563eb', ring: '#2563eb', gradientFrom: '#2563eb', gradientTo: '#2563eb', sidebarFrom: '#2563eb', sidebarVia: '#2563eb', sidebarTo: '#2563eb', bubbleFrom: '#1d4ed8', bubbleTo: '#1d4ed8' },
  'solid-zinc':    { primary: '#52525b', ring: '#52525b', gradientFrom: '#52525b', gradientTo: '#52525b', sidebarFrom: '#52525b', sidebarVia: '#52525b', sidebarTo: '#52525b', bubbleFrom: '#3f3f46', bubbleTo: '#3f3f46' },
  'solid-rose':    { primary: '#e11d48', ring: '#e11d48', gradientFrom: '#e11d48', gradientTo: '#e11d48', sidebarFrom: '#e11d48', sidebarVia: '#e11d48', sidebarTo: '#e11d48', bubbleFrom: '#be123c', bubbleTo: '#be123c' },
  'solid-green':   { primary: '#16a34a', ring: '#16a34a', gradientFrom: '#16a34a', gradientTo: '#16a34a', sidebarFrom: '#16a34a', sidebarVia: '#16a34a', sidebarTo: '#16a34a', bubbleFrom: '#15803d', bubbleTo: '#15803d' },
  'solid-orange':  { primary: '#f97316', ring: '#f97316', gradientFrom: '#f97316', gradientTo: '#f97316', sidebarFrom: '#f97316', sidebarVia: '#f97316', sidebarTo: '#f97316', bubbleFrom: '#c2410c', bubbleTo: '#c2410c' },
};

interface ThemeColorState {
  themeColor: ThemeColor;
  setThemeColor: (color: ThemeColor) => void;
}

function applyThemeColor(color: ThemeColor) {
  const palette = THEME_PALETTES[color];
  if (!palette) return;
  const root = document.documentElement;
  root.style.setProperty('--primary', palette.primary);
  root.style.setProperty('--ring', palette.ring);
  root.style.setProperty('--gradient-from', palette.gradientFrom);
  root.style.setProperty('--gradient-to', palette.gradientTo);
  root.style.setProperty('--sidebar-active-from', palette.sidebarFrom);
  root.style.setProperty('--sidebar-active-via', palette.sidebarVia);
  root.style.setProperty('--sidebar-active-to', palette.sidebarTo);
  root.style.setProperty('--chat-bubble-from', palette.bubbleFrom);
  root.style.setProperty('--chat-bubble-to', palette.bubbleTo);
  root.setAttribute('data-theme-color', color);
}

export const useThemeColorStore = create<ThemeColorState>()(
  persist(
    (set) => ({
      themeColor: 'solid-blue',
      setThemeColor: (color) => {
        applyThemeColor(color);
        set({ themeColor: color });
      },
    }),
    {
      name: 'theme-color',
      onRehydrateStorage: () => (state) => {
        if (state?.themeColor) {
          applyThemeColor(state.themeColor);
        }
      },
    }
  )
);

export { THEME_PALETTES };
export type { ThemeColor };
