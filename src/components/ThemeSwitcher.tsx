import React from 'react';
import { Check, Palette } from 'lucide-react';
import { APP_THEMES } from '../data/themes';
import type { AppThemeId } from '../types';

interface ThemeSwitcherProps {
  currentTheme: AppThemeId;
  onSelectTheme: (theme: AppThemeId) => void;
  compact?: boolean;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({
  currentTheme,
  onSelectTheme,
  compact = false,
}) => {
  return (
    <div
      className={
        compact
          ? 'space-y-2'
          : 'bg-surface rounded-[20px] border border-line px-4 py-3 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3'
      }
    >
      <div className="flex items-center gap-2 text-xs sm:text-sm font-display font-bold text-ink shrink-0">
        <Palette className="w-4 h-4 text-brand shrink-0" aria-hidden="true" />
        <span>لون التطبيق (5 ألوان):</span>
      </div>

      <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="اختر لون التطبيق">
        {APP_THEMES.map((t) => {
          const isSelected = currentTheme === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelectTheme(t.id)}
              className={`min-h-[40px] px-3 py-1.5 rounded-full border text-xs font-display font-bold inline-flex items-center gap-2 transition-all whitespace-nowrap shrink-0 ${
                isSelected
                  ? 'border-ink bg-surface-alt text-ink ring-2 ring-brand/40'
                  : 'border-line bg-surface text-ink-muted hover:text-ink hover:bg-surface-alt'
              }`}
            >
              <span
                className="w-4 h-4 rounded-full border border-black/15 flex items-center justify-center shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${t.swatchBg} 45%, ${t.swatchAccent} 100%)`,
                }}
                aria-hidden="true"
              >
                {isSelected && <Check className="w-2.5 h-2.5 text-white drop-shadow-xs" />}
              </span>
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
