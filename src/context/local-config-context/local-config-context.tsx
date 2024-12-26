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

    // Placeholder for future implementation
    'feature/show-hide-relationships': boolean; // Corrected syntax for placeholder

    buckleWaitlistOpened: boolean;
    setBuckleWaitlistOpened: (buckleWaitlistOpened: boolean) => void;

    buckleDialogLastOpen: number;
    setBuckleDialogLastOpen: (lastOpen: number) => void;

    // Placeholder for future implementation
    main: boolean; // Corrected syntax for placeholder

    showDependenciesOnCanvas: boolean;
    setShowDependenciesOnCanvas: (showDependenciesOnCanvas: boolean) => void;

    // Add these two new properties
    showRelationshipsOnCanvas: boolean;
    setShowRelationshipsOnCanvas: (showRelationshipsOnCanvas: boolean) => void;
}

export const LocalConfigContext = createContext<LocalConfigContext>({
    theme: 'system',
    setTheme: emptyFn,
    scrollAction: 'pan',
    setScrollAction: emptyFn,
    schemasFilter: {},
    setSchemasFilter: emptyFn,
    showCardinality: false,
    setShowCardinality: emptyFn,
    hideMultiSchemaNotification: false,
    setHideMultiSchemaNotification: emptyFn,
    githubRepoOpened: false,
    setGithubRepoOpened: emptyFn,
    starUsDialogLastOpen: 0,
    setStarUsDialogLastOpen: emptyFn,

    // Placeholder for future implementation
    'feature/show-hide-relationships': false, // Default value for placeholder

    buckleWaitlistOpened: false,
    setBuckleWaitlistOpened: emptyFn,

    buckleDialogLastOpen: 0,
    setBuckleDialogLastOpen: emptyFn,

    // Placeholder for future implementation
    main: false, // Default value for placeholder

    showDependenciesOnCanvas: false,
    setShowDependenciesOnCanvas: emptyFn,

    // Add default values for the new properties
    showRelationshipsOnCanvas: false,
    setShowRelationshipsOnCanvas: emptyFn,
});
