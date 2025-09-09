import { describe, it, expect } from 'vitest';

// Extract the detectContentType function for testing
const detectContentType = (
    content: string
): 'query' | 'ddl' | 'dbml' | null => {
    if (!content || content.trim().length === 0) return null;

    const upperContent = content.toUpperCase();

    // Check for DBML patterns first (case sensitive)
    const dbmlPatterns = [
        /^Table\s+\w+\s*{/m,
        /^Ref:\s*\w+/m,
        /^Enum\s+\w+\s*{/m,
        /^TableGroup\s+/m,
        /^Note\s+\w+\s*{/m,
        /\[pk\]/,
        /\[ref:\s*[<>-]/,
    ];

    const hasDBMLPatterns = dbmlPatterns.some((pattern) =>
        pattern.test(content)
    );
    if (hasDBMLPatterns) return 'dbml';

    // Common SQL DDL keywords
    const ddlKeywords = [
        'CREATE TABLE',
        'ALTER TABLE',
        'DROP TABLE',
        'CREATE INDEX',
        'CREATE VIEW',
        'CREATE PROCEDURE',
        'CREATE FUNCTION',
        'CREATE SCHEMA',
        'CREATE DATABASE',
    ];

    // Check for SQL DDL patterns
    const hasDDLKeywords = ddlKeywords.some((keyword) =>
        upperContent.includes(keyword)
    );
    if (hasDDLKeywords) return 'ddl';

    // Check if it looks like JSON
    try {
        // Just check structure, don't need full parse for detection
        if (
            (content.trim().startsWith('{') && content.trim().endsWith('}')) ||
            (content.trim().startsWith('[') && content.trim().endsWith(']'))
        ) {
            return 'query';
        }
    } catch (error) {
        // Not valid JSON, might be partial
        console.error('Error detecting content type:', error);
    }

    // If we can't confidently detect, return null
    return null;
};

describe('detectContentType', () => {
    describe('DBML detection', () => {
        it('should detect DBML with Table definition', () => {
            const content = `Table users {
  id int [pk]
  name varchar
}`;
            expect(detectContentType(content)).toBe('dbml');
        });

        it('should detect DBML with Ref definition', () => {
            const content = `Table posts {
  user_id int
}

Ref: posts.user_id > users.id`;
            expect(detectContentType(content)).toBe('dbml');
        });

        it('should detect DBML with pk attribute', () => {
            const content = `id integer [pk]`;
            expect(detectContentType(content)).toBe('dbml');
        });

        it('should detect DBML with ref attribute', () => {
            const content = `user_id int [ref: > users.id]`;
            expect(detectContentType(content)).toBe('dbml');
        });

        it('should detect DBML with Enum definition', () => {
            const content = `Enum status {
  active
  inactive
}`;
            expect(detectContentType(content)).toBe('dbml');
        });

        it('should detect DBML with TableGroup', () => {
            const content = `TableGroup commerce {
  users
  orders
}`;
            expect(detectContentType(content)).toBe('dbml');
        });

        it('should detect DBML with Note', () => {
            const content = `Note project_note {
  'This is a note about the project'
}`;
            expect(detectContentType(content)).toBe('dbml');
        });

        it('should prioritize DBML over SQL when both patterns exist', () => {
            const content = `CREATE TABLE test (id int);
Table users {
  id int [pk]
}`;
            expect(detectContentType(content)).toBe('dbml');
        });
    });

    describe('SQL DDL detection', () => {
        it('should detect CREATE TABLE statement', () => {
            const content = `CREATE TABLE users (
  id INT PRIMARY KEY,
  name VARCHAR(255)
);`;
            expect(detectContentType(content)).toBe('ddl');
        });

        it('should detect ALTER TABLE statement', () => {
            const content = `ALTER TABLE users ADD COLUMN email VARCHAR(255);`;
            expect(detectContentType(content)).toBe('ddl');
        });

        it('should detect DROP TABLE statement', () => {
            const content = `DROP TABLE IF EXISTS users;`;
            expect(detectContentType(content)).toBe('ddl');
        });

        it('should detect CREATE INDEX statement', () => {
            const content = `CREATE INDEX idx_users_email ON users(email);`;
            expect(detectContentType(content)).toBe('ddl');
        });

        it('should detect multiple DDL statements', () => {
            const content = `CREATE TABLE users (id INT);
CREATE TABLE posts (id INT);
ALTER TABLE posts ADD CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id);`;
            expect(detectContentType(content)).toBe('ddl');
        });

        it('should detect DDL case-insensitively', () => {
            const content = `create table users (id int);`;
            expect(detectContentType(content)).toBe('ddl');
        });
    });

    describe('JSON detection', () => {
        it('should detect JSON object', () => {
            const content = `{
  "tables": [],
  "relationships": []
}`;
            expect(detectContentType(content)).toBe('query');
        });

        it('should detect JSON array', () => {
            const content = `[
  {"name": "users"},
  {"name": "posts"}
]`;
            expect(detectContentType(content)).toBe('query');
        });

        it('should detect minified JSON', () => {
            const content = `{"tables":[],"relationships":[]}`;
            expect(detectContentType(content)).toBe('query');
        });

        it('should detect JSON with whitespace', () => {
            const content = `   {
    "data": true
}   `;
            expect(detectContentType(content)).toBe('query');
        });
    });

    describe('edge cases', () => {
        it('should return null for empty content', () => {
            expect(detectContentType('')).toBeNull();
            expect(detectContentType('   ')).toBeNull();
            expect(detectContentType('\n\n')).toBeNull();
        });

        it('should return null for unrecognized content', () => {
            const content = `This is just some random text
that doesn't match any pattern`;
            expect(detectContentType(content)).toBeNull();
        });

        it('should handle content with special characters', () => {
            const content = `Table users {
  name varchar // Special chars: áéíóú
}`;
            expect(detectContentType(content)).toBe('dbml');
        });

        it('should handle malformed JSON gracefully', () => {
            const content = `{ "incomplete": `;
            expect(detectContentType(content)).toBeNull();
        });
    });
});
