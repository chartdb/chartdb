import type { DBField, DBIndex, IndexType } from '@/lib/domain';
import type { AggregatedIndexInfo } from '../metadata-types/index-info';
import { generateId } from '@/lib/utils';

export const createIndexesFromMetadata = ({
    aggregatedIndexes,
    fields,
}: {
    aggregatedIndexes: AggregatedIndexInfo[];
    fields: DBField[];
}): DBIndex[] =>
    aggregatedIndexes.map(
        (idx): DBIndex => ({
            id: generateId(),
            name: idx.name,
            unique: Boolean(idx.unique),
            fieldIds: idx.columns
                .sort((a, b) => a.position - b.position)
                .map((c) => fields.find((f) => f.name === c.name)?.id)
                .filter((id): id is string => id !== undefined),
            createdAt: Date.now(),
            type: idx.index_type?.toLowerCase() as IndexType,
        })
    );
