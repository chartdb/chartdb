/**
 * Tests for SQLite SQL Validator
 */

import { describe, it, expect } from 'vitest';
import {
    validateSQLiteDialect,
    formatSQLiteValidationMessage,
    quickSQLiteValidate,
} from '../sqlite-validator';

describe('SQLite Validator', () => {
    describe('validateSQLiteDialect', () => {
        it('should return error for empty SQL', () => {
            const result = validateSQLiteDialect('');
            expect(result.isValid).toBe(false);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0].message).toBe('SQL script is empty');
        });

        it('should return error for SQL without valid keywords', () => {
            const result = validateSQLiteDialect('This is not SQL');
            expect(result.isValid).toBe(false);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0].message).toBe(
                'No valid SQL statements found'
            );
        });

        it('should validate basic CREATE TABLE statement', () => {
            const sql = `
                CREATE TABLE users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    email TEXT UNIQUE
                );
            `;
            const result = validateSQLiteDialect(sql);
            expect(result.isValid).toBe(true);
            expect(result.tableCount).toBe(1);
        });

        it('should detect CREATE SCHEMA as unsupported', () => {
            const sql = `
                CREATE SCHEMA test_schema;
                CREATE TABLE users (id INTEGER);
            `;
            const result = validateSQLiteDialect(sql);
            expect(result.isValid).toBe(false);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0].message).toBe(
                'CREATE SCHEMA is not supported in SQLite'
            );
            expect(result.errors[0].type).toBe('unsupported');
        });

        it('should detect DROP SCHEMA as unsupported', () => {
            const sql = `
                DROP SCHEMA IF EXISTS test_schema;
                CREATE TABLE users (id INTEGER);
            `;
            const result = validateSQLiteDialect(sql);
            expect(result.isValid).toBe(false);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0].message).toBe(
                'DROP SCHEMA is not supported in SQLite'
            );
        });

        it('should warn about ENUM type', () => {
            const sql = `
                CREATE TABLE users (
                    id INTEGER PRIMARY KEY,
                    status ENUM('active', 'inactive')
                );
            `;
            const result = validateSQLiteDialect(sql);
            expect(result.isValid).toBe(true);
            expect(result.warnings).toHaveLength(1);
            expect(result.warnings[0].message).toContain(
                'ENUM type is not supported'
            );
        });

        it('should warn about BOOLEAN type', () => {
            const sql = `
                CREATE TABLE users (
                    id INTEGER PRIMARY KEY,
                    is_active BOOLEAN
                );
            `;
            const result = validateSQLiteDialect(sql);
            expect(result.isValid).toBe(true);
            expect(result.warnings.length).toBeGreaterThanOrEqual(1);
            expect(
                result.warnings.some((w) =>
                    w.message.includes('BOOLEAN type will be stored as INTEGER')
                )
            ).toBe(true);
        });

        it('should warn about UUID type', () => {
            const sql = `
                CREATE TABLE users (
                    id UUID PRIMARY KEY,
                    name TEXT
                );
            `;
            const result = validateSQLiteDialect(sql);
            expect(result.isValid).toBe(true);
            expect(result.warnings).toHaveLength(1);
            expect(result.warnings[0].message).toContain(
                'UUID type is not natively supported'
            );
        });

        it('should warn about JSON type', () => {
            const sql = `
                CREATE TABLE users (
                    id INTEGER PRIMARY KEY,
                    data JSON
                );
            `;
            const result = validateSQLiteDialect(sql);
            expect(result.isValid).toBe(true);
            expect(result.warnings).toHaveLength(1);
            expect(result.warnings[0].message).toContain(
                'JSON type requires SQLite 3.38'
            );
        });

        it('should warn about SERIAL type', () => {
            const sql = `
                CREATE TABLE users (
                    id SERIAL PRIMARY KEY,
                    name TEXT
                );
            `;
            const result = validateSQLiteDialect(sql);
            expect(result.isValid).toBe(true);
            expect(result.warnings.length).toBeGreaterThanOrEqual(1);
            expect(
                result.warnings.some((w) =>
                    w.message.includes('SERIAL type is not supported')
                )
            ).toBe(true);
        });

        it('should detect ALTER TABLE MODIFY COLUMN as unsupported', () => {
            const sql = `
                CREATE TABLE users (id INTEGER);
                ALTER TABLE users MODIFY COLUMN id BIGINT;
            `;
            const result = validateSQLiteDialect(sql);
            expect(result.isValid).toBe(false);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0].message).toBe(
                'ALTER TABLE MODIFY COLUMN is not supported in SQLite'
            );
        });

        it('should warn about ALTER TABLE DROP COLUMN', () => {
            const sql = `
                CREATE TABLE users (id INTEGER, name TEXT);
                ALTER TABLE users DROP COLUMN name;
            `;
            const result = validateSQLiteDialect(sql);
            expect(result.isValid).toBe(true);
            expect(result.warnings).toHaveLength(1);
            expect(result.warnings[0].message).toContain(
                'ALTER TABLE DROP COLUMN requires SQLite 3.35.0'
            );
        });

        it('should warn about ALTER TABLE ADD CONSTRAINT', () => {
            const sql = `
                CREATE TABLE users (id INTEGER);
                ALTER TABLE users ADD CONSTRAINT pk_users PRIMARY KEY (id);
            `;
            const result = validateSQLiteDialect(sql);
            expect(result.isValid).toBe(true);
            expect(result.warnings).toHaveLength(1);
            expect(result.warnings[0].message).toContain(
                'ALTER TABLE ADD CONSTRAINT has limited support'
            );
        });

        it('should detect AUTOINCREMENT without INTEGER PRIMARY KEY', () => {
            const sql = `
                CREATE TABLE users (
                    id TEXT AUTOINCREMENT,
                    name TEXT
                );
            `;
            const result = validateSQLiteDialect(sql);
            expect(result.isValid).toBe(false);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0].message).toBe(
                'AUTOINCREMENT can only be used with INTEGER PRIMARY KEY in SQLite'
            );
        });

        it('should warn about foreign key constraints', () => {
            const sql = `
                CREATE TABLE users (id INTEGER PRIMARY KEY);
                CREATE TABLE posts (
                    id INTEGER PRIMARY KEY,
                    user_id INTEGER,
                    FOREIGN KEY (user_id) REFERENCES users(id)
                );
            `;
            const result = validateSQLiteDialect(sql);
            expect(result.isValid).toBe(true);
            expect(result.warnings).toHaveLength(1);
            expect(result.warnings[0].message).toContain(
                'Foreign key constraints found'
            );
        });

        it('should warn about PRAGMA statements', () => {
            const sql = `
                PRAGMA foreign_keys = ON;
                CREATE TABLE users (id INTEGER PRIMARY KEY);
            `;
            const result = validateSQLiteDialect(sql);
            expect(result.isValid).toBe(true);
            expect(result.warnings).toHaveLength(1);
            expect(result.warnings[0].message).toContain(
                'PRAGMA statements found'
            );
        });

        it('should auto-fix SERIAL type', () => {
            const sql = `
                CREATE TABLE users (
                    id SERIAL,
                    name TEXT
                );
            `;
            const result = validateSQLiteDialect(sql);
            expect(result.isValid).toBe(true);
            expect(result.fixedSQL).toBeDefined();
            expect(result.fixedSQL).toContain(
                'INTEGER PRIMARY KEY AUTOINCREMENT'
            );
            expect(
                result.warnings.some((w) =>
                    w.message.includes('Auto-fixed SERIAL type')
                )
            ).toBe(true);
        });

        it('should auto-fix BOOLEAN type', () => {
            const sql = `
                CREATE TABLE users (
                    id INTEGER PRIMARY KEY,
                    is_active BOOLEAN
                );
            `;
            const result = validateSQLiteDialect(sql);
            expect(result.isValid).toBe(true);
            expect(result.fixedSQL).toBeDefined();
            expect(result.fixedSQL).toContain(
                'INTEGER CHECK(is_active IN (0, 1))'
            );
            expect(
                result.warnings.some((w) =>
                    w.message.includes('Auto-fixed BOOLEAN type')
                )
            ).toBe(true);
        });

        it('should count CREATE TABLE statements correctly', () => {
            const sql = `
                CREATE TABLE users (id INTEGER PRIMARY KEY);
                CREATE TABLE IF NOT EXISTS posts (id INTEGER PRIMARY KEY);
                CREATE TABLE [comments] (id INTEGER PRIMARY KEY);
            `;
            const result = validateSQLiteDialect(sql);
            expect(result.tableCount).toBe(3);
        });

        it('should warn about large SQL files', () => {
            const statements = Array(101)
                .fill('CREATE TABLE test (id INTEGER);')
                .join('\n');
            const result = validateSQLiteDialect(statements);
            expect(
                result.warnings.some((w) =>
                    w.message.includes('Large SQL file detected')
                )
            ).toBe(true);
        });

        it('should warn about missing semicolons', () => {
            const sql = `
                CREATE TABLE users (
                    id INTEGER PRIMARY KEY,
                    name TEXT
                )
            `;
            const result = validateSQLiteDialect(sql);
            expect(
                result.warnings.some((w) =>
                    w.message.includes(
                        'SQL statements should end with semicolons'
                    )
                )
            ).toBe(true);
        });
    });

    describe('formatSQLiteValidationMessage', () => {
        it('should format error messages correctly', () => {
            const result = {
                isValid: false,
                errors: [
                    {
                        line: 1,
                        message: 'CREATE SCHEMA is not supported in SQLite',
                        type: 'unsupported' as const,
                        suggestion:
                            'Remove schema creation statements for SQLite',
                    },
                ],
                warnings: [
                    {
                        message: 'ENUM type is not supported in SQLite',
                        type: 'compatibility' as const,
                    },
                ],
                tableCount: 1,
            };

            const message = formatSQLiteValidationMessage(result);
            expect(message).toContain('❌ SQLite SQL Syntax Errors Found');
            expect(message).toContain('Unsupported Features');
            expect(message).toContain('⚠️  SQLite Compatibility Warnings');
        });

        it('should show success message for valid SQL', () => {
            const result = {
                isValid: true,
                errors: [],
                warnings: [],
                tableCount: 1,
            };

            const message = formatSQLiteValidationMessage(result);
            expect(message).toBe(
                '✅ SQL syntax appears compatible with SQLite.'
            );
        });
    });

    describe('quickSQLiteValidate', () => {
        it('should detect common SQLite errors quickly', () => {
            const sql = `
                CREATE SCHEMA test;
                ALTER TABLE users MODIFY COLUMN id BIGINT;
            `;
            const result = quickSQLiteValidate(sql);
            expect(result.hasErrors).toBe(true);
            expect(result.errorCount).toBeGreaterThan(0);
        });

        it('should return no errors for valid SQL', () => {
            const sql = `
                CREATE TABLE users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT
                );
            `;
            const result = quickSQLiteValidate(sql);
            expect(result.hasErrors).toBe(false);
            expect(result.errorCount).toBe(0);
        });
    });
});
