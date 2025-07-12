#!/usr/bin/env bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
CONFIG_FILE="$SCRIPT_DIR/test-mapping.json"

# Get list of staged files
STAGED_FILES=$(git diff --cached --name-only)

# Check if only documentation files are staged
DOC_ONLY=true
NON_DOC_COUNT=0
while IFS= read -r file; do
    [ -z "$file" ] && continue
    if [[ ! "$file" =~ \.(md|txt|rst)$ ]]; then
        DOC_ONLY=false
        ((NON_DOC_COUNT++))
    fi
done <<< "$STAGED_FILES"

# Skip tests if only docs are changed
if [ "$DOC_ONLY" = "true" ]; then
    echo -e "${YELLOW}ℹ️  Only documentation files changed, skipping tests.${NC}"
    exit 0
fi

# Initialize test tracking
TESTS_TO_RUN=""
MATCHED_FILES=()

# Function to add test path
add_test() {
    local test_path=$1
    if [ -d "$test_path" ] || [ -f "$test_path" ]; then
        # Add to list if not already present
        if [[ ! "$TESTS_TO_RUN" =~ "$test_path" ]]; then
            if [ -z "$TESTS_TO_RUN" ]; then
                TESTS_TO_RUN="$test_path"
            else
                TESTS_TO_RUN="$TESTS_TO_RUN $test_path"
            fi
        fi
    fi
}

# Function to check if file matches pattern (simple glob matching)
matches_pattern() {
    local file=$1
    local pattern=$2

    # Use bash pattern matching
    case "$file" in
        $pattern) return 0 ;;
        *) return 1 ;;
    esac
}

# Always verbose by default
VERBOSE=true

# Process files based on available tools
if command -v jq &> /dev/null && [ -f "$CONFIG_FILE" ]; then
    echo -e "${YELLOW}Using configuration from test-mapping.json${NC}"

    # Process each staged file
    while IFS= read -r file; do
        [ -z "$file" ] && continue

        # Check against each mapping rule
        jq -c '.mappings[]' "$CONFIG_FILE" 2>/dev/null | while read -r mapping; do
            name=$(echo "$mapping" | jq -r '.name')

            # Check patterns
            echo "$mapping" | jq -r '.patterns[]' | while read -r pattern; do
                if matches_pattern "$file" "$pattern"; then
                    # Check exclusions
                    excluded=false
                    echo "$mapping" | jq -r '.excludePatterns[]?' 2>/dev/null | while read -r exclude; do
                        if matches_pattern "$file" "$exclude"; then
                            excluded=true
                            break
                        fi
                    done

                    if [ "$excluded" = "false" ]; then
                        [ "$VERBOSE" = "true" ] && echo -e "${GREEN}✓ Matched rule '$name' for file: $file${NC}"
                        MATCHED_FILES+=("$file")

                        # Add tests for this mapping
                        echo "$mapping" | jq -r '.tests[]' | while read -r test_path; do
                            [ -n "$test_path" ] && echo "$test_path" >> /tmp/test_paths_$$
                        done
                    fi
                    break
                fi
            done
        done
    done <<< "$STAGED_FILES"

    # Read test paths from temp file
    if [ -f /tmp/test_paths_$$ ]; then
        while read -r test_path; do
            add_test "$test_path"
        done < /tmp/test_paths_$$
        rm -f /tmp/test_paths_$$
    fi
else
    echo -e "${YELLOW}Using built-in patterns (install jq for config file support)${NC}"

    # Fallback to hardcoded patterns
    while IFS= read -r file; do
        [ -z "$file" ] && continue

        case "$file" in
            # PostgreSQL import files
            src/lib/data/sql-import/dialect-importers/postgresql/*.ts)
                if [[ ! "$file" =~ \.test\.ts$ ]] && [[ ! "$file" =~ \.spec\.ts$ ]]; then
                    [ "$VERBOSE" = "true" ] && echo "📝 Changed PostgreSQL import file: $file"
                    MATCHED_FILES+=("$file")
                    add_test "src/lib/data/sql-import/dialect-importers/postgresql/__tests__"
                fi
                ;;

            # MySQL import files
            src/lib/data/sql-import/dialect-importers/mysql/*.ts)
                if [[ ! "$file" =~ \.test\.ts$ ]] && [[ ! "$file" =~ \.spec\.ts$ ]]; then
                    [ "$VERBOSE" = "true" ] && echo "📝 Changed MySQL import file: $file"
                    MATCHED_FILES+=("$file")
                    add_test "src/lib/data/sql-import/dialect-importers/mysql/__tests__"
                fi
                ;;

            # SQLite import files
            src/lib/data/sql-import/dialect-importers/sqlite/*.ts)
                if [[ ! "$file" =~ \.test\.ts$ ]] && [[ ! "$file" =~ \.spec\.ts$ ]]; then
                    [ "$VERBOSE" = "true" ] && echo "📝 Changed SQLite import file: $file"
                    MATCHED_FILES+=("$file")
                    add_test "src/lib/data/sql-import/dialect-importers/sqlite/__tests__"
                fi
                ;;

            # SQL Server import files
            src/lib/data/sql-import/dialect-importers/sql-server/*.ts)
                if [[ ! "$file" =~ \.test\.ts$ ]] && [[ ! "$file" =~ \.spec\.ts$ ]]; then
                    [ "$VERBOSE" = "true" ] && echo "📝 Changed SQL Server import file: $file"
                    MATCHED_FILES+=("$file")
                    add_test "src/lib/data/sql-import/dialect-importers/sql-server/__tests__"
                fi
                ;;

            # Common SQL import files
            src/lib/data/sql-import/*.ts)
                if [[ ! "$file" =~ \.test\.ts$ ]] && [[ ! "$file" =~ \.spec\.ts$ ]] && [[ ! "$file" =~ /dialect-importers/ ]]; then
                    [ "$VERBOSE" = "true" ] && echo "📝 Changed common SQL import file: $file"
                    MATCHED_FILES+=("$file")
                    # Run all dialect tests if common files change
                    add_test "src/lib/data/sql-import/dialect-importers/postgresql/__tests__"
                    add_test "src/lib/data/sql-import/dialect-importers/mysql/__tests__"
                    add_test "src/lib/data/sql-import/dialect-importers/sqlite/__tests__"
                    add_test "src/lib/data/sql-import/dialect-importers/sql-server/__tests__"
                fi
                ;;

            # SQL validator
            src/lib/data/sql-import/sql-validator.ts)
                [ "$VERBOSE" = "true" ] && echo "📝 Changed SQL validator"
                MATCHED_FILES+=("$file")
                add_test "src/lib/data/sql-import/dialect-importers/postgresql/__tests__"
                ;;

            # Test files themselves
            src/lib/data/sql-import/**/*.test.ts|src/lib/data/sql-import/**/*.spec.ts)
                [ "$VERBOSE" = "true" ] && echo "📝 Changed test file: $file"
                MATCHED_FILES+=("$file")
                add_test "$file"
                ;;
        esac
    done <<< "$STAGED_FILES"
fi

# Run tests if any were found
if [ -n "$TESTS_TO_RUN" ]; then
    echo ""
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}🧪 Running SQL import tests...${NC}"
    [ "$VERBOSE" = "true" ] && echo -e "Matched files: ${#MATCHED_FILES[@]}"
    [ "$VERBOSE" = "true" ] && echo -e "Test paths: $TESTS_TO_RUN"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    # Run the tests
    npm test -- $TESTS_TO_RUN --run
    TEST_RESULT=$?

    if [ $TEST_RESULT -ne 0 ]; then
        echo ""
        echo -e "${RED}❌ SQL import tests failed! Please fix the tests before committing.${NC}"
        exit 1
    else
        echo ""
        echo -e "${GREEN}✅ SQL import tests passed!${NC}"
    fi
else
    echo -e "${YELLOW}ℹ️  No SQL import related changes detected, skipping SQL import tests.${NC}"
fi

exit 0