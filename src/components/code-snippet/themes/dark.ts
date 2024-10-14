import type { editor } from 'monaco-editor';

export const DarkTheme: editor.IStandaloneThemeData = {
    inherit: true,
    base: 'vs-dark',
    rules: [
        { token: 'string.sql', foreground: 'CE9178' },
        { token: 'predefined.sql', foreground: 'DCDCAB' },
    ],
    encodedTokensColors: [],
    colors: {},
};
