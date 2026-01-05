/**
 * SQL Check Constraint Expression Validator
 *
 * Validates SQL check constraint expressions for syntactic correctness.
 * This is a syntax validator - it doesn't verify that column names exist.
 *
 * Valid examples:
 * - "price > 0"
 * - "age >= 18 AND age <= 120"
 * - "status IN ('active', 'inactive')"
 * - "quantity BETWEEN 1 AND 100"
 *
 * Invalid examples:
 * - "a<" (incomplete expression)
 * - "a<2b" (invalid identifier starting with digit)
 * - "(a < b" (unbalanced parentheses)
 */

// Token types for the lexer
type TokenType =
    | 'IDENTIFIER' // column names, table names
    | 'NUMBER' // numeric literals
    | 'STRING' // 'string' or "string"
    | 'OPERATOR' // comparison and arithmetic operators
    | 'LOGICAL' // AND, OR, NOT
    | 'KEYWORD' // BETWEEN, IN, IS, NULL, LIKE, TRUE, FALSE, ISNULL, etc.
    | 'LPAREN' // (
    | 'RPAREN' // )
    | 'LBRACKET' // [ (SQL Server style)
    | 'RBRACKET' // ] (SQL Server style)
    | 'COMMA' // ,
    | 'UNKNOWN'; // unrecognized token

interface Token {
    type: TokenType;
    value: string;
    position: number;
}

// SQL keywords used in check constraints
const SQL_KEYWORDS = new Set([
    'BETWEEN',
    'IN',
    'IS',
    'NULL',
    'NOT',
    'LIKE',
    'ILIKE',
    'TRUE',
    'FALSE',
    'UNKNOWN',
    'ESCAPE',
    'SIMILAR',
    'TO',
    'ANY',
    'ALL',
    'SOME',
    'EXISTS',
    'CASE',
    'WHEN',
    'THEN',
    'ELSE',
    'END',
    'CAST',
    'AS',
    'COLLATE',
]);

// Logical operators
const LOGICAL_OPERATORS = new Set(['AND', 'OR', 'NOT']);

// Comparison operators (including multi-char)
const COMPARISON_OPERATORS = [
    '<>',
    '!=',
    '<=',
    '>=',
    '::',
    '<',
    '>',
    '=',
    '+',
    '-',
    '*',
    '/',
    '%',
    '||',
    '~',
    '!~',
    '~*',
    '!~*',
];

/**
 * Tokenizes a SQL check constraint expression
 */
function tokenize(expression: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;

    while (i < expression.length) {
        // Skip whitespace
        if (/\s/.test(expression[i])) {
            i++;
            continue;
        }

        const startPos = i;

        // Single-quoted string
        if (expression[i] === "'") {
            let value = "'";
            i++;
            while (i < expression.length) {
                if (expression[i] === "'" && expression[i + 1] === "'") {
                    // Escaped quote
                    value += "''";
                    i += 2;
                } else if (expression[i] === "'") {
                    value += "'";
                    i++;
                    break;
                } else {
                    value += expression[i];
                    i++;
                }
            }
            tokens.push({ type: 'STRING', value, position: startPos });
            continue;
        }

        // Double-quoted identifier (standard SQL)
        if (expression[i] === '"') {
            let value = '"';
            i++;
            while (i < expression.length && expression[i] !== '"') {
                value += expression[i];
                i++;
            }
            if (i < expression.length) {
                value += '"';
                i++;
            }
            tokens.push({ type: 'IDENTIFIER', value, position: startPos });
            continue;
        }

        // Backtick-quoted identifier (MySQL style)
        if (expression[i] === '`') {
            let value = '`';
            i++;
            while (i < expression.length && expression[i] !== '`') {
                value += expression[i];
                i++;
            }
            if (i < expression.length) {
                value += '`';
                i++;
            }
            tokens.push({ type: 'IDENTIFIER', value, position: startPos });
            continue;
        }

        // SQL Server bracket-quoted identifier [column]
        if (expression[i] === '[') {
            let value = '[';
            i++;
            while (i < expression.length && expression[i] !== ']') {
                value += expression[i];
                i++;
            }
            if (i < expression.length) {
                value += ']';
                i++;
            }
            tokens.push({ type: 'IDENTIFIER', value, position: startPos });
            continue;
        }

        // Parentheses
        if (expression[i] === '(') {
            tokens.push({ type: 'LPAREN', value: '(', position: startPos });
            i++;
            continue;
        }
        if (expression[i] === ')') {
            tokens.push({ type: 'RPAREN', value: ')', position: startPos });
            i++;
            continue;
        }

        // Comma
        if (expression[i] === ',') {
            tokens.push({ type: 'COMMA', value: ',', position: startPos });
            i++;
            continue;
        }

        // Check for multi-character operators first
        let foundOperator = false;
        for (const op of COMPARISON_OPERATORS) {
            if (expression.substring(i, i + op.length) === op) {
                tokens.push({
                    type: 'OPERATOR',
                    value: op,
                    position: startPos,
                });
                i += op.length;
                foundOperator = true;
                break;
            }
        }
        if (foundOperator) continue;

        // Number (including decimals and negative numbers handled by context)
        if (/[0-9]/.test(expression[i])) {
            let value = '';
            while (
                i < expression.length &&
                /[0-9.]/.test(expression[i]) &&
                !(expression[i] === '.' && value.includes('.'))
            ) {
                value += expression[i];
                i++;
            }
            // Handle scientific notation
            if (
                i < expression.length &&
                (expression[i] === 'e' || expression[i] === 'E')
            ) {
                value += expression[i];
                i++;
                if (
                    i < expression.length &&
                    (expression[i] === '+' || expression[i] === '-')
                ) {
                    value += expression[i];
                    i++;
                }
                while (i < expression.length && /[0-9]/.test(expression[i])) {
                    value += expression[i];
                    i++;
                }
            }
            tokens.push({ type: 'NUMBER', value, position: startPos });
            continue;
        }

        // Identifier or keyword (starts with letter or underscore)
        if (/[a-zA-Z_]/.test(expression[i])) {
            let value = '';
            while (
                i < expression.length &&
                /[a-zA-Z0-9_$]/.test(expression[i])
            ) {
                value += expression[i];
                i++;
            }
            const upperValue = value.toUpperCase();
            if (LOGICAL_OPERATORS.has(upperValue)) {
                tokens.push({
                    type: 'LOGICAL',
                    value: upperValue,
                    position: startPos,
                });
            } else if (SQL_KEYWORDS.has(upperValue)) {
                tokens.push({
                    type: 'KEYWORD',
                    value: upperValue,
                    position: startPos,
                });
            } else {
                tokens.push({ type: 'IDENTIFIER', value, position: startPos });
            }
            continue;
        }

        // Unknown character
        tokens.push({
            type: 'UNKNOWN',
            value: expression[i],
            position: startPos,
        });
        i++;
    }

    return tokens;
}

/**
 * Validation result with detailed error information
 */
export interface CheckConstraintValidationResult {
    isValid: boolean;
    error?: string;
    position?: number;
}

/**
 * Validates a SQL check constraint expression.
 *
 * @param expression - The check constraint expression to validate (e.g., "price > 0")
 * @returns true if the expression is syntactically valid, false otherwise
 */
export function validateCheckConstraint(expression: string): boolean {
    return validateCheckConstraintWithDetails(expression).isValid;
}

/**
 * Validates a SQL check constraint expression with detailed error information.
 *
 * @param expression - The check constraint expression to validate
 * @returns Validation result with error details if invalid
 */
export function validateCheckConstraintWithDetails(
    expression: string
): CheckConstraintValidationResult {
    // Empty or whitespace-only expressions are invalid
    if (!expression || !expression.trim()) {
        return { isValid: false, error: 'Expression cannot be empty' };
    }

    const trimmed = expression.trim();

    // Tokenize the expression
    const tokens = tokenize(trimmed);

    // Check for unknown tokens (except handling edge cases)
    for (const token of tokens) {
        if (token.type === 'UNKNOWN') {
            return {
                isValid: false,
                error: `Unexpected character '${token.value}'`,
                position: token.position,
            };
        }
    }

    // Empty token list after trimming
    if (tokens.length === 0) {
        return { isValid: false, error: 'Expression cannot be empty' };
    }

    // Check for balanced parentheses
    let parenDepth = 0;
    for (const token of tokens) {
        if (token.type === 'LPAREN') parenDepth++;
        if (token.type === 'RPAREN') parenDepth--;
        if (parenDepth < 0) {
            return {
                isValid: false,
                error: 'Unbalanced parentheses: unexpected closing parenthesis',
                position: token.position,
            };
        }
    }
    if (parenDepth !== 0) {
        return {
            isValid: false,
            error: 'Unbalanced parentheses: missing closing parenthesis',
        };
    }

    // Validate token sequence for complete expressions
    const validationResult = validateTokenSequence(tokens);
    if (!validationResult.isValid) {
        return validationResult;
    }

    return { isValid: true };
}

/**
 * Validates that the token sequence forms a valid expression.
 * Checks that operators have operands on both sides, etc.
 */
function validateTokenSequence(
    tokens: Token[]
): CheckConstraintValidationResult {
    if (tokens.length === 0) {
        return { isValid: false, error: 'Expression cannot be empty' };
    }

    // Track context for validation
    let expectingOperand = true; // Start expecting an operand
    let lastToken: Token | null = null;

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];

        switch (token.type) {
            case 'IDENTIFIER':
            case 'NUMBER':
            case 'STRING':
                if (!expectingOperand && lastToken?.type !== 'KEYWORD') {
                    // Allow identifiers after certain keywords like IS, AS, CAST
                    if (
                        lastToken?.type === 'IDENTIFIER' ||
                        lastToken?.type === 'NUMBER' ||
                        lastToken?.type === 'STRING'
                    ) {
                        return {
                            isValid: false,
                            error: `Unexpected ${token.type.toLowerCase()} '${token.value}' - expected an operator`,
                            position: token.position,
                        };
                    }
                }
                expectingOperand = false;
                break;

            case 'OPERATOR':
                // Unary minus/plus before numbers or identifiers is OK at start or after operator/lparen
                if (
                    (token.value === '-' || token.value === '+') &&
                    expectingOperand
                ) {
                    // This is a unary operator, still expecting an operand
                    break;
                }
                // Type cast operator :: doesn't require operand after
                if (token.value === '::') {
                    if (expectingOperand) {
                        return {
                            isValid: false,
                            error: `Operator '${token.value}' requires a value before it`,
                            position: token.position,
                        };
                    }
                    expectingOperand = true;
                    break;
                }
                if (expectingOperand) {
                    return {
                        isValid: false,
                        error: `Operator '${token.value}' requires a value before it`,
                        position: token.position,
                    };
                }
                expectingOperand = true;
                break;

            case 'LOGICAL':
                if (token.value === 'NOT') {
                    // NOT can appear:
                    // 1. Before an operand: NOT(a = b), NOT deleted
                    // 2. After IS: a IS NOT NULL
                    // 3. Before LIKE/IN/BETWEEN: a NOT LIKE '%x%', a NOT IN (1,2), a NOT BETWEEN 1 AND 10
                    // In case 3, NOT comes after a complete operand but is valid
                    // We'll allow it and keep expectingOperand = true
                    expectingOperand = true;
                } else {
                    // AND, OR require operands on both sides
                    if (expectingOperand) {
                        return {
                            isValid: false,
                            error: `Logical operator '${token.value}' requires a value before it`,
                            position: token.position,
                        };
                    }
                    expectingOperand = true;
                }
                break;

            case 'KEYWORD':
                // Handle special keywords
                if (
                    token.value === 'NULL' ||
                    token.value === 'TRUE' ||
                    token.value === 'FALSE'
                ) {
                    expectingOperand = false;
                } else if (token.value === 'NOT') {
                    // NOT as keyword (e.g., IS NOT NULL)
                    expectingOperand = true;
                } else if (
                    token.value === 'IS' ||
                    token.value === 'IN' ||
                    token.value === 'LIKE' ||
                    token.value === 'ILIKE'
                ) {
                    // These keywords require a value before them, BUT
                    // they can also come after NOT (e.g., "a NOT LIKE 'x'", "a NOT IN (1,2)")
                    if (expectingOperand && lastToken?.value !== 'NOT') {
                        return {
                            isValid: false,
                            error: `Keyword '${token.value}' requires a value before it`,
                            position: token.position,
                        };
                    }
                    expectingOperand = true;
                } else if (token.value === 'BETWEEN') {
                    // BETWEEN requires a value before it, or can come after NOT
                    if (expectingOperand && lastToken?.value !== 'NOT') {
                        return {
                            isValid: false,
                            error: `Keyword 'BETWEEN' requires a value before it`,
                            position: token.position,
                        };
                    }
                    expectingOperand = true;
                } else if (
                    token.value === 'CASE' ||
                    token.value === 'CAST' ||
                    token.value === 'EXISTS'
                ) {
                    // These can start expressions
                    expectingOperand = false;
                } else if (
                    token.value === 'WHEN' ||
                    token.value === 'THEN' ||
                    token.value === 'ELSE' ||
                    token.value === 'END'
                ) {
                    // CASE-related keywords
                    if (token.value === 'END') {
                        expectingOperand = false;
                    } else {
                        expectingOperand = true;
                    }
                } else if (token.value === 'AS' || token.value === 'TO') {
                    // AS in CAST, TO in SIMILAR TO
                    expectingOperand = true;
                } else {
                    // Other keywords - generally need an operand after
                    expectingOperand = true;
                }
                break;

            case 'LPAREN':
                // Parenthesis can follow an identifier (function call) or start a group
                if (
                    lastToken?.type === 'IDENTIFIER' ||
                    lastToken?.value === 'IN' ||
                    lastToken?.value === 'EXISTS'
                ) {
                    // Function call or IN list - still expecting operand
                    expectingOperand = true;
                } else {
                    // Grouping parenthesis
                    expectingOperand = true;
                }
                break;

            case 'RPAREN':
                // After closing paren, we have a complete subexpression
                if (expectingOperand && lastToken?.type !== 'LPAREN') {
                    // Empty parens () are only valid for function calls
                    // But we already validated for balance, so this might be OK
                }
                expectingOperand = false;
                break;

            case 'COMMA':
                // Commas separate list items (e.g., IN (..., ...))
                if (expectingOperand) {
                    return {
                        isValid: false,
                        error: 'Unexpected comma - expected a value',
                        position: token.position,
                    };
                }
                expectingOperand = true;
                break;
        }

        lastToken = token;
    }

    // At the end, we should not be expecting an operand (expression should be complete)
    if (expectingOperand && lastToken?.type !== 'RPAREN') {
        // Exception: expression ending with ) is OK
        // Find the last non-RPAREN token
        let lastNonParen: Token | undefined;
        for (let j = tokens.length - 1; j >= 0; j--) {
            if (tokens[j].type !== 'RPAREN') {
                lastNonParen = tokens[j];
                break;
            }
        }
        if (lastNonParen) {
            if (lastNonParen.type === 'OPERATOR') {
                return {
                    isValid: false,
                    error: `Expression incomplete - operator '${lastNonParen.value}' requires a value after it`,
                    position: lastNonParen.position,
                };
            }
            if (
                lastNonParen.type === 'LOGICAL' &&
                lastNonParen.value !== 'NOT'
            ) {
                return {
                    isValid: false,
                    error: `Expression incomplete - '${lastNonParen.value}' requires a value after it`,
                    position: lastNonParen.position,
                };
            }
            if (
                lastNonParen.type === 'KEYWORD' &&
                lastNonParen.value !== 'NULL' &&
                lastNonParen.value !== 'TRUE' &&
                lastNonParen.value !== 'FALSE' &&
                lastNonParen.value !== 'END'
            ) {
                return {
                    isValid: false,
                    error: `Expression incomplete - '${lastNonParen.value}' requires a value after it`,
                    position: lastNonParen.position,
                };
            }
        }
    }

    return { isValid: true };
}
