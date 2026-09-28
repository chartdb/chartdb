import type { DBField } from '@/lib/domain/db-field';
import { TABLE_MINIMIZED_FIELDS } from '@/lib/domain/db-table';

export const getVisibleTableFields = <
    T extends Pick<DBField, 'id' | 'primaryKey'>,
>(
    fields: T[],
    expanded: boolean,
    relatedFieldIds: ReadonlySet<string>
): T[] => {
    if (expanded || fields.length <= TABLE_MINIMIZED_FIELDS) {
        return fields;
    }

    const requiredFields = fields.filter(
        (field) => relatedFieldIds.has(field.id) || field.primaryKey
    );
    const optionalSlots = Math.max(
        0,
        TABLE_MINIMIZED_FIELDS - requiredFields.length
    );
    const optionalFields = fields
        .filter((field) => !relatedFieldIds.has(field.id) && !field.primaryKey)
        .slice(0, optionalSlots);
    const visibleIds = new Set(
        [...requiredFields, ...optionalFields].map((field) => field.id)
    );

    return fields.filter((field) => visibleIds.has(field.id));
};
