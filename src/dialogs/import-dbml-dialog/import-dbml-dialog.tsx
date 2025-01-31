import React, { useCallback, useEffect, useState } from 'react';
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
import { Editor } from '@/components/code-snippet/code-editor';
import { useTheme } from '@/hooks/use-theme';
import { AlertCircle } from 'lucide-react';
import { useMonaco } from '@monaco-editor/react';
import { setupDBMLLanguage } from '@/lib/monaco/dbml-language';
import { importDBMLToDiagram } from '@/lib/dbml-import';
import { useChartDB } from '@/hooks/use-chartdb';
import { Parser } from '@dbml/core';
import { useCanvas } from '@/hooks/use-canvas';
import { DatabaseType } from '@/lib/domain/database-type';

export interface ImportDBMLDialogProps extends BaseDialogProps {}

export const ImportDBMLDialog: React.FC<ImportDBMLDialogProps> = ({
    dialog,
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
    const [error, setError] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [isValidDBML, setIsValidDBML] = useState(false);
    const { effectiveTheme } = useTheme();
    const monaco = useMonaco();
    const {
        addTables,
        addRelationships,
        tables,
        relationships,
        removeTables,
        removeRelationships,
        databaseType: currentDatabaseType,
        updateDatabaseType,
    } = useChartDB();
    const { reorderTables, fitView } = useCanvas();
    const [reordered, setReordered] = useState(false);

    useEffect(() => {
        if (!monaco) return;
        setupDBMLLanguage(monaco);
    }, [monaco]);

    useEffect(() => {
        if (!dialog.open) return;
        setError(false);
        setErrorMessage('');
        setIsValidDBML(true);
        setDBMLContent(initialDBML);
    }, [dialog.open, initialDBML]);

    // Validate DBML content
    useEffect(() => {
        const validateDBML = async () => {
            if (!dbmlContent.trim()) {
                setIsValidDBML(false);
                setError(false);
                setErrorMessage('');
                return;
            }

            try {
                const parser = new Parser();
                parser.parse(dbmlContent, 'dbml');
                setIsValidDBML(true);
                setError(false);
                setErrorMessage('');
            } catch (e) {
                setIsValidDBML(false);
                setError(true);
                setErrorMessage(
                    e instanceof Error ? e.message : 'Invalid DBML syntax'
                );
            }
        };

        validateDBML();
    }, [dbmlContent]);

    const handleImport = useCallback(async () => {
        if (!dbmlContent.trim() || !isValidDBML) return;

        try {
            const importedDiagram = await importDBMLToDiagram(dbmlContent);
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

            if (currentDatabaseType === DatabaseType.GENERIC) {
                await updateDatabaseType(DatabaseType.GENERIC);
            }

            setReordered(true);
            closeImportDBMLDialog();
        } catch (e) {
            setError(true);
            setErrorMessage(
                e instanceof Error
                    ? `Failed to import DBML: ${e.message}`
                    : 'Failed to import DBML'
            );
        }
    }, [
        dbmlContent,
        isValidDBML,
        closeImportDBMLDialog,
        tables,
        relationships,
        removeTables,
        removeRelationships,
        addTables,
        addRelationships,
        currentDatabaseType,
        updateDatabaseType,
    ]);

    useEffect(() => {
        if (reordered) {
            // First reorder the tables
            reorderTables();
            setReordered(false);
        }
    }, [reordered, reorderTables, fitView]);

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
                className="flex h-[80vh] max-h-screen flex-col"
                showClose
            >
                <DialogHeader>
                    <DialogTitle>{t('import_dbml_dialog.title')}</DialogTitle>
                    <DialogDescription>
                        {t('import_dbml_dialog.description')}
                    </DialogDescription>
                </DialogHeader>
                <DialogInternalContent className="flex-1">
                    <div className="flex h-full flex-col gap-4">
                        <div className="relative size-full min-h-[400px]">
                            <Editor
                                value={dbmlContent}
                                onChange={(value) =>
                                    setDBMLContent(value || '')
                                }
                                language="dbml"
                                theme={
                                    effectiveTheme === 'dark'
                                        ? 'dbml-dark'
                                        : 'dbml-light'
                                }
                                options={{
                                    minimap: { enabled: false },
                                    scrollBeyondLastLine: false,
                                    automaticLayout: true,
                                    scrollbar: {
                                        vertical: 'visible',
                                        horizontal: 'visible',
                                    },
                                }}
                                className="size-full"
                            />
                        </div>
                    </div>
                </DialogInternalContent>
                <DialogFooter>
                    <div className="flex w-full items-center justify-between">
                        <div className="flex items-center gap-4">
                            <DialogClose asChild>
                                <Button variant="secondary">
                                    {t('import_dbml_dialog.cancel')}
                                </Button>
                            </DialogClose>
                            {error && (
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="size-4 text-destructive" />
                                    <div className="flex flex-col">
                                        <span className="text-xs text-destructive">
                                            {errorMessage ||
                                                t(
                                                    'import_dbml_dialog.error.description'
                                                )}
                                        </span>
                                        <a
                                            href="https://dbml.dbdiagram.io/docs#table-definition"
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-xs text-muted-foreground hover:text-primary hover:underline"
                                        >
                                            use .dbml docs
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                        <Button
                            onClick={handleImport}
                            disabled={!dbmlContent.trim() || !isValidDBML}
                        >
                            {t('import_dbml_dialog.import')}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
