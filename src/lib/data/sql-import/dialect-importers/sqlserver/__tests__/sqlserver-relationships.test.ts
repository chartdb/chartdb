import { describe, it, expect } from 'vitest';
import { fromSQLServer } from '../sqlserver';
import { readFileSync } from 'fs';

describe('SQL Server Foreign Key Relationship Tests', () => {
    it('should properly link foreign key relationships with correct table IDs', async () => {
        const sql = `
            CREATE TABLE [magic].[schools] (
                [id] [uniqueidentifier] PRIMARY KEY,
                [name] [nvarchar](100) NOT NULL
            );

            CREATE TABLE [magic].[wizards] (
                [id] [uniqueidentifier] PRIMARY KEY,
                [school_id] [uniqueidentifier] NOT NULL,
                [name] [nvarchar](100) NOT NULL
            );

            ALTER TABLE [magic].[wizards] WITH CHECK ADD CONSTRAINT [FK_wizards_schools] 
            FOREIGN KEY ([school_id]) REFERENCES [magic].[schools]([id]);
        `;

        const result = await fromSQLServer(sql);

        // Check tables are parsed
        expect(result.tables).toHaveLength(2);
        const schoolsTable = result.tables.find((t) => t.name === 'schools');
        const wizardsTable = result.tables.find((t) => t.name === 'wizards');
        expect(schoolsTable).toBeDefined();
        expect(wizardsTable).toBeDefined();

        // Check relationship is parsed
        expect(result.relationships).toHaveLength(1);
        const rel = result.relationships[0];

        // Verify the relationship has proper table IDs
        expect(rel.sourceTableId).toBe(wizardsTable!.id);
        expect(rel.targetTableId).toBe(schoolsTable!.id);

        // Verify other relationship properties
        expect(rel.sourceTable).toBe('wizards');
        expect(rel.targetTable).toBe('schools');
        expect(rel.sourceColumn).toBe('school_id');
        expect(rel.targetColumn).toBe('id');
        expect(rel.sourceSchema).toBe('magic');
        expect(rel.targetSchema).toBe('magic');
    });

    it('should handle cross-schema foreign key relationships', async () => {
        const sql = `
            CREATE TABLE [users].[accounts] (
                [id] [int] PRIMARY KEY,
                [username] [nvarchar](50) NOT NULL
            );

            CREATE TABLE [orders].[purchases] (
                [id] [int] PRIMARY KEY,
                [account_id] [int] NOT NULL
            );

            ALTER TABLE [orders].[purchases] ADD CONSTRAINT [FK_purchases_accounts] 
            FOREIGN KEY ([account_id]) REFERENCES [users].[accounts]([id]);
        `;

        const result = await fromSQLServer(sql);

        expect(result.tables).toHaveLength(2);
        expect(result.relationships).toHaveLength(1);

        const rel = result.relationships[0];
        const accountsTable = result.tables.find(
            (t) => t.name === 'accounts' && t.schema === 'users'
        );
        const purchasesTable = result.tables.find(
            (t) => t.name === 'purchases' && t.schema === 'orders'
        );

        // Verify cross-schema relationship IDs are properly linked
        expect(rel.sourceTableId).toBe(purchasesTable!.id);
        expect(rel.targetTableId).toBe(accountsTable!.id);
    });

    it('should parse foreign keys from the novi_myscal2dbdev.sql file with proper table IDs', async () => {
        const sql = readFileSync(
            '/Users/jonathanfishner/Downloads/novi_myscal2dbdev.sql',
            'utf-16le'
        ).toString();
        const result = await fromSQLServer(sql);

        // Debug output
        console.log('Total tables:', result.tables.length);
        console.log('Total relationships:', result.relationships.length);

        // Check if we have relationships
        expect(result.relationships.length).toBeGreaterThan(0);

        // Check a specific relationship we know should exist
        const calibrationProcessRel = result.relationships.find(
            (r) =>
                r.sourceTable === 'CalibrationProcess' &&
                r.targetTable === 'Calibration' &&
                r.sourceColumn === 'CalibrationId'
        );

        expect(calibrationProcessRel).toBeDefined();

        if (calibrationProcessRel) {
            // Find the corresponding tables
            const calibrationTable = result.tables.find(
                (t) => t.name === 'Calibration' && t.schema === 'calibration'
            );
            const calibrationProcessTable = result.tables.find(
                (t) =>
                    t.name === 'CalibrationProcess' &&
                    t.schema === 'calibration'
            );

            console.log('CalibrationProcess relationship:', {
                sourceTableId: calibrationProcessRel.sourceTableId,
                targetTableId: calibrationProcessRel.targetTableId,
                calibrationProcessTableId: calibrationProcessTable?.id,
                calibrationTableId: calibrationTable?.id,
                isSourceIdValid:
                    calibrationProcessRel.sourceTableId ===
                    calibrationProcessTable?.id,
                isTargetIdValid:
                    calibrationProcessRel.targetTableId ===
                    calibrationTable?.id,
            });

            // Verify the IDs are properly linked
            expect(calibrationProcessRel.sourceTableId).toBeTruthy();
            expect(calibrationProcessRel.targetTableId).toBeTruthy();
            expect(calibrationProcessRel.sourceTableId).toBe(
                calibrationProcessTable!.id
            );
            expect(calibrationProcessRel.targetTableId).toBe(
                calibrationTable!.id
            );
        }

        // Check that all relationships have valid table IDs
        const relationshipsWithMissingIds = result.relationships.filter(
            (r) =>
                !r.sourceTableId ||
                !r.targetTableId ||
                r.sourceTableId === '' ||
                r.targetTableId === ''
        );

        if (relationshipsWithMissingIds.length > 0) {
            console.log(
                'Relationships with missing IDs:',
                relationshipsWithMissingIds.slice(0, 5)
            );
        }

        expect(relationshipsWithMissingIds).toHaveLength(0);
    });
});
