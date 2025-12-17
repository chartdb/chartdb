/**
 * Type declarations for @dbml/parse
 *
 * The @dbml/parse package has types but they use path aliases (@/) that don't
 * resolve properly when consumed as a dependency. This module provides the
 * minimal types needed for the completion provider integration.
 */
declare module '@dbml/parse' {
    import type { languages, editor } from 'monaco-editor';

    /**
     * DBML Compiler - parses and analyzes DBML content
     */
    export class Compiler {
        constructor();
        setSource(source: string): void;
    }

    /**
     * Completion item provider for Monaco editor
     */
    export class DBMLCompletionItemProvider
        implements languages.CompletionItemProvider
    {
        triggerCharacters?: string[];
        constructor(compiler: Compiler, triggerCharacters?: string[]);
        provideCompletionItems(
            model: editor.ITextModel,
            position: { lineNumber: number; column: number }
        ): languages.CompletionList;
    }

    /**
     * Services namespace containing providers
     */
    export namespace services {
        export { DBMLCompletionItemProvider };
    }
}
