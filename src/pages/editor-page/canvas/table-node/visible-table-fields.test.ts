import { describe, expect, it } from 'vitest';
import { getVisibleTableFields } from './visible-table-fields';

const fields = Array.from({ length: 13 }, (_, index) => ({
    id: `field-${index}`,
    primaryKey: index === 12,
}));

describe('getVisibleTableFields', () => {
    it('keeps every related field visible when there are more than ten', () => {
        const relatedIds = new Set(
            fields.slice(0, 11).map((field) => field.id)
        );

        expect(
            getVisibleTableFields(fields, false, relatedIds).map(
                (field) => field.id
            )
        ).toEqual([
            'field-0',
            'field-1',
            'field-2',
            'field-3',
            'field-4',
            'field-5',
            'field-6',
            'field-7',
            'field-8',
            'field-9',
            'field-10',
            'field-12',
        ]);
    });

    it('fills remaining compact slots and preserves field order', () => {
        expect(
            getVisibleTableFields(fields, false, new Set(['field-5'])).map(
                (field) => field.id
            )
        ).toEqual([
            'field-0',
            'field-1',
            'field-2',
            'field-3',
            'field-4',
            'field-5',
            'field-6',
            'field-7',
            'field-8',
            'field-12',
        ]);
    });

    it('shows all fields when expanded', () => {
        expect(getVisibleTableFields(fields, true, new Set())).toEqual(fields);
    });
});
