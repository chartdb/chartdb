import { Dialog, DialogContent } from '@/components/dialog/dialog';
import { useDialog } from '@/hooks/use-dialog';
import { DatabaseType } from '@/lib/domain/database-type';
import React, { useCallback, useEffect, useState } from 'react';
import { ImportDatabase } from '../common/import-database/import-database';
import type { DatabaseEdition } from '@/lib/domain/database-edition';
import type { DatabaseMetadata } from '@/lib/data/import-metadata/metadata-types/database-metadata';
import { loadDatabaseMetadata } from '@/lib/data/import-metadata/metadata-types/database-metadata';
import type { Diagram } from '@/lib/domain/diagram';
import { loadFromDatabaseMetadata } from '@/lib/domain/diagram';
import { useChartDB } from '@/hooks/use-chartdb';
import { useRedoUndoStack } from '@/hooks/use-redo-undo-stack';
import { Trans, useTranslation } from 'react-i18next';
import { useReactFlow } from '@xyflow/react';
import type { BaseDialogProps } from '../common/base-dialog-props';
import { useAlert } from '@/context/alert-context/alert-context';
import { sqlImportToDiagram } from '@/lib/data/sql-import';

export interface ImportDatabaseDialogProps extends BaseDialogProps {
    databaseType: DatabaseType;
}

export const ImportDatabaseDialog: React.FC<ImportDatabaseDialogProps> = ({
    dialog,
    databaseType,
}) => {
    const [importMethod, setImportMethod] = useState<'query' | 'ddl'>('query');
    const { closeImportDatabaseDialog } = useDialog();
    const { showAlert } = useAlert();
    const {
        tables,
        relationships,
        removeTables,
        removeRelationships,
        addTables,
        addRelationships,
        diagramName,
        databaseType: currentDatabaseType,
        updateDatabaseType,
    } = useChartDB();
    const [scriptResult, setScriptResult] = useState('');
    const { resetRedoStack, resetUndoStack } = useRedoUndoStack();
    const { setNodes } = useReactFlow();
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
    }, [dialog.open]);

    const importDatabase = useCallback(async () => {
        let diagram: Diagram | undefined;

        if (importMethod === 'ddl') {
            diagram = await sqlImportToDiagram({
                sqlContent: scriptResult,
                sourceDatabaseType: databaseType,
                targetDatabaseType: databaseType,
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

        const tableIdsToRemove = tables
            .filter((table) =>
                diagram.tables?.some(
                    (t) => t.name === table.name && t.schema === table.schema
                )
            )
            .map((table) => table.id);

        const relationshipIdsToRemove = relationships
            .filter((relationship) => {
                const sourceTable = tables.find(
                    (table) => table.id === relationship.sourceTableId
                );

                const targetTable = tables.find(
                    (table) => table.id === relationship.targetTableId
                );

                if (!sourceTable || !targetTable) return true; // should not happen

                const sourceField = sourceTable.fields.find(
                    (field) => field.id === relationship.sourceFieldId
                );

                const targetField = targetTable.fields.find(
                    (field) => field.id === relationship.targetFieldId
                );

                if (!sourceField || !targetField) return true; // should not happen

                const replacementSourceTable = diagram.tables?.find(
                    (table) =>
                        table.name === sourceTable.name &&
                        table.schema === sourceTable.schema
                );

                const replacementTargetTable = diagram.tables?.find(
                    (table) =>
                        table.name === targetTable.name &&
                        table.schema === targetTable.schema
                );

                // if the source or target field of the relationship is not in the new table, remove the relationship
                if (
                    (replacementSourceTable &&
                        !replacementSourceTable.fields.some(
                            (field) => field.name === sourceField.name
                        )) ||
                    (replacementTargetTable &&
                        !replacementTargetTable.fields.some(
                            (field) => field.name === targetField.name
                        ))
                ) {
                    return true;
                }

                return diagram.relationships?.some((r) => {
                    const sourceNewTable = diagram.tables?.find(
                        (table) => table.id === r.sourceTableId
                    );

                    const targetNewTable = diagram.tables?.find(
                        (table) => table.id === r.targetTableId
                    );

                    const sourceNewField = sourceNewTable?.fields.find(
                        (field) => field.id === r.sourceFieldId
                    );

                    const targetNewField = targetNewTable?.fields.find(
                        (field) => field.id === r.targetFieldId
                    );

                    return (
                        sourceField.name === sourceNewField?.name &&
                        sourceTable.name === sourceNewTable?.name &&
                        sourceTable.schema === sourceNewTable?.schema &&
                        targetField.name === targetNewField?.name &&
                        targetTable.name === targetNewTable?.name &&
                        targetTable.schema === targetNewTable?.schema
                    );
                });
            })
            .map((relationship) => relationship.id);

        const newRelationshipsNumber = diagram.relationships?.filter(
            (relationship) => {
                const newSourceTable = diagram.tables?.find(
                    (table) => table.id === relationship.sourceTableId
                );
                const newTargetTable = diagram.tables?.find(
                    (table) => table.id === relationship.targetTableId
                );
                const newSourceField = newSourceTable?.fields.find(
                    (field) => field.id === relationship.sourceFieldId
                );
                const newTargetField = newTargetTable?.fields.find(
                    (field) => field.id === relationship.targetFieldId
                );

                return !relationships.some((r) => {
                    const sourceTable = tables.find(
                        (table) => table.id === r.sourceTableId
                    );
                    const targetTable = tables.find(
                        (table) => table.id === r.targetTableId
                    );
                    const sourceField = sourceTable?.fields.find(
                        (field) => field.id === r.sourceFieldId
                    );
                    const targetField = targetTable?.fields.find(
                        (field) => field.id === r.targetFieldId
                    );
                    return (
                        sourceField?.name === newSourceField?.name &&
                        sourceTable?.name === newSourceTable?.name &&
                        sourceTable?.schema === newSourceTable?.schema &&
                        targetField?.name === newTargetField?.name &&
                        targetTable?.name === newTargetTable?.name &&
                        targetTable?.schema === newTargetTable?.schema
                    );
                });
            }
        ).length;

        const newTablesNumber = diagram.tables?.filter(
            (table) =>
                !tables.some(
                    (t) => t.name === table.name && t.schema === table.schema
                )
        ).length;

        const shouldRemove = new Promise<boolean>((resolve) => {
            if (
                tableIdsToRemove.length === 0 &&
                relationshipIdsToRemove.length === 0 &&
                newTablesNumber === 0 &&
                newRelationshipsNumber === 0
            ) {
                resolve(true);
                return;
            }

            const content = (
                <>
                    <div className="!mb-2">
                        {t(
                            'import_database_dialog.override_alert.content.alert'
                        )}
                    </div>
                    {(newTablesNumber ?? 0 > 0) ? (
                        <div className="!m-0 text-blue-500">
                            <Trans
                                i18nKey="import_database_dialog.override_alert.content.new_tables"
                                values={{
                                    newTablesNumber,
                                }}
                                components={{
                                    bold: <span className="font-bold" />,
                                }}
                            />
                        </div>
                    ) : null}
                    {(newRelationshipsNumber ?? 0 > 0) ? (
                        <div className="!m-0 text-blue-500">
                            <Trans
                                i18nKey="import_database_dialog.override_alert.content.new_relationships"
                                values={{
                                    newRelationshipsNumber,
                                }}
                                components={{
                                    bold: <span className="font-bold" />,
                                }}
                            />
                        </div>
                    ) : null}
                    {tableIdsToRemove.length > 0 && (
                        <div className="!m-0 text-red-500">
                            <Trans
                                i18nKey="import_database_dialog.override_alert.content.tables_override"
                                values={{
                                    tablesOverrideNumber:
                                        tableIdsToRemove.length,
                                }}
                                components={{
                                    bold: <span className="font-bold" />,
                                }}
                            />
                        </div>
                    )}
                    <div className="!mt-2">
                        {t(
                            'import_database_dialog.override_alert.content.proceed'
                        )}
                    </div>
                </>
            );

            showAlert({
                title: t('import_database_dialog.override_alert.title'),
                content,
                actionLabel: t('import_database_dialog.override_alert.import'),
                closeLabel: t('import_database_dialog.override_alert.cancel'),
                onAction: () => resolve(true),
                onClose: () => resolve(false),
            });
        });

        if (!(await shouldRemove)) return;

        await Promise.all([
            removeTables(tableIdsToRemove, { updateHistory: false }),
            removeRelationships(relationshipIdsToRemove, {
                updateHistory: false,
            }),
        ]);

        await Promise.all([
            addTables(diagram.tables ?? [], { updateHistory: false }),
            addRelationships(diagram.relationships ?? [], {
                updateHistory: false,
            }),
        ]);

        if (currentDatabaseType === DatabaseType.GENERIC) {
            await updateDatabaseType(databaseType);
        }

        setNodes((nodes) =>
            nodes.map((node) => ({
                ...node,
                selected:
                    diagram.tables?.some((table) => table.id === node.id) ??
                    false,
            }))
        );

        resetRedoStack();
        resetUndoStack();

        closeImportDatabaseDialog();
    }, [
        importMethod,
        databaseEdition,
        currentDatabaseType,
        updateDatabaseType,
        databaseType,
        scriptResult,
        tables,
        addRelationships,
        addTables,
        closeImportDatabaseDialog,
        relationships,
        removeRelationships,
        removeTables,
        resetRedoStack,
        resetUndoStack,
        showAlert,
        setNodes,
        t,
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
                />
            </DialogContent>
        </Dialog>
    );
};
