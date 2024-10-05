import type { Cardinality } from '@/lib/domain/db-relationship';
import { MIN_TABLE_SIZE, type TableNodeType } from './table-node/table-node';
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
        ? (node?.measured?.height ??
          calcTableHeight(node?.data.table.fields.length ?? 0))
        : calcTableHeight(table?.fields.length ?? 0);

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

export const calcTableHeight = (fieldCount: number): number => {
    const fieldHeight = 32; // h-8 per field

    return Math.min(fieldCount, 11) * fieldHeight + 48;
};

export const getTableDimensions = (
    table: DBTable
): { width: number; height: number } => {
    const fieldCount = table.fields.length;
    const height = calcTableHeight(fieldCount);
    const width = table.width || MIN_TABLE_SIZE;
    return { width, height };
};
