import type { Monaco } from '@monaco-editor/react';
import { dataTypes } from '@/lib/data/data-types/data-types';

export const setupDBMLLanguage = (monaco: Monaco) => {
    monaco.languages.register({ id: 'dbml' });

    // Define themes for DBML
    monaco.editor.defineTheme('dbml-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
            { token: 'comment', foreground: '6A9955' }, // Comments
            { token: 'keyword', foreground: '569CD6' }, // Table, Ref keywords
            { token: 'string', foreground: 'CE9178' }, // Strings
            { token: 'annotation', foreground: '9CDCFE' }, // [annotations]
            { token: 'delimiter', foreground: 'D4D4D4' }, // Braces {}
            { token: 'operator', foreground: 'D4D4D4' }, // Operators
            { token: 'type', foreground: '4EC9B0' }, // Data types
            { token: 'identifier', foreground: '9CDCFE' }, // Field names
        ],
        colors: {},
    });

    monaco.editor.defineTheme('dbml-light', {
        base: 'vs',
        inherit: true,
        rules: [
            { token: 'comment', foreground: '008000' }, // Comments
            { token: 'keyword', foreground: '0000FF' }, // Table, Ref keywords
            { token: 'string', foreground: 'A31515' }, // Strings
            { token: 'annotation', foreground: '001080' }, // [annotations]
            { token: 'delimiter', foreground: '000000' }, // Braces {}
            { token: 'operator', foreground: '000000' }, // Operators
            { token: 'type', foreground: '267F99' }, // Data types
            { token: 'identifier', foreground: '001080' }, // Field names
        ],
        colors: {},
    });

    const dataTypesNames = dataTypes.map((dt) => dt.name);
    const datatypePattern = dataTypesNames.join('|');

    // Language configuration for auto-closing brackets, comments, etc.
    monaco.languages.setLanguageConfiguration('dbml', {
        brackets: [
            ['{', '}'],
            ['[', ']'],
            ['(', ')'],
        ],
        autoClosingPairs: [
            { open: '{', close: '}' },
            { open: '[', close: ']' },
            { open: '(', close: ')' },
            { open: '"', close: '"', notIn: ['string'] },
            { open: "'", close: "'", notIn: ['string'] },
            { open: '`', close: '`', notIn: ['string'] },
        ],
        surroundingPairs: [
            { open: '{', close: '}' },
            { open: '[', close: ']' },
            { open: '(', close: ')' },
            { open: '"', close: '"' },
            { open: "'", close: "'" },
            { open: '`', close: '`' },
        ],
        comments: {
            lineComment: '//',
        },
    });

    monaco.languages.setMonarchTokensProvider('dbml', {
        keywords: ['Table', 'Ref', 'Indexes', 'Note', 'Enum', 'enum'],
        datatypes: dataTypesNames,
        operators: ['>', '<', '-'],

        tokenizer: {
            root: [
                // Comments
                [/\/\/.*$/, 'comment'],

                // Keywords - case insensitive
                [
                    /\b([Tt][Aa][Bb][Ll][Ee]|[Ee][Nn][Uu][Mm]|[Rr][Ee][Ff]|[Ii][Nn][Dd][Ee][Xx][Ee][Ss]|[Nn][Oo][Tt][Ee])\b/,
                    'keyword',
                ],

                // Annotations in brackets
                [/\[.*?\]/, 'annotation'],

                // Strings
                [/'''/, 'string', '@tripleQuoteString'],
                [/"([^"\\]|\\.)*$/, 'string.invalid'], // non-terminated string
                [/'([^'\\]|\\.)*$/, 'string.invalid'], // non-terminated string
                [/"/, 'string', '@string_double'],
                [/'/, 'string', '@string_single'],
                [/`.*?`/, 'string'],

                // Delimiters and operators
                [/[{}()]/, 'delimiter'],
                [/[<>-]/, 'operator'],
                [/:/, 'delimiter'],

                // Data types
                [new RegExp(`\\b(${datatypePattern})\\b`, 'i'), 'type'],

                // Numbers
                [/\d+/, 'number'],

                // Identifiers
                [/[a-zA-Z_]\w*/, 'identifier'],
            ],

            string_double: [
                [/[^\\"]+/, 'string'],
                [/\\./, 'string.escape'],
                [/"/, 'string', '@pop'],
            ],

            string_single: [
                [/[^\\']+/, 'string'],
                [/\\./, 'string.escape'],
                [/'/, 'string', '@pop'],
            ],

            tripleQuoteString: [
                [/[^']+/, 'string'],
                [/'''/, 'string', '@pop'],
                [/'/, 'string'],
            ],
        },
    });
};
