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

        console.log(
            'Testing PostgreSQL parser with CREATE EXTENSION and CREATE TYPE...\n'
        );

        try {
            const result = await fromPostgres(testSQL);

            console.log('Parse successful!');
            console.log('\nTables found:', result.tables.length);
            result.tables.forEach((table) => {
                console.log(`\n- Table: ${table.name}`);
                console.log('  Columns:');
                table.columns.forEach((col) => {
                    console.log(
                        `    - ${col.name}: ${col.type}${col.nullable ? '' : ' NOT NULL'}${col.primaryKey ? ' PRIMARY KEY' : ''}`
                    );
                });
            });

            console.log('\nRelationships found:', result.relationships.length);
            result.relationships.forEach((rel) => {
                console.log(
                    `- ${rel.sourceTable}.${rel.sourceColumn} -> ${rel.targetTable}.${rel.targetColumn}`
                );
            });

            if (result.warnings && result.warnings.length > 0) {
                console.log('\nWarnings:');
                result.warnings.forEach((warning) => {
                    console.log(`- ${warning}`);
                });
            }

            // Basic assertions
            expect(result.tables.length).toBe(2);
            expect(result.tables[0].name).toBe('mystical_creatures');
            expect(result.tables[1].name).toBe('creature_abilities');
            expect(result.relationships.length).toBe(1);
        } catch (error) {
            console.error('Error parsing SQL:', (error as Error).message);
            console.error('\nStack trace:', (error as Error).stack);
            throw error;
        }
    });
});
