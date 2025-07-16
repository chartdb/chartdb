import { describe, it, expect } from 'vitest';
import { autoFixDBML, validateDBML } from '../dbml-validator';

describe('autoFixDBML', () => {
    it('should extract table-level Note declarations', () => {
        const input = `Table users {
  id int [pk]
  Note: 'Main users table'
  name varchar
}

Table posts {
  Note: "Blog posts storage"
  id int [pk]
  title varchar
}`;
        const expected = `Table users {
  id int [pk]
  name varchar
}

Table posts {
  id int [pk]
  title varchar
}`;
        const result = autoFixDBML(input);
        expect(result.fixed).toBe(expected);
        expect(result.tableNotes.size).toBe(2);
        expect(result.tableNotes.get('users')).toBe('Main users table');
        expect(result.tableNotes.get('posts')).toBe('Blog posts storage');
    });
    it('should fix split attributes', () => {
        const input = `Table users {
  id int [pk
    ]
  name varchar [unique
    ]
}`;
        const expected = `Table users {
  id int [pk]
  name varchar [unique]
}`;
        const result = autoFixDBML(input);
        expect(result.fixed).toBe(expected);
        expect(result.tableNotes.size).toBe(0);
    });

    it('should fix split numeric types', () => {
        const input = `Table products {
  price numeric(10,
    2)
  quantity decimal(5,
    0)
}`;
        const expected = `Table products {
  price numeric(10,2)
  quantity decimal(5,0)
}`;
        const result = autoFixDBML(input);
        expect(result.fixed).toBe(expected);
        expect(result.tableNotes.size).toBe(0);
    });

    it('should fix multiple whitespace and newlines in attributes', () => {
        const input = `Table test {
  id int [pk,     not null,
    
    unique     ]
}`;
        const expected = `Table test {
  id int [pk, not null, unique]
}`;
        const result = autoFixDBML(input);
        expect(result.fixed).toBe(expected);
        expect(result.tableNotes.size).toBe(0);
    });

    it('should fix spacing around references', () => {
        const input = `Table posts {
  user_id int [ref:>users.id]
  category_id int [ref: < categories.id]
}`;
        const expected = `Table posts {
  user_id int [ref: > users.id]
  category_id int [ref: < categories.id]
}`;
        const result = autoFixDBML(input);
        expect(result.fixed).toBe(expected);
        expect(result.tableNotes.size).toBe(0);
    });

    it('should normalize indexes block', () => {
        const input = `Table users {
  id int
  email varchar
  
  indexes {
    email
  }
}`;
        const expected = `Table users {
  id int
  email varchar
  
  Indexes {
    email
  }
}`;
        const result = autoFixDBML(input);
        expect(result.fixed).toBe(expected);
        expect(result.tableNotes.size).toBe(0);
    });

    it('should remove header block', () => {
        const input = `{
  database_type: "PostgreSQL"
}
Table users {
  id int [pk]
}`;
        const expected = `Table users {
  id int [pk]
}`;
        const result = autoFixDBML(input);
        expect(result.fixed).toBe(expected);
        expect(result.tableNotes.size).toBe(0);
    });

    it('should format enum blocks properly', () => {
        const input = `Enum status {
active
  inactive
    pending
  // comment
  suspended
}`;
        const expected = `Enum status {
  active
  inactive
  pending
  suspended
}`;
        const result = autoFixDBML(input);
        expect(result.fixed).toBe(expected);
        expect(result.tableNotes.size).toBe(0);
    });

    it('should handle complex real-world example', () => {
        const input = `{
  database_type: "PostgreSQL"
}
Table plan {
  id        serial       [pk
    ] // PK autoincremental
  code      varchar(32)  [unique
    ] // pro, team…
  price     numeric(10,
    2) // ARS
  
  created_at    timestamp [default: \`now()\`, not null
    ]
}

indexes {
  code
}`;
        const expected = `Table plan {
  id        serial       [pk] // PK autoincremental
  code      varchar(32)  [unique] // pro, team…
  price     numeric(10,2) // ARS
  
  created_at    timestamp [default: \`now()\`, not null]
}

Indexes {
  code
}`;
        const result = autoFixDBML(input);
        expect(result.fixed).toBe(expected);
        expect(result.tableNotes.size).toBe(0);
    });
});

describe('validateDBML', () => {
    it('should validate correct DBML', () => {
        const dbml = `Table users {
  id int [pk]
  name varchar
}`;
        const result = validateDBML(dbml);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(result.fixedDBML).toBeUndefined();
    });

    it('should detect empty DBML', () => {
        const result = validateDBML('');
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].message).toBe('DBML content is empty');
    });

    it('should detect split attributes and provide fix', () => {
        const dbml = `Table users {
  id int [pk
    ]
}`;
        const result = validateDBML(dbml);
        expect(result.isValid).toBe(true); // No syntax errors
        expect(result.warnings).toHaveLength(2); // One for split attribute, one for auto-fix available
        expect(result.fixedDBML).toBeDefined();
        expect(result.fixedDBML).toContain('[pk]');
    });

    it('should detect split numeric types', () => {
        const dbml = `Table products {
  price numeric(10,
    2)
}`;
        const result = validateDBML(dbml);
        expect(result.warnings.length).toBeGreaterThan(0);
        expect(result.fixedDBML).toBeDefined();
        expect(result.fixedDBML).toContain('numeric(10,2)');
    });

    it('should detect unclosed attribute bracket', () => {
        const dbml = `Table users {
  id int [pk
}`;
        const result = validateDBML(dbml);
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].message).toBe('Unclosed attribute bracket');
    });

    it('should extract Note declarations inside tables', () => {
        const dbml = `Table property {
  id uuid [pk]
  Note: 'This is a property'
}`;
        const result = validateDBML(dbml);
        expect(result.warnings.length).toBeGreaterThan(0);
        const noteWarning = result.warnings.find((w) =>
            w.message.includes('Table-level Note:')
        );
        expect(noteWarning).toBeDefined();
        expect(result.tableNotes).toBeDefined();
        expect(result.tableNotes?.get('property')).toBe('This is a property');
    });

    it('should handle real-world problematic DBML', () => {
        const dbml = `Table organization_subscription {
  id                uuid      [pk, default: \`uuid_generate_v4()\`
    ]
  plan_id           int       [ref: > plan.id, not null
    ]
  organization_id   uuid      [ref: > organization.id, not null
    ]
  status            varchar(12) [not null, note: "active | trial | canceled"
    ]
  
  Indexes {
    (organization_id) [unique, name: "org_subscription_unique", note: "una sola sub por organización"
        ]
    }
}`;
        const result = validateDBML(dbml);
        expect(result.fixedDBML).toBeDefined();
        expect(result.warnings.length).toBeGreaterThan(0);

        // Check that fixed version has proper formatting
        const fixed = result.fixedDBML!;
        expect(fixed).toContain('[pk, default: `uuid_generate_v4()`]');
        expect(fixed).toContain('[ref: > plan.id, not null]');
        expect(fixed).toContain(
            '[unique, name: "org_subscription_unique", note: "una sola sub por organización"]'
        );
    });
});
