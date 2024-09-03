import React, { useEffect, useState } from 'react';
import { EffectiveThemeType, ThemeContext, ThemeType } from './theme-context';
import { useMediaQuery } from 'react-responsive';

export const ThemeProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const [theme, setTheme] = useState<ThemeType>(() => {
        const savedTheme = localStorage.getItem('theme') as ThemeType | null;
        return savedTheme || 'system';
    });
    const isDarkSystemTheme = useMediaQuery({
        query: '(prefers-color-scheme: dark)',
    });

    const systemTheme = isDarkSystemTheme ? 'dark' : 'light';

    const [effectiveTheme, setEffectiveTheme] =
        useState<EffectiveThemeType>(systemTheme);

    useEffect(() => {
        localStorage.setItem('theme', theme);
        setEffectiveTheme(theme === 'system' ? systemTheme : theme);
    }, [theme, systemTheme]);

    useEffect(() => {
        if (effectiveTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [effectiveTheme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme, effectiveTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
