# PostgreSQL Parser Tests

This directory contains comprehensive tests for the PostgreSQL SQL import parser.

## Test Files

- `postgresql-core.test.ts` - Core functionality tests that should always pass
- `postgresql-parser.test.ts` - Comprehensive edge case tests (some may need adjustment based on parser limitations)
- `postgresql-regression.test.ts` - Regression tests for specific bugs that were fixed
- `postgresql-examples.test.ts` - Tests using real-world SQL examples

## Test Data

All test data is now embedded directly within the test files as hardcoded SQL strings. This ensures tests are self-contained and don't depend on external files.

## Running Tests

```bash
# Run all PostgreSQL parser tests
npm test src/lib/data/sql-import/dialect-importers/postgresql/__tests__

# Run specific test file
npm test postgresql-core.test.ts

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test:coverage
```

## Test Coverage

The tests cover:

1. **Basic table parsing** - Simple CREATE TABLE statements
2. **Foreign key relationships** - Both inline and table-level constraints
3. **Complex data types** - UUID, JSONB, arrays, numeric precision
4. **Generated columns** - IDENTITY and computed columns
5. **Unsupported features** - Functions, triggers, policies, RLS
6. **Edge cases** - Multi-line definitions, dollar quotes, malformed SQL
7. **Fallback parsing** - Tables that fail AST parsing but can be extracted

## Adding New Tests

When adding new tests:

1. Add simple unit tests to `postgresql-core.test.ts`
2. Add edge cases to `postgresql-parser.test.ts`
3. Add regression tests for bugs to `postgresql-regression.test.ts`
4. Use real SQL examples in `postgresql-examples.test.ts`