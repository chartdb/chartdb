import React, {
    useCallback,
    useEffect,
    useState,
    Suspense,
    useRef,
} from 'react';
import * as monaco from 'monaco-editor';
import { useDialog } from '@/hooks/use-dialog';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogInternalContent,
    DialogTitle,
} from '@/components/dialog/dialog';
import { Button } from '@/components/button/button';
import type { BaseDialogProps } from '../common/base-dialog-props';
import { useTranslation } from 'react-i18next';
import { Editor } from '@/components/code-snippet/code-snippet';
import { useTheme } from '@/hooks/use-theme';
import { AlertCircle } from 'lucide-react';
import { importDBMLToDiagram, sanitizeDBML } from '@/lib/dbml-import';
import { useChartDB } from '@/hooks/use-chartdb';
import { Parser } from '@dbml/core';
import { useCanvas } from '@/hooks/use-canvas';
import { setupDBMLLanguage } from '@/components/code-snippet/languages/dbml-language';
import { useToast } from '@/components/toast/use-toast';
import { Spinner } from '@/components/spinner/spinner';
import { debounce } from '@/lib/utils';

interface DBMLError {
    message: string;
    line: number;
    column: number;
}

function parseDBMLError(error: unknown): DBMLError | null {
    try {
        if (typeof error === 'string') {
            const parsed = JSON.parse(error);
            if (parsed.diags?.[0]) {
                const diag = parsed.diags[0];
                return {
                    message: diag.message,
                    line: diag.location.start.line,
                    column: diag.location.start.column,
                };
            }
        } else if (error && typeof error === 'object' && 'diags' in error) {
            const parsed = error as {
                diags: Array<{
                    message: string;
                    location: { start: { line: number; column: number } };
                }>;
            };
            if (parsed.diags?.[0]) {
                return {
                    message: parsed.diags[0].message,
                    line: parsed.diags[0].location.start.line,
                    column: parsed.diags[0].location.start.column,
                };
            }
        }
    } catch (e) {
        console.error('Error parsing DBML error:', e);
    }
    return null;
}

export interface ImportDBMLDialogProps extends BaseDialogProps {
    withCreateEmptyDiagram?: boolean;
}

export const ImportDBMLDialog: React.FC<ImportDBMLDialogProps> = ({
    dialog,
    withCreateEmptyDiagram,
}) => {
    const { t } = useTranslation();
    const initialDBML = `// Use DBML to define your database structure
// Simple Blog System with Comments Example

Table users {
  id integer [primary key]
  name varchar
  email varchar
}

Table posts {
  id integer [primary key]
  title varchar
  content text
  user_id integer
  created_at timestamp
}

Table comments {
  id integer [primary key]
  content text
  post_id integer
  user_id integer
  created_at timestamp
}

// Relationships
Ref: posts.user_id > users.id // Each post belongs to one user
Ref: comments.post_id > posts.id // Each comment belongs to one post
Ref: comments.user_id > users.id // Each comment is written by one user`;

    const [dbmlContent, setDBMLContent] = useState<string>(initialDBML);
    const { closeImportDBMLDialog } = useDialog();
    const [errorMessage, setErrorMessage] = useState<string | undefined>();
    const { effectiveTheme } = useTheme();
    const { toast } = useToast();
    const {
        addTables,
        addRelationships,
        tables,
        relationships,
        removeTables,
        removeRelationships,
    } = useChartDB();
    const { reorderTables } = useCanvas();
    const [reorder, setReorder] = useState(false);
    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor>();
    const decorationsCollection =
        useRef<monaco.editor.IEditorDecorationsCollection>();

    const handleEditorDidMount = (
        editor: monaco.editor.IStandaloneCodeEditor
    ) => {
        editorRef.current = editor;
        decorationsCollection.current = editor.createDecorationsCollection();
    };

    useEffect(() => {
        if (reorder) {
            reorderTables({
                updateHistory: false,
            });
            setReorder(false);
        }
    }, [reorder, reorderTables]);

    const highlightErrorLine = useCallback((error: DBMLError) => {
        if (!editorRef.current) return;

        const model = editorRef.current.getModel();
        if (!model) return;

        const decorations = [
            {
                range: new monaco.Range(
                    error.line,
                    1,
                    error.line,
                    model.getLineMaxColumn(error.line)
                ),
                options: {
                    isWholeLine: true,
                    className: 'dbml-error-line',
                    glyphMarginClassName: 'dbml-error-glyph',
                    hoverMessage: { value: error.message },
                    overviewRuler: {
                        color: '#ff0000',
                        position: monaco.editor.OverviewRulerLane.Right,
                        darkColor: '#ff0000',
                    },
                },
            },
        ];

        decorationsCollection.current?.set(decorations);
    }, []);

    const clearDecorations = useCallback(() => {
        decorationsCollection.current?.clear();
    }, []);

    const validateDBML = useCallback(
        async (content: string) => {
            // Clear previous errors
            setErrorMessage(undefined);
            clearDecorations();

            if (!content.trim()) return;

            try {
                const sanitizedContent = sanitizeDBML(content);
                const parser = new Parser();
                parser.parse(sanitizedContent, 'dbml');
            } catch (e) {
                const parsedError = parseDBMLError(e);
                if (parsedError) {
                    setErrorMessage(
                        t('import_dbml_dialog.error.description') +
                            ` (1 error found - in line ${parsedError.line})`
                    );
                    highlightErrorLine(parsedError);
                } else {
                    setErrorMessage(
                        e instanceof Error ? e.message : JSON.stringify(e)
                    );
                }
            }
        },
        [clearDecorations, highlightErrorLine, t]
    );

    const debouncedValidateRef = useRef<((value: string) => void) | null>(null);

    // Set up debounced validation
    useEffect(() => {
        debouncedValidateRef.current = debounce((value: string) => {
            validateDBML(value);
        }, 500);

        return () => {
            debouncedValidateRef.current = null;
        };
    }, [validateDBML]);

    // Trigger validation when content changes
    useEffect(() => {
        if (debouncedValidateRef.current) {
            debouncedValidateRef.current(dbmlContent);
        }
    }, [dbmlContent]);

    useEffect(() => {
        if (!dialog.open) {
            setErrorMessage(undefined);
            clearDecorations();
            setDBMLContent(initialDBML);
        }
    }, [dialog.open, initialDBML, clearDecorations]);

    const handleImport = useCallback(async () => {
        if (!dbmlContent.trim() || errorMessage) return;

        try {
            // Sanitize DBML content before importing
            const sanitizedContent = sanitizeDBML(dbmlContent);
            const importedDiagram = await importDBMLToDiagram(sanitizedContent);
            const tableIdsToRemove = tables
                .filter((table) =>
                    importedDiagram.tables?.some(
                        (t) =>
                            t.name === table.name && t.schema === table.schema
                    )
                )
                .map((table) => table.id);
            // Find relationships that need to be removed
            const relationshipIdsToRemove = relationships
                .filter((relationship) => {
                    const sourceTable = tables.find(
                        (table) => table.id === relationship.sourceTableId
                    );
                    const targetTable = tables.find(
                        (table) => table.id === relationship.targetTableId
                    );
                    if (!sourceTable || !targetTable) return true;
                    const replacementSourceTable = importedDiagram.tables?.find(
                        (table) =>
                            table.name === sourceTable.name &&
                            table.schema === sourceTable.schema
                    );
                    const replacementTargetTable = importedDiagram.tables?.find(
                        (table) =>
                            table.name === targetTable.name &&
                            table.schema === targetTable.schema
                    );
                    return replacementSourceTable || replacementTargetTable;
                })
                .map((relationship) => relationship.id);

            // Remove existing items
            await Promise.all([
                removeTables(tableIdsToRemove, { updateHistory: false }),
                removeRelationships(relationshipIdsToRemove, {
                    updateHistory: false,
                }),
            ]);

            // Add new items
            await Promise.all([
                addTables(importedDiagram.tables ?? [], {
                    updateHistory: false,
                }),
                addRelationships(importedDiagram.relationships ?? [], {
                    updateHistory: false,
                }),
            ]);
            setReorder(true);
            closeImportDBMLDialog();
        } catch (e) {
            toast({
                title: t('import_dbml_dialog.error.title'),
                variant: 'destructive',
                description: (
                    <>
                        <div>{t('import_dbml_dialog.error.description')}</div>
                        {e instanceof Error ? e.message : JSON.stringify(e)}
                    </>
                ),
            });
        }
    }, [
        dbmlContent,
        closeImportDBMLDialog,
        tables,
        relationships,
        removeTables,
        removeRelationships,
        addTables,
        addRelationships,
        errorMessage,
        toast,
        setReorder,
        t,
    ]);

    return (
        <Dialog
            {...dialog}
            onOpenChange={(open) => {
                if (!open) {
                    closeImportDBMLDialog();
                }
            }}
        >
            <DialogContent
                className="flex h-[80vh] max-h-screen w-full flex-col md:max-w-[900px]"
                showClose
            >
                <DialogHeader>
                    <DialogTitle>
                        {withCreateEmptyDiagram
                            ? t('import_dbml_dialog.example_title')
                            : t('import_dbml_dialog.title')}
                    </DialogTitle>
                    <DialogDescription>
                        {t('import_dbml_dialog.description')}
                    </DialogDescription>
                </DialogHeader>
                <DialogInternalContent>
                    <Suspense fallback={<Spinner />}>
                        <Editor
                            value={dbmlContent}
                            onChange={(value) => setDBMLContent(value || '')}
                            language="dbml"
                            onMount={handleEditorDidMount}
                            theme={
                                effectiveTheme === 'dark'
                                    ? 'dbml-dark'
                                    : 'dbml-light'
                            }
                            beforeMount={setupDBMLLanguage}
                            options={{
                                minimap: { enabled: false },
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                glyphMargin: true,
                                lineNumbers: 'on',
                                scrollbar: {
                                    vertical: 'visible',
                                    horizontal: 'visible',
                                },
                            }}
                            className="size-full"
                        />
                    </Suspense>
                </DialogInternalContent>
                <DialogFooter>
                    <div className="flex w-full items-center justify-between">
                        <div className="flex items-center gap-4">
                            <DialogClose asChild>
                                <Button variant="secondary">
                                    {withCreateEmptyDiagram
                                        ? t('import_dbml_dialog.skip_and_empty')
                                        : t('import_dbml_dialog.cancel')}
                                </Button>
                            </DialogClose>
                            {errorMessage ? (
                                <div className="flex items-center gap-1">
                                    <AlertCircle className="size-4 text-destructive" />

                                    <span className="text-xs text-destructive">
                                        {errorMessage ||
                                            t(
                                                'import_dbml_dialog.error.description'
                                            )}
                                    </span>
                                </div>
                            ) : null}
                        </div>
                        <Button
                            onClick={handleImport}
                            disabled={!dbmlContent.trim() || !!errorMessage}
                        >
                            {withCreateEmptyDiagram
                                ? t('import_dbml_dialog.show_example')
                                : t('import_dbml_dialog.import')}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
