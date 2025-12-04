import { describe, it, expect } from 'vitest';
import { importDBMLToDiagram } from '../dbml-import';
import { generateDBMLFromDiagram } from '../../dbml-export/dbml-export';
import { applyDBMLChanges } from '../../apply-dbml/apply-dbml';
import { DatabaseType } from '@/lib/domain/database-type';
import type { Diagram } from '@/lib/domain/diagram';

describe('DBML Schema Handling - Fantasy Realm Database', () => {
    describe('MySQL - No Schema Support', () => {
        it('should not add public schema for MySQL databases', async () => {
            // Fantasy realm DBML with tables that would typically get 'public' schema
            const dbmlContent = `
                Table "wizards" {
                    "id" bigint [pk]
                    "name" varchar(100)
                    "magic_level" int
                    "Yes" varchar(10) // Reserved DBML keyword
                    "No" varchar(10)  // Reserved DBML keyword
                }

                Table "dragons" {
                    "id" bigint [pk]
                    "name" varchar(100)
                    "treasure_count" int
                    "is_friendly" boolean
                }

                Table "spells" {
                    "id" bigint [pk]
                    "spell_name" varchar(200)
                    "wizard_id" bigint
                    "power_level" int
                }

                Ref: "spells"."wizard_id" > "wizards"."id"
            `;

            const diagram = await importDBMLToDiagram(dbmlContent, {
                databaseType: DatabaseType.MYSQL,
            });

            // Verify no 'public' schema was added
            expect(diagram.tables).toBeDefined();
            diagram.tables?.forEach((table) => {
                expect(table.schema).toBe('');
            });

            // Check specific tables
            const wizardsTable = diagram.tables?.find(
                (t) => t.name === 'wizards'
            );
            expect(wizardsTable).toBeDefined();
            expect(wizardsTable?.schema).toBe('');

            // Check that reserved keywords are preserved as field names
            const yesField = wizardsTable?.fields.find((f) => f.name === 'Yes');
            const noField = wizardsTable?.fields.find((f) => f.name === 'No');
            expect(yesField).toBeDefined();
            expect(noField).toBeDefined();
        });

        it('should preserve IDs when re-importing DBML (no false changes)', async () => {
            // Create initial diagram
            const initialDBML = `
                Table "kingdoms" {
                    "id" bigint [pk]
                    "name" varchar(100)
                    "ruler" varchar(100)
                    "Yes" varchar(10) // Acceptance status
                    "No" varchar(10)  // Rejection status
                }

                Table "knights" {
                    "id" bigint [pk]
                    "name" varchar(100)
                    "kingdom_id" bigint
                    "honor_points" int
                }

                Ref: "knights"."kingdom_id" > "kingdoms"."id"
            `;

            // Import initial DBML
            const sourceDiagram = await importDBMLToDiagram(initialDBML, {
                databaseType: DatabaseType.MYSQL,
            });

            // Export to DBML
            const exported = generateDBMLFromDiagram(sourceDiagram);

            // Re-import the exported DBML (simulating edit mode)
            const reimportedDiagram = await importDBMLToDiagram(
                exported.inlineDbml,
                {
                    databaseType: DatabaseType.MYSQL,
                }
            );

            // Apply DBML changes (should preserve IDs)
            const targetDiagram: Diagram = {
                ...sourceDiagram,
                tables: reimportedDiagram.tables,
                relationships: reimportedDiagram.relationships,
                customTypes: reimportedDiagram.customTypes,
            };

            const resultDiagram = applyDBMLChanges({
                sourceDiagram,
                targetDiagram,
            });

            // Verify IDs are preserved
            expect(resultDiagram.tables?.length).toBe(
                sourceDiagram.tables?.length
            );

            sourceDiagram.tables?.forEach((sourceTable, idx) => {
                const resultTable = resultDiagram.tables?.[idx];
                expect(resultTable?.id).toBe(sourceTable.id);
                expect(resultTable?.name).toBe(sourceTable.name);

                // Check field IDs are preserved
                sourceTable.fields.forEach((sourceField, fieldIdx) => {
                    const resultField = resultTable?.fields[fieldIdx];
                    expect(resultField?.id).toBe(sourceField.id);
                    expect(resultField?.name).toBe(sourceField.name);
                });
            });
        });
    });

    describe('PostgreSQL - Schema Support', () => {
        it('should handle schemas correctly for PostgreSQL', async () => {
            // Fantasy realm with multiple schemas
            const dbmlContent = `
                Table "public"."heroes" {
                    "id" bigint [pk]
                    "name" varchar(100)
                    "class" varchar(50)
                }

                Table "private"."secret_quests" {
                    "id" bigint [pk]
                    "quest_name" varchar(200)
                    "hero_id" bigint
                }

                Table "artifacts" {
                    "id" bigint [pk]
                    "name" varchar(100)
                    "power" int
                }

                Ref: "private"."secret_quests"."hero_id" > "public"."heroes"."id"
            `;

            const diagram = await importDBMLToDiagram(dbmlContent, {
                databaseType: DatabaseType.POSTGRESQL,
            });

            // Check schemas are preserved correctly
            const heroesTable = diagram.tables?.find(
                (t) => t.name === 'heroes'
            );
            expect(heroesTable?.schema).toBe(''); // 'public' should be converted to empty

            const secretQuestsTable = diagram.tables?.find(
                (t) => t.name === 'secret_quests'
            );
            expect(secretQuestsTable?.schema).toBe('private'); // Other schemas preserved

            const artifactsTable = diagram.tables?.find(
                (t) => t.name === 'artifacts'
            );
            expect(artifactsTable?.schema).toBe(''); // No schema = empty string
        });

        it('should handle reserved keywords for PostgreSQL', async () => {
            const dbmlContent = `
                Table "magic_items" {
                    "id" bigint [pk]
                    "name" varchar(100)
                    "Order" int // SQL keyword
                    "Yes" varchar(10) // DBML keyword
                    "No" varchar(10)  // DBML keyword
                }
            `;

            const diagram = await importDBMLToDiagram(dbmlContent, {
                databaseType: DatabaseType.POSTGRESQL,
            });

            const exported = generateDBMLFromDiagram(diagram);

            expect(exported.standardDbml).toContain('Order');
            expect(exported.standardDbml).toContain('Yes');
            expect(exported.standardDbml).toContain('No');
        });
    });

    describe('Public Schema Handling - The Core Fix', () => {
        it('should strip public schema for MySQL to prevent ID mismatch', async () => {
            // This test verifies the core fix - that 'public' schema is converted to empty string
            const dbmlWithPublicSchema = `
                Table "public"."enchanted_items" {
                    "id" bigint [pk]
                    "item_name" varchar(100)
                    "power" int
                }

                Table "public"."spell_books" {
                    "id" bigint [pk]
                    "title" varchar(200)
                    "author" varchar(100)
                }
            `;

            const mysqlDiagram = await importDBMLToDiagram(
                dbmlWithPublicSchema,
                {
                    databaseType: DatabaseType.MYSQL,
                }
            );

            // For MySQL, 'public' schema should be stripped
            mysqlDiagram.tables?.forEach((table) => {
                expect(table.schema).toBe('');
            });

            // Now test with PostgreSQL - public should also be stripped (it's the default)
            const pgDiagram = await importDBMLToDiagram(dbmlWithPublicSchema, {
                databaseType: DatabaseType.POSTGRESQL,
            });

            pgDiagram.tables?.forEach((table) => {
                expect(table.schema).toBe('');
            });
        });

        it('should preserve non-public schemas', async () => {
            const dbmlWithCustomSchema = `
                Table "fantasy"."magic_users" {
                    "id" bigint [pk]
                    "name" varchar(100)
                    "class" varchar(50)
                }

                Table "adventure"."quests" {
                    "id" bigint [pk]
                    "title" varchar(200)
                    "reward" int
                }
            `;

            const diagram = await importDBMLToDiagram(dbmlWithCustomSchema, {
                databaseType: DatabaseType.POSTGRESQL,
            });

            // Non-public schemas should be preserved
            const magicTable = diagram.tables?.find(
                (t) => t.name === 'magic_users'
            );
            const questTable = diagram.tables?.find((t) => t.name === 'quests');

            expect(magicTable?.schema).toBe('fantasy');
            expect(questTable?.schema).toBe('adventure');
        });
    });

    describe('Edge Cases - The Dungeon of Bugs', () => {
        it('should handle tables with names that need quoting', async () => {
            const dbmlContent = `
                Table "dragons_lair" {
                    "id" bigint [pk]
                    "treasure_amount" decimal
                }

                Table "wizard_tower" {
                    "id" bigint [pk]
                    "floor_count" int
                }

                Table "quest_log" {
                    "id" bigint [pk]
                    "quest_name" varchar(200)
                }
            `;

            const diagram = await importDBMLToDiagram(dbmlContent, {
                databaseType: DatabaseType.MYSQL,
            });

            // Tables should be imported correctly
            expect(diagram.tables?.length).toBe(3);
            expect(
                diagram.tables?.find((t) => t.name === 'dragons_lair')
            ).toBeDefined();
            expect(
                diagram.tables?.find((t) => t.name === 'wizard_tower')
            ).toBeDefined();
            expect(
                diagram.tables?.find((t) => t.name === 'quest_log')
            ).toBeDefined();
        });

        it('should handle the Work_Order_Page_Debug case with Yes/No fields', async () => {
            // This is the exact case that was causing the original bug
            const dbmlContent = `
                Table "Work_Order_Page_Debug" {
                    "ID" bigint [pk, not null]
                    "Work_Order_For" varchar(255)
                    "Quan_to_Make" int
                    "Text_Gen" text
                    "Gen_Info" text
                    "Yes" varchar(255)
                    "No" varchar(255)
                }
            `;

            const diagram = await importDBMLToDiagram(dbmlContent, {
                databaseType: DatabaseType.MYSQL,
            });

            const table = diagram.tables?.find(
                (t) => t.name === 'Work_Order_Page_Debug'
            );
            expect(table).toBeDefined();

            // Check Yes and No fields are preserved
            const yesField = table?.fields.find((f) => f.name === 'Yes');
            const noField = table?.fields.find((f) => f.name === 'No');

            expect(yesField).toBeDefined();
            expect(noField).toBeDefined();
            expect(yesField?.name).toBe('Yes');
            expect(noField?.name).toBe('No');

            // Export and verify it doesn't cause errors
            const exported = generateDBMLFromDiagram(diagram);
            expect(exported.standardDbml).toContain('"Yes"');
            expect(exported.standardDbml).toContain('"No"');

            // Re-import should work without errors
            const reimported = await importDBMLToDiagram(exported.inlineDbml, {
                databaseType: DatabaseType.MYSQL,
            });

            expect(reimported.tables?.length).toBe(1);
        });
    });

    describe('Round-trip Testing - The Eternal Cycle', () => {
        it('should maintain data integrity through multiple import/export cycles', async () => {
            const originalDBML = `
                Table "guild_members" {
                    "id" bigint [pk]
                    "name" varchar(100)
                    "level" int
                    "Yes" varchar(10) // Active status
                    "No" varchar(10)  // Inactive status
                    "Order" int       // SQL keyword - rank order
                }

                Table "guild_quests" {
                    "id" bigint [pk]
                    "quest_name" varchar(200)
                    "assigned_to" bigint
                    "difficulty" int
                }

                Ref: "guild_quests"."assigned_to" > "guild_members"."id"
            `;

            let currentDiagram = await importDBMLToDiagram(originalDBML, {
                databaseType: DatabaseType.MYSQL,
            });

            // Store original IDs
            const originalTableIds = currentDiagram.tables?.map((t) => ({
                name: t.name,
                id: t.id,
            }));

            // Perform 3 round-trips
            for (let cycle = 1; cycle <= 3; cycle++) {
                // Export
                const exported = generateDBMLFromDiagram(currentDiagram);

                // Re-import
                const reimported = await importDBMLToDiagram(
                    exported.inlineDbml,
                    {
                        databaseType: DatabaseType.MYSQL,
                    }
                );

                // Apply changes
                const targetDiagram: Diagram = {
                    ...currentDiagram,
                    tables: reimported.tables,
                    relationships: reimported.relationships,
                    customTypes: reimported.customTypes,
                };

                currentDiagram = applyDBMLChanges({
                    sourceDiagram: currentDiagram,
                    targetDiagram,
                });

                // Verify IDs are still the same as original
                originalTableIds?.forEach((original) => {
                    const currentTable = currentDiagram.tables?.find(
                        (t) => t.name === original.name
                    );
                    expect(currentTable?.id).toBe(original.id);
                });
            }
        });
    });
});
