import { describe, it, expect } from 'vitest';
import { generateId } from '@/lib/utils';
import { exportBaseSQL } from '../export-sql-script';
import { DatabaseType } from '@/lib/domain/database-type';
import type { Diagram } from '@/lib/domain/diagram';

describe('SQL Export - Array Fields (Fantasy RPG Theme)', () => {
    it('should export array fields for magical spell components', () => {
        const diagram: Diagram = {
            id: 'test-diagram',
            name: 'Magical Spell System',
            databaseType: DatabaseType.POSTGRESQL,
            tables: [
                {
                    id: generateId(),
                    name: 'spells',
                    schema: '',
                    fields: [
                        {
                            id: generateId(),
                            name: 'id',
                            type: { id: 'uuid', name: 'uuid' },
                            primaryKey: true,
                            unique: true,
                            nullable: false,
                            createdAt: Date.now(),
                        },
                        {
                            id: generateId(),
                            name: 'name',
                            type: { id: 'varchar', name: 'varchar' },
                            primaryKey: false,
                            unique: false,
                            nullable: false,
                            createdAt: Date.now(),
                            characterMaximumLength: '200',
                        },
                        {
                            id: generateId(),
                            name: 'components',
                            type: { id: 'text', name: 'text' },
                            primaryKey: false,
                            unique: false,
                            nullable: true,
                            createdAt: Date.now(),
                            isArray: true,
                            comments: 'Magical components needed for the spell',
                        },
                        {
                            id: generateId(),
                            name: 'elemental_types',
                            type: { id: 'varchar', name: 'varchar' },
                            primaryKey: false,
                            unique: false,
                            nullable: true,
                            createdAt: Date.now(),
                            characterMaximumLength: '50',
                            isArray: true,
                            comments:
                                'Elements involved: fire, water, earth, air',
                        },
                    ],
                    indexes: [],
                    x: 0,
                    y: 0,
                    color: '#3b82f6',
                    isView: false,
                    createdAt: Date.now(),
                    order: 0,
                },
            ],
            relationships: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const sql = exportBaseSQL({
            diagram,
            targetDatabaseType: DatabaseType.POSTGRESQL,
            isDBMLFlow: true,
        });

        expect(sql).toContain('CREATE TABLE "spells"');
        expect(sql).toContain('"components" text[]');
        expect(sql).toContain('"elemental_types" varchar(50)[]');
    });

    it('should export array fields for hero inventory system', () => {
        const diagram: Diagram = {
            id: 'test-diagram',
            name: 'RPG Inventory System',
            databaseType: DatabaseType.POSTGRESQL,
            tables: [
                {
                    id: generateId(),
                    name: 'heroes',
                    schema: 'game',
                    fields: [
                        {
                            id: generateId(),
                            name: 'id',
                            type: { id: 'bigint', name: 'bigint' },
                            primaryKey: true,
                            unique: true,
                            nullable: false,
                            createdAt: Date.now(),
                        },
                        {
                            id: generateId(),
                            name: 'name',
                            type: { id: 'varchar', name: 'varchar' },
                            primaryKey: false,
                            unique: false,
                            nullable: false,
                            createdAt: Date.now(),
                            characterMaximumLength: '100',
                        },
                        {
                            id: generateId(),
                            name: 'abilities',
                            type: { id: 'varchar', name: 'varchar' },
                            primaryKey: false,
                            unique: false,
                            nullable: true,
                            createdAt: Date.now(),
                            characterMaximumLength: '100',
                            isArray: true,
                            comments:
                                'Special abilities like Stealth, Fireball, etc',
                        },
                        {
                            id: generateId(),
                            name: 'inventory_slots',
                            type: { id: 'integer', name: 'integer' },
                            primaryKey: false,
                            unique: false,
                            nullable: true,
                            createdAt: Date.now(),
                            isArray: true,
                            comments: 'Item IDs in inventory',
                        },
                        {
                            id: generateId(),
                            name: 'skill_levels',
                            type: { id: 'numeric', name: 'numeric' },
                            primaryKey: false,
                            unique: false,
                            nullable: true,
                            createdAt: Date.now(),
                            precision: 5,
                            scale: 2,
                            isArray: true,
                            comments: 'Skill proficiency levels',
                        },
                    ],
                    indexes: [],
                    x: 0,
                    y: 0,
                    color: '#ef4444',
                    isView: false,
                    createdAt: Date.now(),
                    order: 0,
                },
            ],
            relationships: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const sql = exportBaseSQL({
            diagram,
            targetDatabaseType: DatabaseType.POSTGRESQL,
            isDBMLFlow: true,
        });

        expect(sql).toContain('CREATE TABLE "game"."heroes"');
        expect(sql).toContain('"abilities" varchar(100)[]');
        expect(sql).toContain('"inventory_slots" integer[]');
        expect(sql).toContain('"skill_levels" numeric(5, 2)[]');
    });

    it('should export non-array fields normally when isArray is false or undefined', () => {
        const diagram: Diagram = {
            id: 'test-diagram',
            name: 'Quest System',
            databaseType: DatabaseType.POSTGRESQL,
            tables: [
                {
                    id: generateId(),
                    name: 'quests',
                    schema: '',
                    fields: [
                        {
                            id: generateId(),
                            name: 'id',
                            type: { id: 'uuid', name: 'uuid' },
                            primaryKey: true,
                            unique: true,
                            nullable: false,
                            createdAt: Date.now(),
                        },
                        {
                            id: generateId(),
                            name: 'title',
                            type: { id: 'varchar', name: 'varchar' },
                            primaryKey: false,
                            unique: false,
                            nullable: false,
                            createdAt: Date.now(),
                            characterMaximumLength: '200',
                            isArray: false,
                        },
                        {
                            id: generateId(),
                            name: 'description',
                            type: { id: 'text', name: 'text' },
                            primaryKey: false,
                            unique: false,
                            nullable: true,
                            createdAt: Date.now(),
                            // isArray is undefined - should not be treated as array
                        },
                    ],
                    indexes: [],
                    x: 0,
                    y: 0,
                    color: '#8b5cf6',
                    isView: false,
                    createdAt: Date.now(),
                    order: 0,
                },
            ],
            relationships: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const sql = exportBaseSQL({
            diagram,
            targetDatabaseType: DatabaseType.POSTGRESQL,
            isDBMLFlow: true,
        });

        expect(sql).toContain('"title" varchar(200)');
        expect(sql).not.toContain('"title" varchar(200)[]');
        expect(sql).toContain('"description" text');
        expect(sql).not.toContain('"description" text[]');
    });

    it('should handle mixed array and non-array fields in magical creatures table', () => {
        const diagram: Diagram = {
            id: 'test-diagram',
            name: 'Bestiary System',
            databaseType: DatabaseType.POSTGRESQL,
            tables: [
                {
                    id: generateId(),
                    name: 'magical_creatures',
                    schema: 'bestiary',
                    fields: [
                        {
                            id: generateId(),
                            name: 'id',
                            type: { id: 'bigint', name: 'bigint' },
                            primaryKey: true,
                            unique: true,
                            nullable: false,
                            createdAt: Date.now(),
                        },
                        {
                            id: generateId(),
                            name: 'species_name',
                            type: { id: 'varchar', name: 'varchar' },
                            primaryKey: false,
                            unique: false,
                            nullable: false,
                            createdAt: Date.now(),
                            characterMaximumLength: '100',
                        },
                        {
                            id: generateId(),
                            name: 'habitats',
                            type: { id: 'varchar', name: 'varchar' },
                            primaryKey: false,
                            unique: false,
                            nullable: true,
                            createdAt: Date.now(),
                            characterMaximumLength: '80',
                            isArray: true,
                            comments:
                                'Preferred habitats: forest, mountain, swamp',
                        },
                        {
                            id: generateId(),
                            name: 'danger_level',
                            type: { id: 'integer', name: 'integer' },
                            primaryKey: false,
                            unique: false,
                            nullable: false,
                            createdAt: Date.now(),
                            default: '1',
                        },
                        {
                            id: generateId(),
                            name: 'resistances',
                            type: { id: 'varchar', name: 'varchar' },
                            primaryKey: false,
                            unique: false,
                            nullable: true,
                            createdAt: Date.now(),
                            characterMaximumLength: '50',
                            isArray: true,
                            comments: 'Damage resistances',
                        },
                        {
                            id: generateId(),
                            name: 'is_tameable',
                            type: { id: 'boolean', name: 'boolean' },
                            primaryKey: false,
                            unique: false,
                            nullable: false,
                            createdAt: Date.now(),
                            default: 'false',
                        },
                    ],
                    indexes: [],
                    x: 0,
                    y: 0,
                    color: '#10b981',
                    isView: false,
                    createdAt: Date.now(),
                    order: 0,
                },
            ],
            relationships: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const sql = exportBaseSQL({
            diagram,
            targetDatabaseType: DatabaseType.POSTGRESQL,
            isDBMLFlow: true,
        });

        expect(sql).toContain('CREATE TABLE "bestiary"."magical_creatures"');
        expect(sql).toContain('"species_name" varchar(100)');
        expect(sql).not.toContain('"species_name" varchar(100)[]');
        expect(sql).toContain('"habitats" varchar(80)[]');
        expect(sql).toContain('"danger_level" integer');
        expect(sql).not.toContain('"danger_level" integer[]');
        expect(sql).toContain('"resistances" varchar(50)[]');
        expect(sql).toContain('"is_tameable" boolean');
        expect(sql).not.toContain('"is_tameable" boolean[]');
    });
});
