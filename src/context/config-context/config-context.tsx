import { createContext } from 'react';
import { emptyFn } from '@/lib/utils';
import type { ChartDBConfig } from '@/lib/domain/config';

export interface ConfigContext {
    config?: ChartDBConfig;
    updateConfig: (params: {
        config?: Partial<ChartDBConfig>;
        updateFn?: (config: ChartDBConfig) => ChartDBConfig;
    }) => Promise<void>;
    getHiddenTablesForDiagram: (diagramId: string) => string[];
    setHiddenTablesForDiagram: (
        diagramId: string,
        hiddenTableIds: string[]
    ) => Promise<void>;
    hideTableForDiagram: (diagramId: string, tableId: string) => Promise<void>;
    unhideTableForDiagram: (
        diagramId: string,
        tableId: string
    ) => Promise<void>;
}

export const ConfigContext = createContext<ConfigContext>({
    config: undefined,
    updateConfig: emptyFn,
    getHiddenTablesForDiagram: () => [],
    setHiddenTablesForDiagram: emptyFn,
    hideTableForDiagram: emptyFn,
    unhideTableForDiagram: emptyFn,
});
