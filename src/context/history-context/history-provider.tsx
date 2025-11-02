import React, { useMemo } from 'react';
import { historyContext } from './history-context';
import { useChartDB } from '@/hooks/use-chartdb';
import { useRedoUndoStack } from '@/hooks/use-redo-undo-stack';
import type { RedoUndoActionHandlers } from './redo-undo-action';

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
        addTables,
        removeTables,
        updateTable,
        updateDiagramName,
        removeField,
        addField,
        updateField,
        addRelationships,
        addDependencies,
        removeDependencies,
        updateDependency,
        updateRelationship,
        updateTablesState,
        addIndex,
        removeIndex,
        updateIndex,
        removeRelationships,
        addAreas,
        removeAreas,
        updateArea,
        addCustomTypes,
        removeCustomTypes,
        updateCustomType,
        addNotes,
        removeNotes,
        updateNote,
    } = useChartDB();

    const redoActionHandlers = useMemo(
        (): RedoUndoActionHandlers => ({
            updateDiagramName: ({ redoData: { name } }) => {
                return updateDiagramName(name, { updateHistory: false });
            },
            addTables: ({ redoData: { tables } }) => {
                return addTables(tables, { updateHistory: false });
            },
            removeTables: ({ redoData: { tableIds } }) => {
                return removeTables(tableIds, { updateHistory: false });
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
            addRelationships: ({ redoData: { relationships } }) => {
                return addRelationships(relationships, {
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
            addDependencies: ({ redoData: { dependencies } }) => {
                return addDependencies(dependencies, { updateHistory: false });
            },
            removeDependencies: ({ redoData: { dependenciesIds } }) => {
                return removeDependencies(dependenciesIds, {
                    updateHistory: false,
                });
            },
            updateDependency: ({ redoData: { dependencyId, dependency } }) => {
                return updateDependency(dependencyId, dependency, {
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
            addAreas: ({ redoData: { areas } }) => {
                return addAreas(areas, { updateHistory: false });
            },
            removeAreas: ({ redoData: { areaIds } }) => {
                return removeAreas(areaIds, { updateHistory: false });
            },
            updateArea: ({ redoData: { areaId, area } }) => {
                return updateArea(areaId, area, { updateHistory: false });
            },
            addCustomTypes: ({ redoData: { customTypes } }) => {
                return addCustomTypes(customTypes, { updateHistory: false });
            },
            removeCustomTypes: ({ redoData: { customTypeIds } }) => {
                return removeCustomTypes(customTypeIds, {
                    updateHistory: false,
                });
            },
            updateCustomType: ({ redoData: { customTypeId, customType } }) => {
                return updateCustomType(customTypeId, customType, {
                    updateHistory: false,
                });
            },
            addNotes: ({ redoData: { notes } }) => {
                return addNotes(notes, { updateHistory: false });
            },
            removeNotes: ({ redoData: { noteIds } }) => {
                return removeNotes(noteIds, { updateHistory: false });
            },
            updateNote: ({ redoData: { noteId, note } }) => {
                return updateNote(noteId, note, { updateHistory: false });
            },
        }),
        [
            addTables,
            removeTables,
            updateTable,
            updateDiagramName,
            removeField,
            addField,
            updateField,
            addRelationships,
            updateRelationship,
            updateTablesState,
            addIndex,
            removeIndex,
            updateIndex,
            removeRelationships,
            addDependencies,
            removeDependencies,
            updateDependency,
            addAreas,
            removeAreas,
            updateArea,
            addCustomTypes,
            removeCustomTypes,
            updateCustomType,
            addNotes,
            removeNotes,
            updateNote,
        ]
    );

    const undoActionHandlers = useMemo(
        (): RedoUndoActionHandlers => ({
            updateDiagramName: ({ undoData: { name } }) => {
                return updateDiagramName(name, { updateHistory: false });
            },
            addTables: ({ undoData: { tableIds } }) => {
                return removeTables(tableIds, { updateHistory: false });
            },
            removeTables: async ({
                undoData: { tables, relationships, dependencies },
            }) => {
                await Promise.all([
                    addTables(tables, { updateHistory: false }),
                    addRelationships(relationships, { updateHistory: false }),
                    addDependencies(dependencies, { updateHistory: false }),
                ]);
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
            addRelationships: ({ undoData: { relationshipIds } }) => {
                return removeRelationships(relationshipIds, {
                    updateHistory: false,
                });
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
            addDependencies: ({ undoData: { dependenciesIds } }) => {
                return removeDependencies(dependenciesIds, {
                    updateHistory: false,
                });
            },
            removeDependencies: ({ undoData: { dependencies } }) => {
                return addDependencies(dependencies, {
                    updateHistory: false,
                });
            },
            updateDependency: ({ undoData: { dependencyId, dependency } }) => {
                return updateDependency(dependencyId, dependency, {
                    updateHistory: false,
                });
            },
            updateTablesState: async ({
                undoData: { tables, relationships, dependencies },
            }) => {
                await Promise.all([
                    updateTablesState(() => tables, {
                        updateHistory: false,
                        forceOverride: true,
                    }),
                    addRelationships(relationships, { updateHistory: false }),
                    addDependencies(dependencies, { updateHistory: false }),
                ]);
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
            addAreas: ({ undoData: { areaIds } }) => {
                return removeAreas(areaIds, { updateHistory: false });
            },
            removeAreas: ({ undoData: { areas } }) => {
                return addAreas(areas, { updateHistory: false });
            },
            updateArea: ({ undoData: { areaId, area } }) => {
                return updateArea(areaId, area, { updateHistory: false });
            },
            addCustomTypes: ({ undoData: { customTypeIds } }) => {
                return removeCustomTypes(customTypeIds, {
                    updateHistory: false,
                });
            },
            removeCustomTypes: ({ undoData: { customTypes } }) => {
                return addCustomTypes(customTypes, { updateHistory: false });
            },
            updateCustomType: ({ undoData: { customTypeId, customType } }) => {
                return updateCustomType(customTypeId, customType, {
                    updateHistory: false,
                });
            },
            addNotes: ({ undoData: { noteIds } }) => {
                return removeNotes(noteIds, { updateHistory: false });
            },
            removeNotes: ({ undoData: { notes } }) => {
                return addNotes(notes, { updateHistory: false });
            },
            updateNote: ({ undoData: { noteId, note } }) => {
                return updateNote(noteId, note, { updateHistory: false });
            },
        }),
        [
            addTables,
            removeTables,
            updateTable,
            updateDiagramName,
            removeField,
            addField,
            updateField,
            addRelationships,
            updateRelationship,
            updateTablesState,
            addIndex,
            removeIndex,
            updateIndex,
            removeRelationships,
            addDependencies,
            removeDependencies,
            updateDependency,
            addAreas,
            removeAreas,
            updateArea,
            addCustomTypes,
            removeCustomTypes,
            updateCustomType,
            addNotes,
            removeNotes,
            updateNote,
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
