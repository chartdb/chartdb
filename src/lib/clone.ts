import type { Area } from './domain/area';
import type { DBDependency } from './domain/db-dependency';
import type { DBField } from './domain/db-field';
import type { DBIndex } from './domain/db-index';
import type { DBRelationship } from './domain/db-relationship';
import type { DBTable } from './domain/db-table';
import type { Diagram } from './domain/diagram';
import { generateId as defaultGenerateId } from './utils';

const generateIdsMapFromTable = (
    table: DBTable,
    generateId: () => string = defaultGenerateId
): Map<string, string> => {
    const idsMap = new Map<string, string>();
    idsMap.set(table.id, generateId());

    table.fields.forEach((field) => {
        idsMap.set(field.id, generateId());
    });

    table.indexes.forEach((index) => {
        idsMap.set(index.id, generateId());
    });

    return idsMap;
};

const generateIdsMapFromDiagram = (
    diagram: Diagram,
    generateId: () => string = defaultGenerateId
): Map<string, string> => {
    let idsMap = new Map<string, string>();
    diagram.tables?.forEach((table) => {
        const tableIdsMap = generateIdsMapFromTable(table, generateId);

        idsMap = new Map([...idsMap, ...tableIdsMap]);
    });

    diagram.relationships?.forEach((relationship) => {
        idsMap.set(relationship.id, generateId());
    });

    diagram.dependencies?.forEach((dependency) => {
        idsMap.set(dependency.id, generateId());
    });

    diagram.areas?.forEach((area) => {
        idsMap.set(area.id, generateId());
    });

    return idsMap;
};

export const cloneTable = (
    table: DBTable,
    options: {
        generateId: () => string;
        idsMap: Map<string, string>;
    } = {
        generateId: defaultGenerateId,
        idsMap: new Map<string, string>(),
    }
): DBTable => {
    const { generateId } = options;

    const idsMap = new Map([
        ...generateIdsMapFromTable(table, generateId),
        ...options.idsMap,
    ]);

    const getNewId = (id: string): string | null => {
        const newId = idsMap.get(id);
        if (!newId) {
            return null;
        }
        return newId;
    };

    const tableId = getNewId(table.id);
    if (!tableId) {
        throw new Error('Table id not found');
    }

    const newTable: DBTable = { ...table, id: tableId };
    newTable.fields = table.fields
        .map((field): DBField | null => {
            const id = getNewId(field.id);

            if (!id) {
                return null;
            }

            return {
                ...field,
                id,
            };
        })
        .filter((field): field is DBField => field !== null);
    newTable.indexes = table.indexes
        .map((index): DBIndex | null => {
            const id = getNewId(index.id);

            if (!id) {
                return null;
            }

            return {
                ...index,
                fieldIds: index.fieldIds
                    .map((id) => getNewId(id))
                    .filter((fieldId): fieldId is string => fieldId !== null),
                id,
            };
        })
        .filter((index): index is DBIndex => index !== null);

    return newTable;
};

export const cloneDiagram = (
    diagram: Diagram,
    options: {
        generateId: () => string;
    } = {
        generateId: defaultGenerateId,
    }
): Diagram => {
    const { generateId } = options;
    const diagramId = generateId();

    const idsMap = generateIdsMapFromDiagram(diagram, generateId);

    const getNewId = (id: string): string | null => {
        const newId = idsMap.get(id);
        if (!newId) {
            return null;
        }
        return newId;
    };

    const tables: DBTable[] =
        diagram.tables?.map((table) =>
            cloneTable(table, { generateId, idsMap })
        ) ?? [];

    const relationships: DBRelationship[] =
        diagram.relationships
            ?.map((relationship): DBRelationship | null => {
                const id = getNewId(relationship.id);
                const sourceTableId = getNewId(relationship.sourceTableId);
                const targetTableId = getNewId(relationship.targetTableId);
                const sourceFieldId = getNewId(relationship.sourceFieldId);
                const targetFieldId = getNewId(relationship.targetFieldId);

                if (
                    !id ||
                    !sourceTableId ||
                    !targetTableId ||
                    !sourceFieldId ||
                    !targetFieldId
                ) {
                    return null;
                }

                return {
                    ...relationship,
                    id,
                    sourceTableId,
                    targetTableId,
                    sourceFieldId,
                    targetFieldId,
                };
            })
            .filter(
                (relationship): relationship is DBRelationship =>
                    relationship !== null
            ) ?? [];

    const dependencies: DBDependency[] =
        diagram.dependencies
            ?.map((dependency): DBDependency | null => {
                const id = getNewId(dependency.id);
                const dependentTableId = getNewId(dependency.dependentTableId);
                const tableId = getNewId(dependency.tableId);

                if (!id || !dependentTableId || !tableId) {
                    return null;
                }

                return {
                    ...dependency,
                    id,
                    dependentTableId,
                    tableId,
                };
            })
            .filter(
                (dependency): dependency is DBDependency => dependency !== null
            ) ?? [];

    const areas: Area[] =
        diagram.areas
            ?.map((area) => {
                const id = getNewId(area.id);
                if (!id) {
                    return null;
                }

                return {
                    ...area,
                    id,
                } satisfies Area;
            })
            .filter((area): area is Area => area !== null) ?? [];

    return {
        ...diagram,
        id: diagramId,
        dependencies,
        relationships,
        tables,
        areas,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
};
