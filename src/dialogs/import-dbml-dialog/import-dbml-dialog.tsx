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
import { importDBMLToDiagram } from '@/lib/dbml-import';
import { useChartDB } from '@/hooks/use-chartdb';
import { Parser } from '@dbml/core';
import { useCanvas } from '@/hooks/use-canvas';
import { setupDBMLLanguage } from '@/components/code-snippet/languages/dbml-language';
import { useToast } from '@/components/toast/use-toast';

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

    useEffect(() => {
        if (!dialog.open) return;
        setErrorMessage(undefined);
        setDBMLContent(initialDBML);
    }, [dialog.open, initialDBML]);

    useEffect(() => {
        const validateDBML = async () => {
            if (!dbmlContent.trim()) {
                setErrorMessage(undefined);
                return;
            }

            try {
                const parser = new Parser();
                parser.parse(dbmlContent, 'dbml');
                setErrorMessage(undefined);
            } catch (e) {
                setErrorMessage(
                    e instanceof Error
                        ? e.message
                        : t('import_dbml_dialog.error.description')
                );
            }
        };

        validateDBML();
    }, [dbmlContent, t]);

    const handleImport = useCallback(async () => {
        if (!dbmlContent.trim() || errorMessage) return;

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

            reorderTables({
                updateHistory: false,
            });
            closeImportDBMLDialog();
        } catch (e) {
            toast({
                title: t('import_dbml_dialog.error.title'),
                variant: 'destructive',
                description: (
                    <>
                        <div>{t('import_dbml_dialog.error.description')}</div>
                        {e instanceof Error ? <div>{e.message}</div> : null}
                    </>
                ),
            });
        }
    }, [
        dbmlContent,
        closeImportDBMLDialog,
        tables,
        reorderTables,
        relationships,
        removeTables,
        removeRelationships,
        addTables,
        addRelationships,
        errorMessage,
        toast,
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
                                beforeMount={setupDBMLLanguage}
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
                            {t('import_dbml_dialog.import')}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
