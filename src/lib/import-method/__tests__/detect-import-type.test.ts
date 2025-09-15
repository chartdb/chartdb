import { describe, it, expect } from 'vitest';
import { detectImportMethod } from '../detect-import-method';

describe('detectImportMethod', () => {
    describe('DBML detection', () => {
        it('should detect DBML with Table definition', () => {
            const content = `Table users {
  id int [pk]
  name varchar
}`;
            expect(detectImportMethod(content)).toBe('dbml');
        });

        it('should detect DBML with Ref definition', () => {
            const content = `Table posts {
  user_id int
}

Ref: posts.user_id > users.id`;
            expect(detectImportMethod(content)).toBe('dbml');
        });

        it('should detect DBML with pk attribute', () => {
            const content = `id integer [pk]`;
            expect(detectImportMethod(content)).toBe('dbml');
        });

        it('should detect DBML with ref attribute', () => {
            const content = `user_id int [ref: > users.id]`;
            expect(detectImportMethod(content)).toBe('dbml');
        });

        it('should detect DBML with Enum definition', () => {
            const content = `Enum status {
  active
  inactive
}`;
            expect(detectImportMethod(content)).toBe('dbml');
        });

        it('should detect DBML with TableGroup', () => {
            const content = `TableGroup commerce {
  users
  orders
}`;
            expect(detectImportMethod(content)).toBe('dbml');
        });

        it('should detect DBML with Note', () => {
            const content = `Note project_note {
  'This is a note about the project'
}`;
            expect(detectImportMethod(content)).toBe('dbml');
        });

        it('should prioritize DBML over SQL when both patterns exist', () => {
            const content = `CREATE TABLE test (id int);
Table users {
  id int [pk]
}`;
            expect(detectImportMethod(content)).toBe('dbml');
        });
    });

    describe('SQL DDL detection', () => {
        it('should detect CREATE TABLE statement', () => {
            const content = `CREATE TABLE users (
  id INT PRIMARY KEY,
  name VARCHAR(255)
);`;
            expect(detectImportMethod(content)).toBe('ddl');
        });

        it('should detect ALTER TABLE statement', () => {
            const content = `ALTER TABLE users ADD COLUMN email VARCHAR(255);`;
            expect(detectImportMethod(content)).toBe('ddl');
        });

        it('should detect DROP TABLE statement', () => {
            const content = `DROP TABLE IF EXISTS users;`;
            expect(detectImportMethod(content)).toBe('ddl');
        });

        it('should detect CREATE INDEX statement', () => {
            const content = `CREATE INDEX idx_users_email ON users(email);`;
            expect(detectImportMethod(content)).toBe('ddl');
        });

        it('should detect multiple DDL statements', () => {
            const content = `CREATE TABLE users (id INT);
CREATE TABLE posts (id INT);
ALTER TABLE posts ADD CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id);`;
            expect(detectImportMethod(content)).toBe('ddl');
        });

        it('should detect DDL case-insensitively', () => {
            const content = `create table users (id int);`;
            expect(detectImportMethod(content)).toBe('ddl');
        });
    });

    describe('JSON detection', () => {
        it('should detect JSON object', () => {
            const content = `{
  "tables": [],
  "relationships": []
}`;
            expect(detectImportMethod(content)).toBe('query');
        });

        it('should detect JSON array', () => {
            const content = `[
  {"name": "users"},
  {"name": "posts"}
]`;
            expect(detectImportMethod(content)).toBe('query');
        });

        it('should detect minified JSON', () => {
            const content = `{"tables":[],"relationships":[]}`;
            expect(detectImportMethod(content)).toBe('query');
        });

        it('should detect JSON with whitespace', () => {
            const content = `   {
    "data": true
}   `;
            expect(detectImportMethod(content)).toBe('query');
        });
    });

    describe('edge cases', () => {
        it('should return null for empty content', () => {
            expect(detectImportMethod('')).toBeNull();
            expect(detectImportMethod('   ')).toBeNull();
            expect(detectImportMethod('\n\n')).toBeNull();
        });

        it('should return null for unrecognized content', () => {
            const content = `This is just some random text
that doesn't match any pattern`;
            expect(detectImportMethod(content)).toBeNull();
        });

        it('should handle content with special characters', () => {
            const content = `Table users {
  name varchar // Special chars: áéíóú
}`;
            expect(detectImportMethod(content)).toBe('dbml');
        });

        it('should handle malformed JSON gracefully', () => {
            const content = `{ "incomplete": `;
            expect(detectImportMethod(content)).toBeNull();
        });
    });
});
