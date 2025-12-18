import { describe, it, expect } from 'vitest';
import { fromSQLServer } from '../sqlserver';

describe('SQL Server Core Parser Tests', () => {
    it('should parse basic tables', async () => {
        const sql = `
            CREATE TABLE wizards (
                id INT PRIMARY KEY,
                name NVARCHAR(255) NOT NULL
            );
        `;

        const result = await fromSQLServer(sql);

        expect(result.tables).toHaveLength(1);
        expect(result.tables[0].name).toBe('wizards');
        expect(result.tables[0].columns).toHaveLength(2);
    });

    it('should parse tables with schemas', async () => {
        const sql = `
            CREATE TABLE [magic].[spells] (
                id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                name NVARCHAR(100) NOT NULL,
                level INT NOT NULL
            );

            CREATE TABLE [dbo].[wizards] (
                id INT IDENTITY(1,1) PRIMARY KEY,
                name NVARCHAR(255) NOT NULL
            );
        `;

        const result = await fromSQLServer(sql);

        expect(result.tables).toHaveLength(2);
        expect(result.tables.find((t) => t.name === 'spells')).toBeDefined();
        expect(result.tables.find((t) => t.name === 'spells')?.schema).toBe(
            'magic'
        );
        expect(result.tables.find((t) => t.name === 'wizards')?.schema).toBe(
            'dbo'
        );
    });

    it('should parse foreign key relationships', async () => {
        const sql = `
            CREATE TABLE guilds (id INT PRIMARY KEY);
            CREATE TABLE mages (
                id INT PRIMARY KEY,
                guild_id INT FOREIGN KEY REFERENCES guilds(id)
            );
        `;

        const result = await fromSQLServer(sql);

        expect(result.tables).toHaveLength(2);
        expect(result.relationships).toHaveLength(1);
        expect(result.relationships[0].sourceTable).toBe('mages');
        expect(result.relationships[0].targetTable).toBe('guilds');
        expect(result.relationships[0].sourceColumn).toBe('guild_id');
        expect(result.relationships[0].targetColumn).toBe('id');
    });

    it('should parse foreign keys with schema references', async () => {
        const sql = `
            CREATE TABLE [magic].[schools] (
                id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                name NVARCHAR(100) NOT NULL
            );

            CREATE TABLE [magic].[towers] (
                id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                school_id UNIQUEIDENTIFIER NOT NULL,
                name NVARCHAR(100) NOT NULL,
                CONSTRAINT FK_towers_schools FOREIGN KEY (school_id) REFERENCES [magic].[schools](id)
            );
        `;

        const result = await fromSQLServer(sql);

        expect(result.tables).toHaveLength(2);
        expect(result.relationships).toHaveLength(1);
        expect(result.relationships[0].sourceTable).toBe('towers');
        expect(result.relationships[0].targetTable).toBe('schools');
        expect(result.relationships[0].sourceSchema).toBe('magic');
        expect(result.relationships[0].targetSchema).toBe('magic');
    });

    it('should handle GO statements and SQL Server specific syntax', async () => {
        const sql = `
            USE [MagicalRealm]
            GO

            SET ANSI_NULLS ON
            GO

            SET QUOTED_IDENTIFIER ON
            GO

            CREATE TABLE [dbo].[enchantments] (
                [Id] [uniqueidentifier] NOT NULL,
                [Name] [nvarchar](max) NOT NULL,
                [Power] [decimal](18, 2) NOT NULL,
                [CreatedAt] [datetime2](7) NOT NULL,
            CONSTRAINT [PK_enchantments] PRIMARY KEY CLUSTERED 
            (
                [Id] ASC
            )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF) ON [PRIMARY]
            ) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
            GO
        `;

        const result = await fromSQLServer(sql);

        expect(result.tables).toHaveLength(1);
        expect(result.tables[0].name).toBe('enchantments');
        expect(result.tables[0].columns).toHaveLength(4);
        expect(
            result.tables[0].columns.find((c) => c.name === 'Power')?.type
        ).toBe('decimal');
    });

    it('should parse ALTER TABLE ADD CONSTRAINT for foreign keys', async () => {
        const sql = `
            CREATE TABLE [calibration].[Calibration] (
                [Id] [uniqueidentifier] NOT NULL PRIMARY KEY,
                [Average] [decimal](18, 2) NOT NULL
            );

            CREATE TABLE [calibration].[CalibrationProcess] (
                [Id] [uniqueidentifier] NOT NULL PRIMARY KEY,
                [CalibrationId] [uniqueidentifier] NOT NULL
            );

            ALTER TABLE [calibration].[CalibrationProcess] 
                ADD CONSTRAINT [FK_CalibrationProcess_Calibration] 
                FOREIGN KEY ([CalibrationId]) 
                REFERENCES [calibration].[Calibration]([Id]);
        `;

        const result = await fromSQLServer(sql);

        expect(result.tables).toHaveLength(2);
        expect(result.relationships).toHaveLength(1);
        expect(result.relationships[0].sourceTable).toBe('CalibrationProcess');
        expect(result.relationships[0].targetTable).toBe('Calibration');
        expect(result.relationships[0].name).toBe(
            'FK_CalibrationProcess_Calibration'
        );
    });

    it('should handle multiple schemas from the test file', async () => {
        const sql = `
            CREATE SCHEMA [magic]
            GO
            CREATE SCHEMA [artifacts]
            GO

            CREATE TABLE [magic].[wizards] (
                [Id] [uniqueidentifier] NOT NULL PRIMARY KEY,
                [Name] [nvarchar](255) NOT NULL
            );

            CREATE TABLE [artifacts].[wands] (
                [Id] [uniqueidentifier] NOT NULL PRIMARY KEY,
                [WizardId] [uniqueidentifier] NOT NULL,
                [WoodType] [nvarchar](50) NOT NULL,
                CONSTRAINT [FK_wands_wizards] FOREIGN KEY ([WizardId]) REFERENCES [magic].[wizards]([Id])
            );
        `;

        const result = await fromSQLServer(sql);

        expect(result.tables).toHaveLength(2);
        expect(result.tables.find((t) => t.schema === 'magic')).toBeDefined();
        expect(
            result.tables.find((t) => t.schema === 'artifacts')
        ).toBeDefined();
        expect(result.relationships).toHaveLength(1);
        expect(result.relationships[0].sourceSchema).toBe('artifacts');
        expect(result.relationships[0].targetSchema).toBe('magic');
    });

    it('should handle SQL Server data types correctly', async () => {
        const sql = `
            CREATE TABLE [magic].[spell_components] (
                [Id] [uniqueidentifier] NOT NULL,
                [Name] [nvarchar](255) NOT NULL,
                [Quantity] [int] NOT NULL,
                [Weight] [decimal](10, 2) NOT NULL,
                [IsPowerful] [bit] NOT NULL,
                [DiscoveredAt] [datetime2](7) NOT NULL,
                [Description] [nvarchar](max) NULL,
                [RarityLevel] [tinyint] NOT NULL,
                [MarketValue] [money] NOT NULL,
                [AlchemicalFormula] [xml] NULL,
                PRIMARY KEY ([Id])
            );
        `;

        const result = await fromSQLServer(sql);

        expect(result.tables).toHaveLength(1);
        const columns = result.tables[0].columns;

        expect(columns.find((c) => c.name === 'Id')?.type).toBe(
            'uniqueidentifier'
        );
        expect(columns.find((c) => c.name === 'Name')?.type).toBe('nvarchar');
        expect(columns.find((c) => c.name === 'Quantity')?.type).toBe('int');
        expect(columns.find((c) => c.name === 'Weight')?.type).toBe('decimal');
        expect(columns.find((c) => c.name === 'IsPowerful')?.type).toBe('bit');
        expect(columns.find((c) => c.name === 'DiscoveredAt')?.type).toBe(
            'datetime2'
        );
        expect(columns.find((c) => c.name === 'Description')?.type).toBe(
            'nvarchar'
        );
        expect(columns.find((c) => c.name === 'RarityLevel')?.type).toBe(
            'tinyint'
        );
        expect(columns.find((c) => c.name === 'MarketValue')?.type).toBe(
            'money'
        );
        expect(columns.find((c) => c.name === 'AlchemicalFormula')?.type).toBe(
            'xml'
        );
    });

    it('should handle IDENTITY columns', async () => {
        const sql = `
            CREATE TABLE [dbo].[magical_creatures] (
                [Id] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
                [Name] [nvarchar](100) NOT NULL,
                [PowerLevel] [int] NOT NULL
            );
        `;

        const result = await fromSQLServer(sql);

        expect(result.tables).toHaveLength(1);
        const idColumn = result.tables[0].columns.find((c) => c.name === 'Id');
        expect(idColumn?.increment).toBe(true);
    });

    it('should parse composite primary keys', async () => {
        const sql = `
            CREATE TABLE [magic].[spell_ingredients] (
                [SpellId] [uniqueidentifier] NOT NULL,
                [IngredientId] [uniqueidentifier] NOT NULL,
                [Quantity] [int] NOT NULL,
                CONSTRAINT [PK_spell_ingredients] PRIMARY KEY CLUSTERED 
                (
                    [SpellId] ASC,
                    [IngredientId] ASC
                )
            );
        `;

        const result = await fromSQLServer(sql);

        expect(result.tables).toHaveLength(1);
        const table = result.tables[0];
        expect(table.columns.filter((c) => c.primaryKey)).toHaveLength(2);
        expect(
            table.columns.find((c) => c.name === 'SpellId')?.primaryKey
        ).toBe(true);
        expect(
            table.columns.find((c) => c.name === 'IngredientId')?.primaryKey
        ).toBe(true);
    });

    it('should handle unique constraints', async () => {
        const sql = `
            CREATE TABLE [dbo].[arcane_libraries] (
                [Id] [uniqueidentifier] NOT NULL PRIMARY KEY,
                [Code] [nvarchar](50) NOT NULL,
                [Name] [nvarchar](255) NOT NULL,
                CONSTRAINT [UQ_arcane_libraries_code] UNIQUE ([Code])
            );
        `;

        const result = await fromSQLServer(sql);

        expect(result.tables).toHaveLength(1);
        expect(result.tables[0].indexes).toHaveLength(1);
        expect(result.tables[0].indexes[0].name).toBe(
            'UQ_arcane_libraries_code'
        );
        expect(result.tables[0].indexes[0].unique).toBe(true);
        expect(result.tables[0].indexes[0].columns).toContain('Code');
    });

    it('should handle default values', async () => {
        const sql = `
            CREATE TABLE [dbo].[potion_recipes] (
                [Id] [uniqueidentifier] NOT NULL DEFAULT NEWID(),
                [Name] [nvarchar](255) NOT NULL,
                [IsActive] [bit] NOT NULL DEFAULT 1,
                [CreatedAt] [datetime2](7) NOT NULL DEFAULT GETDATE(),
                [Difficulty] [int] NOT NULL DEFAULT 5,
                PRIMARY KEY ([Id])
            );
        `;

        const result = await fromSQLServer(sql);

        expect(result.tables).toHaveLength(1);
        const columns = result.tables[0].columns;

        expect(columns.find((c) => c.name === 'Id')?.default).toBeDefined();
        expect(columns.find((c) => c.name === 'IsActive')?.default).toBe('1');
        expect(
            columns.find((c) => c.name === 'CreatedAt')?.default
        ).toBeDefined();
        expect(columns.find((c) => c.name === 'Difficulty')?.default).toBe('5');
    });

    it('should parse indexes created separately', async () => {
        const sql = `
            CREATE TABLE [dbo].[spell_books] (
                [Id] [uniqueidentifier] NOT NULL PRIMARY KEY,
                [Title] [nvarchar](255) NOT NULL,
                [Author] [nvarchar](255) NOT NULL,
                [PublishedYear] [int] NOT NULL
            );

            CREATE INDEX [IX_spell_books_author] ON [dbo].[spell_books] ([Author]);
            CREATE UNIQUE INDEX [UIX_spell_books_title] ON [dbo].[spell_books] ([Title]);
        `;

        const result = await fromSQLServer(sql);

        expect(result.tables).toHaveLength(1);
        expect(result.tables[0].indexes).toHaveLength(2);

        const authorIndex = result.tables[0].indexes.find(
            (i) => i.name === 'IX_spell_books_author'
        );
        expect(authorIndex?.unique).toBe(false);
        expect(authorIndex?.columns).toContain('Author');

        const titleIndex = result.tables[0].indexes.find(
            (i) => i.name === 'UIX_spell_books_title'
        );
        expect(titleIndex?.unique).toBe(true);
        expect(titleIndex?.columns).toContain('Title');
    });

    describe('Primary Key Uniqueness', () => {
        it('should mark single-column primary key field as unique', async () => {
            const sql = `
CREATE TABLE [dbo].[table_1] (
    [id] BIGINT NOT NULL,
    CONSTRAINT [pk_table_1_id] PRIMARY KEY ([id])
);
            `;

            const result = await fromSQLServer(sql);

            expect(result.tables).toHaveLength(1);
            const table = result.tables[0];
            expect(table.name).toBe('table_1');

            const idColumn = table.columns.find((c) => c.name === 'id');
            expect(idColumn).toBeDefined();
            expect(idColumn?.primaryKey).toBe(true);
            expect(idColumn?.unique).toBe(true);
        });

        it('should not mark composite primary key fields as unique individually', async () => {
            const sql = `
CREATE TABLE [dbo].[table_1] (
    [id] BIGINT NOT NULL,
    [field_2] BIGINT NOT NULL,
    CONSTRAINT [pk_table_1_id] PRIMARY KEY ([id], [field_2])
);
            `;

            const result = await fromSQLServer(sql);

            expect(result.tables).toHaveLength(1);
            const table = result.tables[0];
            expect(table.name).toBe('table_1');

            const idColumn = table.columns.find((c) => c.name === 'id');
            expect(idColumn).toBeDefined();
            expect(idColumn?.primaryKey).toBe(true);
            expect(idColumn?.unique).toBe(false);

            const field2Column = table.columns.find(
                (c) => c.name === 'field_2'
            );
            expect(field2Column).toBeDefined();
            expect(field2Column?.primaryKey).toBe(true);
            expect(field2Column?.unique).toBe(false);
        });
    });
});
