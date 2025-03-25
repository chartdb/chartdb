import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/button/button';
import {
    DialogClose,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogInternalContent,
    DialogTitle,
} from '@/components/dialog/dialog';
import { ToggleGroup, ToggleGroupItem } from '@/components/toggle/toggle-group';
import { DatabaseType } from '@/lib/domain/database-type';
import { databaseSecondaryLogoMap } from '@/lib/databases';
import { CodeSnippet } from '@/components/code-snippet/code-snippet';
import { Textarea } from '@/components/textarea/textarea';
import type { DatabaseEdition } from '@/lib/domain/database-edition';
import {
    databaseEditionToImageMap,
    databaseEditionToLabelMap,
    databaseTypeToEditionMap,
} from '@/lib/domain/database-edition';
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from '@/components/avatar/avatar';
import { SSMSInfo } from './ssms-info/ssms-info';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsList, TabsTrigger } from '@/components/tabs/tabs';
import type { DatabaseClient } from '@/lib/domain/database-clients';
import {
    databaseClientToLabelMap,
    databaseTypeToClientsMap,
    databaseEditionToClientsMap,
} from '@/lib/domain/database-clients';
import type { ImportMetadataScripts } from '@/lib/data/import-metadata/scripts/scripts';
import { ZoomableImage } from '@/components/zoomable-image/zoomable-image';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { Spinner } from '@/components/spinner/spinner';
import {
    fixMetadataJson,
    isStringMetadataJson,
} from '@/lib/data/import-metadata/utils';

const errorScriptOutputMessage =
    'Invalid JSON. Please correct it or contact us at chartdb.io@gmail.com for help.';

export interface ImportDatabaseProps {
    goBack?: () => void;
    onImport: () => void;
    onCreateEmptyDiagram?: () => void;
    scriptResult: string;
    setScriptResult: React.Dispatch<React.SetStateAction<string>>;
    databaseType: DatabaseType;
    databaseEdition?: DatabaseEdition;
    setDatabaseEdition: React.Dispatch<
        React.SetStateAction<DatabaseEdition | undefined>
    >;
    keepDialogAfterImport?: boolean;
    title: string;
}

export const ImportDatabase: React.FC<ImportDatabaseProps> = ({
    setScriptResult,
    goBack,
    scriptResult,
    onImport,
    onCreateEmptyDiagram,
    databaseType,
    databaseEdition,
    setDatabaseEdition,
    keepDialogAfterImport,
    title,
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
    const [errorMessage, setErrorMessage] = useState('');
    const [databaseClient, setDatabaseClient] = useState<
        DatabaseClient | undefined
    >();
    const { t } = useTranslation();
    const [importMetadataScripts, setImportMetadataScripts] =
        useState<ImportMetadataScripts | null>(null);

    const { isSm: isDesktop } = useBreakpoint('sm');

    const [showCheckJsonButton, setShowCheckJsonButton] = useState(false);
    const [isCheckingJson, setIsCheckingJson] = useState(false);

    const [showSSMSInfoDialog, setShowSSMSInfoDialog] = useState(false);

    useEffect(() => {
        const loadScripts = async () => {
            const { importMetadataScripts } = await import(
                '@/lib/data/import-metadata/scripts/scripts'
            );
            setImportMetadataScripts(importMetadataScripts);
        };
        loadScripts();
    }, []);

    useEffect(() => {
        if (scriptResult.trim().length === 0) {
            setErrorMessage('');
            setShowCheckJsonButton(false);
            return;
        }

        if (isStringMetadataJson(scriptResult)) {
            setErrorMessage('');
            setShowCheckJsonButton(false);
        } else if (
            scriptResult.trim().includes('{') &&
            scriptResult.trim().includes('}')
        ) {
            setShowCheckJsonButton(true);
            setErrorMessage('');
        } else {
            setErrorMessage(errorScriptOutputMessage);
            setShowCheckJsonButton(false);
        }
    }, [scriptResult]);

    const handleImport = useCallback(() => {
        if (errorMessage.length === 0 && scriptResult.trim().length !== 0) {
            onImport();
        }
    }, [errorMessage.length, onImport, scriptResult]);

    const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            const inputValue = e.target.value;
            setScriptResult(inputValue);

            // Automatically open SSMS info when input length is exactly 65535
            if (inputValue.length === 65535) {
                setShowSSMSInfoDialog(true);
            }
        },
        [setScriptResult]
    );

    const handleCheckJson = useCallback(async () => {
        setIsCheckingJson(true);

        const fixedJson = await fixMetadataJson(scriptResult);

        if (isStringMetadataJson(fixedJson)) {
            setScriptResult(fixedJson);
            setErrorMessage('');
        } else {
            setScriptResult(fixedJson);
            setErrorMessage(errorScriptOutputMessage);
        }

        setShowCheckJsonButton(false);
        setIsCheckingJson(false);
    }, [scriptResult, setScriptResult]);

    const renderHeader = useCallback(() => {
        return (
            <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription className="hidden" />
            </DialogHeader>
        );
    }, [title]);

    const renderContent = useCallback(() => {
        return (
            <DialogInternalContent>
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
                                className="ml-1 flex-wrap gap-2"
                                value={
                                    !databaseEdition
                                        ? 'regular'
                                        : databaseEdition
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
                                1.{' '}
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
                                value={
                                    !databaseClient
                                        ? 'dbclient'
                                        : databaseClient
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
                                                {
                                                    databaseClientToLabelMap[
                                                        client
                                                    ]
                                                }
                                            </TabsTrigger>
                                        )) ?? []}
                                    </TabsList>
                                </div>
                                <CodeSnippet
                                    className="h-40 w-full"
                                    loading={!importMetadataScripts}
                                    code={
                                        importMetadataScripts?.[databaseType]?.(
                                            {
                                                databaseEdition,
                                                databaseClient,
                                            }
                                        ) ?? ''
                                    }
                                    language={databaseClient ? 'shell' : 'sql'}
                                />
                            </Tabs>
                        ) : (
                            <CodeSnippet
                                className="h-40 w-full flex-auto"
                                loading={!importMetadataScripts}
                                code={
                                    importMetadataScripts?.[databaseType]?.({
                                        databaseEdition,
                                    }) ?? ''
                                }
                                language="sql"
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
                        {showCheckJsonButton || errorMessage ? (
                            <div className="mt-2 flex items-center gap-2">
                                {showCheckJsonButton ? (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleCheckJson}
                                        disabled={isCheckingJson}
                                    >
                                        {isCheckingJson ? (
                                            <Spinner size="small" />
                                        ) : (
                                            t(
                                                'new_diagram_dialog.import_database.check_script_result'
                                            )
                                        )}
                                    </Button>
                                ) : (
                                    <p className="text-sm text-red-700">
                                        {errorMessage}
                                    </p>
                                )}
                            </div>
                        ) : null}
                    </div>
                </div>
            </DialogInternalContent>
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
        importMetadataScripts,
        t,
        showCheckJsonButton,
        isCheckingJson,
        handleCheckJson,
        showSSMSInfoDialog,
        setShowSSMSInfoDialog,
    ]);

    const renderFooter = useCallback(() => {
        return (
            <DialogFooter className="mt-4 flex !justify-between gap-2">
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                    {goBack && (
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={goBack}
                        >
                            {t('new_diagram_dialog.back')}
                        </Button>
                    )}
                    {isDesktop ? (
                        <ZoomableImage src="/load-new-db-instructions.gif">
                            <Button type="button" variant="link">
                                {t(
                                    'new_diagram_dialog.import_database.instructions_link'
                                )}
                            </Button>
                        </ZoomableImage>
                    ) : null}
                </div>
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:space-x-2">
                    {onCreateEmptyDiagram && (
                        <DialogClose asChild>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onCreateEmptyDiagram}
                            >
                                {t('new_diagram_dialog.empty_diagram')}
                            </Button>
                        </DialogClose>
                    )}

                    {keepDialogAfterImport ? (
                        <Button
                            type="button"
                            variant="default"
                            disabled={
                                scriptResult.trim().length === 0 ||
                                errorMessage.length > 0
                            }
                            onClick={handleImport}
                        >
                            {t('new_diagram_dialog.import')}
                        </Button>
                    ) : (
                        <DialogClose asChild>
                            <Button
                                type="button"
                                variant="default"
                                disabled={
                                    showCheckJsonButton ||
                                    scriptResult.trim().length === 0 ||
                                    errorMessage.length > 0
                                }
                                onClick={handleImport}
                            >
                                {t('new_diagram_dialog.import')}
                            </Button>
                        </DialogClose>
                    )}

                    {!isDesktop ? (
                        <ZoomableImage src="/load-new-db-instructions.gif">
                            <Button type="button" variant="link">
                                {t(
                                    'new_diagram_dialog.import_database.instructions_link'
                                )}
                            </Button>
                        </ZoomableImage>
                    ) : null}
                </div>
            </DialogFooter>
        );
    }, [
        handleImport,
        isDesktop,
        keepDialogAfterImport,
        onCreateEmptyDiagram,
        errorMessage.length,
        scriptResult,
        showCheckJsonButton,
        goBack,
        t,
    ]);

    return (
        <>
            {renderHeader()}
            {renderContent()}
            {renderFooter()}
        </>
    );
};
