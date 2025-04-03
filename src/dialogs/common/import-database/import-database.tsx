import React, { Suspense, useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/button/button';
import {
    DialogClose,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogInternalContent,
    DialogTitle,
} from '@/components/dialog/dialog';
import type { DatabaseType } from '@/lib/domain/database-type';
import { Editor } from '@/components/code-snippet/code-snippet';
import type { DatabaseEdition } from '@/lib/domain/database-edition';
import { useTranslation } from 'react-i18next';
import { ZoomableImage } from '@/components/zoomable-image/zoomable-image';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { Spinner } from '@/components/spinner/spinner';
import {
    fixMetadataJson,
    isStringMetadataJson,
} from '@/lib/data/import-metadata/utils';
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from '@/components/resizable/resizable';
import { useTheme } from '@/hooks/use-theme';
import type { OnChange } from '@monaco-editor/react';
import { useDebounce } from '@/hooks/use-debounce-v2';
import { InstructionsSection } from './instructions-section/instructions-section';
import { parseSQLError } from '@/lib/data/sql-import';

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
    importMethod: 'query' | 'ddl';
    setImportMethod: (method: 'query' | 'ddl') => void;
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
    importMethod,
    setImportMethod,
}) => {
    const { effectiveTheme } = useTheme();
    const [errorMessage, setErrorMessage] = useState('');

    const { t } = useTranslation();
    const { isSm: isDesktop } = useBreakpoint('sm');

    const [showCheckJsonButton, setShowCheckJsonButton] = useState(false);
    const [isCheckingJson, setIsCheckingJson] = useState(false);
    const [showSSMSInfoDialog, setShowSSMSInfoDialog] = useState(false);

    useEffect(() => {
        setScriptResult('');
        setErrorMessage('');
        setShowCheckJsonButton(false);
    }, [importMethod, setScriptResult]);

    // Check if the ddl is valid
    useEffect(() => {
        if (importMethod !== 'ddl') {
            return;
        }

        if (!scriptResult.trim()) return;

        const result = parseSQLError({
            sqlContent: scriptResult,
            sourceDatabaseType: databaseType,
        });

        if (result.success) {
            setErrorMessage('');
        } else if (!result.success && result.error) {
            setErrorMessage(result.error);
        }
    }, [importMethod, scriptResult, databaseType]);

    // Check if the script result is a valid JSON
    useEffect(() => {
        if (importMethod !== 'query') {
            return;
        }

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
    }, [scriptResult, importMethod]);

    const handleImport = useCallback(() => {
        if (errorMessage.length === 0 && scriptResult.trim().length !== 0) {
            onImport();
        }
    }, [errorMessage.length, onImport, scriptResult]);

    const handleInputChange: OnChange = useCallback(
        (inputValue) => {
            setScriptResult(inputValue ?? '');

            // Automatically open SSMS info when input length is exactly 65535
            if ((inputValue ?? '').length === 65535) {
                setShowSSMSInfoDialog(true);
            }
        },
        [setScriptResult]
    );

    const debouncedHandleInputChange = useDebounce(handleInputChange, 500);

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
                <ResizablePanelGroup
                    direction={isDesktop ? 'horizontal' : 'vertical'}
                    className="min-h-[500px] md:min-h-fit"
                >
                    <ResizablePanel
                        defaultSize={25}
                        minSize={25}
                        maxSize={99}
                        className="min-h-fit rounded-md bg-gradient-to-b from-slate-50 to-slate-100 p-2 dark:from-slate-900 dark:to-slate-800 md:min-h-fit md:min-w-[350px] md:rounded-l-md md:p-2"
                    >
                        <InstructionsSection
                            databaseType={databaseType}
                            importMethod={importMethod}
                            setDatabaseEdition={setDatabaseEdition}
                            setImportMethod={setImportMethod}
                            databaseEdition={databaseEdition}
                            setShowSSMSInfoDialog={setShowSSMSInfoDialog}
                            showSSMSInfoDialog={showSSMSInfoDialog}
                        />
                    </ResizablePanel>
                    {isDesktop ? <ResizableHandle withHandle /> : null}
                    <ResizablePanel className="min-h-40 py-2 md:px-2 md:py-0">
                        <div className="flex size-full flex-col gap-1 overflow-hidden rounded-md border p-1">
                            <div className="w-full text-center text-xs text-muted-foreground">
                                {importMethod === 'query'
                                    ? 'Smart Query Output'
                                    : 'SQL DDL'}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <Suspense fallback={<Spinner />}>
                                    <Editor
                                        value={scriptResult}
                                        onChange={debouncedHandleInputChange}
                                        language={
                                            importMethod === 'query'
                                                ? 'json'
                                                : 'sql'
                                        }
                                        loading={<Spinner />}
                                        theme={
                                            effectiveTheme === 'dark'
                                                ? 'dbml-dark'
                                                : 'dbml-light'
                                        }
                                        options={{
                                            formatOnPaste: true,
                                            minimap: { enabled: false },
                                            scrollBeyondLastLine: false,
                                            automaticLayout: true,
                                            glyphMargin: false,
                                            lineNumbers: 'on',
                                            guides: {
                                                indentation: false,
                                            },
                                            folding: true,
                                            lineNumbersMinChars: 3,
                                            renderValidationDecorations: 'off',
                                            lineDecorationsWidth: 0,
                                            overviewRulerBorder: false,
                                            overviewRulerLanes: 0,
                                            hideCursorInOverviewRuler: true,
                                            contextmenu: false,

                                            scrollbar: {
                                                vertical: 'hidden',
                                                horizontal: 'hidden',
                                                alwaysConsumeMouseWheel: false,
                                            },
                                        }}
                                        className="size-full"
                                    />
                                </Suspense>
                            </div>

                            {showCheckJsonButton || errorMessage ? (
                                <div className="mt-2 flex shrink-0 items-center gap-2">
                                    {showCheckJsonButton ? (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={handleCheckJson}
                                            disabled={isCheckingJson}
                                            className="h-7"
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
                                        <p className="text-xs text-red-700">
                                            {errorMessage}
                                        </p>
                                    )}
                                </div>
                            ) : null}
                        </div>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </DialogInternalContent>
        );
    }, [
        showSSMSInfoDialog,
        databaseEdition,
        databaseType,
        errorMessage,
        scriptResult,
        setDatabaseEdition,
        t,
        isDesktop,
        showCheckJsonButton,
        isCheckingJson,
        handleCheckJson,
        effectiveTheme,
        debouncedHandleInputChange,
        importMethod,
        setImportMethod,
    ]);

    const renderFooter = useCallback(() => {
        return (
            <DialogFooter className="flex !justify-between gap-2">
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
