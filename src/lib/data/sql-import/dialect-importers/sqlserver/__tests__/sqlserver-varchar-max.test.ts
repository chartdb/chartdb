import { describe, it, expect } from 'vitest';
import { fromSQLServer } from '../sqlserver';
import { convertToChartDBDiagram } from '../../../common';
import { DatabaseType } from '@/lib/domain/database-type';

describe('SQL Server varchar(max) and nvarchar(max) preservation', () => {
    it('should preserve varchar(max) and nvarchar(max) in column definitions', async () => {
        const sql = `
            CREATE TABLE [dbo].[magical_texts] (
                [Id] [uniqueidentifier] NOT NULL PRIMARY KEY,
                [Title] [nvarchar](255) NOT NULL,
                [Description] [nvarchar](max) NULL,
                [Content] [varchar](max) NOT NULL,
                [ShortNote] [varchar](100) NULL,
                [Metadata] [nvarchar](4000) NULL
            );
        `;

        const result = await fromSQLServer(sql);

        expect(result.tables).toHaveLength(1);
        const table = result.tables[0];
        expect(table.columns).toHaveLength(6);

        // Check that max is preserved in typeArgs
        const descriptionCol = table.columns.find(
            (c) => c.name === 'Description'
        );
        expect(descriptionCol).toBeDefined();
        expect(descriptionCol?.type).toBe('nvarchar');
        expect(descriptionCol?.typeArgs).toBe('max');

        const contentCol = table.columns.find((c) => c.name === 'Content');
        expect(contentCol).toBeDefined();
        expect(contentCol?.type).toBe('varchar');
        expect(contentCol?.typeArgs).toBe('max');

        // Check that numeric lengths are preserved as arrays
        const titleCol = table.columns.find((c) => c.name === 'Title');
        expect(titleCol).toBeDefined();
        expect(titleCol?.type).toBe('nvarchar');
        expect(titleCol?.typeArgs).toEqual([255]);

        const shortNoteCol = table.columns.find((c) => c.name === 'ShortNote');
        expect(shortNoteCol).toBeDefined();
        expect(shortNoteCol?.type).toBe('varchar');
        expect(shortNoteCol?.typeArgs).toEqual([100]);
    });

    it('should convert varchar(max) to characterMaximumLength field in diagram', async () => {
        const sql = `
            CREATE TABLE [dbo].[spell_scrolls] (
                [Id] [int] IDENTITY(1,1) PRIMARY KEY,
                [SpellName] [nvarchar](50) NOT NULL,
                [Incantation] [nvarchar](max) NOT NULL,
                [Instructions] [varchar](max) NULL,
                [PowerLevel] [decimal](10, 2) NOT NULL
            );
        `;

        const result = await fromSQLServer(sql);
        const diagram = convertToChartDBDiagram(
            result,
            DatabaseType.SQL_SERVER,
            DatabaseType.SQL_SERVER
        );

        expect(diagram.tables).toBeDefined();
        expect(diagram.tables).toHaveLength(1);
        const table = diagram.tables![0];

        // Check that 'max' is preserved in characterMaximumLength
        const incantationField = table.fields.find(
            (f) => f.name === 'Incantation'
        );
        expect(incantationField).toBeDefined();
        expect(incantationField?.characterMaximumLength).toBe('max');

        const instructionsField = table.fields.find(
            (f) => f.name === 'Instructions'
        );
        expect(instructionsField).toBeDefined();
        expect(instructionsField?.characterMaximumLength).toBe('max');

        // Check that numeric lengths are preserved
        const spellNameField = table.fields.find((f) => f.name === 'SpellName');
        expect(spellNameField).toBeDefined();
        expect(spellNameField?.characterMaximumLength).toBe('50');

        // Check decimal precision/scale
        const powerLevelField = table.fields.find(
            (f) => f.name === 'PowerLevel'
        );
        expect(powerLevelField).toBeDefined();
        expect(powerLevelField?.precision).toBe(10);
        expect(powerLevelField?.scale).toBe(2);
    });

    it('should handle mixed varchar types with schema and relationships', async () => {
        const sql = `
            CREATE TABLE [content].[authors] (
                [Id] [uniqueidentifier] PRIMARY KEY DEFAULT NEWID(),
                [Name] [nvarchar](100) NOT NULL,
                [Bio] [nvarchar](max) NULL
            );

            CREATE TABLE [content].[books] (
                [Id] [uniqueidentifier] PRIMARY KEY DEFAULT NEWID(),
                [AuthorId] [uniqueidentifier] NOT NULL,
                [Title] [nvarchar](500) NOT NULL,
                [Summary] [nvarchar](max) NULL,
                [FullText] [varchar](max) NOT NULL,
                [ISBN] [varchar](13) NULL,
                CONSTRAINT [FK_books_authors] FOREIGN KEY ([AuthorId]) REFERENCES [content].[authors]([Id])
            );
        `;

        const result = await fromSQLServer(sql);

        expect(result.tables).toHaveLength(2);

        // Check authors table
        const authorsTable = result.tables.find((t) => t.name === 'authors');
        expect(authorsTable).toBeDefined();

        const bioCol = authorsTable?.columns.find((c) => c.name === 'Bio');
        expect(bioCol?.typeArgs).toBe('max');

        // Check books table
        const booksTable = result.tables.find((t) => t.name === 'books');
        expect(booksTable).toBeDefined();

        const summaryCol = booksTable?.columns.find(
            (c) => c.name === 'Summary'
        );
        expect(summaryCol?.typeArgs).toBe('max');

        const fullTextCol = booksTable?.columns.find(
            (c) => c.name === 'FullText'
        );
        expect(fullTextCol?.typeArgs).toBe('max');

        const isbnCol = booksTable?.columns.find((c) => c.name === 'ISBN');
        expect(isbnCol?.typeArgs).toEqual([13]);

        // Verify relationship is preserved
        expect(result.relationships).toHaveLength(1);
        expect(result.relationships[0].sourceTable).toBe('books');
        expect(result.relationships[0].targetTable).toBe('authors');
    });

    it('should handle complex table with various SQL Server features including varchar(max)', async () => {
        const sql = `
            CREATE TABLE [reporting].[wizard_performance](\
                [Id] [bigint] IDENTITY(1,1) NOT NULL,
                [WizardId] [uniqueidentifier] NOT NULL,
                [EvaluationDate] [datetime2](7) NOT NULL,
                [PerformanceScore] [decimal](5, 2) NOT NULL,
                [Comments] [nvarchar](max) NULL,
                [DetailedReport] [varchar](max) NULL,
                [Signature] [varbinary](max) NULL,
                [ReviewerNotes] [text] NULL,
                [IsActive] [bit] NOT NULL DEFAULT 1,
                CONSTRAINT [PK_wizard_performance] PRIMARY KEY CLUSTERED ([Id] ASC)
            ) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY];
        `;

        const result = await fromSQLServer(sql);

        expect(result.tables).toHaveLength(1);
        const table = result.tables[0];

        // Check varchar(max) columns
        const commentsCol = table.columns.find((c) => c.name === 'Comments');
        expect(commentsCol?.type).toBe('nvarchar');
        expect(commentsCol?.typeArgs).toBe('max');

        const reportCol = table.columns.find(
            (c) => c.name === 'DetailedReport'
        );
        expect(reportCol?.type).toBe('varchar');
        expect(reportCol?.typeArgs).toBe('max');

        // Note: varbinary(max) should also be preserved but might need special handling
        const signatureCol = table.columns.find((c) => c.name === 'Signature');
        expect(signatureCol?.type).toBe('varbinary');
        // varbinary(max) handling might differ

        // Check other column types
        const scoreCol = table.columns.find(
            (c) => c.name === 'PerformanceScore'
        );
        expect(scoreCol?.typeArgs).toEqual([5, 2]);

        const idCol = table.columns.find((c) => c.name === 'Id');
        expect(idCol?.increment).toBe(true);
    });
});
