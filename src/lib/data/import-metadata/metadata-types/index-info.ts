import { schemaNameToDomainSchemaName } from '@/lib/domain/db-schema';
import type { TableInfo } from './table-info';
import { z } from 'zod';

export interface IndexInfo {
    schema: string;
    table: string;
    name: string;
    column: string;
    index_type: string;
    cardinality: number;
    size: number | null;
    unique: boolean;
    is_partial_index: boolean;
    direction: string;
    column_position: number;
}

export const IndexInfoSchema: z.ZodType<IndexInfo> = z.object({
    schema: z.string(),
    table: z.string(),
    name: z.string(),
    column: z.string(),
    index_type: z.string(),
    cardinality: z.number(),
    size: z.number().nullable(),
    unique: z.boolean(),
    is_partial_index: z.boolean(),
    direction: z.string(),
    column_position: z.number(),
});

export type AggregatedIndexInfo = Omit<IndexInfo, 'column'> & {
    columns: { name: string; position: number }[];
};

export const createAggregatedIndexes = ({
    tableInfo,
    tableSchema,
    indexes,
}: {
    tableInfo: TableInfo;
    indexes: IndexInfo[];
    tableSchema?: string;
}): AggregatedIndexInfo[] => {
    const tableIndexes = indexes.filter((idx) => {
        const indexSchema = schemaNameToDomainSchemaName(idx.schema);

        return idx.table === tableInfo.table && indexSchema === tableSchema;
    });

    return Object.values(
        tableIndexes.reduce(
            (acc, idx) => {
                const key = `${idx.schema}_${idx.name}`;
                if (!acc[key]) {
                    acc[key] = {
                        ...idx,
                        columns: [
                            { name: idx.column, position: idx.column_position },
                        ],
                    };
                } else {
                    acc[key].columns.push({
                        name: idx.column,
                        position: idx.column_position,
                    });
                }
                return acc;
            },
            {} as Record<string, AggregatedIndexInfo>
        )
    );
};
