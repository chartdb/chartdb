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
import { AlertCircle } from 'lucide-react';
import { sqlImportToDiagram, parseSQLError } from '@/lib/data/sql-import';
import { useChartDB } from '@/hooks/use-chartdb';
import { useCanvas } from '@/hooks/use-canvas';
import { Spinner } from '@/components/spinner/spinner';
import { debounce } from '@/lib/utils';
import { DatabaseType } from '@/lib/domain/database-type';
import { databaseTypeToLabelMap } from '@/lib/databases';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/select/select';
import { Label } from '@/components/label/label';

// Define the SQLError type
interface SQLError {
    message: string;
    line?: number;
    column?: number;
}

export interface ImportSQLDialogProps extends BaseDialogProps {
    withCreateEmptyDiagram?: boolean;
}

export const ImportSQLDialog: React.FC<ImportSQLDialogProps> = ({ dialog }) => {
    const { t } = useTranslation();
    const initialSQL = `-- Use SQL DDL to define your database structure
-- Simple Blog System with Comments Example

CREATE TABLE users (
  id INT PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255)
);

CREATE TABLE posts (
  id INT PRIMARY KEY,
  title VARCHAR(255),
  content TEXT,
  user_id INT,
  created_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE comments (
  id INT PRIMARY KEY,
  content TEXT,
  post_id INT,
  user_id INT,
  created_at TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);`;

    const [sqlContent, setSQLContent] = useState<string>(initialSQL);
    const { closeImportSQLDialog } = useDialog();
    const [errorMessage, setErrorMessage] = useState<string | undefined>();
    const {
        addTables,
        addRelationships,
        tables,
        relationships,
        removeTables,
        removeRelationships,
        databaseType: targetDatabaseType, // Use the current diagram's database type as target
    } = useChartDB();
    const { reorderTables } = useCanvas();
    const [reorder, setReorder] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [sourceDatabaseType, setSourceDatabaseType] = useState<DatabaseType>(
        DatabaseType.POSTGRESQL
    );
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

    // Highlight error in the editor
    const highlightErrorLine = useCallback((error: SQLError) => {
        if (!editorRef.current || !error.line) return;

        const model = editorRef.current.getModel();
        if (!model) return;

        const line = error.line;
        const decorations = [
            {
                range: new monaco.Range(
                    line,
                    1,
                    line,
                    model.getLineMaxColumn(line)
                ),
                options: {
                    isWholeLine: true,
                    className: 'sql-error-line',
                    glyphMarginClassName: 'sql-error-glyph',
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

    const validateSQLContent = useCallback(
        async (content: string) => {
            // Clear previous errors
            setErrorMessage(undefined);
            clearDecorations();

            if (!content.trim()) return;

            const result = parseSQLError(content, sourceDatabaseType);
            if (!result.success && result.error) {
                const lineInfo = result.line
                    ? ` (1 error found - in line ${result.line})`
                    : '';

                setErrorMessage(
                    t('import_sql_dialog.error.description') + lineInfo
                );

                if (result.line) {
                    highlightErrorLine({
                        message: result.error,
                        line: result.line,
                        column: result.column,
                    });
                }
            }
        },
        [clearDecorations, highlightErrorLine, t, sourceDatabaseType]
    );

    const debouncedValidateRef = useRef<((value: string) => void) | null>(null);

    // Set up debounced validation
    useEffect(() => {
        debouncedValidateRef.current = debounce((value: string) => {
            validateSQLContent(value);
        }, 500);

        return () => {
            debouncedValidateRef.current = null;
        };
    }, [validateSQLContent]);

    // Trigger validation when content changes or source database type changes
    useEffect(() => {
        if (debouncedValidateRef.current) {
            debouncedValidateRef.current(sqlContent);
        }
    }, [sqlContent, sourceDatabaseType]);

    useEffect(() => {
        if (!dialog.open) {
            setErrorMessage(undefined);
            clearDecorations();
            setSQLContent(initialSQL);
            setSourceDatabaseType(DatabaseType.POSTGRESQL);
        }
    }, [dialog.open, initialSQL, clearDecorations]);

    const handleImport = useCallback(async () => {
        if (!sqlContent.trim() || errorMessage) return;

        try {
            console.log('Starting SQL import');
            setIsLoading(true);
            const importedDiagram = await sqlImportToDiagram(
                sqlContent,
                sourceDatabaseType,
                targetDatabaseType
            );

            console.log('Import result:', {
                diagramId: importedDiagram.id,
                tables: importedDiagram.tables?.length || 0,
                relationships: importedDiagram.relationships?.length || 0,
            });

            const tableIdsToRemove = tables
                .filter((table) =>
                    importedDiagram.tables?.some(
                        (t) =>
                            t.name === table.name && t.schema === table.schema
                    )
                )
                .map((table) => table.id);

            console.log('Tables to remove:', tableIdsToRemove);

            const relationshipIdsToRemove = relationships
                .filter((rel) => {
                    const sourceTable = tables.find(
                        (t) => t.id === rel.sourceTableId
                    );
                    const targetTable = tables.find(
                        (t) => t.id === rel.targetTableId
                    );
                    return (
                        (sourceTable &&
                            importedDiagram.tables?.some(
                                (t) =>
                                    t.name === sourceTable.name &&
                                    t.schema === sourceTable.schema
                            )) ||
                        (targetTable &&
                            importedDiagram.tables?.some(
                                (t) =>
                                    t.name === targetTable.name &&
                                    t.schema === targetTable.schema
                            ))
                    );
                })
                .map((rel) => rel.id);

            console.log('Relationships to remove:', relationshipIdsToRemove);

            // Remove existing tables and relationships that will be replaced
            if (tableIdsToRemove.length > 0) {
                console.log('Removing existing tables');
                removeTables(tableIdsToRemove, { updateHistory: false });
            }
            if (relationshipIdsToRemove.length > 0) {
                console.log('Removing existing relationships');
                removeRelationships(relationshipIdsToRemove, {
                    updateHistory: false,
                });
            }

            if (importedDiagram.tables?.length) {
                console.log('Adding imported tables');
                addTables(importedDiagram.tables, { updateHistory: false });
            }
            if (importedDiagram.relationships?.length) {
                console.log('Adding imported relationships');
                addRelationships(importedDiagram.relationships, {
                    updateHistory: false,
                });
            }

            setReorder(true);
            closeImportSQLDialog();
            console.log('SQL import completed successfully');
        } catch (error) {
            console.error('Error importing SQL:', error);
            setErrorMessage(
                error instanceof Error ? error.message : String(error)
            );
        } finally {
            setIsLoading(false);
        }
    }, [
        sqlContent,
        errorMessage,
        tables,
        relationships,
        addTables,
        addRelationships,
        removeTables,
        removeRelationships,
        closeImportSQLDialog,
        sourceDatabaseType,
        targetDatabaseType,
    ]);

    return (
        <Dialog {...dialog}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('import_sql_dialog.title')}</DialogTitle>
                    <DialogDescription>
                        {t('import_sql_dialog.description')}
                    </DialogDescription>
                </DialogHeader>
                <DialogInternalContent>
                    <div className="flex h-[600px] flex-col">
                        <div className="mb-4">
                            <Label
                                htmlFor="source-db-type"
                                className="mb-2 block"
                            >
                                Source Database Type
                            </Label>
                            <Select
                                value={sourceDatabaseType}
                                onValueChange={(val) =>
                                    setSourceDatabaseType(val as DatabaseType)
                                }
                            >
                                <SelectTrigger
                                    id="source-db-type"
                                    className="w-[280px]"
                                >
                                    <SelectValue placeholder="Select database type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={DatabaseType.POSTGRESQL}>
                                        {databaseTypeToLabelMap['postgresql']}
                                    </SelectItem>
                                    <SelectItem value={DatabaseType.MYSQL}>
                                        {databaseTypeToLabelMap['mysql']}
                                    </SelectItem>
                                    <SelectItem value={DatabaseType.SQL_SERVER}>
                                        {databaseTypeToLabelMap['sql_server']}
                                    </SelectItem>
                                    <SelectItem value={DatabaseType.MARIADB}>
                                        {databaseTypeToLabelMap['mariadb']}
                                    </SelectItem>
                                    <SelectItem value={DatabaseType.SQLITE}>
                                        {databaseTypeToLabelMap['sqlite']}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Suspense
                            fallback={
                                <div className="flex size-full flex-1 items-center justify-center">
                                    <Spinner />
                                </div>
                            }
                        >
                            <div className="size-full flex-1">
                                <Editor
                                    language="sql"
                                    value={sqlContent}
                                    onChange={(value) =>
                                        setSQLContent(value || '')
                                    }
                                    onMount={handleEditorDidMount}
                                    options={{
                                        minimap: { enabled: false },
                                        scrollBeyondLastLine: false,
                                        glyphMargin: true,
                                    }}
                                />
                            </div>
                        </Suspense>
                        {errorMessage && (
                            <div className="mb-4 mt-2 flex items-center space-x-2 rounded-sm bg-destructive/20 p-2 text-destructive">
                                <AlertCircle size={18} />
                                <span>{errorMessage}</span>
                            </div>
                        )}
                    </div>
                </DialogInternalContent>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">
                            {t('import_sql_dialog.cancel')}
                        </Button>
                    </DialogClose>
                    <Button
                        onClick={handleImport}
                        disabled={
                            !sqlContent.trim() ||
                            Boolean(errorMessage) ||
                            isLoading
                        }
                    >
                        {isLoading ? <Spinner className="mr-2 size-4" /> : null}
                        {t('import_sql_dialog.import')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
