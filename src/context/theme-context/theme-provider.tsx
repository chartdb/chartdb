import React, { useEffect, useState, useCallback } from 'react';
import type { EffectiveTheme } from './theme-context';
import { ThemeContext } from './theme-context';
import { useMediaQuery } from 'react-responsive';
import { useLocalConfig } from '@/hooks/use-local-config';
import { useHotkeys } from 'react-hotkeys-hook';
import {
    KeyboardShortcutAction,
    keyboardShortcutsForOS,
} from '../keyboard-shortcuts-context/keyboard-shortcuts';

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

    const handleThemeToggle = useCallback(() => {
        if (theme === 'system') {
            setTheme(effectiveTheme === 'dark' ? 'light' : 'dark');
        } else {
            setTheme(theme === 'dark' ? 'light' : 'dark');
        }
    }, [theme, effectiveTheme, setTheme]);

    useHotkeys(
        keyboardShortcutsForOS[KeyboardShortcutAction.TOGGLE_THEME]
            .keyCombination,
        handleThemeToggle,
        {
            preventDefault: true,
            enableOnFormTags: true,
        },
        [handleThemeToggle]
    );

    return (
        <ThemeContext.Provider value={{ theme, setTheme, effectiveTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
