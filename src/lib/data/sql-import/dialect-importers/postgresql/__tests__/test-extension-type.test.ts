import { describe, it, expect } from 'vitest';
import { fromPostgres } from '../postgresql';

describe('PostgreSQL parser - CREATE EXTENSION and CREATE TYPE', () => {
    it('should handle CREATE EXTENSION and CREATE TYPE statements', async () => {
        const testSQL = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom type for creature alignment
CREATE TYPE creature_alignment AS ENUM ('lawful', 'neutral', 'chaotic');

-- Create a table that uses the custom type
CREATE TABLE mystical_creatures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    species VARCHAR(255) UNIQUE NOT NULL,
    alignment creature_alignment DEFAULT 'neutral',
    discovered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create another custom type
CREATE TYPE magic_school AS ENUM ('illusion', 'evocation', 'necromancy', 'divination');

-- Create a table with foreign key
CREATE TABLE creature_abilities (
    id SERIAL PRIMARY KEY,
    creature_id UUID REFERENCES mystical_creatures(id),
    ability_name VARCHAR(255) NOT NULL,
    school magic_school DEFAULT 'evocation',
    is_innate BOOLEAN DEFAULT FALSE
);
`;

        const result = await fromPostgres(testSQL);

        // Basic assertions
        expect(result.tables.length).toBe(2);
        expect(result.tables[0].name).toBe('mystical_creatures');
        expect(result.tables[1].name).toBe('creature_abilities');
        expect(result.relationships.length).toBe(1);

        // Verify enums are parsed
        expect(result.enums).toHaveLength(2);
        expect(result.enums?.map((e) => e.name).sort()).toEqual([
            'creature_alignment',
            'magic_school',
        ]);
    });
});
