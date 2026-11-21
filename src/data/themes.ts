import type { AppThemeId } from '../types';

export interface AppThemeOption {
  id: AppThemeId;
  label: string;
  swatchBg: string;
  swatchAccent: string;
  metaThemeColor: string;
}

export const APP_THEMES: AppThemeOption[] = [
  {
    id: 'sunset',
    label: 'وردي مرجاني',
    swatchBg: '#FFE4EC',
    swatchAccent: '#E11D48',
    metaThemeColor: '#BE185D',
  },
  {
    id: 'ocean',
    label: 'أزرق سماوي',
    swatchBg: '#D6EEFF',
    swatchAccent: '#0284C7',
    metaThemeColor: '#0369A1',
  },
  {
    id: 'mint',
    label: 'أخضر نعناعي',
    swatchBg: '#D2F7E7',
    swatchAccent: '#0D9488',
    metaThemeColor: '#0F766E',
  },
  {
    id: 'lavender',
    label: 'بنفسجي ملكي',
    swatchBg: '#E9DDFD',
    swatchAccent: '#7C3AED',
    metaThemeColor: '#6D28D9',
  },
  {
    id: 'midnight',
    label: 'كحلي ليلي',
    swatchBg: '#0B1222',
    swatchAccent: '#38BDF8',
    metaThemeColor: '#0B1222',
  },
];

export const DEFAULT_THEME: AppThemeId = 'sunset';

export function isValidAppTheme(val: unknown): val is AppThemeId {
  return APP_THEMES.some((t) => t.id === val);
}
