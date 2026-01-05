import { describe, it, expect } from 'vitest';
import {
    validateCheckConstraint,
    validateCheckConstraintWithDetails,
} from '../check-constraints-validator';

describe('Check Constraint Validator', () => {
    describe('Valid expressions', () => {
        describe('Simple comparisons', () => {
            it('should validate simple less than', () => {
                expect(validateCheckConstraint('a < b')).toBe(true);
            });

            it('should validate simple greater than', () => {
                expect(validateCheckConstraint('a > b')).toBe(true);
            });

            it('should validate simple equal', () => {
                expect(validateCheckConstraint('a = b')).toBe(true);
            });

            it('should validate less than or equal', () => {
                expect(validateCheckConstraint('a <= b')).toBe(true);
            });

            it('should validate greater than or equal', () => {
                expect(validateCheckConstraint('a >= b')).toBe(true);
            });

            it('should validate not equal (!=)', () => {
                expect(validateCheckConstraint('a != b')).toBe(true);
            });

            it('should validate not equal (<>)', () => {
                expect(validateCheckConstraint('a <> b')).toBe(true);
            });

            it('should validate comparison with number', () => {
                expect(validateCheckConstraint('price > 0')).toBe(true);
            });

            it('should validate comparison with negative number', () => {
                expect(validateCheckConstraint('balance >= -100')).toBe(true);
            });

            it('should validate comparison with decimal', () => {
                expect(validateCheckConstraint('rate < 0.05')).toBe(true);
            });
        });

        describe('Compound expressions', () => {
            it('should validate AND expression', () => {
                expect(validateCheckConstraint('a > 0 AND b < 100')).toBe(true);
            });

            it('should validate OR expression', () => {
                expect(validateCheckConstraint('a > 0 OR a < -10')).toBe(true);
            });

            it('should validate complex AND/OR', () => {
                expect(
                    validateCheckConstraint('a > 0 AND b < 100 OR c = 5')
                ).toBe(true);
            });

            it('should validate range check with AND', () => {
                expect(
                    validateCheckConstraint('grade >= 0 AND grade <= 100')
                ).toBe(true);
            });

            it('should validate multiple conditions', () => {
                expect(
                    validateCheckConstraint('age >= 18 AND age <= 120')
                ).toBe(true);
            });
        });

        describe('BETWEEN expressions', () => {
            it('should validate BETWEEN with numbers', () => {
                expect(
                    validateCheckConstraint('quantity BETWEEN 1 AND 100')
                ).toBe(true);
            });

            it('should validate BETWEEN with identifiers', () => {
                expect(
                    validateCheckConstraint('value BETWEEN min_val AND max_val')
                ).toBe(true);
            });

            it('should validate danger_level BETWEEN', () => {
                expect(
                    validateCheckConstraint('danger_level BETWEEN 1 AND 10')
                ).toBe(true);
            });

            it('should validate day_of_week BETWEEN', () => {
                expect(
                    validateCheckConstraint('day_of_week BETWEEN 1 AND 7')
                ).toBe(true);
            });
        });

        describe('IN expressions', () => {
            it('should validate IN with strings', () => {
                expect(
                    validateCheckConstraint(
                        "status IN ('active', 'inactive', 'pending')"
                    )
                ).toBe(true);
            });

            it('should validate IN with numbers', () => {
                expect(
                    validateCheckConstraint('priority IN (1, 2, 3, 4, 5)')
                ).toBe(true);
            });

            it('should validate IN with single value', () => {
                expect(validateCheckConstraint("type IN ('default')")).toBe(
                    true
                );
            });

            it('should validate complex IN expression', () => {
                expect(
                    validateCheckConstraint(
                        "status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')"
                    )
                ).toBe(true);
            });
        });

        describe('IS NULL / IS NOT NULL', () => {
            it('should validate IS NULL', () => {
                expect(validateCheckConstraint('deleted_at IS NULL')).toBe(
                    true
                );
            });

            it('should validate IS NOT NULL', () => {
                expect(validateCheckConstraint('name IS NOT NULL')).toBe(true);
            });
        });

        describe('LIKE expressions', () => {
            it('should validate LIKE with pattern', () => {
                expect(validateCheckConstraint("email LIKE '%@%'")).toBe(true);
            });

            it('should validate NOT LIKE', () => {
                expect(validateCheckConstraint("code NOT LIKE 'TEST%'")).toBe(
                    true
                );
            });
        });

        describe('NOT IN and NOT BETWEEN', () => {
            it('should validate NOT IN', () => {
                expect(
                    validateCheckConstraint(
                        "status NOT IN ('deleted', 'archived')"
                    )
                ).toBe(true);
            });

            it('should validate NOT BETWEEN', () => {
                expect(
                    validateCheckConstraint('value NOT BETWEEN 0 AND 10')
                ).toBe(true);
            });
        });

        describe('Function calls', () => {
            it('should validate LENGTH function', () => {
                expect(validateCheckConstraint('LENGTH(name) > 0')).toBe(true);
            });

            it('should validate UPPER function comparison', () => {
                expect(validateCheckConstraint('UPPER(code) = code')).toBe(
                    true
                );
            });

            it('should validate nested function calls', () => {
                expect(
                    validateCheckConstraint('TRIM(UPPER(name)) = name')
                ).toBe(true);
            });

            it('should validate ISJSON function', () => {
                expect(validateCheckConstraint('ISJSON(metadata) = 1')).toBe(
                    true
                );
            });

            it('should validate YEAR function', () => {
                expect(
                    validateCheckConstraint('YEAR(created_at) >= 2020')
                ).toBe(true);
            });
        });

        describe('Arithmetic expressions', () => {
            it('should validate addition', () => {
                expect(validateCheckConstraint('a + b < 100')).toBe(true);
            });

            it('should validate subtraction', () => {
                expect(
                    validateCheckConstraint('end_date - start_date > 0')
                ).toBe(true);
            });

            it('should validate multiplication', () => {
                expect(
                    validateCheckConstraint('quantity * price < 10000')
                ).toBe(true);
            });

            it('should validate division', () => {
                expect(validateCheckConstraint('total / count > 0')).toBe(true);
            });

            it('should validate modulo', () => {
                expect(validateCheckConstraint('id % 2 = 0')).toBe(true);
            });
        });

        describe('Parenthesized expressions', () => {
            it('should validate simple parentheses', () => {
                expect(validateCheckConstraint('(a < b)')).toBe(true);
            });

            it('should validate nested parentheses', () => {
                expect(validateCheckConstraint('((a < b) AND (c > d))')).toBe(
                    true
                );
            });

            it('should validate grouped OR with AND', () => {
                expect(
                    validateCheckConstraint('(a = 1 OR a = 2) AND b > 0')
                ).toBe(true);
            });
        });

        describe('Quoted identifiers', () => {
            it('should validate double-quoted identifier', () => {
                expect(validateCheckConstraint('"column name" > 0')).toBe(true);
            });

            it('should validate backtick-quoted identifier (MySQL)', () => {
                expect(validateCheckConstraint('`column name` > 0')).toBe(true);
            });

            it('should validate bracket-quoted identifier (SQL Server)', () => {
                expect(validateCheckConstraint('[price] >= 0')).toBe(true);
            });

            it('should validate SQL Server style with multiple brackets', () => {
                expect(
                    validateCheckConstraint('[grade] >= 0 AND [grade] <= 100')
                ).toBe(true);
            });
        });

        describe('NOT expressions', () => {
            it('should validate NOT with parentheses', () => {
                expect(validateCheckConstraint('NOT (a = b)')).toBe(true);
            });

            it('should validate NOT with comparison', () => {
                expect(validateCheckConstraint('NOT deleted')).toBe(true);
            });
        });

        describe('Boolean literals', () => {
            it('should validate TRUE', () => {
                expect(validateCheckConstraint('is_active = TRUE')).toBe(true);
            });

            it('should validate FALSE', () => {
                expect(validateCheckConstraint('is_deleted = FALSE')).toBe(
                    true
                );
            });
        });

        describe('Type casting (PostgreSQL)', () => {
            it('should validate PostgreSQL type cast', () => {
                expect(validateCheckConstraint('value::integer > 0')).toBe(
                    true
                );
            });
        });

        describe('Real-world examples from codebase', () => {
            it('should validate price >= 0', () => {
                expect(validateCheckConstraint('price >= 0')).toBe(true);
            });

            it('should validate enchantment_charges >= 0', () => {
                expect(
                    validateCheckConstraint('enchantment_charges >= 0')
                ).toBe(true);
            });

            it('should validate quantity > 0', () => {
                expect(validateCheckConstraint('quantity > 0')).toBe(true);
            });

            it('should validate mana_cost > 0', () => {
                expect(validateCheckConstraint('mana_cost > 0')).toBe(true);
            });

            it('should validate enchantment_level BETWEEN 0 AND 10', () => {
                expect(
                    validateCheckConstraint(
                        'enchantment_level BETWEEN 0 AND 10'
                    )
                ).toBe(true);
            });

            it('should validate period_end >= period_start', () => {
                expect(
                    validateCheckConstraint('period_end >= period_start')
                ).toBe(true);
            });

            it('should validate total_cents >= 0', () => {
                expect(validateCheckConstraint('total_cents >= 0')).toBe(true);
            });

            it('should validate amount_cents > 0', () => {
                expect(validateCheckConstraint('amount_cents > 0')).toBe(true);
            });
        });
    });

    describe('Invalid expressions', () => {
        describe('Incomplete expressions', () => {
            it('should reject expression with missing right operand', () => {
                expect(validateCheckConstraint('a<')).toBe(false);
            });

            it('should reject expression with missing left operand', () => {
                expect(validateCheckConstraint('<b')).toBe(false);
            });

            it('should reject expression with missing operand after AND', () => {
                expect(validateCheckConstraint('a > 0 AND')).toBe(false);
            });

            it('should reject expression with missing operand after OR', () => {
                expect(validateCheckConstraint('a > 0 OR')).toBe(false);
            });

            it('should reject expression ending with operator', () => {
                expect(validateCheckConstraint('price >')).toBe(false);
            });

            it('should reject expression ending with >=', () => {
                expect(validateCheckConstraint('value >=')).toBe(false);
            });
        });

        describe('Invalid identifiers', () => {
            it('should reject identifier starting with digit', () => {
                expect(validateCheckConstraint('a < 2b')).toBe(false);
            });

            it('should reject number followed by letters without space', () => {
                expect(validateCheckConstraint('a < 123abc')).toBe(false);
            });
        });

        describe('Unbalanced parentheses', () => {
            it('should reject missing closing parenthesis', () => {
                expect(validateCheckConstraint('(a < b')).toBe(false);
            });

            it('should reject missing opening parenthesis', () => {
                expect(validateCheckConstraint('a < b)')).toBe(false);
            });

            it('should reject nested unbalanced parentheses', () => {
                expect(validateCheckConstraint('((a < b)')).toBe(false);
            });

            it('should reject function with missing closing paren', () => {
                expect(validateCheckConstraint('LENGTH(name > 0')).toBe(false);
            });
        });

        describe('Empty expressions', () => {
            it('should reject empty string', () => {
                expect(validateCheckConstraint('')).toBe(false);
            });

            it('should reject whitespace only', () => {
                expect(validateCheckConstraint('   ')).toBe(false);
            });

            it('should reject tabs and newlines only', () => {
                expect(validateCheckConstraint('\t\n')).toBe(false);
            });
        });

        describe('Invalid operator placement', () => {
            it('should reject double operators', () => {
                expect(validateCheckConstraint('a < > b')).toBe(false);
            });

            it('should reject AND at start', () => {
                expect(validateCheckConstraint('AND a > 0')).toBe(false);
            });

            it('should reject OR at start', () => {
                expect(validateCheckConstraint('OR a > 0')).toBe(false);
            });
        });

        describe('Invalid BETWEEN', () => {
            it('should reject BETWEEN without value before', () => {
                expect(validateCheckConstraint('BETWEEN 1 AND 10')).toBe(false);
            });
        });

        describe('Invalid IN', () => {
            it('should reject IN without value before', () => {
                expect(validateCheckConstraint("IN ('a', 'b')")).toBe(false);
            });
        });

        describe('Invalid IS', () => {
            it('should reject IS without value before', () => {
                expect(validateCheckConstraint('IS NULL')).toBe(false);
            });
        });
    });

    describe('validateCheckConstraintWithDetails', () => {
        it('should return error details for invalid expression', () => {
            const result = validateCheckConstraintWithDetails('a<');
            expect(result.isValid).toBe(false);
            expect(result.error).toBeDefined();
            expect(result.error).toContain('incomplete');
        });

        it('should return error details for unbalanced parentheses', () => {
            const result = validateCheckConstraintWithDetails('(a < b');
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('parenthes');
        });

        it('should return error details for empty expression', () => {
            const result = validateCheckConstraintWithDetails('');
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('empty');
        });

        it('should return valid result for good expression', () => {
            const result = validateCheckConstraintWithDetails('a < b');
            expect(result.isValid).toBe(true);
            expect(result.error).toBeUndefined();
        });

        it('should return position for certain errors', () => {
            const result = validateCheckConstraintWithDetails('a < b)');
            expect(result.isValid).toBe(false);
            expect(result.position).toBeDefined();
        });
    });

    describe('Edge cases', () => {
        it('should handle underscores in identifiers', () => {
            expect(validateCheckConstraint('my_column > 0')).toBe(true);
        });

        it('should handle multiple underscores', () => {
            expect(validateCheckConstraint('my__very__long__column > 0')).toBe(
                true
            );
        });

        it('should handle $ in identifier', () => {
            expect(validateCheckConstraint('col$1 > 0')).toBe(true);
        });

        it('should handle scientific notation', () => {
            expect(validateCheckConstraint('value < 1e10')).toBe(true);
        });

        it('should handle negative scientific notation', () => {
            expect(validateCheckConstraint('value > 1e-5')).toBe(true);
        });

        it('should handle string with escaped quote', () => {
            expect(validateCheckConstraint("name = 'O''Brien'")).toBe(true);
        });

        it('should handle empty parentheses in function call', () => {
            expect(validateCheckConstraint('NOW() > created_at')).toBe(true);
        });

        it('should handle comparison between two columns', () => {
            expect(validateCheckConstraint('end_date >= start_date')).toBe(
                true
            );
        });

        it('should handle just an identifier (boolean column)', () => {
            expect(validateCheckConstraint('is_valid')).toBe(true);
        });

        it('should handle NOT with identifier', () => {
            expect(validateCheckConstraint('NOT is_deleted')).toBe(true);
        });
    });
});
