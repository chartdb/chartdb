import React, {
    Suspense,
    useCallback,
    useEffect,
    useState,
    useRef,
} from 'react';
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
import { useMonaco } from '@monaco-editor/react';
import { useDebounce } from '@/hooks/use-debounce-v2';
import { InstructionsSection } from './instructions-section/instructions-section';
import { parseSQLError } from '@/lib/data/sql-import';
import type { editor, IDisposable } from 'monaco-editor';
import { waitFor } from '@/lib/utils';
import {
    validateSQL,
    type ValidationResult,
} from '@/lib/data/sql-import/sql-validator';
import { SQLValidationStatus } from './sql-validation-status';
import { Parser } from '@dbml/core';
import {
    preprocessDBML,
    sanitizeDBML,
} from '@/lib/dbml/dbml-import/dbml-import';
import { setupDBMLLanguage } from '@/components/code-snippet/languages/dbml-language';

const calculateContentSizeMB = (content: string): number => {
    return content.length / (1024 * 1024); // Convert to MB
};

const calculateIsLargeFile = (content: string): boolean => {
    const contentSizeMB = calculateContentSizeMB(content);
    return contentSizeMB > 2; // Consider large if over 2MB
};

const errorScriptOutputMessage =
    'Invalid JSON. Please correct it or contact us at support@chartdb.io for help.';

// Helper to detect if content is likely SQL DDL, JSON, or DBML
const detectContentType = (
    content: string
): 'query' | 'ddl' | 'dbml' | null => {
    if (!content || content.trim().length === 0) return null;

    const upperContent = content.toUpperCase();

    // Check for DBML patterns first (case sensitive)
    const dbmlPatterns = [
        /^Table\s+\w+\s*{/m,
        /^Ref:\s*\w+/m,
        /^Enum\s+\w+\s*{/m,
        /^TableGroup\s+/m,
        /^Note\s+\w+\s*{/m,
        /\[pk\]/,
        /\[ref:\s*[<>-]/,
    ];

    const hasDBMLPatterns = dbmlPatterns.some((pattern) =>
        pattern.test(content)
    );
    if (hasDBMLPatterns) return 'dbml';

    // Common SQL DDL keywords
    const ddlKeywords = [
        'CREATE TABLE',
        'ALTER TABLE',
        'DROP TABLE',
        'CREATE INDEX',
        'CREATE VIEW',
        'CREATE PROCEDURE',
        'CREATE FUNCTION',
        'CREATE SCHEMA',
        'CREATE DATABASE',
    ];

    // Check for SQL DDL patterns
    const hasDDLKeywords = ddlKeywords.some((keyword) =>
        upperContent.includes(keyword)
    );
    if (hasDDLKeywords) return 'ddl';

    // Check if it looks like JSON
    try {
        // Just check structure, don't need full parse for detection
        if (
            (content.trim().startsWith('{') && content.trim().endsWith('}')) ||
            (content.trim().startsWith('[') && content.trim().endsWith(']'))
        ) {
            return 'query';
        }
    } catch (error) {
        // Not valid JSON, might be partial
        console.error('Error detecting content type:', error);
    }

    // If we can't confidently detect, return null
    return null;
};

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
    importMethod: 'query' | 'ddl' | 'dbml';
    setImportMethod: (method: 'query' | 'ddl' | 'dbml') => void;
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
    const monaco = useMonaco();
    const [errorMessage, setErrorMessage] = useState('');
    const [editorMounted, setEditorMounted] = useState(false);
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const pasteDisposableRef = useRef<IDisposable | null>(null);

    const { t } = useTranslation();
    const { isSm: isDesktop } = useBreakpoint('sm');

    const [showCheckJsonButton, setShowCheckJsonButton] = useState(false);
    const [isCheckingJson, setIsCheckingJson] = useState(false);
    const [showSSMSInfoDialog, setShowSSMSInfoDialog] = useState(false);
    const [sqlValidation, setSqlValidation] = useState<ValidationResult | null>(
        null
    );
    const [isAutoFixing, setIsAutoFixing] = useState(false);
    const [showAutoFixButton, setShowAutoFixButton] = useState(false);

    useEffect(() => {
        setScriptResult('');
        setErrorMessage('');
        setShowCheckJsonButton(false);
    }, [importMethod, setScriptResult]);

    // Check if the ddl or dbml is valid
    useEffect(() => {
        if (importMethod === 'query') {
            setSqlValidation(null);
            setShowAutoFixButton(false);
            return;
        }

        if (!scriptResult.trim()) {
            setSqlValidation(null);
            setShowAutoFixButton(false);
            setErrorMessage('');
            return;
        }

        if (importMethod === 'dbml') {
            // Validate DBML by parsing it
            try {
                const preprocessedContent = preprocessDBML(scriptResult);
                const sanitizedContent = sanitizeDBML(preprocessedContent);
                const parser = new Parser();
                parser.parse(sanitizedContent, 'dbml');
                setErrorMessage('');
                setSqlValidation({
                    isValid: true,
                    errors: [],
                    warnings: [],
                });
            } catch (e) {
                // Parser failed, use error from parser
                let errorMsg = 'Invalid DBML syntax';
                let line: number | undefined;

                if (e && typeof e === 'object' && 'diags' in e) {
                    const error = e as {
                        diags: Array<{
                            message: string;
                            location?: { start?: { line: number } };
                        }>;
                    };
                    if (error.diags && error.diags[0]) {
                        errorMsg = error.diags[0].message;
                        line = error.diags[0].location?.start?.line;
                    }
                }

                setSqlValidation({
                    isValid: false,
                    errors: [
                        {
                            message: errorMsg,
                            line: line || 1,
                            type: 'syntax' as const,
                        },
                    ],
                    warnings: [],
                });
                setErrorMessage(errorMsg);
            }

            setShowAutoFixButton(false);
            return;
        }

        // SQL validation
        // First run our validation based on database type
        const validation = validateSQL(scriptResult, databaseType);
        setSqlValidation(validation);

        // If we have auto-fixable errors, show the auto-fix button
        if (validation.fixedSQL && validation.errors.length > 0) {
            setShowAutoFixButton(true);
            // Don't try to parse invalid SQL
            setErrorMessage('SQL contains syntax errors');
            return;
        }

        // Hide auto-fix button if no fixes available
        setShowAutoFixButton(false);

        // Validate the SQL (either original or already fixed)
        parseSQLError({
            sqlContent: scriptResult,
            sourceDatabaseType: databaseType,
        }).then((result) => {
            if (result.success) {
                setErrorMessage('');
            } else if (!result.success && result.error) {
                setErrorMessage(result.error);
            }
        });
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

    const handleAutoFix = useCallback(() => {
        if (sqlValidation?.fixedSQL) {
            setIsAutoFixing(true);
            setShowAutoFixButton(false);
            setErrorMessage('');

            // Apply the fix with a delay so user sees the fixing message
            setTimeout(() => {
                setScriptResult(sqlValidation.fixedSQL!);

                setTimeout(() => {
                    setIsAutoFixing(false);
                }, 100);
            }, 1000);
        }
    }, [sqlValidation, setScriptResult]);

    const handleErrorClick = useCallback((line: number) => {
        if (editorRef.current) {
            // Set cursor to the error line
            editorRef.current.setPosition({ lineNumber: line, column: 1 });
            editorRef.current.revealLineInCenter(line);
            editorRef.current.focus();
        }
    }, []);

    const formatEditor = useCallback(() => {
        if (editorRef.current) {
            const model = editorRef.current.getModel();
            if (model) {
                const content = model.getValue();

                // Skip formatting for large files (> 2MB)
                if (calculateIsLargeFile(content)) {
                    return;
                }
            }

            setTimeout(() => {
                editorRef.current
                    ?.getAction('editor.action.formatDocument')
                    ?.run();
            }, 50);
        }
    }, []);

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

        await waitFor(1000);
        const fixedJson = fixMetadataJson(scriptResult);

        if (isStringMetadataJson(fixedJson)) {
            setScriptResult(fixedJson);
            setErrorMessage('');
            formatEditor();
        } else {
            setScriptResult(fixedJson);
            setErrorMessage(errorScriptOutputMessage);
            formatEditor();
        }

        setShowCheckJsonButton(false);
        setIsCheckingJson(false);
    }, [scriptResult, setScriptResult, formatEditor]);

    useEffect(() => {
        // Cleanup paste handler on unmount
        return () => {
            if (pasteDisposableRef.current) {
                pasteDisposableRef.current.dispose();
                pasteDisposableRef.current = null;
            }
        };
    }, []);

    // Setup DBML language and theme when import method or theme changes
    useEffect(() => {
        if (!monaco || !editorMounted || !editorRef.current) return;

        if (importMethod === 'dbml') {
            // First ensure DBML language is set up
            setupDBMLLanguage(monaco);

            // Get the current model and set its language to DBML
            const model = editorRef.current.getModel();
            if (model) {
                monaco.editor.setModelLanguage(model, 'dbml');
            }

            // Then apply the theme with a small delay to ensure it takes effect
            setTimeout(() => {
                const themeName =
                    effectiveTheme === 'dark' ? 'dbml-dark' : 'dbml-light';
                monaco.editor.setTheme(themeName);
            }, 50);
        } else {
            // Reset to default theme when not DBML
            monaco.editor.setTheme(
                effectiveTheme === 'dark' ? 'vs-dark' : 'vs'
            );
        }
    }, [monaco, editorMounted, importMethod, effectiveTheme]);

    const handleEditorDidMount = useCallback(
        (editor: editor.IStandaloneCodeEditor) => {
            editorRef.current = editor;
            setEditorMounted(true);

            // Cleanup previous disposable if it exists
            if (pasteDisposableRef.current) {
                pasteDisposableRef.current.dispose();
                pasteDisposableRef.current = null;
            }

            // Add paste handler for all modes
            const disposable = editor.onDidPaste(() => {
                const model = editor.getModel();
                if (!model) return;

                const content = model.getValue();

                // Skip formatting for large files (> 2MB) to prevent browser freezing
                const isLargeFile = calculateIsLargeFile(content);

                // First, detect content type to determine if we should switch modes
                const detectedType = detectContentType(content);
                if (detectedType && detectedType !== importMethod) {
                    // Switch to the detected mode immediately
                    setImportMethod(detectedType);

                    // Only format if it's JSON (query mode) AND file is not too large
                    if (detectedType === 'query' && !isLargeFile) {
                        // For JSON mode, format after a short delay
                        setTimeout(() => {
                            editor
                                .getAction('editor.action.formatDocument')
                                ?.run();
                        }, 100);
                    }
                    // For DDL and DBML modes, do NOT format as it can break the syntax
                } else {
                    // Content type didn't change, apply formatting based on current mode
                    if (importMethod === 'query' && !isLargeFile) {
                        // Only format JSON content if not too large
                        setTimeout(() => {
                            editor
                                .getAction('editor.action.formatDocument')
                                ?.run();
                        }, 100);
                    }
                    // For DDL and DBML modes or large files, do NOT format
                }
            });

            pasteDisposableRef.current = disposable;
        },
        [importMethod, setImportMethod]
    );

    const renderHeader = useCallback(() => {
        return (
            <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription className="hidden" />
            </DialogHeader>
        );
    }, [title]);

    const renderInstructions = useCallback(
        () => (
            <InstructionsSection
                databaseType={databaseType}
                importMethod={importMethod}
                setDatabaseEdition={setDatabaseEdition}
                setImportMethod={setImportMethod}
                databaseEdition={databaseEdition}
                setShowSSMSInfoDialog={setShowSSMSInfoDialog}
                showSSMSInfoDialog={showSSMSInfoDialog}
            />
        ),
        [
            databaseType,
            importMethod,
            setDatabaseEdition,
            setImportMethod,
            databaseEdition,
            setShowSSMSInfoDialog,
            showSSMSInfoDialog,
        ]
    );

    const renderOutputTextArea = useCallback(
        () => (
            <div className="flex size-full flex-col gap-1 overflow-hidden rounded-md border p-1">
                <div className="w-full text-center text-xs text-muted-foreground">
                    {importMethod === 'query'
                        ? 'Smart Query Output'
                        : importMethod === 'dbml'
                          ? 'DBML Script'
                          : 'SQL Script'}
                </div>
                <div className="flex-1 overflow-hidden">
                    <Suspense fallback={<Spinner />}>
                        <Editor
                            value={scriptResult}
                            onChange={debouncedHandleInputChange}
                            language={
                                importMethod === 'query'
                                    ? 'json'
                                    : importMethod === 'dbml'
                                      ? 'dbml'
                                      : 'sql'
                            }
                            loading={<Spinner />}
                            onMount={handleEditorDidMount}
                            beforeMount={
                                importMethod === 'dbml'
                                    ? setupDBMLLanguage
                                    : undefined
                            }
                            options={{
                                formatOnPaste: false, // Never format on paste - we handle it manually
                                minimap: { enabled: false },
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                glyphMargin: importMethod === 'dbml', // Enable glyph margin for DBML to show error indicators
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
                            className="size-full min-h-40"
                        />
                    </Suspense>
                </div>

                {errorMessage ||
                ((importMethod === 'ddl' || importMethod === 'dbml') &&
                    sqlValidation) ? (
                    <SQLValidationStatus
                        validation={sqlValidation}
                        errorMessage={errorMessage}
                        isAutoFixing={isAutoFixing}
                        onErrorClick={handleErrorClick}
                    />
                ) : null}
            </div>
        ),
        [
            errorMessage,
            scriptResult,
            importMethod,
            debouncedHandleInputChange,
            handleEditorDidMount,
            sqlValidation,
            isAutoFixing,
            handleErrorClick,
        ]
    );

    const renderContent = useCallback(() => {
        return (
            <DialogInternalContent>
                {isDesktop ? (
                    <ResizablePanelGroup
                        direction={isDesktop ? 'horizontal' : 'vertical'}
                        className="min-h-[500px]"
                    >
                        <ResizablePanel
                            defaultSize={25}
                            minSize={25}
                            maxSize={99}
                            className="min-h-fit rounded-md bg-gradient-to-b from-slate-50 to-slate-100 p-2 dark:from-slate-900 dark:to-slate-800 md:min-h-fit md:min-w-[350px] md:rounded-l-md md:p-2"
                        >
                            {renderInstructions()}
                        </ResizablePanel>
                        <ResizableHandle withHandle />
                        <ResizablePanel className="min-h-40 py-2 md:px-2 md:py-0">
                            {renderOutputTextArea()}
                        </ResizablePanel>
                    </ResizablePanelGroup>
                ) : (
                    <div className="flex flex-col gap-2">
                        {renderInstructions()}
                        {renderOutputTextArea()}
                    </div>
                )}
            </DialogInternalContent>
        );
    }, [renderOutputTextArea, renderInstructions, isDesktop]);

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

                    {showCheckJsonButton ? (
                        <Button
                            type="button"
                            variant="default"
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
                    ) : showAutoFixButton &&
                      (importMethod === 'ddl' || importMethod === 'dbml') ? (
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handleAutoFix}
                            disabled={isAutoFixing}
                            className="bg-sky-600 text-white hover:bg-sky-700"
                        >
                            {isAutoFixing ? (
                                <Spinner size="small" />
                            ) : (
                                'Try auto-fix'
                            )}
                        </Button>
                    ) : keepDialogAfterImport ? (
                        <Button
                            type="button"
                            variant="default"
                            disabled={
                                scriptResult.trim().length === 0 ||
                                errorMessage.length > 0 ||
                                isAutoFixing
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
                                    scriptResult.trim().length === 0 ||
                                    errorMessage.length > 0 ||
                                    isAutoFixing
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
        isCheckingJson,
        handleCheckJson,
        goBack,
        t,
        importMethod,
        isAutoFixing,
        showAutoFixButton,
        handleAutoFix,
    ]);

    return (
        <>
            {renderHeader()}
            {renderContent()}
            {renderFooter()}
        </>
    );
};
