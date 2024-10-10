module.exports = {
    root: true,
    env: { browser: true, es2020: true },
    extends: [
        'eslint:recommended',
        'plugin:react/recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:react-hooks/recommended',
        'plugin:css-modules/recommended',
        'plugin:tailwindcss/recommended',
        'plugin:prettier/recommended',
        // 'plugin:jsx-a11y/recommended',
    ],
    ignorePatterns: ['dist', '.eslintrc.cjs'],
    parser: '@typescript-eslint/parser',
    plugins: ['react-refresh', 'css-modules', 'tailwindcss', 'jsx-a11y'],
    rules: {
        '@typescript-eslint/consistent-type-imports': 'error',
        'react-refresh/only-export-components': [
            'warn',
            { allowConstantExport: true },
        ],
        'react/no-unescaped-entities': 'off',
        'react/prop-types': 'off',
    },
    settings: {
        react: { version: 'detect' },
    },
};
