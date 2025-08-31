import React, { useEffect, useMemo, useState } from 'react';
import { DatabaseType } from '@/lib/domain/database-type';
import { CodeSnippet } from '@/components/code-snippet/code-snippet';
import type { DatabaseEdition } from '@/lib/domain/database-edition';
import { SSMSInfo } from './ssms-info/ssms-info';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsList, TabsTrigger } from '@/components/tabs/tabs';
import type { DatabaseClient } from '@/lib/domain/database-clients';
import { minimizeQuery } from '@/lib/data/import-metadata/utils';
import {
    databaseClientToLabelMap,
    databaseTypeToClientsMap,
    databaseEditionToClientsMap,
} from '@/lib/domain/database-clients';
import type { ImportMetadataScripts } from '@/lib/data/import-metadata/scripts/scripts';

export interface SmartQueryInstructionsProps {
    databaseType: DatabaseType;
    databaseEdition?: DatabaseEdition;
    showSSMSInfoDialog: boolean;
    setShowSSMSInfoDialog: (show: boolean) => void;
}

export const SmartQueryInstructions: React.FC<SmartQueryInstructionsProps> = ({
    databaseType,
    databaseEdition,
    showSSMSInfoDialog,
    setShowSSMSInfoDialog,
}) => {
    const databaseClients = useMemo(
        () => [
            ...databaseTypeToClientsMap[databaseType],
            ...(databaseEdition
                ? databaseEditionToClientsMap[databaseEdition]
                : []),
        ],
        [databaseType, databaseEdition]
    );
    const [databaseClient, setDatabaseClient] = useState<
        DatabaseClient | undefined
    >();
    const { t } = useTranslation();
    const [importMetadataScripts, setImportMetadataScripts] =
        useState<ImportMetadataScripts | null>(null);

    const code = useMemo(
        () =>
            (databaseClients.length > 0
                ? importMetadataScripts?.[databaseType]?.({
                      databaseEdition,
                      databaseClient,
                  })
                : importMetadataScripts?.[databaseType]?.({
                      databaseEdition,
                  })) ?? '',
        [
            databaseType,
            databaseEdition,
            databaseClients,
            importMetadataScripts,
            databaseClient,
        ]
    );

    useEffect(() => {
        const loadScripts = async () => {
            const { importMetadataScripts } = await import(
                '@/lib/data/import-metadata/scripts/scripts'
            );
            setImportMetadataScripts(importMetadataScripts);
        };
        loadScripts();
    }, []);

    return (
        <>
            <div className="flex flex-col gap-1">
                <div className="flex flex-col gap-1 text-sm text-primary">
                    <div>
                        <span className="font-medium">1.</span>{' '}
                        {t('new_diagram_dialog.import_database.step_1')}
                    </div>
                    {databaseType === DatabaseType.SQL_SERVER && (
                        <SSMSInfo
                            open={showSSMSInfoDialog}
                            setOpen={setShowSSMSInfoDialog}
                        />
                    )}
                </div>
                {databaseClients.length > 0 ? (
                    <Tabs
                        value={!databaseClient ? 'dbclient' : databaseClient}
                        onValueChange={(value) => {
                            setDatabaseClient(
                                value === 'dbclient'
                                    ? undefined
                                    : (value as DatabaseClient)
                            );
                        }}
                    >
                        <div className="flex flex-1">
                            <TabsList className="h-8 justify-start rounded-none rounded-t-sm ">
                                <TabsTrigger
                                    value="dbclient"
                                    className="h-6 w-20"
                                >
                                    DB Client
                                </TabsTrigger>

                                {databaseClients?.map((client) => (
                                    <TabsTrigger
                                        key={client}
                                        value={client}
                                        className="h-6 !w-20"
                                    >
                                        {databaseClientToLabelMap[client]}
                                    </TabsTrigger>
                                )) ?? []}
                            </TabsList>
                        </div>
                        <CodeSnippet
                            className="h-40 w-full md:h-[200px]"
                            loading={!importMetadataScripts}
                            code={minimizeQuery(code)}
                            codeToCopy={code}
                            language={databaseClient ? 'shell' : 'sql'}
                        />
                    </Tabs>
                ) : (
                    <CodeSnippet
                        className="h-40 w-full flex-auto md:h-[200px]"
                        loading={!importMetadataScripts}
                        code={minimizeQuery(code)}
                        codeToCopy={code}
                        language="sql"
                    />
                )}
            </div>
            <div className="flex flex-col gap-1">
                <p className="text-sm text-primary">
                    <span className="font-medium">2.</span>{' '}
                    {t('new_diagram_dialog.import_database.step_2')}
                </p>
            </div>
        </>
    );
};
