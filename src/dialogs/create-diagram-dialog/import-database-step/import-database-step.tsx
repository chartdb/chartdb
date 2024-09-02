import React, { useCallback, useState } from 'react';
import { Button } from '@/components/button/button';
import {
    DialogClose,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/dialog/dialog';
import { ToggleGroup, ToggleGroupItem } from '@/components/toggle/toggle-group';
import { DatabaseType } from '@/lib/domain/database-type';
import { databaseSecondaryLogoMap } from '@/lib/databases';
import { CodeSnippet } from '@/components/code-snippet/code-snippet';
import { Textarea } from '@/components/textarea/textarea';
import { importMetadataScripts } from '@/lib/data/import-metadata/scripts/scripts';
import {
    DatabaseEdition,
    databaseEditionToImageMap,
    databaseEditionToLabelMap,
    databaseTypeToEditionMap,
} from '@/lib/domain/database-edition';
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from '@/components/avatar/avatar';
import { CreateDiagramDialogStep } from '../create-diagram-dialog-step';
import { SSMSInfo } from './ssms-info/ssms-info';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsList, TabsTrigger } from '@/components/tabs/tabs';
import {
    DatabaseClient,
    databaseClientToLabelMap,
    databaseTypeToClientsMap,
} from '@/lib/domain/database-clients';

export interface ImportDatabaseStepProps {
    setStep: React.Dispatch<React.SetStateAction<CreateDiagramDialogStep>>;
    createNewDiagram: () => void;
    scriptResult: string;
    setScriptResult: React.Dispatch<React.SetStateAction<string>>;
    databaseType: DatabaseType;
    databaseEdition?: DatabaseEdition;
    setDatabaseEdition: React.Dispatch<
        React.SetStateAction<DatabaseEdition | undefined>
    >;
    errorMessage: string;
}

export const ImportDatabaseStep: React.FC<ImportDatabaseStepProps> = ({
    setScriptResult,
    setStep,
    scriptResult,
    createNewDiagram,
    databaseType,
    databaseEdition,
    setDatabaseEdition,
    errorMessage,
}) => {
    const databaseClients = databaseTypeToClientsMap[databaseType];
    const [databaseClient, setDatabaseClient] = useState<
        DatabaseClient | undefined
    >();
    const { t } = useTranslation();
    const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            const inputValue = e.target.value;
            setScriptResult(inputValue);
        },
        [setScriptResult]
    );

    const renderHeader = useCallback(() => {
        return (
            <DialogHeader>
                <DialogTitle>
                    {t('new_diagram_dialog.import_database.title')}
                </DialogTitle>
            </DialogHeader>
        );
    }, [t]);

    const renderContent = useCallback(() => {
        return (
            <div className="flex w-full flex-1 flex-col gap-6">
                {databaseTypeToEditionMap[databaseType].length > 0 ? (
                    <div className="flex flex-col gap-1 md:flex-row">
                        <p className="text-sm leading-6 text-muted-foreground">
                            {t(
                                'new_diagram_dialog.import_database.database_edition'
                            )}
                        </p>
                        <ToggleGroup
                            type="single"
                            className="ml-1 gap-2"
                            value={
                                !databaseEdition ? 'regular' : databaseEdition
                            }
                            onValueChange={(value) => {
                                setDatabaseEdition(
                                    value === 'regular'
                                        ? undefined
                                        : (value as DatabaseEdition)
                                );
                            }}
                        >
                            <ToggleGroupItem
                                value="regular"
                                variant="outline"
                                className="h-6 gap-1 p-0 px-2 shadow-none"
                            >
                                <Avatar className="size-4 rounded-none">
                                    <AvatarImage
                                        src={
                                            databaseSecondaryLogoMap[
                                                databaseType
                                            ]
                                        }
                                        alt="Regular"
                                    />
                                    <AvatarFallback>Regular</AvatarFallback>
                                </Avatar>
                                Regular
                            </ToggleGroupItem>
                            {databaseTypeToEditionMap[databaseType].map(
                                (edition) => (
                                    <ToggleGroupItem
                                        value={edition}
                                        key={edition}
                                        variant="outline"
                                        className="h-6 gap-1 p-0 px-2 shadow-none"
                                    >
                                        <Avatar className="size-4">
                                            <AvatarImage
                                                src={
                                                    databaseEditionToImageMap[
                                                        edition
                                                    ]
                                                }
                                                alt={
                                                    databaseEditionToLabelMap[
                                                        edition
                                                    ]
                                                }
                                            />
                                            <AvatarFallback>
                                                {
                                                    databaseEditionToLabelMap[
                                                        edition
                                                    ]
                                                }
                                            </AvatarFallback>
                                        </Avatar>
                                        {databaseEditionToLabelMap[edition]}
                                    </ToggleGroupItem>
                                )
                            )}
                        </ToggleGroup>
                    </div>
                ) : null}
                <div className="flex flex-col gap-1">
                    <div className="flex flex-col gap-1 text-sm text-muted-foreground md:flex-row md:justify-between">
                        <div>
                            1. {t('new_diagram_dialog.import_database.step_1')}
                        </div>
                        {databaseType === DatabaseType.SQL_SERVER && (
                            <SSMSInfo />
                        )}
                    </div>
                    {databaseTypeToClientsMap[databaseType].length > 0 ? (
                        <Tabs
                            value={
                                !databaseClient ? 'dbclient' : databaseClient
                            }
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
                                className="max-h-40 w-full"
                                code={importMetadataScripts[databaseType]({
                                    databaseEdition,
                                    databaseClient,
                                })}
                                language={databaseClient ? 'bash' : 'sql'}
                            />
                        </Tabs>
                    ) : (
                        <CodeSnippet
                            className="max-h-40 w-full"
                            code={importMetadataScripts[databaseType]({
                                databaseEdition,
                            })}
                        />
                    )}
                </div>
                <div className="flex h-48 flex-col gap-1">
                    <p className="text-sm text-muted-foreground">
                        2. {t('new_diagram_dialog.import_database.step_2')}
                    </p>
                    <Textarea
                        className="w-full flex-1 rounded-md bg-muted p-2 text-sm"
                        placeholder={t(
                            'new_diagram_dialog.import_database.script_results_placeholder'
                        )}
                        value={scriptResult}
                        onChange={handleInputChange}
                    />
                    {errorMessage && (
                        <p className="mt-2 text-sm text-red-700">
                            {errorMessage}
                        </p>
                    )}
                </div>
            </div>
        );
    }, [
        databaseEdition,
        databaseType,
        errorMessage,
        handleInputChange,
        scriptResult,
        setDatabaseEdition,
        databaseClients,
        databaseClient,
        t,
    ]);

    const renderFooter = useCallback(() => {
        return (
            <DialogFooter className="mt-4 flex !justify-between gap-2">
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() =>
                            setStep(CreateDiagramDialogStep.SELECT_DATABASE)
                        }
                    >
                        {t('new_diagram_dialog.back')}
                    </Button>
                </div>
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:space-x-2">
                    <DialogClose asChild>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={createNewDiagram}
                        >
                            {t('new_diagram_dialog.empty_diagram')}
                        </Button>
                    </DialogClose>
                    <DialogClose asChild>
                        <Button
                            type="button"
                            variant="default"
                            disabled={
                                scriptResult.trim().length === 0 ||
                                errorMessage.length > 0
                            }
                            onClick={createNewDiagram}
                        >
                            {t('new_diagram_dialog.import')}
                        </Button>
                    </DialogClose>
                </div>
            </DialogFooter>
        );
    }, [createNewDiagram, errorMessage.length, scriptResult, setStep, t]);

    return (
        <>
            {renderHeader()}
            {renderContent()}
            {renderFooter()}
        </>
    );
};
