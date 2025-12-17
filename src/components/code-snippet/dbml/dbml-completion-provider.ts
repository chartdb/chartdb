import type { Monaco } from '@monaco-editor/react';
import type { IDisposable } from 'monaco-editor';
import { Compiler, services } from '@dbml/parse';

/**
 * Creates and manages a DBML completion provider using @dbml/parse.
 *
 * The provider maintains a Compiler instance that needs to be kept in sync
 * with the editor content to provide context-aware completions.
 */
export interface DBMLCompletionManager {
    /** Disposable to clean up the completion provider registration */
    dispose: () => void;
    /** Update the compiler with new DBML content */
    updateSource: (content: string) => void;
}

// Trigger characters for DBML completions
const TRIGGER_CHARACTERS = [' ', '[', ':', '.', '>', '<', '-'];

/**
 * Registers a DBML completion provider with Monaco editor.
 *
 * Uses @dbml/parse's built-in DBMLCompletionItemProvider which provides:
 * - Context-aware keyword suggestions (Table, Ref, Enum, etc.)
 * - Symbol suggestions based on parsed DBML (table names, column names)
 * - Field setting suggestions (pk, not null, unique, etc.)
 * - Ref operator suggestions (>, <, -, <>)
 *
 * @param monaco - Monaco editor instance
 * @param initialContent - Initial DBML content to parse
 * @returns Manager object with dispose and updateSource methods
 */
export function registerDBMLCompletionProvider(
    monaco: Monaco,
    initialContent: string = ''
): DBMLCompletionManager {
    const compiler = new Compiler();

    // Initialize with content if provided
    if (initialContent) {
        compiler.setSource(initialContent);
    }

    // Create the completion provider from @dbml/parse
    const completionProvider = new services.DBMLCompletionItemProvider(
        compiler,
        TRIGGER_CHARACTERS
    );

    // Register with Monaco
    const disposable: IDisposable =
        monaco.languages.registerCompletionItemProvider(
            'dbml',
            completionProvider
        );

    return {
        dispose: () => disposable.dispose(),
        updateSource: (content: string) => {
            compiler.setSource(content);
        },
    };
}
