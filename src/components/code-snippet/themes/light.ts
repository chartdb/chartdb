import type { editor } from 'monaco-editor';

export const LightTheme: editor.IStandaloneThemeData = {
    inherit: true,
    base: 'vs',
    rules: [{ token: 'string.sql', foreground: 'A31515' }],
    encodedTokensColors: [],
    colors: {},
};
