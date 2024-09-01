import { createContext } from 'react';

export interface KeyboardShortcutsContext {}

export const keyboardShortcutsContext = createContext<KeyboardShortcutsContext>(
    {}
);
