import { createContext } from 'react';
import { emptyFn } from '@/lib/utils';
import type { Theme } from '../theme-context/theme-context';

export type ScrollAction = 'pan' | 'zoom';

export type SchemasFilter = Record<string, string[]>;

export interface LocalConfigContext {
    theme: Theme;
    setTheme: (theme: Theme) => void;

    scrollAction: ScrollAction;
    setScrollAction: (action: ScrollAction) => void;

    schemasFilter: SchemasFilter;
    setSchemasFilter: React.Dispatch<React.SetStateAction<SchemasFilter>>;

    showCardinality: boolean;
    setShowCardinality: (showCardinality: boolean) => void;

    hideMultiSchemaNotification: boolean;
    setHideMultiSchemaNotification: (
        hideMultiSchemaNotification: boolean
    ) => void;

    githubRepoOpened: boolean;
    setGithubRepoOpened: (githubRepoOpened: boolean) => void;

    starUsDialogLastOpen: number;
    setStarUsDialogLastOpen: (lastOpen: number) => void;

    showDependenciesOnCanvas: boolean;
    setShowDependenciesOnCanvas: (showDependenciesOnCanvas: boolean) => void;

    showMiniMapOnCanvas: boolean;
    setShowMiniMapOnCanvas: (showMiniMapOnCanvas: boolean) => void;
}

export const LocalConfigContext = createContext<LocalConfigContext>({
    theme: 'system',
    setTheme: emptyFn,

    scrollAction: 'pan',
    setScrollAction: emptyFn,

    schemasFilter: {},
    setSchemasFilter: emptyFn,

    showCardinality: true,
    setShowCardinality: emptyFn,

    hideMultiSchemaNotification: false,
    setHideMultiSchemaNotification: emptyFn,

    githubRepoOpened: false,
    setGithubRepoOpened: emptyFn,

    starUsDialogLastOpen: 0,
    setStarUsDialogLastOpen: emptyFn,

    showDependenciesOnCanvas: false,
    setShowDependenciesOnCanvas: emptyFn,

    showMiniMapOnCanvas: false,
    setShowMiniMapOnCanvas: emptyFn,
});
