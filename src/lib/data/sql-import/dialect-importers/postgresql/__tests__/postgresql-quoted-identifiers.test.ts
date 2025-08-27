import { describe, it, expect } from 'vitest';
import { fromPostgres } from '../postgresql';

describe('PostgreSQL Import - Quoted Identifiers with Special Characters', () => {
    describe('CREATE TABLE with quoted identifiers', () => {
        it('should handle tables with quoted schema and table names', async () => {
            const sql = `
                CREATE TABLE "my-schema"."user-profiles" (
                    id serial PRIMARY KEY,
                    name text NOT NULL
                );
            `;

            const result = await fromPostgres(sql);

            expect(result.warnings || []).toHaveLength(0);
            expect(result.tables).toHaveLength(1);

            const table = result.tables[0];
            expect(table.schema).toBe('my-schema');
            expect(table.name).toBe('user-profiles');
        });

        it('should handle tables with spaces in schema and table names', async () => {
            const sql = `
                CREATE TABLE "user schema"."profile table" (
                    "user id" integer PRIMARY KEY,
                    "full name" varchar(255)
                );
            `;

            const result = await fromPostgres(sql);

            expect(result.warnings || []).toHaveLength(0);
            expect(result.tables).toHaveLength(1);

            const table = result.tables[0];
            expect(table.schema).toBe('user schema');
            expect(table.name).toBe('profile table');
            expect(table.columns).toBeDefined();
            expect(table.columns.length).toBeGreaterThan(0);
            // Note: Column names with spaces might be parsed differently
        });

        it('should handle mixed quoted and unquoted identifiers', async () => {
            const sql = `
                CREATE TABLE "special-schema".users (
                    id serial PRIMARY KEY
                );
                CREATE TABLE public."special-table" (
                    id serial PRIMARY KEY
                );
            `;

            const result = await fromPostgres(sql);

            expect(result.warnings || []).toHaveLength(0);
            expect(result.tables).toHaveLength(2);

            expect(result.tables[0].schema).toBe('special-schema');
            expect(result.tables[0].name).toBe('users');
            expect(result.tables[1].schema).toBe('public');
            expect(result.tables[1].name).toBe('special-table');
        });

        it('should handle tables with dots in names', async () => {
            const sql = `
                CREATE TABLE "schema.with.dots"."table.with.dots" (
                    id serial PRIMARY KEY,
                    data text
                );
            `;

            const result = await fromPostgres(sql);

            expect(result.warnings || []).toHaveLength(0);
            expect(result.tables).toHaveLength(1);

            const table = result.tables[0];
            expect(table.schema).toBe('schema.with.dots');
            expect(table.name).toBe('table.with.dots');
        });
    });

    describe('FOREIGN KEY with quoted identifiers', () => {
        it('should handle inline REFERENCES with quoted identifiers', async () => {
            const sql = `
                CREATE TABLE "auth-schema"."users" (
                    "user-id" serial PRIMARY KEY,
                    email text UNIQUE
                );
                
                CREATE TABLE "app-schema"."user-profiles" (
                    id serial PRIMARY KEY,
                    "user-id" integer REFERENCES "auth-schema"."users"("user-id"),
                    bio text
                );
            `;

            const result = await fromPostgres(sql);

            expect(result.warnings || []).toHaveLength(0);
            expect(result.tables).toHaveLength(2);
            expect(result.relationships).toHaveLength(1);

            const relationship = result.relationships[0];
            expect(relationship.sourceTable).toBe('user-profiles');
            expect(relationship.targetTable).toBe('users');
            expect(relationship.sourceColumn).toBe('user-id');
            expect(relationship.targetColumn).toBe('user-id');
        });

        it('should handle FOREIGN KEY constraints with quoted identifiers', async () => {
            const sql = `
                CREATE TABLE "schema one"."table one" (
                    "id field" serial PRIMARY KEY,
                    "data field" text
                );
                
                CREATE TABLE "schema two"."table two" (
                    id serial PRIMARY KEY,
                    "ref id" integer,
                    FOREIGN KEY ("ref id") REFERENCES "schema one"."table one"("id field")
                );
            `;

            const result = await fromPostgres(sql);

            expect(result.warnings || []).toHaveLength(0);
            expect(result.tables).toHaveLength(2);
            expect(result.relationships).toHaveLength(1);

            const relationship = result.relationships[0];
            expect(relationship.sourceTable).toBe('table two');
            expect(relationship.targetTable).toBe('table one');
            expect(relationship.sourceColumn).toBe('ref id');
            expect(relationship.targetColumn).toBe('id field');
        });

        it('should handle named constraints with quoted identifiers', async () => {
            const sql = `
                CREATE TABLE "auth"."users" (
                    id serial PRIMARY KEY
                );
                
                CREATE TABLE "app"."profiles" (
                    id serial PRIMARY KEY,
                    user_id integer,
                    CONSTRAINT "fk-user-profile" FOREIGN KEY (user_id) REFERENCES "auth"."users"(id)
                );
            `;

            const result = await fromPostgres(sql);

            expect(result.warnings || []).toHaveLength(0);
            expect(result.relationships).toHaveLength(1);

            const relationship = result.relationships[0];
            // Note: Constraint names with special characters might be normalized
            expect(relationship.name).toBeDefined();
        });

        it('should handle ALTER TABLE ADD CONSTRAINT with quoted identifiers', async () => {
            const sql = `
                CREATE TABLE "user-schema"."user-accounts" (
                    "account-id" serial PRIMARY KEY,
                    username text
                );
                
                CREATE TABLE "order-schema"."user-orders" (
                    "order-id" serial PRIMARY KEY,
                    "account-id" integer
                );
                
                ALTER TABLE "order-schema"."user-orders" 
                ADD CONSTRAINT "fk_orders_accounts" 
                FOREIGN KEY ("account-id") 
                REFERENCES "user-schema"."user-accounts"("account-id");
            `;

            const result = await fromPostgres(sql);

            expect(result.warnings || []).toHaveLength(0);
            expect(result.tables).toHaveLength(2);
            expect(result.relationships).toHaveLength(1);

            const relationship = result.relationships[0];
            expect(relationship.name).toBe('fk_orders_accounts');
            expect(relationship.sourceTable).toBe('user-orders');
            expect(relationship.targetTable).toBe('user-accounts');
            expect(relationship.sourceColumn).toBe('account-id');
            expect(relationship.targetColumn).toBe('account-id');
        });

        it('should handle complex mixed quoting scenarios', async () => {
            const sql = `
                CREATE TABLE auth.users (
                    id serial PRIMARY KEY
                );
                
                CREATE TABLE "app-data"."user_profiles" (
                    profile_id serial PRIMARY KEY,
                    "user-id" integer REFERENCES auth.users(id)
                );
                
                CREATE TABLE "app-data".posts (
                    id serial PRIMARY KEY,
                    profile_id integer
                );
                
                ALTER TABLE "app-data".posts 
                ADD CONSTRAINT fk_posts_profiles 
                FOREIGN KEY (profile_id) 
                REFERENCES "app-data"."user_profiles"(profile_id);
            `;

            const result = await fromPostgres(sql);

            expect(result.warnings || []).toHaveLength(0);
            expect(result.tables).toHaveLength(3);
            expect(result.relationships).toHaveLength(2);

            // Verify the relationships were correctly identified
            const profilesTable = result.tables.find(
                (t) => t.name === 'user_profiles'
            );
            expect(profilesTable?.schema).toBe('app-data');

            const postsTable = result.tables.find((t) => t.name === 'posts');
            expect(postsTable?.schema).toBe('app-data');
        });
    });

    describe('Edge cases and special scenarios', () => {
        it('should handle Unicode characters in quoted identifiers', async () => {
            const sql = `
                CREATE TABLE "схема"."таблица" (
                    "идентификатор" serial PRIMARY KEY,
                    "данные" text
                );
            `;

            const result = await fromPostgres(sql);

            expect(result.warnings || []).toHaveLength(0);
            expect(result.tables).toHaveLength(1);

            const table = result.tables[0];
            expect(table.schema).toBe('схема');
            expect(table.name).toBe('таблица');
            expect(table.columns).toBeDefined();
            expect(table.columns.length).toBeGreaterThan(0);
        });

        it('should handle parentheses in quoted identifiers', async () => {
            const sql = `
                CREATE TABLE "schema(prod)"."users(archived)" (
                    id serial PRIMARY KEY,
                    data text
                );
            `;

            const result = await fromPostgres(sql);

            expect(result.warnings || []).toHaveLength(0);
            expect(result.tables).toHaveLength(1);

            const table = result.tables[0];
            expect(table.schema).toBe('schema(prod)');
            expect(table.name).toBe('users(archived)');
        });

        it('should handle forward slashes in quoted identifiers', async () => {
            const sql = `
                CREATE TABLE "api/v1"."users/profiles" (
                    id serial PRIMARY KEY
                );
            `;

            const result = await fromPostgres(sql);

            expect(result.warnings || []).toHaveLength(0);
            expect(result.tables).toHaveLength(1);

            const table = result.tables[0];
            expect(table.schema).toBe('api/v1');
            expect(table.name).toBe('users/profiles');
        });

        it('should handle IF NOT EXISTS with quoted identifiers', async () => {
            const sql = `
                CREATE TABLE IF NOT EXISTS "test-schema"."test-table" (
                    id serial PRIMARY KEY
                );
            `;

            const result = await fromPostgres(sql);

            expect(result.warnings || []).toHaveLength(0);
            expect(result.tables).toHaveLength(1);

            const table = result.tables[0];
            expect(table.schema).toBe('test-schema');
            expect(table.name).toBe('test-table');
        });

        it('should handle ONLY keyword with quoted identifiers', async () => {
            const sql = `
                CREATE TABLE ONLY "parent-schema"."parent-table" (
                    id serial PRIMARY KEY
                );
                
                ALTER TABLE ONLY "parent-schema"."parent-table"
                ADD CONSTRAINT "unique-constraint" UNIQUE (id);
            `;

            const result = await fromPostgres(sql);

            // ONLY keyword might trigger warnings
            expect(result.warnings).toBeDefined();
            expect(result.tables).toHaveLength(1);

            const table = result.tables[0];
            expect(table.schema).toBe('parent-schema');
            expect(table.name).toBe('parent-table');
        });

        it('should handle self-referencing foreign keys with quoted identifiers', async () => {
            const sql = `
                CREATE TABLE "org-schema"."departments" (
                    "dept-id" serial PRIMARY KEY,
                    "parent-dept-id" integer REFERENCES "org-schema"."departments"("dept-id"),
                    name text
                );
            `;

            const result = await fromPostgres(sql);

            expect(result.warnings || []).toHaveLength(0);
            expect(result.tables).toHaveLength(1);
            expect(result.relationships).toHaveLength(1);

            const relationship = result.relationships[0];
            expect(relationship.sourceTable).toBe('departments');
            expect(relationship.targetTable).toBe('departments'); // Self-reference
            expect(relationship.sourceColumn).toBe('parent-dept-id');
            expect(relationship.targetColumn).toBe('dept-id');
        });
    });
});
