import { describe, expect, it } from 'vitest';
import { normalizePostgresStringArray } from '../postgres/introspection.js';

describe('normalizePostgresStringArray', () => {
    it('returns arrays unchanged', () => {
        expect(normalizePostgresStringArray(['id', 'status'])).toEqual([
            'id',
            'status',
        ]);
    });

    it('parses raw postgres array strings', () => {
        expect(normalizePostgresStringArray('{"id","status"}')).toEqual([
            'id',
            'status',
        ]);
    });

    it('parses quoted values containing commas', () => {
        expect(
            normalizePostgresStringArray('{"user,id","display name"}')
        ).toEqual(['user,id', 'display name']);
    });

    it('returns an empty array for nullish values', () => {
        expect(normalizePostgresStringArray(null)).toEqual([]);
        expect(normalizePostgresStringArray(undefined)).toEqual([]);
    });
});
