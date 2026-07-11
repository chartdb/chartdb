import { describe, it, expect } from 'vitest';
import { getEffectiveTableColor } from '../db-schema';
import type { DBTable } from '../db-table';

const baseTable = (overrides: Partial<DBTable>): DBTable =>
    ({
        id: 't1',
        name: 'users',
        schema: 'public',
        x: 0,
        y: 0,
        fields: [],
        indexes: [],
        color: '#111111',
        isView: false,
        createdAt: 0,
        ...overrides,
    }) as DBTable;

describe('getEffectiveTableColor', () => {
    it('inherits the schema color when the table color is not custom', () => {
        const table = baseTable({ isColorCustom: false });
        expect(getEffectiveTableColor(table, { public: '#22ff22' })).toBe(
            '#22ff22'
        );
    });

    it('keeps the table color when it was explicitly picked', () => {
        const table = baseTable({ color: '#abcdef', isColorCustom: true });
        expect(getEffectiveTableColor(table, { public: '#22ff22' })).toBe(
            '#abcdef'
        );
    });

    it('falls back to the table color when no schema color exists', () => {
        const table = baseTable({ color: '#abcdef', isColorCustom: false });
        expect(getEffectiveTableColor(table, {})).toBe('#abcdef');
        expect(getEffectiveTableColor(table, undefined)).toBe('#abcdef');
    });

    it('matches schema colors via the normalized schema id', () => {
        const table = baseTable({ schema: 'My Schema', isColorCustom: false });
        expect(getEffectiveTableColor(table, { my_schema: '#123456' })).toBe(
            '#123456'
        );
    });

    it('ignores schema colors for tables without a schema', () => {
        const table = baseTable({ schema: null, isColorCustom: false });
        expect(getEffectiveTableColor(table, { public: '#22ff22' })).toBe(
            '#111111'
        );
    });
});
