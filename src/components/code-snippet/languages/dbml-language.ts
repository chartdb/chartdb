import type { Monaco } from '@monaco-editor/react';
import { dataTypes } from '@/lib/data/data-types/data-types';

export const setupDBMLLanguage = (monaco: Monaco) => {
    monaco.languages.register({ id: 'dbml' });

    // Define themes for DBML
    monaco.editor.defineTheme('dbml-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
            { token: 'keyword', foreground: '569CD6' }, // Table, Ref keywords
            { token: 'string', foreground: 'CE9178' }, // Strings
            { token: 'annotation', foreground: '9CDCFE' }, // [annotations]
            { token: 'delimiter', foreground: 'D4D4D4' }, // Braces {}
            { token: 'operator', foreground: 'D4D4D4' }, // Operators
            { token: 'datatype', foreground: '4EC9B0' }, // Data types
            { token: 'error', foreground: 'F14C4C', fontStyle: 'bold' }, // Error messages
            { token: 'error-title', foreground: 'FF5050', fontStyle: 'bold' }, // Error titles
        ],
        colors: {},
    });

    monaco.editor.defineTheme('dbml-light', {
        base: 'vs',
        inherit: true,
        rules: [
            { token: 'keyword', foreground: '0000FF' }, // Table, Ref keywords
            { token: 'string', foreground: 'A31515' }, // Strings
            { token: 'annotation', foreground: '001080' }, // [annotations]
            { token: 'delimiter', foreground: '000000' }, // Braces {}
            { token: 'operator', foreground: '000000' }, // Operators
            { token: 'type', foreground: '267F99' }, // Data types
            { token: 'error', foreground: 'D32F2F', fontStyle: 'bold' }, // Error messages
            { token: 'error-title', foreground: 'C62828', fontStyle: 'bold' }, // Error titles
        ],
        colors: {},
    });

    const dataTypesNames = dataTypes.map((dt) => dt.name);
    const datatypePattern = dataTypesNames.join('|');

    monaco.languages.setMonarchTokensProvider('dbml', {
        keywords: ['Table', 'Ref', 'Indexes'],
        datatypes: dataTypesNames,
        tokenizer: {
            root: [
                // Error highlighting patterns
                [/\/\/ ={2,} DBML GENERATION ERROR ={2,}/, 'error-title'],
                [/\/\/ ==+.*?==+/, 'error-title'],
                [/\/\/ Error:.*$/, 'error'],
                [/\/\/ Field:.*$/, 'error'],
                [/\/\/ Table:.*$/, 'error'],
                [/\/\/ Fix:.*$/, 'error'],
                [/\/\/ Check.*$/, 'error'],
                // Regular DBML patterns
                [/\b(Table|Ref|Indexes)\b/, 'keyword'],
                [/\[.*?\]/, 'annotation'],
                [/".*?"/, 'string'],
                [/'.*?'/, 'string'],
                [/[{}]/, 'delimiter'],
                [/[<>]/, 'operator'],
                [new RegExp(`\\b(${datatypePattern})\\b`, 'i'), 'type'], // Added 'i' flag for case-insensitive matching
            ],
        },
    });
};
