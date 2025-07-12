# Smart Pre-commit Hooks

This directory contains intelligent pre-commit hooks that run relevant tests based on the files being committed.

## Features

- **Smart Test Detection**: Automatically detects which tests to run based on changed files
- **Configurable Mappings**: Easy to configure via `test-mapping.json` (optional)
- **Performance Optimized**: Only runs tests for affected code
- **Skip Option**: Temporarily skip tests when needed
- **Progressive Enhancement**: Works without dependencies, enhanced with `jq` if available

## How It Works

1. **Linting**: Always runs linting first
2. **File Analysis**: Examines staged files to determine which are SQL import related
3. **Test Selection**: Maps changed files to relevant test suites
4. **Test Execution**: Runs only the necessary tests

## Configuration

The test runner works in two modes:

### Basic Mode (No Dependencies)
- Uses built-in patterns for common SQL import files
- Works out of the box without any additional tools

### Enhanced Mode (With `jq`)
- Reads configuration from `test-mapping.json`
- Allows custom patterns and mappings
- More flexible and maintainable

### Automatic Behaviors
- **Documentation Changes**: Tests are automatically skipped for .md, .txt, and .rst files
- **Verbose Output**: Always shows matched files and test paths for better visibility

## File Mappings

Built-in mappings:
- PostgreSQL import files → PostgreSQL tests
- MySQL import files → MySQL tests
- SQLite import files → SQLite tests
- SQL Server import files → SQL Server tests
- Common SQL files → All dialect tests
- SQL validator → PostgreSQL tests

## Usage

### Normal Operation
Just commit as usual. The hooks will automatically run relevant tests.

### Skip Tests Temporarily
```bash
# Create skip file
touch .husky/.skip-tests

# Commit without tests
git commit -m "WIP: debugging"

# Remove skip file to re-enable
rm .husky/.skip-tests
```

### Customize Mappings
1. Install `jq`: `brew install jq` (macOS) or `apt-get install jq` (Linux)
2. Edit `test-mapping.json` to add new patterns or modify existing ones

## Requirements

- **Required**: None (works with bash only)
- **Optional**: `jq` for JSON configuration support

## Examples

### Example 1: PostgreSQL Parser Change
```bash
# Changed: src/lib/data/sql-import/dialect-importers/postgresql/postgresql-improved.ts
# Runs: src/lib/data/sql-import/dialect-importers/postgresql/__tests__
```

### Example 2: Common SQL Import Change
```bash
# Changed: src/lib/data/sql-import/common.ts
# Runs: All dialect tests (PostgreSQL, MySQL, SQLite, SQL Server)
```

### Example 3: Test File Change
```bash
# Changed: src/lib/data/sql-import/dialect-importers/postgresql/__tests__/test-types.test.ts
# Runs: That specific test file
```

## Troubleshooting

1. **Tests not running**: Check if `.husky/.skip-tests` exists
2. **Wrong tests running**: Check `test-mapping.json` patterns
3. **All tests running**: You may have exceeded the change threshold