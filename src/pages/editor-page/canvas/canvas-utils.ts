import type { Cardinality } from '@/lib/domain/db-relationship';
import type { TableNodeType } from './table-node/table-node';

export const getCardinalityMarkerId = ({
    cardinality,
    selected,
    side,
}: {
    cardinality: Cardinality;
    selected: boolean;
    side: 'left' | 'right';
}) =>
    `cardinality_${selected ? 'selected' : 'not_selected'}_${cardinality}_${side}`;

export const findTableOverlapping = (
    table: TableNodeType,
    tables: TableNodeType[]
): string[] => {
    const overlappingTables = new Set<string>();
    const tableRect = {
        id: table.id,
        left: table.position.x,
        right: table.position.x + (table.measured?.width ?? 0),
        top: table.position.y,
        bottom: table.position.y + (table.measured?.height ?? 0),
    };

    for (const otherTable of tables) {
        if (table.id === otherTable.id) {
            continue;
        }

        const otherTableRect = {
            id: otherTable.id,
            left: otherTable.position.x,
            right: otherTable.position.x + (otherTable.measured?.width ?? 0),
            top: otherTable.position.y,
            bottom: otherTable.position.y + (otherTable.measured?.height ?? 0),
        };

        if (
            tableRect.left < otherTableRect.right &&
            tableRect.right > otherTableRect.left &&
            tableRect.top < otherTableRect.bottom &&
            tableRect.bottom > otherTableRect.top
        ) {
            overlappingTables.add(otherTableRect.id);
        }
    }

    return Array.from(overlappingTables);
};

export const findOverlappingTables = (tables: TableNodeType[]): string[] => {
    const overlappingTables: string[] = [];
    for (const table of tables) {
        const currentOverlappingTables = findTableOverlapping(table, tables);
        overlappingTables.push(...currentOverlappingTables);
    }

    return Array.from(new Set(overlappingTables));
};
