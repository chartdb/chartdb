import { createContext } from 'react';
import { emptyFn } from '@/lib/utils';
import { Theme } from '../theme-context/theme-context';

export type ScrollAction = 'pan' | 'zoom';

export type SchemasFilter = Record<string, string[]>;

export interface LocalConfigContext {
    theme: Theme;
    setTheme: (theme: Theme) => void;

    scrollAction: ScrollAction;
    setScrollAction: (action: ScrollAction) => void;

    schemasFilter: SchemasFilter;
    setSchemasFilter: React.Dispatch<React.SetStateAction<SchemasFilter>>;
}

export const LocalConfigContext = createContext<LocalConfigContext>({
    theme: 'system',
    setTheme: emptyFn,

    scrollAction: 'pan',
    setScrollAction: emptyFn,

    schemasFilter: {},
    setSchemasFilter: emptyFn,
});
