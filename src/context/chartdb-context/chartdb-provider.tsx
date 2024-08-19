import React, { useCallback } from 'react';
import { DBTable } from '@/lib/domain/db-table';
import { generateId, randomHSLA } from '@/lib/utils';
import { ChartDBContext, chartDBContext } from './chartdb-context';
import { DatabaseType } from '@/lib/domain/database-type';
import { DBField } from '@/lib/domain/db-field';
import { DBIndex } from '@/lib/domain/db-index';
import { DBRelationship } from '@/lib/domain/db-relationship';
import { useStorage } from '@/hooks/use-storage';

export const ChartDBProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const [diagramId, setDiagramId] = React.useState('');
    const db = useStorage();
    const [diagramName, setDiagramName] = React.useState('New Diagram');
    const [databaseType, setDatabaseType] = React.useState<DatabaseType>(
        DatabaseType.GENERIC
    );
    const [tables, setTables] = React.useState<DBTable[]>([]);
    const [relationships, setRelationships] = React.useState<DBRelationship[]>(
        []
    );

    const updateDatabaseType: ChartDBContext['updateDatabaseType'] = async (
        databaseType
    ) => {
        setDatabaseType(databaseType);
        await db.updateDiagram({
            id: diagramId,
            attributes: {
                databaseType,
            },
        });
    };
    const updateDiagramId: ChartDBContext['updateDiagramId'] = async (id) => {
        const prevId = diagramId;
        setDiagramId(id);
        await db.updateDiagram({ id: prevId, attributes: { id } });
    };
    const updateDiagramName: ChartDBContext['updateDiagramName'] = async (
        name
    ) => {
        setDiagramName(name);
        await db.updateDiagram({ id: diagramId, attributes: { name } });
    };

    const addTable: ChartDBContext['addTable'] = (table: DBTable) => {
        setTables((tables) => [...tables, table]);
        return db.addTable({ diagramId, table });
    };

    const createTable: ChartDBContext['createTable'] = async () => {
        const table: DBTable = {
            id: generateId(),
            name: `table_${tables.length + 1}`,
            x: 0,
            y: 0,
            fields: [
                {
                    id: generateId(),
                    name: 'id',
                    type: 'bigint',
                    unique: true,
                    nullable: false,
                    primaryKey: true,
                    createdAt: Date.now(),
                },
            ],
            indexes: [],
            color: randomHSLA(),
            createdAt: Date.now(),
        };
        await addTable(table);

        return table;
    };

    const getTable: ChartDBContext['getTable'] = (id: string) =>
        tables.find((table) => table.id === id) ?? null;

    const removeTable: ChartDBContext['removeTable'] = async (id: string) => {
        setTables((tables) => tables.filter((table) => table.id !== id));
        await db.deleteTable({ diagramId, id });
    };

    const updateTable: ChartDBContext['updateTable'] = async (
        id: string,
        table: Partial<DBTable>
    ) => {
        setTables((tables) =>
            tables.map((t) => (t.id === id ? { ...t, ...table } : t))
        );
        await db.updateTable({ id, attributes: table });
    };

    const updateTables: ChartDBContext['updateTables'] = async (
        tables: PartialExcept<DBTable, 'id'>[]
    ) => {
        setTables((currentTables) =>
            currentTables.map((table) => {
                const updatedTable = tables.find((t) => t.id === table.id);
                return updatedTable ? { ...table, ...updatedTable } : table;
            })
        );

        const promises = [];
        for (const table of tables) {
            promises.push(db.updateTable({ id: table.id, attributes: table }));
        }

        await Promise.all(promises);
    };

    const updateTablesState: ChartDBContext['updateTablesState'] = async (
        updateFn: (tables: DBTable[]) => PartialExcept<DBTable, 'id'>[]
    ) => {
        const updatedTables = updateFn(tables);
        setTables((prevTables) => {
            const updatedTables = updateFn(prevTables);
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
        });

        const promises = [];
        for (const updatedTable of updatedTables) {
            promises.push(
                db.updateTable({
                    id: updatedTable.id,
                    attributes: updatedTable,
                })
            );
        }

        const tablesToDelete = tables.filter(
            (table) => !updatedTables.some((t) => t.id === table.id)
        );

        for (const table of tablesToDelete) {
            promises.push(db.deleteTable({ diagramId, id: table.id }));
        }

        await Promise.all(promises);
    };

    const updateField: ChartDBContext['updateField'] = async (
        tableId: string,
        fieldId: string,
        field: Partial<DBField>
    ) => {
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

        await db.updateTable({
            id: tableId,
            attributes: {
                ...table,
                fields: table.fields.map((f) =>
                    f.id === fieldId ? { ...f, ...field } : f
                ),
            },
        });
    };

    const removeField: ChartDBContext['removeField'] = async (
        tableId: string,
        fieldId: string
    ) => {
        setTables((tables) =>
            tables.map((table) =>
                table.id === tableId
                    ? {
                          ...table,
                          fields: table.fields.filter((f) => f.id !== fieldId),
                      }
                    : table
            )
        );

        const table = await db.getTable({ diagramId, id: tableId });
        if (!table) {
            return;
        }

        await db.updateTable({
            id: tableId,
            attributes: {
                ...table,
                fields: table.fields.filter((f) => f.id !== fieldId),
            },
        });
    };

    const addField: ChartDBContext['addField'] = async (
        tableId: string,
        field: DBField
    ) => {
        setTables((tables) =>
            tables.map((table) =>
                table.id === tableId
                    ? { ...table, fields: [...table.fields, field] }
                    : table
            )
        );

        const table = await db.getTable({ diagramId, id: tableId });

        if (!table) {
            return;
        }

        await db.updateTable({
            id: tableId,
            attributes: {
                ...table,
                fields: [...table.fields, field],
            },
        });
    };

    const getField: ChartDBContext['getField'] = (
        tableId: string,
        fieldId: string
    ) => {
        const table = getTable(tableId);
        return table?.fields.find((f) => f.id === fieldId) ?? null;
    };

    const createField: ChartDBContext['createField'] = async (
        tableId: string
    ) => {
        const table = getTable(tableId);
        const field: DBField = {
            id: generateId(),
            name: `field_${(table?.fields?.length ?? 0) + 1}`,
            type: 'bigint',
            unique: false,
            nullable: true,
            primaryKey: false,
            createdAt: Date.now(),
        };

        await addField(tableId, field);

        return field;
    };

    const addIndex: ChartDBContext['addIndex'] = async (
        tableId: string,
        index: DBIndex
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

        await db.updateTable({
            id: tableId,
            attributes: {
                ...dbTable,
                indexes: [...dbTable.indexes, index],
            },
        });
    };

    const removeIndex: ChartDBContext['removeIndex'] = async (
        tableId: string,
        indexId: string
    ) => {
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

        await db.updateTable({
            id: tableId,
            attributes: {
                ...dbTable,
                indexes: dbTable.indexes.filter((i) => i.id !== indexId),
            },
        });
    };

    const createIndex: ChartDBContext['createIndex'] = async (
        tableId: string
    ) => {
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
    };

    const getIndex: ChartDBContext['getIndex'] = (
        tableId: string,
        indexId: string
    ) => {
        const table = getTable(tableId);
        return table?.indexes.find((i) => i.id === indexId) ?? null;
    };

    const updateIndex: ChartDBContext['updateIndex'] = async (
        tableId: string,
        indexId: string,
        index: Partial<DBIndex>
    ) => {
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

        await db.updateTable({
            id: tableId,
            attributes: {
                ...dbTable,
                indexes: dbTable.indexes.map((i) =>
                    i.id === indexId ? { ...i, ...index } : i
                ),
            },
        });
    };

    const addRelationship: ChartDBContext['addRelationship'] = async (
        relationship: DBRelationship
    ) => {
        setRelationships((relationships) => [...relationships, relationship]);

        await db.addRelationship({ diagramId, relationship });
    };

    const createRelationship: ChartDBContext['createRelationship'] = async ({
        sourceTableId,
        targetTableId,
        sourceFieldId,
        targetFieldId,
    }) => {
        const sourceTableName = getTable(sourceTableId)?.name ?? '';
        const targetTableName = getTable(targetTableId)?.name ?? '';
        const relationship: DBRelationship = {
            id: generateId(),
            name: `${sourceTableName}_${targetTableName}_fk`,
            sourceTableId,
            targetTableId,
            sourceFieldId,
            targetFieldId,
            type: 'one_to_one',
            createdAt: Date.now(),
        };

        await addRelationship(relationship);

        return relationship;
    };

    const getRelationship: ChartDBContext['getRelationship'] = (id: string) =>
        relationships.find((relationship) => relationship.id === id) ?? null;

    const removeRelationship: ChartDBContext['removeRelationship'] = async (
        id: string
    ) => {
        setRelationships((relationships) =>
            relationships.filter((relationship) => relationship.id !== id)
        );

        await db.deleteRelationship({ diagramId, id });
    };

    const removeRelationships: ChartDBContext['removeRelationships'] = async (
        ...ids: string[]
    ) => {
        setRelationships((relationships) =>
            relationships.filter(
                (relationship) => !ids.includes(relationship.id)
            )
        );

        await Promise.all(
            ids.map((id) => db.deleteRelationship({ diagramId, id }))
        );
    };

    const updateRelationship: ChartDBContext['updateRelationship'] = async (
        id: string,
        relationship: Partial<DBRelationship>
    ) => {
        setRelationships((relationships) =>
            relationships.map((r) =>
                r.id === id ? { ...r, ...relationship } : r
            )
        );

        await db.updateRelationship({ id, attributes: relationship });
    };

    const loadDiagram: ChartDBContext['loadDiagram'] = useCallback(
        async (diagramId: string) => {
            const diagram = await db.getDiagram(diagramId, {
                includeRelationships: true,
                includeTables: true,
            });

            if (diagram) {
                setDiagramId(diagram.id);
                setDiagramName(diagram.name);
                setDatabaseType(diagram.databaseType);
                setTables(diagram?.tables ?? []);
                setRelationships(diagram?.relationships ?? []);
            }

            return diagram;
        },
        [
            db,
            setDiagramId,
            setDiagramName,
            setDatabaseType,
            setTables,
            setRelationships,
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
                updateDiagramId,
                updateDiagramName,
                loadDiagram,
                updateDatabaseType,
                createTable,
                addTable,
                getTable,
                removeTable,
                updateTable,
                updateTables,
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
                createRelationship,
                getRelationship,
                removeRelationship,
                removeRelationships,
                updateRelationship,
            }}
        >
            {children}
        </chartDBContext.Provider>
    );
};
