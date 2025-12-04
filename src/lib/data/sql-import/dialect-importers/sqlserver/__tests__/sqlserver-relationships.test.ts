import { describe, it, expect } from 'vitest';
import { fromSQLServer } from '../sqlserver';

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

    it('should parse complex foreign keys from magical realm database with proper table IDs', async () => {
        // Fantasy-themed SQL with multiple schemas and relationships
        const sql = `
            -- Spell casting schema
            CREATE SCHEMA [spellcasting];
            GO
            
            -- Create spell table
            CREATE TABLE [spellcasting].[Spell] (
                [Id] [uniqueidentifier] NOT NULL,
                [Name] [nvarchar](255) NOT NULL,
                [School] [nvarchar](100) NOT NULL,
                [Level] [int] NOT NULL,
                [Description] [nvarchar](max) NOT NULL,
                CONSTRAINT [PK_Spell] PRIMARY KEY CLUSTERED ([Id] ASC)
            );
            GO
            
            -- Create spell casting process table
            CREATE TABLE [spellcasting].[SpellCastingProcess] (
                [Id] [uniqueidentifier] NOT NULL,
                [SpellId] [uniqueidentifier] NOT NULL,
                [WizardId] [uniqueidentifier] NOT NULL,
                [CastingDate] [datetime2](7) NOT NULL,
                [SuccessRate] [decimal](18, 2) NOT NULL,
                [ManaCost] [int] NOT NULL,
                [Notes] [nvarchar](max) NULL,
                CONSTRAINT [PK_SpellCastingProcess] PRIMARY KEY CLUSTERED ([Id] ASC)
            );
            GO
            
            -- Wizards schema
            CREATE SCHEMA [wizards];
            GO
            
            -- Create wizard table
            CREATE TABLE [wizards].[Wizard] (
                [Id] [uniqueidentifier] NOT NULL,
                [Name] [nvarchar](255) NOT NULL,
                [Title] [nvarchar](100) NULL,
                [Level] [int] NOT NULL,
                [Specialization] [nvarchar](100) NULL,
                CONSTRAINT [PK_Wizard] PRIMARY KEY CLUSTERED ([Id] ASC)
            );
            GO
            
            -- Create wizard apprentice table
            CREATE TABLE [wizards].[Apprentice] (
                [Id] [uniqueidentifier] NOT NULL,
                [WizardId] [uniqueidentifier] NOT NULL,
                [MentorId] [uniqueidentifier] NOT NULL,
                [StartDate] [datetime2](7) NOT NULL,
                [EndDate] [datetime2](7) NULL,
                CONSTRAINT [PK_Apprentice] PRIMARY KEY CLUSTERED ([Id] ASC)
            );
            GO
            
            -- Add foreign key constraints
            ALTER TABLE [spellcasting].[SpellCastingProcess] 
                ADD CONSTRAINT [FK_SpellCastingProcess_Spell] 
                FOREIGN KEY ([SpellId]) 
                REFERENCES [spellcasting].[Spell]([Id]);
            GO
            
            ALTER TABLE [spellcasting].[SpellCastingProcess] 
                ADD CONSTRAINT [FK_SpellCastingProcess_Wizard] 
                FOREIGN KEY ([WizardId]) 
                REFERENCES [wizards].[Wizard]([Id]);
            GO
            
            ALTER TABLE [wizards].[Apprentice] 
                ADD CONSTRAINT [FK_Apprentice_Wizard] 
                FOREIGN KEY ([WizardId]) 
                REFERENCES [wizards].[Wizard]([Id]);
            GO
            
            ALTER TABLE [wizards].[Apprentice] 
                ADD CONSTRAINT [FK_Apprentice_Mentor] 
                FOREIGN KEY ([MentorId]) 
                REFERENCES [wizards].[Wizard]([Id]);
            GO
        `;

        const result = await fromSQLServer(sql);

        // Check if we have the expected number of tables and relationships
        expect(result.tables).toHaveLength(4);
        expect(result.relationships).toHaveLength(4);

        // Check a specific relationship we know should exist
        const spellCastingRel = result.relationships.find(
            (r) =>
                r.sourceTable === 'SpellCastingProcess' &&
                r.targetTable === 'Spell' &&
                r.sourceColumn === 'SpellId'
        );

        expect(spellCastingRel).toBeDefined();

        // Find the corresponding tables
        const spellTable = result.tables.find(
            (t) => t.name === 'Spell' && t.schema === 'spellcasting'
        );
        const spellCastingProcessTable = result.tables.find(
            (t) =>
                t.name === 'SpellCastingProcess' && t.schema === 'spellcasting'
        );

        // Verify the IDs are properly linked
        expect(spellCastingRel!.sourceTableId).toBeTruthy();
        expect(spellCastingRel!.targetTableId).toBeTruthy();
        expect(spellCastingRel!.sourceTableId).toBe(
            spellCastingProcessTable!.id
        );
        expect(spellCastingRel!.targetTableId).toBe(spellTable!.id);

        // Check the apprentice self-referencing relationships
        const apprenticeWizardRel = result.relationships.find(
            (r) =>
                r.sourceTable === 'Apprentice' &&
                r.targetTable === 'Wizard' &&
                r.sourceColumn === 'WizardId'
        );

        const apprenticeMentorRel = result.relationships.find(
            (r) =>
                r.sourceTable === 'Apprentice' &&
                r.targetTable === 'Wizard' &&
                r.sourceColumn === 'MentorId'
        );

        expect(apprenticeWizardRel).toBeDefined();
        expect(apprenticeMentorRel).toBeDefined();

        // Check that all relationships have valid table IDs
        const relationshipsWithMissingIds = result.relationships.filter(
            (r) =>
                !r.sourceTableId ||
                !r.targetTableId ||
                r.sourceTableId === '' ||
                r.targetTableId === ''
        );

        expect(relationshipsWithMissingIds).toHaveLength(0);
    });
});
