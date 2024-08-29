import { createContext } from 'react';

type ThemeType = 'light' | 'dark' | 'system';

export interface ThemeContext {
    theme: ThemeType;
    setTheme: (theme: ThemeType) => void;
    effectiveTheme: 'light' | 'dark';
}

export const ThemeContext = createContext<ThemeContext>({
    theme: 'system',
    setTheme: () => {},
    effectiveTheme: 'light',
});
