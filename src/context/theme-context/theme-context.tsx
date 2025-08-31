import { createContext } from 'react';
import { emptyFn } from '@/lib/utils';
import type { Theme, EffectiveTheme } from '@/lib/types';
export type { Theme, EffectiveTheme };

export interface ThemeContext {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    effectiveTheme: EffectiveTheme;
}

export const ThemeContext = createContext<ThemeContext>({
    theme: 'system',
    setTheme: emptyFn,
    effectiveTheme: 'light',
});
