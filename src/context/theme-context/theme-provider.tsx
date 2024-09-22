import React, { useEffect, useState } from 'react';
import type { EffectiveTheme } from './theme-context';
import { ThemeContext } from './theme-context';
import { useMediaQuery } from 'react-responsive';
import { useLocalConfig } from '@/hooks/use-local-config';

export const ThemeProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const { theme, setTheme } = useLocalConfig();
    const isDarkSystemTheme = useMediaQuery({
        query: '(prefers-color-scheme: dark)',
    });

    const systemTheme = isDarkSystemTheme ? 'dark' : 'light';

    const [effectiveTheme, setEffectiveTheme] =
        useState<EffectiveTheme>(systemTheme);

    useEffect(() => {
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
