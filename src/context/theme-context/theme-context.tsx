import { createContext } from 'react';
import { emptyFn } from '@/lib/utils';

export type ThemeType = 'light' | 'dark' | 'system';
export type EffectiveThemeType = Exclude<ThemeType, 'system'>;

export interface ThemeContext {
    theme: ThemeType;
    setTheme: (theme: ThemeType) => void;
    effectiveTheme: EffectiveThemeType;
}

export const ThemeContext = createContext<ThemeContext>({
    theme: 'system',
    setTheme: emptyFn,
    effectiveTheme: 'light',
});
