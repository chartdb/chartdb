import type { Diagram } from '@/lib/domain/diagram';
import type { Template } from './templates-data';
import { generateId } from '@/lib/utils';
import type { DBTable } from '@/lib/domain/db-table';
import type { DBField } from '@/lib/domain/db-field';
import type { DBIndex } from '@/lib/domain/db-index';
import type { DBRelationship } from '@/lib/domain/db-relationship';
import type { DBDependency } from '@/lib/domain/db-dependency';

export const convertTemplateToNewDiagram = (template: Template): Diagram => {
    // const diagramId = generateDiagramId();
    const diagramId = template.diagram.id;

    const idsMap = new Map<string, string>();
    template.diagram.tables?.forEach((table) => {
        idsMap.set(table.id, generateId());

        table.fields.forEach((field) => {
            idsMap.set(field.id, generateId());
        });

        table.indexes.forEach((index) => {
            idsMap.set(index.id, generateId());
        });
    });
    template.diagram.relationships?.forEach((relationship) => {
        idsMap.set(relationship.id, generateId());
    });

    template.diagram.dependencies?.forEach((dependency) => {
        idsMap.set(dependency.id, generateId());
    });

    const getNewId = (id: string) => {
        const newId = idsMap.get(id);
        if (!newId) {
            throw new Error(`Id not found for ${id}`);
        }
        return newId;
    };

    const tables: DBTable[] =
        template.diagram.tables?.map((table) => {
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
                    id: getNewId(index.id),
                })
            );
            return newTable;
        }) ?? [];

    const relationships: DBRelationship[] =
        template.diagram.relationships?.map(
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
        template.diagram.dependencies?.map(
            (dependency): DBDependency => ({
                ...dependency,
                id: getNewId(dependency.id),
                dependentTableId: getNewId(dependency.dependentTableId),
                tableId: getNewId(dependency.tableId),
            })
        ) ?? [];

    return {
        ...template.diagram,
        id: diagramId,
        dependencies,
        relationships,
        tables,
    };
};
