import { Dialog, DialogContent } from '@/components/dialog/dialog';
import { useDialog } from '@/hooks/use-dialog';
import { DatabaseType } from '@/lib/domain/database-type';
import React, { useCallback, useEffect, useState } from 'react';
import { ImportDatabase } from '../common/import-database/import-database';
import type { DatabaseEdition } from '@/lib/domain/database-edition';
import type { DatabaseMetadata } from '@/lib/data/import-metadata/metadata-types/database-metadata';
import { loadDatabaseMetadata } from '@/lib/data/import-metadata/metadata-types/database-metadata';
import type { Diagram } from '@/lib/domain/diagram';
import { loadFromDatabaseMetadata } from '@/lib/data/import-metadata/import';
import { useChartDB } from '@/hooks/use-chartdb';
import { useRedoUndoStack } from '@/hooks/use-redo-undo-stack';
import { useTranslation } from 'react-i18next';
import type { BaseDialogProps } from '../common/base-dialog-props';
import { sqlImportToDiagram } from '@/lib/data/sql-import';
import { importDBMLToDiagram } from '@/lib/dbml/dbml-import/dbml-import';
import type { ImportMethod } from '@/lib/import-method/import-method';

export interface ImportDatabaseDialogProps extends BaseDialogProps {
    databaseType: DatabaseType;
    importMethods?: ImportMethod[];
    initialImportMethod?: ImportMethod;
}

const defaultImportMethods: ImportMethod[] = ['query', 'ddl', 'dbml'];

export const ImportDatabaseDialog: React.FC<ImportDatabaseDialogProps> = ({
    dialog,
    databaseType,
    importMethods = defaultImportMethods,
    initialImportMethod,
}) => {
    const [importMethod, setImportMethod] = useState<ImportMethod>(
        initialImportMethod ?? importMethods[0]
    );
    const { closeImportDatabaseDialog } = useDialog();
    const {
        addTables,
        addRelationships,
        diagramName,
        databaseType: currentDatabaseType,
        updateDatabaseType,
        tables: existingTables,
    } = useChartDB();
    const [scriptResult, setScriptResult] = useState('');
    const { resetRedoStack, resetUndoStack } = useRedoUndoStack();
    const { t } = useTranslation();
    const [databaseEdition, setDatabaseEdition] = useState<
        DatabaseEdition | undefined
    >();

    useEffect(() => {
        setDatabaseEdition(undefined);
    }, [databaseType]);

    useEffect(() => {
        if (!dialog.open) return;
        setDatabaseEdition(undefined);
        setScriptResult('');
        setImportMethod(initialImportMethod ?? importMethods[0]);
    }, [dialog.open, importMethods, initialImportMethod]);

    const importDatabase = useCallback(async () => {
        let diagram: Diagram | undefined;

        if (importMethod === 'ddl') {
            diagram = await sqlImportToDiagram({
                sqlContent: scriptResult,
                sourceDatabaseType: databaseType,
                targetDatabaseType: databaseType,
            });
        } else if (importMethod === 'dbml') {
            diagram = await importDBMLToDiagram(scriptResult, {
                databaseType,
            });
        } else {
            const databaseMetadata: DatabaseMetadata =
                loadDatabaseMetadata(scriptResult);

            diagram = await loadFromDatabaseMetadata({
                databaseType,
                databaseMetadata,
                databaseEdition:
                    databaseEdition?.trim().length === 0
                        ? undefined
                        : databaseEdition,
            });
        }

        // Skip if nothing to import
        const newTablesNumber = diagram.tables?.length ?? 0;
        const newRelationshipsNumber = diagram.relationships?.length ?? 0;
        if (newTablesNumber === 0 && newRelationshipsNumber === 0) {
            return;
        }

        // Close dialog immediately to prevent re-render blocking
        closeImportDatabaseDialog();

        // Calculate position offset for new tables to avoid overlap
        let offsetX = 0;
        if (existingTables.length > 0) {
            // Find the rightmost table
            const rightmostTable = existingTables.reduce((max, table) => {
                const tableRight = table.x + (table.width ?? 250);
                const maxRight = max.x + (max.width ?? 250);
                return tableRight > maxRight ? table : max;
            });
            // Position new tables 150px to the right of the rightmost table
            offsetX = rightmostTable.x + (rightmostTable.width ?? 250) + 150;
        }

        // Apply offset to imported tables
        const positionedTables =
            diagram.tables?.map((table) => ({
                ...table,
                x: table.x + offsetX,
            })) ?? [];

        // Use queueMicrotask to defer work after dialog closes but before next paint
        queueMicrotask(async () => {
            // Add tables and relationships
            await Promise.all([
                addTables(positionedTables, { updateHistory: false }),
                addRelationships(diagram.relationships ?? [], {
                    updateHistory: false,
                }),
            ]);

            if (currentDatabaseType === DatabaseType.GENERIC) {
                await updateDatabaseType(databaseType);
            }

            // Reset undo/redo stacks
            resetRedoStack();
            resetUndoStack();
        });
    }, [
        importMethod,
        databaseEdition,
        currentDatabaseType,
        updateDatabaseType,
        databaseType,
        scriptResult,
        addRelationships,
        addTables,
        resetRedoStack,
        resetUndoStack,
        closeImportDatabaseDialog,
        existingTables,
    ]);

    return (
        <Dialog
            {...dialog}
            onOpenChange={(open) => {
                if (!open) {
                    closeImportDatabaseDialog();
                }
            }}
        >
            <DialogContent
                className="flex max-h-screen w-full flex-col md:max-w-[900px]"
                showClose
            >
                <ImportDatabase
                    databaseType={databaseType}
                    databaseEdition={databaseEdition}
                    setDatabaseEdition={setDatabaseEdition}
                    onImport={importDatabase}
                    scriptResult={scriptResult}
                    setScriptResult={setScriptResult}
                    keepDialogAfterImport
                    title={t('import_database_dialog.title', { diagramName })}
                    importMethod={importMethod}
                    setImportMethod={setImportMethod}
                    importMethods={importMethods}
                />
            </DialogContent>
        </Dialog>
    );
};
