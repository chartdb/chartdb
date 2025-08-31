import type { Cardinality } from '@/lib/domain/db-relationship';
import { type TableNodeType } from './table-node/table-node';
import { addEdge, createGraph, removeEdge, type Graph } from '@/lib/graph';
import {
    getTableDimensions,
    calcTableHeight,
    type DBTable,
    MIN_TABLE_SIZE,
} from '@/lib/domain/db-table';

export { calcTableHeight, getTableDimensions };

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
