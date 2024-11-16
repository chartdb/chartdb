import React, { useCallback, useMemo, useState } from 'react';
import type { DBTable } from '@/lib/domain/db-table';
import { deepCopy, generateId } from '@/lib/utils';
import { randomColor } from '@/lib/colors';
import type { ChartDBContext, ChartDBEvent } from './chartdb-context';
import { chartDBContext } from './chartdb-context';
import { DatabaseType } from '@/lib/domain/database-type';
import type { DBField } from '@/lib/domain/db-field';
import type { DBIndex } from '@/lib/domain/db-index';
import type { DBRelationship } from '@/lib/domain/db-relationship';
import { useStorage } from '@/hooks/use-storage';
import { useRedoUndoStack } from '@/hooks/use-redo-undo-stack';
import type { Diagram } from '@/lib/domain/diagram';
import type { DatabaseEdition } from '@/lib/domain/database-edition';
import type { DBSchema } from '@/lib/domain/db-schema';
import {
    databasesWithSchemas,
    schemaNameToSchemaId,
} from '@/lib/domain/db-schema';
import { useLocalConfig } from '@/hooks/use-local-config';
import { defaultSchemas } from '@/lib/data/default-schemas';
import { useEventEmitter } from 'ahooks';
import type { DBDependency } from '@/lib/domain/db-dependency';
import { storageInitialValue } from '../storage-context/storage-context';

export interface ChartDBProviderProps {
    diagram?: Diagram;
    readonly?: boolean;
}
export const ChartDBProvider: React.FC<
    React.PropsWithChildren<ChartDBProviderProps>
> = ({ children, diagram, readonly }) => {
    let db = useStorage();
    const events = useEventEmitter<ChartDBEvent>();
    const { setSchemasFilter, schemasFilter } = useLocalConfig();
    const { addUndoAction, resetRedoStack, resetUndoStack } =
        useRedoUndoStack();
    const [diagramId, setDiagramId] = useState('');
    const [diagramName, setDiagramName] = useState('');
    const [diagramCreatedAt, setDiagramCreatedAt] = useState<Date>(new Date());
    const [diagramUpdatedAt, setDiagramUpdatedAt] = useState<Date>(new Date());
    const [databaseType, setDatabaseType] = useState<DatabaseType>(
        DatabaseType.GENERIC
    );
    const [databaseEdition, setDatabaseEdition] = useState<
        DatabaseEdition | undefined
    >();
    const [tables, setTables] = useState<DBTable[]>(diagram?.tables ?? []);
    const [relationships, setRelationships] = useState<DBRelationship[]>(
        diagram?.relationships ?? []
    );
    const [dependencies, setDependencies] = useState<DBDependency[]>(
        diagram?.dependencies ?? []
    );

    const defaultSchemaName = defaultSchemas[databaseType];

    if (readonly) {
        db = storageInitialValue;
    }

    const schemas = useMemo(
        () =>
            databasesWithSchemas.includes(databaseType)
                ? [
                      ...new Set(
                          tables
                              .map((table) => table.schema)
                              .filter((schema) => !!schema) as string[]
                      ),
                  ]
                      .sort((a, b) =>
                          a === defaultSchemaName ? -1 : a.localeCompare(b)
                      )
                      .map(
                          (schema): DBSchema => ({
                              id: schemaNameToSchemaId(schema),
                              name: schema,
                              tableCount: tables.filter(
                                  (table) => table.schema === schema
                              ).length,
                          })
                      )
                : [],
        [tables, defaultSchemaName, databaseType]
    );

    const filterSchemas: ChartDBContext['filterSchemas'] = useCallback(
        (schemaIds) => {
            setSchemasFilter((prev) => ({
                ...prev,
                [diagramId]: schemaIds,
            }));
        },
        [diagramId, setSchemasFilter]
    );

    const filteredSchemas: ChartDBContext['filteredSchemas'] = useMemo(() => {
        if (schemas.length === 0) {
            return undefined;
        }

        const schemasFilterFromCache =
            (schemasFilter[diagramId] ?? []).length === 0
                ? undefined // in case of empty filter, skip cache
                : schemasFilter[diagramId];

        return (
            schemasFilterFromCache ?? [
                schemas.find((s) => s.name === defaultSchemaName)?.id ??
                    schemas[0]?.id,
            ]
        );
    }, [schemasFilter, diagramId, schemas, defaultSchemaName]);

    const currentDiagram: Diagram = useMemo(
        () => ({
            id: diagramId,
            name: diagramName,
            createdAt: diagramCreatedAt,
            updatedAt: diagramUpdatedAt,
            databaseType,
            databaseEdition,
            tables,
            relationships,
            dependencies,
        }),
        [
            diagramId,
            diagramName,
            databaseType,
            databaseEdition,
            tables,
            relationships,
            dependencies,
            diagramCreatedAt,
            diagramUpdatedAt,
        ]
    );

    const clearDiagramData: ChartDBContext['clearDiagramData'] =
        useCallback(async () => {
            const updatedAt = new Date();
            setTables([]);
            setRelationships([]);
            setDependencies([]);
            setDiagramUpdatedAt(updatedAt);

            resetRedoStack();
            resetUndoStack();

            await Promise.all([
                db.updateDiagram({ id: diagramId, attributes: { updatedAt } }),
                db.deleteDiagramTables(diagramId),
                db.deleteDiagramRelationships(diagramId),
                db.deleteDiagramDependencies(diagramId),
            ]);
        }, [db, diagramId, resetRedoStack, resetUndoStack]);

    const deleteDiagram: ChartDBContext['deleteDiagram'] =
        useCallback(async () => {
            setDiagramId('');
            setDiagramName('');
            setDatabaseType(DatabaseType.GENERIC);
            setDatabaseEdition(undefined);
            setTables([]);
            setRelationships([]);
            setDependencies([]);
            resetRedoStack();
            resetUndoStack();

            await Promise.all([
                db.deleteDiagramTables(diagramId),
                db.deleteDiagramRelationships(diagramId),
                db.deleteDiagram(diagramId),
                db.deleteDiagramDependencies(diagramId),
            ]);
        }, [db, diagramId, resetRedoStack, resetUndoStack]);

    const updateDiagramUpdatedAt: ChartDBContext['updateDiagramUpdatedAt'] =
        useCallback(async () => {
            const updatedAt = new Date();
            setDiagramUpdatedAt(updatedAt);
            await db.updateDiagram({
                id: diagramId,
                attributes: { updatedAt },
            });
        }, [db, diagramId, setDiagramUpdatedAt]);

    const updateDatabaseType: ChartDBContext['updateDatabaseType'] =
        useCallback(
            async (databaseType) => {
                setDatabaseType(databaseType);
                await db.updateDiagram({
                    id: diagramId,
                    attributes: {
                        databaseType,
                    },
                });
            },
            [db, diagramId, setDatabaseType]
        );

    const updateDatabaseEdition: ChartDBContext['updateDatabaseEdition'] =
        useCallback(
            async (databaseEdition) => {
                setDatabaseEdition(databaseEdition);
                await db.updateDiagram({
                    id: diagramId,
                    attributes: {
                        databaseEdition,
                    },
                });
            },
            [db, diagramId, setDatabaseEdition]
        );

    const updateDiagramId: ChartDBContext['updateDiagramId'] = useCallback(
        async (id) => {
            const prevId = diagramId;
            setDiagramId(id);
            await db.updateDiagram({ id: prevId, attributes: { id } });
        },
        [db, diagramId, setDiagramId]
    );

    const updateDiagramName: ChartDBContext['updateDiagramName'] = useCallback(
        async (name, options = { updateHistory: true }) => {
            const prevName = diagramName;
            setDiagramName(name);
            const updatedAt = new Date();
            setDiagramUpdatedAt(updatedAt);
            await db.updateDiagram({
                id: diagramId,
                attributes: { name, updatedAt },
            });

            if (options.updateHistory) {
                addUndoAction({
                    action: 'updateDiagramName',
                    redoData: { name },
                    undoData: { name: prevName },
                });
                resetRedoStack();
            }
        },
        [
            db,
            diagramId,
            setDiagramName,
            addUndoAction,
            diagramName,
            resetRedoStack,
        ]
    );

    const addTables: ChartDBContext['addTables'] = useCallback(
        async (tables: DBTable[], options = { updateHistory: true }) => {
            setTables((currentTables) => [...currentTables, ...tables]);
            const updatedAt = new Date();
            setDiagramUpdatedAt(updatedAt);
            await Promise.all([
                db.updateDiagram({ id: diagramId, attributes: { updatedAt } }),
                ...tables.map((table) => db.addTable({ diagramId, table })),
            ]);

            events.emit({ action: 'add_tables', data: { tables } });

            if (options.updateHistory) {
                addUndoAction({
                    action: 'addTables',
                    redoData: { tables },
                    undoData: { tableIds: tables.map((t) => t.id) },
                });
                resetRedoStack();
            }
        },
        [db, diagramId, setTables, addUndoAction, resetRedoStack, events]
    );

    const addTable: ChartDBContext['addTable'] = useCallback(
        async (table: DBTable, options = { updateHistory: true }) => {
            return addTables([table], options);
        },
        [addTables]
    );

    const createTable: ChartDBContext['createTable'] = useCallback(
        async (attributes) => {
            const table: DBTable = {
                id: generateId(),
                name: `table_${tables.length + 1}`,
                x: 0,
                y: 0,
                fields: [
                    {
                        id: generateId(),
                        name: 'id',
                        type:
                            databaseType === DatabaseType.SQLITE
                                ? { id: 'integer', name: 'integer' }
                                : { id: 'bigint', name: 'bigint' },
                        unique: true,
                        nullable: false,
                        primaryKey: true,
                        createdAt: Date.now(),
                    },
                ],
                indexes: [],
                color: randomColor(),
                createdAt: Date.now(),
                isView: false,
                ...attributes,
            };
            await addTable(table);

            return table;
        },
        [addTable, tables, databaseType]
    );

    const getTable: ChartDBContext['getTable'] = useCallback(
        (id: string) => tables.find((table) => table.id === id) ?? null,
        [tables]
    );

    const removeTables: ChartDBContext['removeTables'] = useCallback(
        async (ids, options) => {
            const tables = ids.map((id) => getTable(id)).filter((t) => !!t);
            const relationshipsToRemove = relationships.filter(
                (relationship) =>
                    ids.includes(relationship.sourceTableId) ||
                    ids.includes(relationship.targetTableId)
            );

            const dependenciesToRemove = dependencies.filter(
                (dependency) =>
                    ids.includes(dependency.tableId) ||
                    ids.includes(dependency.dependentTableId)
            );

            setRelationships((relationships) =>
                relationships.filter(
                    (relationship) =>
                        !relationshipsToRemove.some(
                            (r) => r.id === relationship.id
                        )
                )
            );

            setDependencies((dependencies) =>
                dependencies.filter(
                    (dependency) =>
                        !dependenciesToRemove.some(
                            (d) => d.id === dependency.id
                        )
                )
            );

            setTables((tables) =>
                tables.filter((table) => !ids.includes(table.id))
            );

            events.emit({ action: 'remove_tables', data: { tableIds: ids } });

            const updatedAt = new Date();
            setDiagramUpdatedAt(updatedAt);
            await Promise.all([
                db.updateDiagram({ id: diagramId, attributes: { updatedAt } }),
                ...relationshipsToRemove.map((relationship) =>
                    db.deleteRelationship({ diagramId, id: relationship.id })
                ),
                ...dependenciesToRemove.map((dependency) =>
                    db.deleteDependency({ diagramId, id: dependency.id })
                ),
                ...ids.map((id) => db.deleteTable({ diagramId, id })),
            ]);

            if (tables.length > 0 && options?.updateHistory) {
                addUndoAction({
                    action: 'removeTables',
                    redoData: {
                        tableIds: ids,
                    },
                    undoData: {
                        tables,
                        relationships: relationshipsToRemove,
                        dependencies: dependenciesToRemove,
                    },
                });
                resetRedoStack();
            }
        },
        [
            db,
            diagramId,
            setTables,
            addUndoAction,
            resetRedoStack,
            getTable,
            relationships,
            events,
            dependencies,
        ]
    );

    const removeTable: ChartDBContext['removeTable'] = useCallback(
        async (id: string, options = { updateHistory: true }) => {
            return removeTables([id], options);
        },
        [removeTables]
    );

    const updateTable: ChartDBContext['updateTable'] = useCallback(
        async (
            id: string,
            table: Partial<DBTable>,
            options = { updateHistory: true }
        ) => {
            const prevTable = getTable(id);
            setTables((tables) =>
                tables.map((t) => (t.id === id ? { ...t, ...table } : t))
            );

            events.emit({
                action: 'update_table',
                data: { id, table },
            });

            const updatedAt = new Date();
            setDiagramUpdatedAt(updatedAt);
            await Promise.all([
                db.updateDiagram({ id: diagramId, attributes: { updatedAt } }),
                db.updateTable({ id, attributes: table }),
            ]);

            if (!!prevTable && options.updateHistory) {
                addUndoAction({
                    action: 'updateTable',
                    redoData: { tableId: id, table },
                    undoData: { tableId: id, table: prevTable },
                });
                resetRedoStack();
            }
        },
        [
            db,
            setTables,
            addUndoAction,
            resetRedoStack,
            getTable,
            diagramId,
            events,
        ]
    );

    const updateTablesState: ChartDBContext['updateTablesState'] = useCallback(
        async (
            updateFn: (tables: DBTable[]) => PartialExcept<DBTable, 'id'>[],
            options = { updateHistory: true, forceOverride: false }
        ) => {
            const updateTables = (prevTables: DBTable[]) => {
                const updatedTables = updateFn(prevTables);
                if (options.forceOverride) {
                    return updatedTables as DBTable[];
                }

                return prevTables
                    .map((prevTable) => {
                        const updatedTable = updatedTables.find(
                            (t) => t.id === prevTable.id
                        );
                        return updatedTable
                            ? { ...prevTable, ...updatedTable }
                            : prevTable;
                    })
                    .filter((prevTable) =>
                        updatedTables.some((t) => t.id === prevTable.id)
                    );
            };

            const prevTables = deepCopy(tables);
            const updatedTables = updateTables(tables);

            const tablesToDelete = prevTables.filter(
                (table) => !updatedTables.some((t) => t.id === table.id)
            );

            const relationshipsToRemove = relationships.filter((relationship) =>
                tablesToDelete.some(
                    (table) =>
                        table.id === relationship.sourceTableId ||
                        table.id === relationship.targetTableId
                )
            );

            const dependenciesToRemove = dependencies.filter((dependency) =>
                tablesToDelete.some(
                    (table) =>
                        table.id === dependency.tableId ||
                        table.id === dependency.dependentTableId
                )
            );

            setRelationships((relationships) =>
                relationships.filter(
                    (relationship) =>
                        !relationshipsToRemove.some(
                            (r) => r.id === relationship.id
                        )
                )
            );

            setDependencies((dependencies) =>
                dependencies.filter(
                    (dependency) =>
                        !dependenciesToRemove.some(
                            (d) => d.id === dependency.id
                        )
                )
            );

            setTables(updateTables);

            events.emit({
                action: 'remove_tables',
                data: { tableIds: tablesToDelete.map((t) => t.id) },
            });

            const promises = [];
            for (const updatedTable of updatedTables) {
                promises.push(
                    db.putTable({
                        diagramId,
                        table: updatedTable,
                    })
                );
            }

            for (const table of tablesToDelete) {
                promises.push(db.deleteTable({ diagramId, id: table.id }));
            }

            for (const relationship of relationshipsToRemove) {
                promises.push(
                    db.deleteRelationship({ diagramId, id: relationship.id })
                );
            }

            for (const dependency of dependenciesToRemove) {
                promises.push(
                    db.deleteDependency({ diagramId, id: dependency.id })
                );
            }

            const updatedAt = new Date();
            setDiagramUpdatedAt(updatedAt);
            promises.push(
                db.updateDiagram({ id: diagramId, attributes: { updatedAt } })
            );

            await Promise.all(promises);

            if (options.updateHistory) {
                addUndoAction({
                    action: 'updateTablesState',
                    redoData: { tables: updatedTables },
                    undoData: {
                        tables: prevTables,
                        relationships: relationshipsToRemove,
                        dependencies: dependenciesToRemove,
                    },
                });
                resetRedoStack();
            }
        },
        [
            db,
            tables,
            setTables,
            diagramId,
            addUndoAction,
            resetRedoStack,
            relationships,
            events,
            dependencies,
        ]
    );

    const getField: ChartDBContext['getField'] = useCallback(
        (tableId: string, fieldId: string) => {
            const table = getTable(tableId);
            return table?.fields.find((f) => f.id === fieldId) ?? null;
        },
        [getTable]
    );

    const updateField: ChartDBContext['updateField'] = useCallback(
        async (
            tableId: string,
            fieldId: string,
            field: Partial<DBField>,
            options = { updateHistory: true }
        ) => {
            const prevField = getField(tableId, fieldId);
            setTables((tables) =>
                tables.map((table) =>
                    table.id === tableId
                        ? {
                              ...table,
                              fields: table.fields.map((f) =>
                                  f.id === fieldId ? { ...f, ...field } : f
                              ),
                          }
                        : table
                )
            );

            const table = await db.getTable({ diagramId, id: tableId });
            if (!table) {
                return;
            }

            const updatedAt = new Date();
            setDiagramUpdatedAt(updatedAt);
            await Promise.all([
                db.updateDiagram({ id: diagramId, attributes: { updatedAt } }),
                db.updateTable({
                    id: tableId,
                    attributes: {
                        ...table,
                        fields: table.fields.map((f) =>
                            f.id === fieldId ? { ...f, ...field } : f
                        ),
                    },
                }),
            ]);

            if (!!prevField && options.updateHistory) {
                addUndoAction({
                    action: 'updateField',
                    redoData: {
                        tableId,
                        fieldId,
                        field: { ...prevField, ...field },
                    },
                    undoData: { tableId, fieldId, field: prevField },
                });
                resetRedoStack();
            }
        },
        [db, diagramId, setTables, addUndoAction, resetRedoStack, getField]
    );

    const removeField: ChartDBContext['removeField'] = useCallback(
        async (
            tableId: string,
            fieldId: string,
            options = { updateHistory: true }
        ) => {
            const fields = getTable(tableId)?.fields ?? [];
            const prevField = getField(tableId, fieldId);
            setTables((tables) =>
                tables.map((table) =>
                    table.id === tableId
                        ? {
                              ...table,
                              fields: table.fields.filter(
                                  (f) => f.id !== fieldId
                              ),
                          }
                        : table
                )
            );

            events.emit({
                action: 'remove_field',
                data: {
                    tableId: tableId,
                    fieldId,
                    fields: fields.filter((f) => f.id !== fieldId),
                },
            });

            const table = await db.getTable({ diagramId, id: tableId });
            if (!table) {
                return;
            }

            const updatedAt = new Date();
            setDiagramUpdatedAt(updatedAt);
            await Promise.all([
                db.updateDiagram({ id: diagramId, attributes: { updatedAt } }),
                db.updateTable({
                    id: tableId,
                    attributes: {
                        ...table,
                        fields: table.fields.filter((f) => f.id !== fieldId),
                    },
                }),
            ]);

            if (!!prevField && options.updateHistory) {
                addUndoAction({
                    action: 'removeField',
                    redoData: { tableId, fieldId },
                    undoData: { tableId, field: prevField },
                });
                resetRedoStack();
            }
        },
        [
            db,
            diagramId,
            setTables,
            addUndoAction,
            resetRedoStack,
            getField,
            getTable,
            events,
        ]
    );

    const addField: ChartDBContext['addField'] = useCallback(
        async (
            tableId: string,
            field: DBField,
            options = { updateHistory: true }
        ) => {
            const fields = getTable(tableId)?.fields ?? [];
            setTables((tables) =>
                tables.map((table) =>
                    table.id === tableId
                        ? { ...table, fields: [...table.fields, field] }
                        : table
                )
            );

            events.emit({
                action: 'add_field',
                data: {
                    tableId: tableId,
                    field,
                    fields: [...fields, field],
                },
            });

            const table = await db.getTable({ diagramId, id: tableId });

            if (!table) {
                return;
            }

            const updatedAt = new Date();
            setDiagramUpdatedAt(updatedAt);
            await Promise.all([
                db.updateDiagram({ id: diagramId, attributes: { updatedAt } }),
                db.updateTable({
                    id: tableId,
                    attributes: {
                        ...table,
                        fields: [...table.fields, field],
                    },
                }),
            ]);

            if (options.updateHistory) {
                addUndoAction({
                    action: 'addField',
                    redoData: { tableId, field },
                    undoData: { tableId, fieldId: field.id },
                });
                resetRedoStack();
            }
        },
        [
            db,
            diagramId,
            setTables,
            addUndoAction,
            resetRedoStack,
            events,
            getTable,
        ]
    );

    const createField: ChartDBContext['createField'] = useCallback(
        async (tableId: string) => {
            const table = getTable(tableId);
            const field: DBField = {
                id: generateId(),
                name: `field_${(table?.fields?.length ?? 0) + 1}`,
                type:
                    databaseType === DatabaseType.SQLITE
                        ? { id: 'integer', name: 'integer' }
                        : { id: 'bigint', name: 'bigint' },
                unique: false,
                nullable: true,
                primaryKey: false,
                createdAt: Date.now(),
            };

            await addField(tableId, field);

            return field;
        },
        [addField, getTable, databaseType]
    );

    const getIndex: ChartDBContext['getIndex'] = useCallback(
        (tableId: string, indexId: string) => {
            const table = getTable(tableId);
            return table?.indexes.find((i) => i.id === indexId) ?? null;
        },
        [getTable]
    );

    const addIndex: ChartDBContext['addIndex'] = useCallback(
        async (
            tableId: string,
            index: DBIndex,
            options = { updateHistory: true }
        ) => {
            setTables((tables) =>
                tables.map((table) =>
                    table.id === tableId
                        ? { ...table, indexes: [...table.indexes, index] }
                        : table
                )
            );

            const dbTable = await db.getTable({ diagramId, id: tableId });
            if (!dbTable) {
                return;
            }

            const updatedAt = new Date();
            setDiagramUpdatedAt(updatedAt);
            await Promise.all([
                db.updateDiagram({ id: diagramId, attributes: { updatedAt } }),
                db.updateTable({
                    id: tableId,
                    attributes: {
                        ...dbTable,
                        indexes: [...dbTable.indexes, index],
                    },
                }),
            ]);

            if (options.updateHistory) {
                addUndoAction({
                    action: 'addIndex',
                    redoData: { tableId, index },
                    undoData: { tableId, indexId: index.id },
                });
                resetRedoStack();
            }
        },
        [db, diagramId, setTables, addUndoAction, resetRedoStack]
    );

    const removeIndex: ChartDBContext['removeIndex'] = useCallback(
        async (
            tableId: string,
            indexId: string,
            options = { updateHistory: true }
        ) => {
            const prevIndex = getIndex(tableId, indexId);
            setTables((tables) =>
                tables.map((table) =>
                    table.id === tableId
                        ? {
                              ...table,
                              indexes: table.indexes.filter(
                                  (i) => i.id !== indexId
                              ),
                          }
                        : table
                )
            );

            const dbTable = await db.getTable({
                diagramId,
                id: tableId,
            });

            if (!dbTable) {
                return;
            }

            const updatedAt = new Date();
            setDiagramUpdatedAt(updatedAt);
            await Promise.all([
                db.updateDiagram({ id: diagramId, attributes: { updatedAt } }),
                db.updateTable({
                    id: tableId,
                    attributes: {
                        ...dbTable,
                        indexes: dbTable.indexes.filter(
                            (i) => i.id !== indexId
                        ),
                    },
                }),
            ]);

            if (!!prevIndex && options.updateHistory) {
                addUndoAction({
                    action: 'removeIndex',
                    redoData: { indexId, tableId },
                    undoData: { tableId, index: prevIndex },
                });
                resetRedoStack();
            }
        },
        [db, diagramId, setTables, addUndoAction, resetRedoStack, getIndex]
    );

    const createIndex: ChartDBContext['createIndex'] = useCallback(
        async (tableId: string) => {
            const table = getTable(tableId);
            const index: DBIndex = {
                id: generateId(),
                name: `index_${(table?.indexes?.length ?? 0) + 1}`,
                fieldIds: [],
                unique: false,
                createdAt: Date.now(),
            };

            await addIndex(tableId, index);

            return index;
        },
        [addIndex, getTable]
    );

    const updateIndex: ChartDBContext['updateIndex'] = useCallback(
        async (
            tableId: string,
            indexId: string,
            index: Partial<DBIndex>,
            options = { updateHistory: true }
        ) => {
            const prevIndex = getIndex(tableId, indexId);
            setTables((tables) =>
                tables.map((table) =>
                    table.id === tableId
                        ? {
                              ...table,
                              indexes: table.indexes.map((i) =>
                                  i.id === indexId ? { ...i, ...index } : i
                              ),
                          }
                        : table
                )
            );

            const dbTable = await db.getTable({ diagramId, id: tableId });

            if (!dbTable) {
                return;
            }

            const updatedAt = new Date();
            setDiagramUpdatedAt(updatedAt);
            await Promise.all([
                db.updateDiagram({ id: diagramId, attributes: { updatedAt } }),
                db.updateTable({
                    id: tableId,
                    attributes: {
                        ...dbTable,
                        indexes: dbTable.indexes.map((i) =>
                            i.id === indexId ? { ...i, ...index } : i
                        ),
                    },
                }),
            ]);

            if (!!prevIndex && options.updateHistory) {
                addUndoAction({
                    action: 'updateIndex',
                    redoData: { tableId, indexId, index },
                    undoData: { tableId, indexId, index: prevIndex },
                });
                resetRedoStack();
            }
        },
        [db, diagramId, setTables, addUndoAction, resetRedoStack, getIndex]
    );

    const addRelationships: ChartDBContext['addRelationships'] = useCallback(
        async (
            relationships: DBRelationship[],
            options = { updateHistory: true }
        ) => {
            setRelationships((currentRelationships) => [
                ...currentRelationships,
                ...relationships,
            ]);

            const updatedAt = new Date();
            setDiagramUpdatedAt(updatedAt);

            await Promise.all([
                ...relationships.map((relationship) =>
                    db.addRelationship({ diagramId, relationship })
                ),
                db.updateDiagram({ id: diagramId, attributes: { updatedAt } }),
            ]);

            if (options.updateHistory) {
                addUndoAction({
                    action: 'addRelationships',
                    redoData: { relationships },
                    undoData: {
                        relationshipIds: relationships.map((r) => r.id),
                    },
                });
                resetRedoStack();
            }
        },
        [db, diagramId, setRelationships, addUndoAction, resetRedoStack]
    );

    const addRelationship: ChartDBContext['addRelationship'] = useCallback(
        async (
            relationship: DBRelationship,
            options = { updateHistory: true }
        ) => {
            return addRelationships([relationship], options);
        },
        [addRelationships]
    );

    const createRelationship: ChartDBContext['createRelationship'] =
        useCallback(
            async ({
                sourceTableId,
                targetTableId,
                sourceFieldId,
                targetFieldId,
            }) => {
                const sourceTable = getTable(sourceTableId);
                const sourceTableName = sourceTable?.name ?? '';

                const sourceField = sourceTable?.fields.find(
                    (field: { id: string }) => field.id === sourceFieldId
                );

                const sourceFieldName = sourceField?.name ?? '';

                const relationship: DBRelationship = {
                    id: generateId(),
                    name: `${sourceTableName}_${sourceFieldName}_fk`,
                    sourceSchema: sourceTable?.schema,
                    sourceTableId,
                    targetSchema: sourceTable?.schema,
                    targetTableId,
                    sourceFieldId,
                    targetFieldId,
                    sourceCardinality: 'one',
                    targetCardinality: 'one',
                    createdAt: Date.now(),
                };

                await addRelationship(relationship);

                return relationship;
            },
            [addRelationship, getTable]
        );

    const getRelationship: ChartDBContext['getRelationship'] = useCallback(
        (id: string) =>
            relationships.find((relationship) => relationship.id === id) ??
            null,
        [relationships]
    );

    const removeRelationships: ChartDBContext['removeRelationships'] =
        useCallback(
            async (ids: string[], options = { updateHistory: true }) => {
                const prevRelationships = [
                    ...relationships.filter((relationship) =>
                        ids.includes(relationship.id)
                    ),
                ];

                setRelationships((relationships) =>
                    relationships.filter(
                        (relationship) => !ids.includes(relationship.id)
                    )
                );

                const updatedAt = new Date();
                setDiagramUpdatedAt(updatedAt);
                await Promise.all([
                    ...ids.map((id) =>
                        db.deleteRelationship({ diagramId, id })
                    ),
                    db.updateDiagram({
                        id: diagramId,
                        attributes: { updatedAt },
                    }),
                ]);

                if (prevRelationships.length > 0 && options.updateHistory) {
                    addUndoAction({
                        action: 'removeRelationships',
                        redoData: { relationshipsIds: ids },
                        undoData: { relationships: prevRelationships },
                    });
                    resetRedoStack();
                }
            },
            [
                db,
                diagramId,
                setRelationships,
                relationships,
                addUndoAction,
                resetRedoStack,
            ]
        );

    const removeRelationship: ChartDBContext['removeRelationship'] =
        useCallback(
            async (id: string, options = { updateHistory: true }) => {
                return removeRelationships([id], options);
            },
            [removeRelationships]
        );

    const updateRelationship: ChartDBContext['updateRelationship'] =
        useCallback(
            async (
                id: string,
                relationship: Partial<DBRelationship>,
                options = { updateHistory: true }
            ) => {
                const prevRelationship = getRelationship(id);
                setRelationships((relationships) =>
                    relationships.map((r) =>
                        r.id === id ? { ...r, ...relationship } : r
                    )
                );

                const updatedAt = new Date();
                setDiagramUpdatedAt(updatedAt);
                await Promise.all([
                    db.updateDiagram({
                        id: diagramId,
                        attributes: { updatedAt },
                    }),
                    db.updateRelationship({ id, attributes: relationship }),
                ]);

                if (!!prevRelationship && options.updateHistory) {
                    addUndoAction({
                        action: 'updateRelationship',
                        redoData: { relationshipId: id, relationship },
                        undoData: {
                            relationshipId: id,
                            relationship: prevRelationship,
                        },
                    });
                    resetRedoStack();
                }
            },
            [
                db,
                setRelationships,
                addUndoAction,
                getRelationship,
                resetRedoStack,
                diagramId,
            ]
        );

    const addDependencies: ChartDBContext['addDependencies'] = useCallback(
        async (
            dependencies: DBDependency[],
            options = { updateHistory: true }
        ) => {
            setDependencies((currentDependencies) => [
                ...currentDependencies,
                ...dependencies,
            ]);

            const updatedAt = new Date();
            setDiagramUpdatedAt(updatedAt);

            await Promise.all([
                ...dependencies.map((dependency) =>
                    db.addDependency({ diagramId, dependency })
                ),
                db.updateDiagram({ id: diagramId, attributes: { updatedAt } }),
            ]);

            if (options.updateHistory) {
                addUndoAction({
                    action: 'addDependencies',
                    redoData: { dependencies },
                    undoData: {
                        dependenciesIds: dependencies.map((r) => r.id),
                    },
                });
                resetRedoStack();
            }
        },
        [db, diagramId, setDependencies, addUndoAction, resetRedoStack]
    );

    const addDependency: ChartDBContext['addDependency'] = useCallback(
        async (dependency: DBDependency, options = { updateHistory: true }) => {
            return addDependencies([dependency], options);
        },
        [addDependencies]
    );

    const createDependency: ChartDBContext['createDependency'] = useCallback(
        async ({ tableId, dependentTableId }) => {
            const table = getTable(tableId);
            const dependentTable = getTable(dependentTableId);

            const dependency: DBDependency = {
                id: generateId(),
                tableId,
                dependentTableId,
                dependentSchema: dependentTable?.schema,
                schema: table?.schema,
                createdAt: Date.now(),
            };

            await addDependency(dependency);

            return dependency;
        },
        [addDependency, getTable]
    );

    const getDependency: ChartDBContext['getDependency'] = useCallback(
        (id: string) =>
            dependencies.find((dependency) => dependency.id === id) ?? null,
        [dependencies]
    );

    const removeDependencies: ChartDBContext['removeDependencies'] =
        useCallback(
            async (ids: string[], options = { updateHistory: true }) => {
                const prevDependencies = [
                    ...dependencies.filter((dependency) =>
                        ids.includes(dependency.id)
                    ),
                ];

                setDependencies((dependencies) =>
                    dependencies.filter(
                        (dependency) => !ids.includes(dependency.id)
                    )
                );

                const updatedAt = new Date();
                setDiagramUpdatedAt(updatedAt);
                await Promise.all([
                    ...ids.map((id) => db.deleteDependency({ diagramId, id })),
                    db.updateDiagram({
                        id: diagramId,
                        attributes: { updatedAt },
                    }),
                ]);

                if (prevDependencies.length > 0 && options.updateHistory) {
                    addUndoAction({
                        action: 'removeDependencies',
                        redoData: { dependenciesIds: ids },
                        undoData: { dependencies: prevDependencies },
                    });
                    resetRedoStack();
                }
            },
            [
                db,
                diagramId,
                setDependencies,
                addUndoAction,
                resetRedoStack,
                dependencies,
            ]
        );

    const removeDependency: ChartDBContext['removeDependency'] = useCallback(
        async (id: string, options = { updateHistory: true }) => {
            return removeDependencies([id], options);
        },
        [removeDependencies]
    );

    const updateDependency: ChartDBContext['updateDependency'] = useCallback(
        async (
            id: string,
            dependency: Partial<DBDependency>,
            options = { updateHistory: true }
        ) => {
            const prevDependency = getDependency(id);
            setDependencies((dependencies) =>
                dependencies.map((d) =>
                    d.id === id ? { ...d, ...dependency } : d
                )
            );

            const updatedAt = new Date();
            setDiagramUpdatedAt(updatedAt);
            await Promise.all([
                db.updateDiagram({ id: diagramId, attributes: { updatedAt } }),
                db.updateDependency({ id, attributes: dependency }),
            ]);

            if (!!prevDependency && options.updateHistory) {
                addUndoAction({
                    action: 'updateDependency',
                    redoData: { dependencyId: id, dependency },
                    undoData: { dependencyId: id, dependency: prevDependency },
                });
                resetRedoStack();
            }
        },
        [
            db,
            diagramId,
            setDependencies,
            addUndoAction,
            resetRedoStack,
            getDependency,
        ]
    );

    const loadDiagram: ChartDBContext['loadDiagram'] = useCallback(
        async (diagramId: string) => {
            const diagram = await db.getDiagram(diagramId, {
                includeRelationships: true,
                includeTables: true,
                includeDependencies: true,
            });

            if (diagram) {
                setDiagramId(diagram.id);
                setDiagramName(diagram.name);
                setDatabaseType(diagram.databaseType);
                setDatabaseEdition(diagram.databaseEdition);
                setTables(diagram?.tables ?? []);
                setRelationships(diagram?.relationships ?? []);
                setDependencies(diagram?.dependencies ?? []);
                setDiagramCreatedAt(diagram.createdAt);
                setDiagramUpdatedAt(diagram.updatedAt);

                events.emit({ action: 'load_diagram', data: { diagram } });
            }

            return diagram;
        },
        [
            db,
            setDiagramId,
            setDiagramName,
            setDatabaseType,
            setDatabaseEdition,
            setTables,
            setRelationships,
            setDependencies,
            setDiagramCreatedAt,
            setDiagramUpdatedAt,
            events,
        ]
    );

    return (
        <chartDBContext.Provider
            value={{
                diagramId,
                diagramName,
                databaseType,
                tables,
                relationships,
                dependencies,
                currentDiagram,
                schemas,
                filteredSchemas,
                events,
                readonly,
                filterSchemas,
                updateDiagramId,
                updateDiagramName,
                loadDiagram,
                updateDatabaseType,
                updateDatabaseEdition,
                clearDiagramData,
                deleteDiagram,
                updateDiagramUpdatedAt,
                createTable,
                addTable,
                addTables,
                getTable,
                removeTable,
                removeTables,
                updateTable,
                updateTablesState,
                updateField,
                removeField,
                createField,
                addField,
                addIndex,
                createIndex,
                removeIndex,
                getField,
                getIndex,
                updateIndex,
                addRelationship,
                addRelationships,
                createRelationship,
                getRelationship,
                removeRelationship,
                removeRelationships,
                updateRelationship,
                addDependency,
                addDependencies,
                createDependency,
                getDependency,
                removeDependency,
                removeDependencies,
                updateDependency,
            }}
        >
            {children}
        </chartDBContext.Provider>
    );
};
