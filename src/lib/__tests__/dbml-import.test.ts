import { describe, it, expect } from 'vitest';
import {
    preprocessDBML,
    sanitizeDBML,
    importDBMLToDiagram,
} from '../dbml-import';
import { Parser } from '@dbml/core';

describe('DBML Import', () => {
    describe('preprocessDBML', () => {
        it('should remove TableGroup blocks', () => {
            const dbml = `
Table users {
  id int
}

TableGroup "Test Group" [color: #CA4243] {
  users
  posts
}

Table posts {
  id int
}`;
            const result = preprocessDBML(dbml);
            expect(result).not.toContain('TableGroup');
            expect(result).toContain('Table users');
            expect(result).toContain('Table posts');
        });

        it('should remove Note blocks', () => {
            const dbml = `
Table users {
  id int
}

Note note_test {
  'This is a note'
}`;
            const result = preprocessDBML(dbml);
            expect(result).not.toContain('Note');
            expect(result).toContain('Table users');
        });

        it('should convert array types to text', () => {
            const dbml = `
Table users {
  tags text[]
  domains varchar[]
}`;
            const result = preprocessDBML(dbml);
            expect(result).toContain('tags text');
            expect(result).toContain('domains text');
            expect(result).not.toContain('[]');
        });

        it('should convert enum types without values to varchar', () => {
            const dbml = `
Table users {
  status enum
  verification_type enum // comment here
}`;
            const result = preprocessDBML(dbml);
            expect(result).toContain('status varchar');
            expect(result).toContain('verification_type varchar');
            expect(result).not.toContain('enum');
        });

        it('should remove table header color attributes', () => {
            const dbml = `
Table users [headercolor: #24BAB1] {
  id int
}`;
            const result = preprocessDBML(dbml);
            expect(result).toContain('Table users {');
            expect(result).not.toContain('headercolor');
        });
    });

    describe('Full DBML Import', () => {
        it('should successfully parse complex DBML with preprocessing', async () => {
            const complexDBML = `
Table users {
  id uuid [pk, not null]
  role varchar(50) [default: 'researcher']
  domains text[] // array type
  verification_type enum // enum without values
  metadata jsonb
}

Table posts [headercolor: #24BAB1] {
  id int [pk]
  user_id uuid
  tags varchar[]
}

Ref: posts.user_id > users.id

TableGroup "Test Group" [color: #CA4243] {
  users
  posts
}

Note note_test {
  'This is a test note'
}`;

            const diagram = await importDBMLToDiagram(complexDBML);

            expect(diagram.tables).toHaveLength(2);
            expect(diagram.relationships).toHaveLength(1);

            const usersTable = diagram.tables?.find((t) => t.name === 'users');
            expect(usersTable).toBeDefined();
            expect(usersTable?.fields).toHaveLength(5);

            // Check that array types were converted
            const domainsField = usersTable?.fields.find(
                (f) => f.name === 'domains'
            );
            expect(domainsField?.type.id).toBe('text');

            // Check that enum was converted
            const verificationField = usersTable?.fields.find(
                (f) => f.name === 'verification_type'
            );
            expect(verificationField?.type.id).toBe('varchar');
        });

        it('should handle the problematic example DBML', () => {
            const problematicDBML = `
Table users {
  id uuid [pk, not null]
  domains text[]
  verification_type enum
}

Table respondent [headercolor: #24BAB1] {
  id int [pk, not null]
  name varchar(500)
}

TableGroup "Makeup Sample Claims" [color: #CA4243] {
 respondent
}

Note note_1750185617764 {
'country -> move here? '
}`;

            // Test that preprocessing handles all issues
            const preprocessed = preprocessDBML(problematicDBML);
            const sanitized = sanitizeDBML(preprocessed);

            // Should not throw
            const parser = new Parser();
            expect(() => parser.parse(sanitized, 'dbml')).not.toThrow();
        });
    });

    describe('sanitizeDBML', () => {
        it('should replace special characters', () => {
            const input = 'áéíóúñÑÁÉÍÓÚ';
            const expected = 'aeiounNAEIOU';
            expect(sanitizeDBML(input)).toBe(expected);
        });

        it('should handle Russian text in comments', () => {
            const dbml = `Table users {
  role varchar(50) // нужна таблица справочник?
}`;
            const result = sanitizeDBML(dbml);
            // Russian text should remain unchanged
            expect(result).toContain('нужна таблица справочник?');
        });
    });
});
