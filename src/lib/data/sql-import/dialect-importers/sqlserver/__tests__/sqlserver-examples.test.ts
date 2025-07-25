import { describe, it, expect } from 'vitest';
import { fromSQLServer } from '../sqlserver';

describe('SQL Server Real-World Examples', () => {
    describe('Magical Academy Example', () => {
        it('should parse the magical academy example with all 16 tables', async () => {
            const sql = `
                CREATE TABLE [dbo].[schools](
                    [id] [uniqueidentifier] PRIMARY KEY DEFAULT NEWID(),
                    [name] [nvarchar](255) NOT NULL,
                    [created_at] [datetime2](7) NOT NULL DEFAULT GETDATE()
                );

                CREATE TABLE [dbo].[towers](
                    [id] [uniqueidentifier] PRIMARY KEY DEFAULT NEWID(),
                    [school_id] [uniqueidentifier] NOT NULL,
                    [name] [nvarchar](255) NOT NULL,
                    CONSTRAINT [FK_towers_schools] FOREIGN KEY ([school_id]) REFERENCES [dbo].[schools]([id]) ON DELETE CASCADE
                );

                CREATE TABLE [dbo].[ranks](
                    [id] [uniqueidentifier] PRIMARY KEY DEFAULT NEWID(),
                    [school_id] [uniqueidentifier] NOT NULL,
                    [name] [nvarchar](255) NOT NULL,
                    CONSTRAINT [FK_ranks_schools] FOREIGN KEY ([school_id]) REFERENCES [dbo].[schools]([id]) ON DELETE CASCADE
                );

                CREATE TABLE [dbo].[spell_permissions](
                    [id] [uniqueidentifier] PRIMARY KEY DEFAULT NEWID(),
                    [spell_type] [nvarchar](255) NOT NULL,
                    [casting_level] [nvarchar](255) NOT NULL
                );

                CREATE TABLE [dbo].[rank_spell_permissions](
                    [rank_id] [uniqueidentifier] NOT NULL,
                    [spell_permission_id] [uniqueidentifier] NOT NULL,
                    PRIMARY KEY ([rank_id], [spell_permission_id]),
                    CONSTRAINT [FK_rsp_ranks] FOREIGN KEY ([rank_id]) REFERENCES [dbo].[ranks]([id]) ON DELETE CASCADE,
                    CONSTRAINT [FK_rsp_permissions] FOREIGN KEY ([spell_permission_id]) REFERENCES [dbo].[spell_permissions]([id]) ON DELETE CASCADE
                );

                CREATE TABLE [dbo].[grimoire_types](
                    [id] [uniqueidentifier] PRIMARY KEY DEFAULT NEWID(),
                    [school_id] [uniqueidentifier] NOT NULL,
                    [name] [nvarchar](255) NOT NULL,
                    CONSTRAINT [FK_grimoire_types_schools] FOREIGN KEY ([school_id]) REFERENCES [dbo].[schools]([id]) ON DELETE CASCADE
                );

                CREATE TABLE [dbo].[wizards](
                    [id] [uniqueidentifier] PRIMARY KEY DEFAULT NEWID(),
                    [school_id] [uniqueidentifier] NOT NULL,
                    [tower_id] [uniqueidentifier] NOT NULL,
                    [wizard_name] [nvarchar](255) NOT NULL,
                    [email] [nvarchar](255) NOT NULL,
                    CONSTRAINT [FK_wizards_schools] FOREIGN KEY ([school_id]) REFERENCES [dbo].[schools]([id]) ON DELETE CASCADE,
                    CONSTRAINT [FK_wizards_towers] FOREIGN KEY ([tower_id]) REFERENCES [dbo].[towers]([id]) ON DELETE CASCADE,
                    CONSTRAINT [UQ_wizards_school_name] UNIQUE ([school_id], [wizard_name])
                );

                CREATE TABLE [dbo].[wizard_ranks](
                    [wizard_id] [uniqueidentifier] NOT NULL,
                    [rank_id] [uniqueidentifier] NOT NULL,
                    [tower_id] [uniqueidentifier] NOT NULL,
                    [assigned_at] [datetime2](7) NOT NULL DEFAULT GETDATE(),
                    PRIMARY KEY ([wizard_id], [rank_id], [tower_id]),
                    CONSTRAINT [FK_wr_wizards] FOREIGN KEY ([wizard_id]) REFERENCES [dbo].[wizards]([id]) ON DELETE CASCADE,
                    CONSTRAINT [FK_wr_ranks] FOREIGN KEY ([rank_id]) REFERENCES [dbo].[ranks]([id]) ON DELETE CASCADE,
                    CONSTRAINT [FK_wr_towers] FOREIGN KEY ([tower_id]) REFERENCES [dbo].[towers]([id]) ON DELETE CASCADE
                );

                CREATE TABLE [dbo].[apprentices](
                    [id] [uniqueidentifier] PRIMARY KEY DEFAULT NEWID(),
                    [school_id] [uniqueidentifier] NOT NULL,
                    [tower_id] [uniqueidentifier] NOT NULL,
                    [first_name] [nvarchar](255) NOT NULL,
                    [last_name] [nvarchar](255) NOT NULL,
                    [enrollment_date] [date] NOT NULL,
                    [primary_mentor] [uniqueidentifier] NULL,
                    [sponsoring_wizard] [uniqueidentifier] NULL,
                    CONSTRAINT [FK_apprentices_schools] FOREIGN KEY ([school_id]) REFERENCES [dbo].[schools]([id]) ON DELETE CASCADE,
                    CONSTRAINT [FK_apprentices_towers] FOREIGN KEY ([tower_id]) REFERENCES [dbo].[towers]([id]) ON DELETE CASCADE,
                    CONSTRAINT [FK_apprentices_mentor] FOREIGN KEY ([primary_mentor]) REFERENCES [dbo].[wizards]([id]),
                    CONSTRAINT [FK_apprentices_sponsor] FOREIGN KEY ([sponsoring_wizard]) REFERENCES [dbo].[wizards]([id])
                );

                CREATE TABLE [dbo].[spell_lessons](
                    [id] [uniqueidentifier] PRIMARY KEY DEFAULT NEWID(),
                    [school_id] [uniqueidentifier] NOT NULL,
                    [tower_id] [uniqueidentifier] NOT NULL,
                    [apprentice_id] [uniqueidentifier] NOT NULL,
                    [instructor_id] [uniqueidentifier] NOT NULL,
                    [lesson_date] [datetime2](7) NOT NULL,
                    CONSTRAINT [FK_sl_schools] FOREIGN KEY ([school_id]) REFERENCES [dbo].[schools]([id]) ON DELETE CASCADE,
                    CONSTRAINT [FK_sl_towers] FOREIGN KEY ([tower_id]) REFERENCES [dbo].[towers]([id]) ON DELETE CASCADE,
                    CONSTRAINT [FK_sl_apprentices] FOREIGN KEY ([apprentice_id]) REFERENCES [dbo].[apprentices]([id]) ON DELETE CASCADE,
                    CONSTRAINT [FK_sl_instructors] FOREIGN KEY ([instructor_id]) REFERENCES [dbo].[wizards]([id])
                );

                CREATE TABLE [dbo].[grimoires](
                    [id] [uniqueidentifier] PRIMARY KEY DEFAULT NEWID(),
                    [school_id] [uniqueidentifier] NOT NULL,
                    [tower_id] [uniqueidentifier] NOT NULL,
                    [apprentice_id] [uniqueidentifier] NOT NULL,
                    [grimoire_type_id] [uniqueidentifier] NOT NULL,
                    [author_wizard_id] [uniqueidentifier] NOT NULL,
                    [content] [nvarchar](max) NOT NULL,
                    CONSTRAINT [FK_g_schools] FOREIGN KEY ([school_id]) REFERENCES [dbo].[schools]([id]) ON DELETE CASCADE,
                    CONSTRAINT [FK_g_towers] FOREIGN KEY ([tower_id]) REFERENCES [dbo].[towers]([id]) ON DELETE CASCADE,
                    CONSTRAINT [FK_g_apprentices] FOREIGN KEY ([apprentice_id]) REFERENCES [dbo].[apprentices]([id]) ON DELETE CASCADE,
                    CONSTRAINT [FK_g_types] FOREIGN KEY ([grimoire_type_id]) REFERENCES [dbo].[grimoire_types]([id]),
                    CONSTRAINT [FK_g_authors] FOREIGN KEY ([author_wizard_id]) REFERENCES [dbo].[wizards]([id])
                );

                CREATE TABLE [dbo].[tuition_scrolls](
                    [id] [uniqueidentifier] PRIMARY KEY DEFAULT NEWID(),
                    [school_id] [uniqueidentifier] NOT NULL,
                    [tower_id] [uniqueidentifier] NOT NULL,
                    [apprentice_id] [uniqueidentifier] NOT NULL,
                    [total_amount] [decimal](10,2) NOT NULL,
                    [status] [nvarchar](50) NOT NULL,
                    CONSTRAINT [FK_ts_schools] FOREIGN KEY ([school_id]) REFERENCES [dbo].[schools]([id]) ON DELETE CASCADE,
                    CONSTRAINT [FK_ts_towers] FOREIGN KEY ([tower_id]) REFERENCES [dbo].[towers]([id]) ON DELETE CASCADE,
                    CONSTRAINT [FK_ts_apprentices] FOREIGN KEY ([apprentice_id]) REFERENCES [dbo].[apprentices]([id]) ON DELETE CASCADE
                );

                CREATE TABLE [dbo].[tuition_items](
                    [id] [uniqueidentifier] PRIMARY KEY DEFAULT NEWID(),
                    [tuition_scroll_id] [uniqueidentifier] NOT NULL,
                    [description] [nvarchar](max) NOT NULL,
                    [amount] [decimal](10,2) NOT NULL,
                    CONSTRAINT [FK_ti_scrolls] FOREIGN KEY ([tuition_scroll_id]) REFERENCES [dbo].[tuition_scrolls]([id]) ON DELETE CASCADE
                );

                CREATE TABLE [dbo].[patron_sponsorships](
                    [id] [uniqueidentifier] PRIMARY KEY DEFAULT NEWID(),
                    [tuition_scroll_id] [uniqueidentifier] NOT NULL,
                    [patron_house] [nvarchar](255) NOT NULL,
                    [sponsorship_code] [nvarchar](50) NOT NULL,
                    [status] [nvarchar](50) NOT NULL,
                    CONSTRAINT [FK_ps_scrolls] FOREIGN KEY ([tuition_scroll_id]) REFERENCES [dbo].[tuition_scrolls]([id]) ON DELETE CASCADE
                );

                CREATE TABLE [dbo].[gold_payments](
                    [id] [uniqueidentifier] PRIMARY KEY DEFAULT NEWID(),
                    [tuition_scroll_id] [uniqueidentifier] NOT NULL,
                    [amount] [decimal](10,2) NOT NULL,
                    [payment_date] [datetime2](7) NOT NULL DEFAULT GETDATE(),
                    CONSTRAINT [FK_gp_scrolls] FOREIGN KEY ([tuition_scroll_id]) REFERENCES [dbo].[tuition_scrolls]([id]) ON DELETE CASCADE
                );

                CREATE TABLE [dbo].[arcane_logs](
                    [id] [bigint] IDENTITY(1,1) PRIMARY KEY,
                    [school_id] [uniqueidentifier] NULL,
                    [wizard_id] [uniqueidentifier] NULL,
                    [tower_id] [uniqueidentifier] NULL,
                    [table_name] [nvarchar](255) NOT NULL,
                    [operation] [nvarchar](50) NOT NULL,
                    [record_id] [uniqueidentifier] NULL,
                    [changes] [nvarchar](max) NULL,
                    [created_at] [datetime2](7) NOT NULL DEFAULT GETDATE(),
                    CONSTRAINT [FK_al_schools] FOREIGN KEY ([school_id]) REFERENCES [dbo].[schools]([id]) ON DELETE SET NULL,
                    CONSTRAINT [FK_al_wizards] FOREIGN KEY ([wizard_id]) REFERENCES [dbo].[wizards]([id]) ON DELETE SET NULL,
                    CONSTRAINT [FK_al_towers] FOREIGN KEY ([tower_id]) REFERENCES [dbo].[towers]([id]) ON DELETE SET NULL
                );
            `;

            const result = await fromSQLServer(sql);

            // Should find all 16 tables
            const expectedTables = [
                'apprentices',
                'arcane_logs',
                'gold_payments',
                'grimoire_types',
                'grimoires',
                'patron_sponsorships',
                'rank_spell_permissions',
                'ranks',
                'schools',
                'spell_lessons',
                'spell_permissions',
                'towers',
                'tuition_items',
                'tuition_scrolls',
                'wizard_ranks',
                'wizards',
            ];

            expect(result.tables).toHaveLength(16);
            expect(result.tables.map((t) => t.name).sort()).toEqual(
                expectedTables
            );

            // Verify key relationships exist
            const relationships = result.relationships;

            // Check some critical relationships
            expect(
                relationships.some(
                    (r) =>
                        r.sourceTable === 'wizards' &&
                        r.targetTable === 'schools' &&
                        r.sourceColumn === 'school_id'
                )
            ).toBe(true);

            expect(
                relationships.some(
                    (r) =>
                        r.sourceTable === 'wizard_ranks' &&
                        r.targetTable === 'wizards' &&
                        r.sourceColumn === 'wizard_id'
                )
            ).toBe(true);

            expect(
                relationships.some(
                    (r) =>
                        r.sourceTable === 'apprentices' &&
                        r.targetTable === 'wizards' &&
                        r.sourceColumn === 'primary_mentor'
                )
            ).toBe(true);
        });
    });

    describe('Enchanted Bazaar Example', () => {
        it('should parse the enchanted bazaar example with complex features', async () => {
            const sql = `
                -- Enchanted Bazaar tables with complex features
                CREATE TABLE [dbo].[merchants](
                    [id] [int] IDENTITY(1,1) PRIMARY KEY,
                    [name] [nvarchar](255) NOT NULL,
                    [email] [nvarchar](255) NOT NULL,
                    [created_at] [datetime] DEFAULT GETDATE(),
                    CONSTRAINT [UQ_merchants_email] UNIQUE ([email])
                );

                CREATE TABLE [dbo].[artifacts](
                    [id] [int] IDENTITY(1,1) PRIMARY KEY,
                    [merchant_id] [int] NOT NULL,
                    [name] [nvarchar](255) NOT NULL,
                    [price] [decimal](10, 2) NOT NULL CHECK ([price] >= 0),
                    [enchantment_charges] [int] DEFAULT 0 CHECK ([enchantment_charges] >= 0),
                    CONSTRAINT [FK_artifacts_merchants] FOREIGN KEY ([merchant_id]) REFERENCES [dbo].[merchants]([id]) ON DELETE CASCADE
                );

                CREATE TABLE [dbo].[trades](
                    [id] [int] IDENTITY(1,1) PRIMARY KEY,
                    [created_at] [datetime] DEFAULT GETDATE(),
                    [status] [varchar](50) DEFAULT 'negotiating'
                );

                CREATE TABLE [dbo].[trade_items](
                    [trade_id] [int] NOT NULL,
                    [artifact_id] [int] NOT NULL,
                    [quantity] [int] NOT NULL CHECK ([quantity] > 0),
                    [agreed_price] [decimal](10, 2) NOT NULL,
                    PRIMARY KEY ([trade_id], [artifact_id]),
                    CONSTRAINT [FK_ti_trades] FOREIGN KEY ([trade_id]) REFERENCES [dbo].[trades]([id]) ON DELETE CASCADE,
                    CONSTRAINT [FK_ti_artifacts] FOREIGN KEY ([artifact_id]) REFERENCES [dbo].[artifacts]([id])
                );

                -- Create indexes
                CREATE INDEX [IX_artifacts_merchant_id] ON [dbo].[artifacts] ([merchant_id]);
                CREATE INDEX [IX_artifacts_price] ON [dbo].[artifacts] ([price] DESC);
                CREATE UNIQUE INDEX [UIX_artifacts_name_merchant] ON [dbo].[artifacts] ([name], [merchant_id]);
            `;

            const result = await fromSQLServer(sql);

            // Should parse all tables
            expect(result.tables.length).toBeGreaterThanOrEqual(4);

            // Check for specific tables
            const tableNames = result.tables.map((t) => t.name);
            expect(tableNames).toContain('merchants');
            expect(tableNames).toContain('artifacts');
            expect(tableNames).toContain('trades');
            expect(tableNames).toContain('trade_items');

            // Check relationships
            expect(
                result.relationships.some(
                    (r) =>
                        r.sourceTable === 'artifacts' &&
                        r.targetTable === 'merchants'
                )
            ).toBe(true);

            expect(
                result.relationships.some(
                    (r) =>
                        r.sourceTable === 'trade_items' &&
                        r.targetTable === 'trades'
                )
            ).toBe(true);

            // Check indexes were created
            const artifactsTable = result.tables.find(
                (t) => t.name === 'artifacts'
            );
            expect(artifactsTable?.indexes.length).toBeGreaterThanOrEqual(2);
            expect(
                artifactsTable?.indexes.some(
                    (i) => i.name === 'IX_artifacts_merchant_id'
                )
            ).toBe(true);
            expect(
                artifactsTable?.indexes.some(
                    (i) => i.unique && i.name === 'UIX_artifacts_name_merchant'
                )
            ).toBe(true);
        });
    });

    describe('Complex SQL Server Schema Example', () => {
        it('should parse complex multi-schema database with various SQL Server features', async () => {
            const sql = `
                CREATE SCHEMA [magic];
                GO
                CREATE SCHEMA [inventory];
                GO
                CREATE SCHEMA [academy];
                GO

                -- Magic schema tables
                CREATE TABLE [magic].[spell_categories](
                    [id] [uniqueidentifier] PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
                    [name] [nvarchar](100) NOT NULL,
                    [description] [nvarchar](max) NULL,
                    [is_forbidden] [bit] NOT NULL DEFAULT 0,
                    [created_at] [datetime2](7) NOT NULL DEFAULT SYSDATETIME()
                );

                CREATE TABLE [magic].[spells](
                    [id] [uniqueidentifier] PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
                    [category_id] [uniqueidentifier] NOT NULL,
                    [name] [nvarchar](200) NOT NULL,
                    [mana_cost] [smallint] NOT NULL CHECK ([mana_cost] > 0),
                    [damage_output] [decimal](10,2) NULL,
                    [cast_time_ms] [int] NOT NULL DEFAULT 1000,
                    [is_active] [bit] NOT NULL DEFAULT 1,
                    [metadata] [xml] NULL,
                    CONSTRAINT [FK_spells_categories] FOREIGN KEY ([category_id]) 
                        REFERENCES [magic].[spell_categories]([id]) ON DELETE CASCADE,
                    CONSTRAINT [UQ_spells_name] UNIQUE ([name])
                );

                -- Inventory schema tables
                CREATE TABLE [inventory].[item_types](
                    [id] [int] IDENTITY(1,1) PRIMARY KEY,
                    [type_code] [char](3) NOT NULL UNIQUE,
                    [type_name] [varchar](50) NOT NULL,
                    [max_stack_size] [tinyint] NOT NULL DEFAULT 99
                );

                CREATE TABLE [inventory].[magical_items](
                    [id] [bigint] IDENTITY(1,1) PRIMARY KEY,
                    [item_type_id] [int] NOT NULL,
                    [item_name] [nvarchar](255) NOT NULL,
                    [rarity] [varchar](20) NOT NULL,
                    [weight_kg] [float] NOT NULL,
                    [base_value] [money] NOT NULL,
                    [enchantment_level] [tinyint] NULL CHECK ([enchantment_level] BETWEEN 0 AND 10),
                    [discovered_date] [date] NULL,
                    [discovered_time] [time](7) NULL,
                    [full_discovered_at] [datetimeoffset](7) NULL,
                    CONSTRAINT [FK_items_types] FOREIGN KEY ([item_type_id]) 
                        REFERENCES [inventory].[item_types]([id])
                );

                -- Academy schema tables
                CREATE TABLE [academy].[courses](
                    [course_id] [uniqueidentifier] PRIMARY KEY DEFAULT NEWID(),
                    [course_code] [nvarchar](10) NOT NULL UNIQUE,
                    [course_name] [nvarchar](200) NOT NULL,
                    [credits] [decimal](3,1) NOT NULL,
                    [prerequisite_spell_id] [uniqueidentifier] NULL,
                    CONSTRAINT [FK_courses_spells] FOREIGN KEY ([prerequisite_spell_id]) 
                        REFERENCES [magic].[spells]([id])
                );

                CREATE TABLE [academy].[enrollments](
                    [enrollment_id] [bigint] IDENTITY(1,1) PRIMARY KEY,
                    [student_id] [uniqueidentifier] NOT NULL,
                    [course_id] [uniqueidentifier] NOT NULL,
                    [enrollment_date] [datetime2](0) NOT NULL DEFAULT GETDATE(),
                    [grade] [decimal](4,2) NULL CHECK ([grade] >= 0 AND [grade] <= 100),
                    [completion_status] [nvarchar](20) NOT NULL DEFAULT 'enrolled',
                    CONSTRAINT [FK_enrollments_courses] FOREIGN KEY ([course_id]) 
                        REFERENCES [academy].[courses]([course_id]) ON DELETE CASCADE,
                    CONSTRAINT [UQ_enrollment] UNIQUE ([student_id], [course_id])
                );

                -- Cross-schema relationships
                CREATE TABLE [inventory].[spell_reagents](
                    [spell_id] [uniqueidentifier] NOT NULL,
                    [item_id] [bigint] NOT NULL,
                    [quantity_required] [smallint] NOT NULL DEFAULT 1,
                    PRIMARY KEY ([spell_id], [item_id]),
                    CONSTRAINT [FK_reagents_spells] FOREIGN KEY ([spell_id]) 
                        REFERENCES [magic].[spells]([id]) ON DELETE CASCADE,
                    CONSTRAINT [FK_reagents_items] FOREIGN KEY ([item_id]) 
                        REFERENCES [inventory].[magical_items]([id]) ON DELETE CASCADE
                );

                -- Additional indexes
                CREATE INDEX [IX_spells_category] ON [magic].[spells] ([category_id]);
                CREATE INDEX [IX_items_type_rarity] ON [inventory].[magical_items] ([item_type_id], [rarity]);
                CREATE UNIQUE INDEX [UIX_items_name_type] ON [inventory].[magical_items] ([item_name], [item_type_id]);
            `;

            const result = await fromSQLServer(sql);

            // Verify all tables are parsed
            expect(result.tables).toHaveLength(7);

            // Check schema assignment
            expect(
                result.tables.filter((t) => t.schema === 'magic')
            ).toHaveLength(2);
            expect(
                result.tables.filter((t) => t.schema === 'inventory')
            ).toHaveLength(3);
            expect(
                result.tables.filter((t) => t.schema === 'academy')
            ).toHaveLength(2);

            // Verify cross-schema relationships
            const crossSchemaRel = result.relationships.find(
                (r) => r.sourceTable === 'courses' && r.targetTable === 'spells'
            );
            expect(crossSchemaRel).toBeDefined();
            expect(crossSchemaRel?.sourceSchema).toBe('academy');
            expect(crossSchemaRel?.targetSchema).toBe('magic');

            // Check various SQL Server data types
            const spellsTable = result.tables.find((t) => t.name === 'spells');
            expect(
                spellsTable?.columns.find((c) => c.name === 'mana_cost')?.type
            ).toBe('smallint');
            expect(
                spellsTable?.columns.find((c) => c.name === 'metadata')?.type
            ).toBe('xml');

            const itemsTable = result.tables.find(
                (t) => t.name === 'magical_items'
            );
            expect(
                itemsTable?.columns.find((c) => c.name === 'weight_kg')?.type
            ).toBe('float');
            expect(
                itemsTable?.columns.find((c) => c.name === 'base_value')?.type
            ).toBe('money');
            expect(
                itemsTable?.columns.find((c) => c.name === 'discovered_date')
                    ?.type
            ).toBe('date');
            expect(
                itemsTable?.columns.find((c) => c.name === 'discovered_time')
                    ?.type
            ).toBe('time');
            expect(
                itemsTable?.columns.find((c) => c.name === 'full_discovered_at')
                    ?.type
            ).toBe('datetimeoffset');

            // Verify IDENTITY columns
            const itemTypesTable = result.tables.find(
                (t) => t.name === 'item_types'
            );
            expect(
                itemTypesTable?.columns.find((c) => c.name === 'id')?.increment
            ).toBe(true);
        });
    });
});
