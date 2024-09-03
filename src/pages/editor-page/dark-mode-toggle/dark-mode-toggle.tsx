import { useTheme } from '@/hooks/use-theme';
import { Moon, Sun } from 'lucide-react';
import React from 'react';

const DarkModeToggle: React.FC = () => {
    const { theme, setTheme } = useTheme();

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    return (
        <button
            onClick={toggleTheme}
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
            {theme === 'light' ? <Moon /> : <Sun />}
        </button>
    );
};

export default DarkModeToggle;
