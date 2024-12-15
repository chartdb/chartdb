import { fixupConfigRules, fixupPluginRules } from '@eslint/compat';
import reactRefresh from 'eslint-plugin-react-refresh';
import cssModules from 'eslint-plugin-css-modules';
import tailwindcss from 'eslint-plugin-tailwindcss';
import jsxA11Y from 'eslint-plugin-jsx-a11y';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all,
});

export default [
    {
        ignores: ['**/dist', '**/.eslintrc.cjs', '**/tailwind.config.js'],
        // files: ['**/*.ts', '**/*.tsx'],
    },
    ...fixupConfigRules(
        compat.extends(
            'eslint:recommended',
            'plugin:react/recommended',
            'plugin:@typescript-eslint/recommended',
            'plugin:react-hooks/recommended',
            'plugin:css-modules/recommended',
            'plugin:tailwindcss/recommended',
            'plugin:prettier/recommended'
        )
    ),
    {
        plugins: {
            'react-refresh': reactRefresh,
            'css-modules': fixupPluginRules(cssModules),
            tailwindcss: fixupPluginRules(tailwindcss),
            'jsx-a11y': jsxA11Y,
        },

        languageOptions: {
            globals: {
                ...globals.browser,
            },

            parser: tsParser,
            // parserOptions: {
            //     project: './tsconfig.json',
            // },
        },

        settings: {
            react: {
                version: 'detect',
            },
        },

        rules: {
            '@typescript-eslint/consistent-type-imports': 'error',

            'react-refresh/only-export-components': [
                'warn',
                {
                    allowConstantExport: true,
                },
            ],

            'react/no-unescaped-entities': 'off',
            'react/prop-types': 'off',
            '@typescript-eslint/no-empty-object-type': 'off',
        },
    },
];
