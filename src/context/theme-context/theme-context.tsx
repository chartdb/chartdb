import { createContext } from 'react';
import { emptyFn } from '@/lib/utils';

export type Theme = 'light' | 'dark' | 'system';
export type EffectiveTheme = Exclude<Theme, 'system'>;

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
