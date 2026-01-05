import { describe, it, expect } from 'vitest';
import { preprocessDBML, importDBMLToDiagram } from '../dbml-import';
import { DBMLValidationError } from '../dbml-import-error';
import { DatabaseType } from '@/lib/domain/database-type';

describe('DBML Check Constraints Validation', () => {
    describe('preprocessDBML - table-level check constraints', () => {
        it('should accept valid check constraint expressions', () => {
            const dbml = `
Table users {
    id int [pk]
    age int

    checks {
        \`age >= 0\`
    }
}`;
            expect(() => preprocessDBML(dbml)).not.toThrow();
            const { tableChecks } = preprocessDBML(dbml);
            expect(tableChecks.get('users')).toHaveLength(1);
            expect(tableChecks.get('users')![0].expression).toBe('age >= 0');
        });

        it('should accept multiple valid check constraints', () => {
            const dbml = `
Table products {
    id int [pk]
    price decimal
    quantity int

    checks {
        \`price > 0\`
        \`quantity >= 0\`
    }
}`;
            expect(() => preprocessDBML(dbml)).not.toThrow();
            const { tableChecks } = preprocessDBML(dbml);
            expect(tableChecks.get('products')).toHaveLength(2);
        });

        it('should accept complex check constraint expressions', () => {
            const dbml = `
Table orders {
    id int [pk]
    status varchar

    checks {
        \`status IN ('pending', 'completed', 'cancelled')\`
    }
}`;
            expect(() => preprocessDBML(dbml)).not.toThrow();
        });

        it('should accept BETWEEN expressions', () => {
            const dbml = `
Table ratings {
    id int [pk]
    score int

    checks {
        \`score BETWEEN 1 AND 5\`
    }
}`;
            expect(() => preprocessDBML(dbml)).not.toThrow();
        });

        it('should reject incomplete expressions - missing right operand', () => {
            const dbml = `
Table users {
    id int [pk]
    age int

    checks {
        \`age >\`
    }
}`;
            expect(() => preprocessDBML(dbml)).toThrow(DBMLValidationError);
            try {
                preprocessDBML(dbml);
            } catch (e) {
                expect(e).toBeInstanceOf(DBMLValidationError);
                const error = e as DBMLValidationError;
                expect(error.message).toContain('Invalid check constraint');
                expect(error.message).toContain('incomplete');
            }
        });

        it('should reject unbalanced parentheses', () => {
            const dbml = `
Table users {
    id int [pk]
    status varchar

    checks {
        \`(status = 'active'\`
    }
}`;
            expect(() => preprocessDBML(dbml)).toThrow(DBMLValidationError);
            try {
                preprocessDBML(dbml);
            } catch (e) {
                expect(e).toBeInstanceOf(DBMLValidationError);
                const error = e as DBMLValidationError;
                expect(error.message).toContain('parenthes');
            }
        });

        it('should reject expressions starting with operator', () => {
            const dbml = `
Table users {
    id int [pk]
    age int

    checks {
        \`> 0\`
    }
}`;
            expect(() => preprocessDBML(dbml)).toThrow(DBMLValidationError);
        });

        it('should provide line number in error', () => {
            const dbml = `
Table users {
    id int [pk]
    age int

    checks {
        \`age >\`
    }
}`;
            try {
                preprocessDBML(dbml);
                expect.fail('Should have thrown');
            } catch (e) {
                expect(e).toBeInstanceOf(DBMLValidationError);
                const error = e as DBMLValidationError;
                expect(error.dbmlError.line).toBeGreaterThan(0);
            }
        });
    });

    describe('preprocessDBML - field-level check constraints', () => {
        it('should accept valid field-level check constraint', () => {
            const dbml = `
Table products {
    id int [pk]
    price decimal [not null, check: \`price > 0\`]
}`;
            expect(() => preprocessDBML(dbml)).not.toThrow();
            const { fieldChecks } = preprocessDBML(dbml);
            expect(fieldChecks.get('products')?.get('price')?.expression).toBe(
                'price > 0'
            );
        });

        it('should reject invalid field-level check constraint', () => {
            const dbml = `
Table products {
    id int [pk]
    price decimal [not null, check: \`price >\`]
}`;
            expect(() => preprocessDBML(dbml)).toThrow(DBMLValidationError);
            try {
                preprocessDBML(dbml);
            } catch (e) {
                expect(e).toBeInstanceOf(DBMLValidationError);
                const error = e as DBMLValidationError;
                expect(error.message).toContain('Invalid check constraint');
                expect(error.message).toContain('price');
            }
        });
    });

    describe('importDBMLToDiagram - check constraint validation', () => {
        it('should successfully import valid check constraints', async () => {
            const dbml = `
Table users {
    id int [pk]
    age int
    status varchar

    checks {
        \`age >= 0 AND age <= 150\`
        \`status IN ('active', 'inactive')\`
    }
}`;
            const diagram = await importDBMLToDiagram(dbml, {
                databaseType: DatabaseType.POSTGRESQL,
            });

            expect(diagram.tables).toHaveLength(1);
            const table = diagram.tables![0];
            expect(table.checkConstraints).toHaveLength(2);
            expect(table.checkConstraints![0].expression).toBe(
                'age >= 0 AND age <= 150'
            );
            expect(table.checkConstraints![1].expression).toBe(
                "status IN ('active', 'inactive')"
            );
        });

        it('should throw validation error for invalid check constraint during import', async () => {
            const dbml = `
Table users {
    id int [pk]
    age int

    checks {
        \`age <\`
    }
}`;
            await expect(
                importDBMLToDiagram(dbml, {
                    databaseType: DatabaseType.POSTGRESQL,
                })
            ).rejects.toThrow(DBMLValidationError);
        });

        it('should import named check constraints', async () => {
            const dbml = `
Table products {
    id int [pk]
    price decimal

    checks {
        \`price > 0\` [name: 'positive_price']
    }
}`;
            const diagram = await importDBMLToDiagram(dbml, {
                databaseType: DatabaseType.POSTGRESQL,
            });

            const table = diagram.tables![0];
            expect(table.checkConstraints).toHaveLength(1);
            expect(table.checkConstraints![0].expression).toBe('price > 0');
        });
    });

    describe('edge cases', () => {
        it('should handle check constraints with quoted identifiers', () => {
            const dbml = `
Table users {
    id int [pk]
    "user name" varchar

    checks {
        \`"user name" IS NOT NULL\`
    }
}`;
            expect(() => preprocessDBML(dbml)).not.toThrow();
        });

        it('should handle check constraints with SQL Server bracket notation', () => {
            const dbml = `
Table users {
    id int [pk]
    age int

    checks {
        \`[age] >= 0 AND [age] <= 100\`
    }
}`;
            expect(() => preprocessDBML(dbml)).not.toThrow();
        });

        it('should handle check constraints with function calls', () => {
            const dbml = `
Table users {
    id int [pk]
    email varchar

    checks {
        \`LENGTH(email) > 0\`
    }
}`;
            expect(() => preprocessDBML(dbml)).not.toThrow();
        });

        it('should handle NOT LIKE expressions', () => {
            const dbml = `
Table users {
    id int [pk]
    code varchar

    checks {
        \`code NOT LIKE 'TEST%'\`
    }
}`;
            expect(() => preprocessDBML(dbml)).not.toThrow();
        });

        it('should handle NOT IN expressions', () => {
            const dbml = `
Table users {
    id int [pk]
    status varchar

    checks {
        \`status NOT IN ('deleted', 'banned')\`
    }
}`;
            expect(() => preprocessDBML(dbml)).not.toThrow();
        });

        it('should handle empty checks block gracefully', () => {
            const dbml = `
Table users {
    id int [pk]

    checks {
    }
}`;
            expect(() => preprocessDBML(dbml)).not.toThrow();
            const { tableChecks } = preprocessDBML(dbml);
            expect(tableChecks.has('users')).toBe(false);
        });
    });
});
