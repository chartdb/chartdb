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

    const getNewId = (id: string) => {
        const newId = idsMap.get(id);
        if (!newId) {
            throw new Error(`Id not found for ${id}`);
        }
        return newId;
    };

    const newTable: DBTable = { ...table, id: getNewId(table.id) };
    newTable.fields = table.fields.map(
        (field): DBField => ({
            ...field,
            id: getNewId(field.id),
        })
    );
    newTable.indexes = table.indexes.map(
        (index): DBIndex => ({
            ...index,
            fieldIds: index.fieldIds.map((id) => getNewId(id)),
            id: getNewId(index.id),
        })
    );

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

    const getNewId = (id: string) => {
        const newId = idsMap.get(id);
        if (!newId) {
            throw new Error(`Id not found for ${id}`);
        }
        return newId;
    };

    const tables: DBTable[] =
        diagram.tables?.map((table) =>
            cloneTable(table, { generateId, idsMap })
        ) ?? [];

    const relationships: DBRelationship[] =
        diagram.relationships?.map(
            (relationship): DBRelationship => ({
                ...relationship,
                id: getNewId(relationship.id),
                sourceTableId: getNewId(relationship.sourceTableId),
                targetTableId: getNewId(relationship.targetTableId),
                sourceFieldId: getNewId(relationship.sourceFieldId),
                targetFieldId: getNewId(relationship.targetFieldId),
            })
        ) ?? [];

    const dependencies: DBDependency[] =
        diagram.dependencies?.map(
            (dependency): DBDependency => ({
                ...dependency,
                id: getNewId(dependency.id),
                dependentTableId: getNewId(dependency.dependentTableId),
                tableId: getNewId(dependency.tableId),
            })
        ) ?? [];

    return {
        ...diagram,
        id: diagramId,
        dependencies,
        relationships,
        tables,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
};
