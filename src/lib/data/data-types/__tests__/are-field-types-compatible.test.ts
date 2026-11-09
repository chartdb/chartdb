import { describe, it, expect } from 'vitest';
import { areFieldTypesCompatible } from '../data-types';
import { DatabaseType } from '@/lib/domain/database-type';

describe('areFieldTypesCompatible', () => {
    const compatible = (a: string, b: string) =>
        areFieldTypesCompatible(
            { id: a, name: a },
            { id: b, name: b },
            DatabaseType.POSTGRESQL
        );

    it('treats PostgreSQL serial and int as compatible in both directions', () => {
        expect(compatible('serial', 'int')).toBe(true);
        expect(compatible('int', 'serial')).toBe(true);
    });

    it('keeps the existing PostgreSQL serial family mappings', () => {
        expect(compatible('serial', 'integer')).toBe(true);
        expect(compatible('smallserial', 'smallint')).toBe(true);
        expect(compatible('bigserial', 'bigint')).toBe(true);
    });

    it('does not make serial compatible with unrelated types', () => {
        expect(compatible('serial', 'bigint')).toBeFalsy();
    });
});
