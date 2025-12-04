import { describe, it, expect } from 'vitest';
import { importDBMLToDiagram } from '../dbml-import';
import { generateDBMLFromDiagram } from '../../dbml-export/dbml-export';
import { DatabaseType } from '@/lib/domain/database-type';

describe('DBML Array Fields - Fantasy RPG Theme', () => {
    describe('Import - Spell and Magic Arrays', () => {
        it('should import spell components as array fields', async () => {
            const dbml = `
Table "magic"."spells" {
  "id" uuid [pk, not null]
  "name" varchar(200) [not null]
  "level" integer [not null]
  "components" text[] [note: 'Magical components: bat wing, dragon scale, phoenix feather']
  "elemental_types" varchar(50)[] [note: 'Elements: fire, water, earth, air']
  "mana_cost" integer [not null]
  "created_at" timestamp [not null]

  Indexes {
    (name, level) [unique, name: "unique_spell"]
  }
}
`;

            const result = await importDBMLToDiagram(dbml, {
                databaseType: DatabaseType.POSTGRESQL,
            });

            expect(result.tables).toHaveLength(1);

            const table = result.tables![0];
            expect(table.name).toBe('spells');
            expect(table.schema).toBe('magic');

            // Find the array fields
            const components = table.fields.find(
                (f) => f.name === 'components'
            );
            const elementalTypes = table.fields.find(
                (f) => f.name === 'elemental_types'
            );

            // Verify they are marked as arrays
            expect(components).toBeDefined();
            expect(components?.isArray).toBe(true);
            expect(components?.type.name).toBe('text');

            expect(elementalTypes).toBeDefined();
            expect(elementalTypes?.isArray).toBe(true);
            expect(elementalTypes?.type.name).toBe('varchar');
            expect(elementalTypes?.characterMaximumLength).toBe('50');

            // Verify non-array fields don't have isArray set
            const idField = table.fields.find((f) => f.name === 'id');
            expect(idField?.isArray).toBeUndefined();
        });

        it('should import hero inventory with various array types', async () => {
            const dbml = `
Table "heroes" {
  "id" bigint [pk]
  "name" varchar(100) [not null]
  "abilities" varchar(100)[]
  "inventory_slots" integer[]
  "skill_levels" decimal(5, 2)[]
  "quest_log" text[]
}
`;

            const result = await importDBMLToDiagram(dbml, {
                databaseType: DatabaseType.POSTGRESQL,
            });

            const table = result.tables![0];

            const abilities = table.fields.find((f) => f.name === 'abilities');
            expect(abilities?.isArray).toBe(true);
            expect(abilities?.type.name).toBe('varchar');
            expect(abilities?.characterMaximumLength).toBe('100');

            const inventorySlots = table.fields.find(
                (f) => f.name === 'inventory_slots'
            );
            expect(inventorySlots?.isArray).toBe(true);
            expect(inventorySlots?.type.name).toBe('int');

            const skillLevels = table.fields.find(
                (f) => f.name === 'skill_levels'
            );
            expect(skillLevels?.isArray).toBe(true);
            expect(skillLevels?.type.name).toBe('decimal');
            expect(skillLevels?.precision).toBe(5);
            expect(skillLevels?.scale).toBe(2);

            const questLog = table.fields.find((f) => f.name === 'quest_log');
            expect(questLog?.isArray).toBe(true);
            expect(questLog?.type.name).toBe('text');
        });

        it('should handle mixed array and non-array fields in creature table', async () => {
            const dbml = `
Table "bestiary"."creatures" {
  "id" uuid [pk]
  "species_name" varchar(100) [not null]
  "habitats" varchar(50)[]
  "danger_level" integer [not null]
  "resistances" varchar(50)[]
  "is_tameable" boolean [not null]
}
`;

            const result = await importDBMLToDiagram(dbml, {
                databaseType: DatabaseType.POSTGRESQL,
            });

            const table = result.tables![0];

            // Non-array fields
            const id = table.fields.find((f) => f.name === 'id');
            expect(id?.isArray).toBeUndefined();

            const speciesName = table.fields.find(
                (f) => f.name === 'species_name'
            );
            expect(speciesName?.isArray).toBeUndefined();

            const dangerLevel = table.fields.find(
                (f) => f.name === 'danger_level'
            );
            expect(dangerLevel?.isArray).toBeUndefined();

            // Array fields
            const habitats = table.fields.find((f) => f.name === 'habitats');
            expect(habitats?.isArray).toBe(true);

            const resistances = table.fields.find(
                (f) => f.name === 'resistances'
            );
            expect(resistances?.isArray).toBe(true);
        });
    });

    describe('Round-trip - Quest and Adventure Arrays', () => {
        it('should preserve quest rewards array through export and re-import', async () => {
            const originalDbml = `
Table "adventures"."quests" {
  "id" uuid [pk, not null]
  "title" varchar(200) [not null]
  "difficulty" varchar(20) [not null]
  "reward_items" text[] [note: 'Legendary sword, enchanted armor, healing potion']
  "required_skills" varchar(100)[]
  "experience_points" integer [not null]
  "gold_reward" decimal(10, 2) [not null]
  "created_at" timestamp [not null]

  Indexes {
    (title, difficulty) [unique, name: "unique_quest"]
  }
}
`;

            // Import the DBML
            const diagram = await importDBMLToDiagram(originalDbml, {
                databaseType: DatabaseType.POSTGRESQL,
            });

            // Verify array fields were imported correctly
            const table = diagram.tables![0];
            const rewardItems = table.fields.find(
                (f) => f.name === 'reward_items'
            );
            const requiredSkills = table.fields.find(
                (f) => f.name === 'required_skills'
            );

            expect(rewardItems?.isArray).toBe(true);
            expect(requiredSkills?.isArray).toBe(true);

            // Export back to DBML
            const { standardDbml: exportedDbml } =
                generateDBMLFromDiagram(diagram);

            // Verify the exported DBML contains array syntax
            expect(exportedDbml).toContain('text[]');
            expect(exportedDbml).toContain('"reward_items" text[]');
            expect(exportedDbml).toContain('"required_skills" varchar(100)[]');

            // Re-import the exported DBML
            const reimportedDiagram = await importDBMLToDiagram(exportedDbml, {
                databaseType: DatabaseType.POSTGRESQL,
            });

            // Verify array fields are still marked as arrays
            const reimportedTable = reimportedDiagram.tables![0];
            const reimportedRewards = reimportedTable.fields.find(
                (f) => f.name === 'reward_items'
            );
            const reimportedSkills = reimportedTable.fields.find(
                (f) => f.name === 'required_skills'
            );

            expect(reimportedRewards?.isArray).toBe(true);
            expect(reimportedSkills?.isArray).toBe(true);
        });

        it('should handle guild members with different array types in round-trip', async () => {
            const originalDbml = `
Table "guilds"."members" {
  "id" uuid [pk]
  "name" varchar(100) [not null]
  "class_specializations" varchar(50)[]
  "completed_quest_ids" integer[]
  "skill_ratings" decimal(3, 1)[]
  "titles_earned" text[]
}
`;

            // Import
            const diagram = await importDBMLToDiagram(originalDbml, {
                databaseType: DatabaseType.POSTGRESQL,
            });

            // Export
            const { standardDbml: exportedDbml } =
                generateDBMLFromDiagram(diagram);

            // Verify exported DBML has correct array syntax with types
            expect(exportedDbml).toContain('varchar(50)[]');
            expect(exportedDbml).toContain('int[]');
            expect(exportedDbml).toContain('decimal(3,1)[]');
            expect(exportedDbml).toContain('text[]');

            // Re-import
            const reimportedDiagram = await importDBMLToDiagram(exportedDbml, {
                databaseType: DatabaseType.POSTGRESQL,
            });

            const table = reimportedDiagram.tables![0];

            const classSpecs = table.fields.find(
                (f) => f.name === 'class_specializations'
            );
            expect(classSpecs?.isArray).toBe(true);
            expect(classSpecs?.characterMaximumLength).toBe('50');

            const questIds = table.fields.find(
                (f) => f.name === 'completed_quest_ids'
            );
            expect(questIds?.isArray).toBe(true);

            const skillRatings = table.fields.find(
                (f) => f.name === 'skill_ratings'
            );
            expect(skillRatings?.isArray).toBe(true);
            expect(skillRatings?.precision).toBe(3);
            expect(skillRatings?.scale).toBe(1);

            const titles = table.fields.find((f) => f.name === 'titles_earned');
            expect(titles?.isArray).toBe(true);
        });

        it('should preserve dungeon loot tables with mixed array and non-array fields', async () => {
            const originalDbml = `
Table "dungeons"."loot_tables" {
  "id" bigint [pk]
  "dungeon_name" varchar(150) [not null]
  "boss_name" varchar(100)
  "common_drops" text[]
  "rare_drops" text[]
  "legendary_drops" text[]
  "gold_range_min" integer [not null]
  "gold_range_max" integer [not null]
  "drop_rates" decimal(5, 2)[]
}
`;

            // Import, export, and re-import
            const diagram = await importDBMLToDiagram(originalDbml, {
                databaseType: DatabaseType.POSTGRESQL,
            });

            const { standardDbml: exportedDbml } =
                generateDBMLFromDiagram(diagram);

            const reimportedDiagram = await importDBMLToDiagram(exportedDbml, {
                databaseType: DatabaseType.POSTGRESQL,
            });

            const table = reimportedDiagram.tables![0];

            // Verify non-array fields
            expect(
                table.fields.find((f) => f.name === 'id')?.isArray
            ).toBeUndefined();
            expect(
                table.fields.find((f) => f.name === 'dungeon_name')?.isArray
            ).toBeUndefined();
            expect(
                table.fields.find((f) => f.name === 'gold_range_min')?.isArray
            ).toBeUndefined();

            // Verify array fields
            expect(
                table.fields.find((f) => f.name === 'common_drops')?.isArray
            ).toBe(true);
            expect(
                table.fields.find((f) => f.name === 'rare_drops')?.isArray
            ).toBe(true);
            expect(
                table.fields.find((f) => f.name === 'legendary_drops')?.isArray
            ).toBe(true);
            expect(
                table.fields.find((f) => f.name === 'drop_rates')?.isArray
            ).toBe(true);
        });
    });
});
