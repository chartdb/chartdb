import { createContext } from 'react';
import { emptyFn } from '@/lib/utils';
import type { Theme } from '../theme-context/theme-context';
import { LLMProvider } from '@/llms/providers';

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

    buckleWaitlistOpened: boolean;
    setBuckleWaitlistOpened: (githubRepoOpened: boolean) => void;

    buckleDialogLastOpen: number;
    setBuckleDialogLastOpen: (lastOpen: number) => void;

    showDependenciesOnCanvas: boolean;
    setShowDependenciesOnCanvas: (showDependenciesOnCanvas: boolean) => void;

    showMiniMapOnCanvas: boolean;
    setShowMiniMapOnCanvas: (showMiniMapOnCanvas: boolean) => void;

    ollamaAvailableModels: string[];
    setOllamaAvailableModels: (models: string[]) => void;

    ollamaSelectedModel: string;
    setOllamaSelectedModel: (modelName: string) => void;

    llmProvider: LLMProvider;
    setLLMProvider: (provider: LLMProvider) => void;
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

    buckleWaitlistOpened: false,
    setBuckleWaitlistOpened: emptyFn,

    buckleDialogLastOpen: 0,
    setBuckleDialogLastOpen: emptyFn,

    showDependenciesOnCanvas: false,
    setShowDependenciesOnCanvas: emptyFn,

    showMiniMapOnCanvas: false,
    setShowMiniMapOnCanvas: emptyFn,

    ollamaAvailableModels: [],
    setOllamaAvailableModels: emptyFn,

    ollamaSelectedModel: ``,
    setOllamaSelectedModel: emptyFn,

    llmProvider: LLMProvider.None,
    setLLMProvider: emptyFn,
});
