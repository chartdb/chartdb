import React, { useMemo } from 'react';
import { historyContext } from './history-context';
import { useChartDB } from '@/hooks/use-chartdb';
import { useRedoUndoStack } from '@/hooks/use-redo-undo-stack';
import { RedoUndoActionHandlers } from './redo-undo-action';

export const HistoryProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const {
        addRedoAction,
        addUndoAction,
        undoStack,
        redoStack,
        hasRedo,
        hasUndo,
    } = useRedoUndoStack();
    const {
        addTable,
        removeTable,
        updateTable,
        updateDiagramName,
        removeField,
        addField,
        updateField,
        addRelationship,
        addRelationships,
        removeRelationship,
        updateRelationship,
        updateTablesState,
        addIndex,
        removeIndex,
        updateIndex,
        removeRelationships,
    } = useChartDB();

    const redoActionHandlers = useMemo(
        (): RedoUndoActionHandlers => ({
            updateDiagramName: ({ redoData: { name } }) => {
                return updateDiagramName(name, { updateHistory: false });
            },
            addTable: ({ redoData: { table } }) => {
                return addTable(table, { updateHistory: false });
            },
            removeTable: ({ redoData: { tableId } }) => {
                return removeTable(tableId, { updateHistory: false });
            },
            updateTable: ({ redoData: { tableId, table } }) => {
                return updateTable(tableId, table, { updateHistory: false });
            },
            updateTablesState: ({ redoData: { tables } }) => {
                return updateTablesState(() => tables, {
                    updateHistory: false,
                    forceOverride: true,
                });
            },
            addField: ({ redoData: { tableId, field } }) => {
                return addField(tableId, field, { updateHistory: false });
            },
            removeField: ({ redoData: { tableId, fieldId } }) => {
                return removeField(tableId, fieldId, { updateHistory: false });
            },
            updateField: ({ redoData: { tableId, fieldId, field } }) => {
                return updateField(tableId, fieldId, field, {
                    updateHistory: false,
                });
            },
            addRelationship: ({ redoData: { relationship } }) => {
                return addRelationship(relationship, { updateHistory: false });
            },
            addRelationships: ({ redoData: { relationships } }) => {
                return addRelationships(relationships, {
                    updateHistory: false,
                });
            },
            removeRelationship: ({ redoData: { relationshipId } }) => {
                return removeRelationship(relationshipId, {
                    updateHistory: false,
                });
            },
            updateRelationship: ({
                redoData: { relationshipId, relationship },
            }) => {
                return updateRelationship(relationshipId, relationship, {
                    updateHistory: false,
                });
            },
            removeRelationships: ({ redoData: { relationshipsIds } }) => {
                return removeRelationships(relationshipsIds, {
                    updateHistory: false,
                });
            },
            addIndex: ({ redoData: { tableId, index } }) => {
                return addIndex(tableId, index, { updateHistory: false });
            },
            removeIndex: ({ redoData: { tableId, indexId } }) => {
                return removeIndex(tableId, indexId, { updateHistory: false });
            },
            updateIndex: ({ redoData: { tableId, indexId, index } }) => {
                return updateIndex(tableId, indexId, index, {
                    updateHistory: false,
                });
            },
        }),
        [
            addTable,
            removeTable,
            updateTable,
            updateDiagramName,
            removeField,
            addField,
            updateField,
            addRelationship,
            addRelationships,
            removeRelationship,
            updateRelationship,
            updateTablesState,
            addIndex,
            removeIndex,
            updateIndex,
            removeRelationships,
        ]
    );

    const undoActionHandlers = useMemo(
        (): RedoUndoActionHandlers => ({
            updateDiagramName: ({ undoData: { name } }) => {
                return updateDiagramName(name, { updateHistory: false });
            },
            addTable: ({ undoData: { tableId } }) => {
                return removeTable(tableId, { updateHistory: false });
            },
            removeTable: ({ undoData: { table } }) => {
                return addTable(table, { updateHistory: false });
            },
            updateTable: ({ undoData: { tableId, table } }) => {
                return updateTable(tableId, table, { updateHistory: false });
            },
            addField: ({ undoData: { fieldId, tableId } }) => {
                return removeField(tableId, fieldId, { updateHistory: false });
            },
            removeField: ({ undoData: { tableId, field } }) => {
                return addField(tableId, field, { updateHistory: false });
            },
            updateField: ({ undoData: { tableId, fieldId, field } }) => {
                return updateField(tableId, fieldId, field, {
                    updateHistory: false,
                });
            },
            addRelationship: ({ undoData: { relationshipId } }) => {
                return removeRelationship(relationshipId, {
                    updateHistory: false,
                });
            },
            removeRelationship: ({ undoData: { relationship } }) => {
                return addRelationship(relationship, { updateHistory: false });
            },
            removeRelationships: ({ undoData: { relationships } }) => {
                return addRelationships(relationships, {
                    updateHistory: false,
                });
            },
            updateRelationship: ({
                undoData: { relationshipId, relationship },
            }) => {
                return updateRelationship(relationshipId, relationship, {
                    updateHistory: false,
                });
            },
            updateTablesState: ({ undoData: { tables } }) => {
                return updateTablesState(() => tables, {
                    updateHistory: false,
                    forceOverride: true,
                });
            },
            addIndex: ({ undoData: { tableId, indexId } }) => {
                return removeIndex(tableId, indexId, { updateHistory: false });
            },
            removeIndex: ({ undoData: { tableId, index } }) => {
                return addIndex(tableId, index, { updateHistory: false });
            },
            updateIndex: ({ undoData: { tableId, indexId, index } }) => {
                return updateIndex(tableId, indexId, index, {
                    updateHistory: false,
                });
            },
            addRelationships: ({ undoData: { relationshipIds } }) => {
                return removeRelationships(relationshipIds, {
                    updateHistory: false,
                });
            },
        }),
        [
            addTable,
            removeTable,
            updateTable,
            updateDiagramName,
            removeField,
            addField,
            updateField,
            addRelationship,
            addRelationships,
            removeRelationship,
            updateRelationship,
            updateTablesState,
            addIndex,
            removeIndex,
            updateIndex,
            removeRelationships,
        ]
    );

    const undo = async () => {
        const action = undoStack.pop();
        if (!action) {
            return;
        }

        const handler = undoActionHandlers[action.action];
        addRedoAction(action);

        await handler?.({
            undoData: action.undoData,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);
    };

    const redo = async () => {
        const action = redoStack.pop();
        if (!action) {
            return;
        }

        const handler = redoActionHandlers[action.action];
        addUndoAction(action);

        await handler?.({
            redoData: action.redoData,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);
    };

    return (
        <historyContext.Provider value={{ undo, redo, hasRedo, hasUndo }}>
            {children}
        </historyContext.Provider>
    );
};
