import { describe, it } from 'vitest';

describe('node-sql-parser - CREATE TYPE handling', () => {
    it('should show exact parser error for CREATE TYPE', async () => {
        const { Parser } = await import('node-sql-parser');
        const parser = new Parser();
        const parserOpts = {
            database: 'PostgreSQL',
        };

        console.log('\n=== Testing CREATE TYPE statement ===');
        const createTypeSQL = `CREATE TYPE spell_element AS ENUM ('fire', 'water', 'earth', 'air');`;

        try {
            parser.astify(createTypeSQL, parserOpts);
            console.log('CREATE TYPE parsed successfully');
        } catch (error) {
            console.log('CREATE TYPE parse error:', (error as Error).message);
        }

        console.log('\n=== Testing CREATE EXTENSION statement ===');
        const createExtensionSQL = `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`;

        try {
            parser.astify(createExtensionSQL, parserOpts);
            console.log('CREATE EXTENSION parsed successfully');
        } catch (error) {
            console.log(
                'CREATE EXTENSION parse error:',
                (error as Error).message
            );
        }

        console.log('\n=== Testing CREATE TABLE with custom type ===');
        const createTableWithTypeSQL = `CREATE TABLE wizards (
            id UUID PRIMARY KEY,
            element spell_element DEFAULT 'fire'
        );`;

        try {
            parser.astify(createTableWithTypeSQL, parserOpts);
            console.log('CREATE TABLE with custom type parsed successfully');
        } catch (error) {
            console.log(
                'CREATE TABLE with custom type parse error:',
                (error as Error).message
            );
        }

        console.log('\n=== Testing CREATE TABLE with standard types only ===');
        const createTableStandardSQL = `CREATE TABLE wizards (
            id UUID PRIMARY KEY,
            element VARCHAR(20) DEFAULT 'fire'
        );`;

        try {
            parser.astify(createTableStandardSQL, parserOpts);
            console.log('CREATE TABLE with standard types parsed successfully');
        } catch (error) {
            console.log(
                'CREATE TABLE with standard types parse error:',
                (error as Error).message
            );
        }
    });
});
