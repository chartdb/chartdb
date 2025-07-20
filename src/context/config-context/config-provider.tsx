import React, { useEffect } from 'react';
import { ConfigContext } from './config-context';

import { useStorage } from '@/hooks/use-storage';
import type { ChartDBConfig } from '@/lib/domain/config';

export const ConfigProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const { getConfig, updateConfig: updateDataConfig } = useStorage();
    const [config, setConfig] = React.useState<ChartDBConfig | undefined>();

    useEffect(() => {
        const loadConfig = async () => {
            const config = await getConfig();
            setConfig(config);
        };

        loadConfig();
    }, [getConfig]);

    const updateConfig: ConfigContext['updateConfig'] = async ({
        config,
        updateFn,
    }) => {
        const promise = new Promise<void>((resolve) => {
            setConfig((prevConfig) => {
                let baseConfig: ChartDBConfig = { defaultDiagramId: '' };
                if (prevConfig) {
                    baseConfig = prevConfig;
                }

                const updatedConfig = updateFn
                    ? updateFn(baseConfig)
                    : { ...baseConfig, ...config };

                updateDataConfig(updatedConfig).then(() => {
                    resolve();
                });
                return updatedConfig;
            });
        });

        return promise;
    };

    const getHiddenTablesForDiagram = (diagramId: string): string[] => {
        return config?.hiddenTablesByDiagram?.[diagramId] ?? [];
    };

    const setHiddenTablesForDiagram = async (
        diagramId: string,
        hiddenTableIds: string[]
    ): Promise<void> => {
        return updateConfig({
            updateFn: (currentConfig) => ({
                ...currentConfig,
                hiddenTablesByDiagram: {
                    ...currentConfig.hiddenTablesByDiagram,
                    [diagramId]: hiddenTableIds,
                },
            }),
        });
    };

    const hideTableForDiagram = async (
        diagramId: string,
        tableId: string
    ): Promise<void> => {
        return updateConfig({
            updateFn: (currentConfig) => {
                const currentHiddenTables =
                    currentConfig.hiddenTablesByDiagram?.[diagramId] ?? [];
                if (currentHiddenTables.includes(tableId)) {
                    return currentConfig; // Already hidden, no change needed
                }

                return {
                    ...currentConfig,
                    hiddenTablesByDiagram: {
                        ...currentConfig.hiddenTablesByDiagram,
                        [diagramId]: [...currentHiddenTables, tableId],
                    },
                };
            },
        });
    };

    const unhideTableForDiagram = async (
        diagramId: string,
        tableId: string
    ): Promise<void> => {
        return updateConfig({
            updateFn: (currentConfig) => {
                const currentHiddenTables =
                    currentConfig.hiddenTablesByDiagram?.[diagramId] ?? [];
                const filteredTables = currentHiddenTables.filter(
                    (id) => id !== tableId
                );

                if (filteredTables.length === currentHiddenTables.length) {
                    return currentConfig; // Not hidden, no change needed
                }

                return {
                    ...currentConfig,
                    hiddenTablesByDiagram: {
                        ...currentConfig.hiddenTablesByDiagram,
                        [diagramId]: filteredTables,
                    },
                };
            },
        });
    };

    return (
        <ConfigContext.Provider
            value={{
                config,
                updateConfig,
                getHiddenTablesForDiagram,
                setHiddenTablesForDiagram,
                hideTableForDiagram,
                unhideTableForDiagram,
            }}
        >
            {children}
        </ConfigContext.Provider>
    );
};
