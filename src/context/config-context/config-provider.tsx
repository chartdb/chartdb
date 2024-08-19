import React, { useEffect } from 'react';
import { ConfigContext } from './config-context';

import { useData } from '@/hooks/use-data';
import { ChartDBConfig } from '@/lib/domain/config';

export const ConfigProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const { getConfig, updateConfig: updateDataConfig } = useData();
    const [config, setConfig] = React.useState<ChartDBConfig | undefined>();

    useEffect(() => {
        const loadConfig = async () => {
            const config = await getConfig();
            setConfig(config);
        };

        loadConfig();
    }, [getConfig]);

    const updateConfig: ConfigContext['updateConfig'] = async (
        config: Partial<ChartDBConfig>
    ) => {
        await updateDataConfig(config);
        setConfig((prevConfig) =>
            prevConfig
                ? { ...prevConfig, ...config }
                : { ...{ defaultDiagramId: '' }, ...config }
        );
    };

    return (
        <ConfigContext.Provider value={{ config, updateConfig }}>
            {children}
        </ConfigContext.Provider>
    );
};
