import type { Cardinality } from '@/lib/domain/db-relationship';
import {
    MIN_TABLE_SIZE,
    TABLE_MINIMIZED_FIELDS,
    type TableNodeType,
} from './table-node/table-node';
import { addEdge, createGraph, removeEdge, type Graph } from '@/lib/graph';
import type { DBTable } from '@/lib/domain/db-table';

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

const calcRect = ({
    node,
    table,
}: ExactlyOne<{ table: DBTable; node: TableNodeType }>) => {
    const id = node?.id ?? table?.id ?? '';
    const x = node?.position.x ?? table?.x ?? 0;
    const y = node?.position.y ?? table?.y ?? 0;
    const width =
        node?.measured?.width ??
        node?.data.table.width ??
        table?.width ??
        MIN_TABLE_SIZE;
    const height = node
        ? (node?.measured?.height ?? calcTableHeight(node.data.table))
        : calcTableHeight(table);

    return {
        id,
        left: x,
        right: x + width,
        top: y,
        bottom: y + height,
    };
};

export const findTableOverlapping = (
    {
        node,
        table,
    }: ExactlyOne<{
        node: TableNodeType;
        table: DBTable;
    }>,
    {
        nodes,
        tables,
    }: ExactlyOne<{
        nodes: TableNodeType[];
        tables: DBTable[];
    }>,
    graph: Graph<string>
): Graph<string> => {
    const id = node?.id ?? table?.id ?? '';
    const tableRect = calcRect(node ? { node } : { table });

    for (const otherTable of nodes ?? tables ?? []) {
        if (id === otherTable.id) {
            continue;
        }

        const isNode = !!nodes;

        const otherTableRect = isNode
            ? calcRect({ node: otherTable as TableNodeType })
            : calcRect({ table: otherTable as DBTable });

        if (
            tableRect.left < otherTableRect.right &&
            tableRect.right > otherTableRect.left &&
            tableRect.top < otherTableRect.bottom &&
            tableRect.bottom > otherTableRect.top
        ) {
            graph = addEdge(graph, id, otherTable.id);
        } else {
            graph = removeEdge(graph, id, otherTable.id);
        }
    }

    return graph;
};

export const findOverlappingTables = ({
    tables,
    nodes,
}: ExactlyOne<{
    nodes: TableNodeType[];
    tables: DBTable[];
}>): Graph<string> => {
    let graph = createGraph<string>();

    if (tables) {
        for (const table of tables) {
            graph = findTableOverlapping({ table }, { tables }, graph);
        }
    } else {
        for (const node of nodes) {
            graph = findTableOverlapping({ node }, { nodes }, graph);
        }
    }

    return graph;
};

export const calcTableHeight = (table?: DBTable): number => {
    if (!table) {
        return 300;
    }

    const FIELD_HEIGHT = 32; // h-8 per field
    const TABLE_FOOTER_HEIGHT = 32; // h-8 for show more button
    const TABLE_HEADER_HEIGHT = 42;
    // Calculate how many fields are visible
    const fieldCount = table.fields.length;
    let visibleFieldCount = fieldCount;

    // If not expanded, use minimum of field count and TABLE_MINIMIZED_FIELDS
    if (!table.expanded) {
        visibleFieldCount = Math.min(fieldCount, TABLE_MINIMIZED_FIELDS);
    }

    // Calculate height based on visible fields
    const fieldsHeight = visibleFieldCount * FIELD_HEIGHT;
    const showMoreButtonHeight =
        fieldCount > TABLE_MINIMIZED_FIELDS ? TABLE_FOOTER_HEIGHT : 0;

    return TABLE_HEADER_HEIGHT + fieldsHeight + showMoreButtonHeight;
};

export const getTableDimensions = (
    table: DBTable
): { width: number; height: number } => {
    const height = calcTableHeight(table);
    const width = table.width || MIN_TABLE_SIZE;
    return { width, height };
};
