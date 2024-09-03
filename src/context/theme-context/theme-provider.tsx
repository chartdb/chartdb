import React, { useEffect, useState } from 'react';
import { EffectiveThemeType, ThemeContext, ThemeType } from './theme-context';

const getSystemTheme = (): EffectiveThemeType => {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    }
    return 'light';
};

export const ThemeProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const [theme, setTheme] = useState<ThemeType>(() => {
        const savedTheme = localStorage.getItem('theme') as ThemeType | null;
        return savedTheme || 'system';
    });

    const [effectiveTheme, setEffectiveTheme] =
        useState<EffectiveThemeType>(getSystemTheme());

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleChange = () => {
            if (theme === 'system') {
                setEffectiveTheme(getSystemTheme());
            }
        };

        mediaQuery.addEventListener('change', handleChange);

        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme]);

    useEffect(() => {
        localStorage.setItem('theme', theme);
        if (theme === 'system') {
            setEffectiveTheme(getSystemTheme());
        } else {
            setEffectiveTheme(theme);
        }
    }, [theme]);

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
