import React, {
    useMemo,
    useState,
    useEffect,
    useCallback,
    useRef,
} from 'react';
import { useDebounceFn } from 'ahooks';
import { useChartDB } from '@/hooks/use-chartdb';
import { useTheme } from '@/hooks/use-theme';
import { CodeSnippet } from '@/components/code-snippet/code-snippet';
import type { EffectiveTheme } from '@/context/theme-context/theme-context';
import type { Diagram } from '@/lib/domain/diagram';
import { useToast } from '@/components/toast/use-toast';
import { setupDBMLLanguage } from '@/components/code-snippet/languages/dbml-language';
import {
    AlertCircle,
    ArrowLeftRight,
    Check,
    Pencil,
    PencilOff,
    Undo2,
    X,
} from 'lucide-react';
import { generateDBMLFromDiagram } from '@/lib/dbml/dbml-export/dbml-export';
import { useDiff } from '@/context/diff-context/use-diff';
import { importDBMLToDiagram } from '@/lib/dbml/dbml-import/dbml-import';
import { applyDBMLChanges } from '@/lib/dbml/apply-dbml/apply-dbml';
import { parseDBMLError } from '@/lib/dbml/dbml-import/dbml-import-error';
import {
    clearErrorHighlight,
    highlightErrorLine,
} from '@/components/code-snippet/dbml/utils';
import {
    registerDBMLCompletionProvider,
    type DBMLCompletionManager,
} from '@/components/code-snippet/dbml/dbml-completion-provider';
import type * as monaco from 'monaco-editor';
import type { Monaco } from '@monaco-editor/react';
import { useTranslation } from 'react-i18next';
import { useFullScreenLoader } from '@/hooks/use-full-screen-spinner';

export interface TableDBMLProps {}

const getEditorTheme = (theme: EffectiveTheme) => {
    return theme === 'dark' ? 'dbml-dark' : 'dbml-light';
};

export const TableDBML: React.FC<TableDBMLProps> = () => {
    const { currentDiagram, updateDiagramData, databaseType, readonly } =
        useChartDB();
    const { effectiveTheme } = useTheme();
    const { toast } = useToast();
    const [dbmlFormat, setDbmlFormat] = useState<'inline' | 'standard'>(
        'inline'
    );
    const [isLoading, setIsLoading] = useState(true);
    const [standardDbml, setStandardDbml] = useState('');
    const [inlineDbml, setInlineDbml] = useState('');
    const isMountedRef = useRef(true);
    const [isEditButtonEmphasized, setIsEditButtonEmphasized] = useState(false);

    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor>();
    const decorationsCollection =
        useRef<monaco.editor.IEditorDecorationsCollection>();
    const completionManagerRef = useRef<DBMLCompletionManager>();

    const handleEditorDidMount = useCallback(
        (
            editor: monaco.editor.IStandaloneCodeEditor,
            monacoInstance: Monaco
        ) => {
            editorRef.current = editor;
            decorationsCollection.current =
                editor.createDecorationsCollection();

            if (readOnlyDisposableRef.current) {
                readOnlyDisposableRef.current.dispose();
            }

            const readOnlyDisposable = editor.onDidAttemptReadOnlyEdit(() => {
                if (emphasisTimeoutRef.current) {
                    clearTimeout(emphasisTimeoutRef.current);
                }

                setIsEditButtonEmphasized(false);

                requestAnimationFrame(() => {
                    setIsEditButtonEmphasized(true);

                    emphasisTimeoutRef.current = setTimeout(() => {
                        setIsEditButtonEmphasized(false);
                    }, 600);
                });
            });

            readOnlyDisposableRef.current = readOnlyDisposable;

            // Register DBML completion provider
            completionManagerRef.current?.dispose();
            completionManagerRef.current = registerDBMLCompletionProvider(
                monacoInstance,
                editor.getValue()
            );
        },
        []
    );

    // Determine which DBML string to display
    const dbmlToDisplay = useMemo(
        () => (dbmlFormat === 'inline' ? inlineDbml : standardDbml),
        [dbmlFormat, inlineDbml, standardDbml]
    );

    // Toggle function
    const toggleFormat = useCallback(() => {
        setDbmlFormat((prev) => (prev === 'inline' ? 'standard' : 'inline'));
    }, []);

    const [isEditMode, setIsEditMode] = useState(false);
    const [editedDbml, setEditedDbml] = useState<string>('');
    const lastDBMLChange = useRef(editedDbml);
    const { calculateDiff, originalDiagram, resetDiff, hasDiff, newDiagram } =
        useDiff();
    const { loadDiagramFromData } = useChartDB();
    const [errorMessage, setErrorMessage] = useState<string>();
    const [warningMessage, setWarningMessage] = useState<string>();
    const { t } = useTranslation();
    const { hideLoader, showLoader } = useFullScreenLoader();
    const emphasisTimeoutRef = useRef<NodeJS.Timeout>();
    const readOnlyDisposableRef = useRef<monaco.IDisposable>();
    const currentDiagramRef = useRef<Diagram>(currentDiagram);
    const originalDiagramRef = useRef<Diagram | null>(originalDiagram);

    // Keep refs updated
    useEffect(() => {
        currentDiagramRef.current = currentDiagram;
    }, [currentDiagram]);

    useEffect(() => {
        originalDiagramRef.current = originalDiagram;
    }, [originalDiagram]);

    // --- Check for empty field name warnings only on mount ---
    useEffect(() => {
        // Only check when not in edit mode
        if (isEditMode) return;

        let foundInvalidFields = false;
        const invalidTableNames = new Set<string>();

        currentDiagram.tables?.forEach((table) => {
            table.fields.forEach((field) => {
                if (field.name === '') {
                    foundInvalidFields = true;
                    invalidTableNames.add(table.name);
                }
            });
        });

        if (foundInvalidFields) {
            const tableNamesString = Array.from(invalidTableNames).join(', ');
            setWarningMessage(
                `Some fields had empty names in tables: [${tableNamesString}] and were excluded from the DBML export.`
            );
        }
    }, [currentDiagram.tables, t, isEditMode]);

    useEffect(() => {
        if (isEditMode) {
            setIsLoading(false);
            return;
        }

        setErrorMessage(undefined);
        clearErrorHighlight(decorationsCollection.current);

        const generateDBML = async () => {
            setIsLoading(true);

            const result = generateDBMLFromDiagram(currentDiagram);

            // Handle errors
            if (result.error) {
                toast({
                    title: 'DBML Export Error',
                    description: `Could not generate DBML: ${result.error.substring(0, 100)}${result.error.length > 100 ? '...' : ''}`,
                    variant: 'destructive',
                });
            }

            setStandardDbml(result.standardDbml);
            setInlineDbml(result.inlineDbml);
            setIsLoading(false);
        };

        setTimeout(() => generateDBML(), 0);
    }, [currentDiagram, toast, isEditMode]);

    // Update editedDbml when dbmlToDisplay changes
    useEffect(() => {
        if (!isLoading && dbmlToDisplay && !isEditMode) {
            setEditedDbml(dbmlToDisplay);
            lastDBMLChange.current = dbmlToDisplay;
        }
    }, [dbmlToDisplay, isLoading, isEditMode]);

    // Create the showDiff function
    const showDiff = useCallback(
        async (dbmlContent: string) => {
            clearErrorHighlight(decorationsCollection.current);
            setErrorMessage(undefined);
            try {
                const diagramFromDBML: Diagram = await importDBMLToDiagram(
                    dbmlContent,
                    { databaseType }
                );

                const sourceDiagram: Diagram =
                    originalDiagramRef.current ?? currentDiagramRef.current;

                const targetDiagram: Diagram = {
                    ...sourceDiagram,
                    tables: diagramFromDBML.tables,
                    relationships: diagramFromDBML.relationships,
                    customTypes: diagramFromDBML.customTypes,
                };

                const newDiagram = applyDBMLChanges({
                    sourceDiagram,
                    targetDiagram,
                });

                if (originalDiagramRef.current) {
                    resetDiff();
                    loadDiagramFromData(originalDiagramRef.current);
                }

                calculateDiff({
                    diagram: sourceDiagram,
                    newDiagram,
                    options: { summaryOnly: true },
                });
            } catch (error) {
                const dbmlError = parseDBMLError(error);

                if (dbmlError) {
                    highlightErrorLine({
                        error: dbmlError,
                        model: editorRef.current?.getModel(),
                        editorDecorationsCollection:
                            decorationsCollection.current,
                    });

                    setErrorMessage(
                        t('import_dbml_dialog.error.description') +
                            ` (1 error found - in line ${dbmlError.line})`
                    );
                }
            }
        },
        [t, resetDiff, loadDiagramFromData, calculateDiff, databaseType]
    );

    const { run: debouncedShowDiff } = useDebounceFn(showDiff, {
        wait: 1000,
    });

    useEffect(() => {
        if (!isEditMode || !editedDbml) {
            return;
        }

        // Only calculate diff if the DBML has changed
        if (editedDbml === lastDBMLChange.current) {
            return;
        }

        lastDBMLChange.current = editedDbml;

        debouncedShowDiff(editedDbml);
    }, [editedDbml, isEditMode, debouncedShowDiff]);

    const acceptChanges = useCallback(async () => {
        if (!editedDbml) return;
        if (!newDiagram) return;

        showLoader();

        await updateDiagramData(newDiagram, { forceUpdateStorage: true });

        resetDiff();
        setEditedDbml(editedDbml);
        setIsEditMode(false);
        lastDBMLChange.current = editedDbml;
        hideLoader();
    }, [
        editedDbml,
        updateDiagramData,
        newDiagram,
        resetDiff,
        showLoader,
        hideLoader,
    ]);

    const undoChanges = useCallback(() => {
        if (!editedDbml) return;
        if (!originalDiagram) return;

        loadDiagramFromData(originalDiagram);
        setIsEditMode(false);
        resetDiff();
        setEditedDbml(dbmlToDisplay);
        lastDBMLChange.current = dbmlToDisplay;
    }, [
        editedDbml,
        loadDiagramFromData,
        originalDiagram,
        resetDiff,
        dbmlToDisplay,
    ]);

    // Update completion provider when editor content changes
    useEffect(() => {
        completionManagerRef.current?.updateSource(editedDbml);
    }, [editedDbml]);

    useEffect(() => {
        isMountedRef.current = true;

        return () => {
            isMountedRef.current = false;

            if (emphasisTimeoutRef.current) {
                clearTimeout(emphasisTimeoutRef.current);
            }

            if (readOnlyDisposableRef.current) {
                readOnlyDisposableRef.current.dispose();
                readOnlyDisposableRef.current = undefined;
            }

            if (completionManagerRef.current) {
                completionManagerRef.current.dispose();
                completionManagerRef.current = undefined;
            }
        };
    }, []);

    useEffect(() => {
        const currentUndoChanges = undoChanges;

        return () => {
            setTimeout(() => {
                if (!isMountedRef.current) {
                    currentUndoChanges();
                }
            }, 0);
        };
    }, [undoChanges]);

    return (
        <>
            <CodeSnippet
                code={editedDbml}
                loading={isLoading}
                actionsTooltipSide="right"
                className="my-0.5"
                allowCopy={!isEditMode}
                actions={
                    isEditMode && hasDiff
                        ? [
                              {
                                  label: 'Accept Changes',
                                  icon: Check,
                                  onClick: acceptChanges,
                                  className:
                                      'h-7 items-center gap-1.5 rounded-md border border-green-200 bg-green-50 px-2.5 py-1.5 text-xs font-medium text-green-600 shadow-sm hover:bg-green-100 dark:border-green-800 dark:bg-green-800 dark:text-green-200 dark:hover:bg-green-700',
                              },
                              {
                                  label: 'Undo Changes',
                                  icon: Undo2,
                                  onClick: undoChanges,
                                  className:
                                      'h-7 items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-600 shadow-sm hover:bg-red-100 dark:border-red-800 dark:bg-red-800 dark:text-red-200 dark:hover:bg-red-700',
                              },
                          ]
                        : isEditMode && !hasDiff
                          ? [
                                {
                                    label: 'View',
                                    icon: PencilOff,
                                    onClick: () => {
                                        resetDiff();
                                        setIsEditMode((prev) => !prev);
                                    },
                                },
                            ]
                          : [
                                {
                                    label: `Show ${dbmlFormat === 'inline' ? 'Standard' : 'Inline'} Refs`,
                                    icon: ArrowLeftRight,
                                    onClick: toggleFormat,
                                },
                                ...(!readonly
                                    ? [
                                          {
                                              label: 'Edit',
                                              icon: Pencil,
                                              onClick: () =>
                                                  setIsEditMode(
                                                      (prev) => !prev
                                                  ),
                                              className: isEditButtonEmphasized
                                                  ? 'dbml-edit-button-emphasis'
                                                  : undefined,
                                          },
                                      ]
                                    : []),
                            ]
                }
                editorProps={{
                    height: '100%',
                    defaultLanguage: 'dbml',
                    beforeMount: setupDBMLLanguage,
                    theme: getEditorTheme(effectiveTheme),
                    onMount: handleEditorDidMount,
                    options: {
                        wordWrap: 'off',
                        mouseWheelZoom: false,
                        readOnly: !isEditMode,
                        autoClosingBrackets: 'always',
                        autoClosingQuotes: 'always',
                        autoSurround: 'languageDefined',
                    },
                    onChange: (value) => {
                        setEditedDbml(value ?? '');
                    },
                }}
            />
            {warningMessage ? (
                <div className="my-2 rounded-md border border-blue-200 bg-blue-50 p-3 dark:border-blue-900/50 dark:bg-blue-950/20">
                    <div className="flex items-start gap-2">
                        <AlertCircle className="mt-0.5 size-4 shrink-0 text-blue-600 dark:text-blue-400" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                Warning
                            </p>
                            <p className="mt-0.5 text-xs text-blue-700 dark:text-blue-300">
                                {warningMessage}
                            </p>
                        </div>
                        <button
                            onClick={() => setWarningMessage(undefined)}
                            className="rounded p-0.5 text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/50"
                            aria-label="Close warning"
                        >
                            <X className="size-3.5" />
                        </button>
                    </div>
                </div>
            ) : null}
            {errorMessage ? (
                <div className="my-2 rounded-md border border-orange-200 bg-orange-50 p-3 dark:border-orange-900/50 dark:bg-orange-950/20">
                    <div className="flex gap-2">
                        <AlertCircle className="mt-0.5 size-4 shrink-0 text-orange-600 dark:text-orange-400" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                                Syntax Error
                            </p>
                            <p className="mt-0.5 text-xs text-orange-700 dark:text-orange-300">
                                {errorMessage ||
                                    t('import_dbml_dialog.error.description')}
                            </p>
                        </div>
                    </div>
                </div>
            ) : null}
        </>
    );
};
