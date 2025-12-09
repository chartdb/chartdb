import { describe, it, expect } from 'vitest';
import { sqlImportToDiagram } from '../index';
import { DatabaseType } from '@/lib/domain/database-type';

describe('sqlImportToDiagram', () => {
    it('should parse a simple PostgreSQL table and return a valid diagram', async () => {
        const sql = `
            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE
            );
        `;

        const diagram = await sqlImportToDiagram({
            sqlContent: sql,
            sourceDatabaseType: DatabaseType.POSTGRESQL,
            targetDatabaseType: DatabaseType.POSTGRESQL,
        });

        // Verify diagram structure
        expect(diagram).toBeDefined();
        expect(diagram.id).toBeDefined();
        expect(diagram.databaseType).toBe(DatabaseType.POSTGRESQL);

        // Verify table was parsed
        expect(diagram.tables).toHaveLength(1);
        expect(diagram.tables?.[0].name).toBe('users');

        // Verify fields were parsed
        const fields = diagram.tables?.[0].fields;
        expect(fields).toHaveLength(3);

        const fieldNames = fields?.map((f) => f.name);
        expect(fieldNames).toContain('id');
        expect(fieldNames).toContain('name');
        expect(fieldNames).toContain('email');

        // Verify primary key
        const idField = fields?.find((f) => f.name === 'id');
        expect(idField?.primaryKey).toBe(true);

        // Verify nullable constraints
        const nameField = fields?.find((f) => f.name === 'name');
        expect(nameField?.nullable).toBe(false);

        // Verify unique constraint
        const emailField = fields?.find((f) => f.name === 'email');
        expect(emailField?.unique).toBe(true);
    });

    it('should parse foreign key constraints properly', async () => {
        const sql = `
            CREATE SCHEMA IF NOT EXISTS "public";

CREATE TABLE "public"."playlists" (
    "playlist_id" SERIAL,
    "user_id" int NOT NULL,
    PRIMARY KEY ("playlist_id")
);

CREATE TABLE "public"."users" (
    "user_id" SERIAL,
    PRIMARY KEY ("user_id")
);

-- Foreign key constraints
-- Schema: public
ALTER TABLE "public"."playlists" ADD CONSTRAINT "fk_playlists_user_id_users_user_id" FOREIGN KEY("user_id") REFERENCES "public"."users"("user_id");
        `;

        const diagram = await sqlImportToDiagram({
            sqlContent: sql,
            sourceDatabaseType: DatabaseType.POSTGRESQL,
            targetDatabaseType: DatabaseType.POSTGRESQL,
        });

        // Verify diagram structure
        expect(diagram).toBeDefined();

        const playlistTable = diagram.tables?.find(
            (t) => t.name === 'playlists'
        );
        expect(playlistTable).toBeDefined();

        const playlistUserIdField = playlistTable?.fields?.find(
            (f) => f.name === 'user_id'
        );
        expect(playlistUserIdField).toBeDefined();

        const usersTable = diagram.tables?.find((t) => t.name === 'users');
        expect(usersTable).toBeDefined();

        const usersUserIdField = usersTable?.fields?.find(
            (f) => f.name === 'user_id'
        );
        expect(usersUserIdField).toBeDefined();

        // verify relationships
        expect(diagram.relationships).toBeDefined();
        expect(diagram.relationships).toHaveLength(1);

        const relationship = diagram.relationships?.[0];
        expect(relationship?.sourceSchema).toBe('public');
        expect(relationship?.sourceTableId).toBe(usersTable?.id);
        expect(relationship?.sourceFieldId).toBe(usersUserIdField?.id);
        expect(relationship?.sourceCardinality).toBe('one');

        expect(relationship?.targetSchema).toBe('public');
        expect(relationship?.targetTableId).toBe(playlistTable?.id);
        expect(relationship?.targetFieldId).toBe(playlistUserIdField?.id);
        expect(relationship?.targetCardinality).toBe('many');
    });

    it('should parse foreign key constraints properly - MySQL', async () => {
        const sql = `
CREATE TABLE \`users\` (
    \`user_id\` INT AUTO_INCREMENT,
    PRIMARY KEY (\`user_id\`)
) ENGINE=InnoDB;

CREATE TABLE \`playlists\` (
    \`playlist_id\` INT AUTO_INCREMENT,
    \`user_id\` INT NOT NULL,
    PRIMARY KEY (\`playlist_id\`),
    CONSTRAINT \`fk_playlists_user_id\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`user_id\`)
) ENGINE=InnoDB;
        `;

        const diagram = await sqlImportToDiagram({
            sqlContent: sql,
            sourceDatabaseType: DatabaseType.MYSQL,
            targetDatabaseType: DatabaseType.MYSQL,
        });

        // Verify diagram structure
        expect(diagram).toBeDefined();

        const playlistTable = diagram.tables?.find(
            (t) => t.name === 'playlists'
        );
        expect(playlistTable).toBeDefined();

        const playlistUserIdField = playlistTable?.fields?.find(
            (f) => f.name === 'user_id'
        );
        expect(playlistUserIdField).toBeDefined();

        const usersTable = diagram.tables?.find((t) => t.name === 'users');
        expect(usersTable).toBeDefined();

        const usersUserIdField = usersTable?.fields?.find(
            (f) => f.name === 'user_id'
        );
        expect(usersUserIdField).toBeDefined();

        // verify relationships
        expect(diagram.relationships).toBeDefined();
        expect(diagram.relationships).toHaveLength(1);

        const relationship = diagram.relationships?.[0];
        expect(relationship?.sourceTableId).toBe(usersTable?.id);
        expect(relationship?.sourceFieldId).toBe(usersUserIdField?.id);
        expect(relationship?.sourceCardinality).toBe('one');

        expect(relationship?.targetTableId).toBe(playlistTable?.id);
        expect(relationship?.targetFieldId).toBe(playlistUserIdField?.id);
        expect(relationship?.targetCardinality).toBe('many');
    });

    it('should parse foreign key constraints properly - MariaDB', async () => {
        const sql = `
CREATE TABLE \`users\` (
    \`user_id\` INT AUTO_INCREMENT,
    PRIMARY KEY (\`user_id\`)
) ENGINE=InnoDB;

CREATE TABLE \`playlists\` (
    \`playlist_id\` INT AUTO_INCREMENT,
    \`user_id\` INT NOT NULL,
    PRIMARY KEY (\`playlist_id\`),
    CONSTRAINT \`fk_playlists_user_id\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`user_id\`)
) ENGINE=InnoDB;
        `;

        const diagram = await sqlImportToDiagram({
            sqlContent: sql,
            sourceDatabaseType: DatabaseType.MARIADB,
            targetDatabaseType: DatabaseType.MARIADB,
        });

        // Verify diagram structure
        expect(diagram).toBeDefined();

        const playlistTable = diagram.tables?.find(
            (t) => t.name === 'playlists'
        );
        expect(playlistTable).toBeDefined();

        const playlistUserIdField = playlistTable?.fields?.find(
            (f) => f.name === 'user_id'
        );
        expect(playlistUserIdField).toBeDefined();

        const usersTable = diagram.tables?.find((t) => t.name === 'users');
        expect(usersTable).toBeDefined();

        const usersUserIdField = usersTable?.fields?.find(
            (f) => f.name === 'user_id'
        );
        expect(usersUserIdField).toBeDefined();

        // verify relationships
        expect(diagram.relationships).toBeDefined();
        expect(diagram.relationships).toHaveLength(1);

        const relationship = diagram.relationships?.[0];
        expect(relationship?.sourceTableId).toBe(usersTable?.id);
        expect(relationship?.sourceFieldId).toBe(usersUserIdField?.id);
        expect(relationship?.sourceCardinality).toBe('one');

        expect(relationship?.targetTableId).toBe(playlistTable?.id);
        expect(relationship?.targetFieldId).toBe(playlistUserIdField?.id);
        expect(relationship?.targetCardinality).toBe('many');
    });

    it('should parse foreign key constraints properly - SQL Server', async () => {
        const sql = `
CREATE TABLE [dbo].[users] (
    [user_id] INT IDENTITY(1,1) NOT NULL,
    PRIMARY KEY ([user_id])
);

CREATE TABLE [dbo].[playlists] (
    [playlist_id] INT IDENTITY(1,1) NOT NULL,
    [user_id] INT NOT NULL,
    PRIMARY KEY ([playlist_id]),
    CONSTRAINT [fk_playlists_user_id] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([user_id])
);
        `;

        const diagram = await sqlImportToDiagram({
            sqlContent: sql,
            sourceDatabaseType: DatabaseType.SQL_SERVER,
            targetDatabaseType: DatabaseType.SQL_SERVER,
        });

        // Verify diagram structure
        expect(diagram).toBeDefined();

        const playlistTable = diagram.tables?.find(
            (t) => t.name === 'playlists'
        );
        expect(playlistTable).toBeDefined();

        const playlistUserIdField = playlistTable?.fields?.find(
            (f) => f.name === 'user_id'
        );
        expect(playlistUserIdField).toBeDefined();

        const usersTable = diagram.tables?.find((t) => t.name === 'users');
        expect(usersTable).toBeDefined();

        const usersUserIdField = usersTable?.fields?.find(
            (f) => f.name === 'user_id'
        );
        expect(usersUserIdField).toBeDefined();

        // verify relationships
        expect(diagram.relationships).toBeDefined();
        expect(diagram.relationships).toHaveLength(1);

        const relationship = diagram.relationships?.[0];
        expect(relationship?.sourceSchema).toBe('dbo');
        expect(relationship?.sourceTableId).toBe(usersTable?.id);
        expect(relationship?.sourceFieldId).toBe(usersUserIdField?.id);
        expect(relationship?.sourceCardinality).toBe('one');

        expect(relationship?.targetSchema).toBe('dbo');
        expect(relationship?.targetTableId).toBe(playlistTable?.id);
        expect(relationship?.targetFieldId).toBe(playlistUserIdField?.id);
        expect(relationship?.targetCardinality).toBe('many');
    });

    it('should parse foreign key constraints properly - SQLite', async () => {
        const sql = `
CREATE TABLE users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT
);

CREATE TABLE playlists (
    playlist_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);
        `;

        const diagram = await sqlImportToDiagram({
            sqlContent: sql,
            sourceDatabaseType: DatabaseType.SQLITE,
            targetDatabaseType: DatabaseType.SQLITE,
        });

        // Verify diagram structure
        expect(diagram).toBeDefined();

        const playlistTable = diagram.tables?.find(
            (t) => t.name === 'playlists'
        );
        expect(playlistTable).toBeDefined();

        const playlistUserIdField = playlistTable?.fields?.find(
            (f) => f.name === 'user_id'
        );
        expect(playlistUserIdField).toBeDefined();

        const usersTable = diagram.tables?.find((t) => t.name === 'users');
        expect(usersTable).toBeDefined();

        const usersUserIdField = usersTable?.fields?.find(
            (f) => f.name === 'user_id'
        );
        expect(usersUserIdField).toBeDefined();

        // verify relationships
        expect(diagram.relationships).toBeDefined();
        expect(diagram.relationships).toHaveLength(1);

        const relationship = diagram.relationships?.[0];
        expect(relationship?.sourceTableId).toBe(usersTable?.id);
        expect(relationship?.sourceFieldId).toBe(usersUserIdField?.id);
        expect(relationship?.sourceCardinality).toBe('one');

        expect(relationship?.targetTableId).toBe(playlistTable?.id);
        expect(relationship?.targetFieldId).toBe(playlistUserIdField?.id);
        expect(relationship?.targetCardinality).toBe('many');
    });
});
