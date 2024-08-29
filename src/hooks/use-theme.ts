import { ThemeContext } from '@/context/theme-context/theme-context';
import { useContext } from 'react';

export const useTheme = () => useContext(ThemeContext);
