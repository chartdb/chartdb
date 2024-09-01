import React from 'react';
import { keyboardShortcutsContext } from './keyboard-shortcuts-context';
import { useHotkeys } from 'react-hotkeys-hook';
import {
    KeyboardShortcutAction,
    keyboardShortcutsForOS,
} from './keyboard-shortcuts';
import { useHistory } from '@/hooks/use-history';

export const KeyboardShortcutsProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const { redo, undo } = useHistory();
    useHotkeys(
        keyboardShortcutsForOS[KeyboardShortcutAction.REDO].keyCombination,
        redo,
        [redo]
    );
    useHotkeys(
        keyboardShortcutsForOS[KeyboardShortcutAction.UNDO].keyCombination,
        undo,
        [undo]
    );
    return (
        <keyboardShortcutsContext.Provider value={{}}>
            {children}
        </keyboardShortcutsContext.Provider>
    );
};
