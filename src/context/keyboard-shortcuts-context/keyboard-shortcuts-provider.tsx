import React from 'react';
import { keyboardShortcutsContext } from './keyboard-shortcuts-context';
import { useHotkeys } from 'react-hotkeys-hook';
import {
    KeyboardShortcutAction,
    keyboardShortcutsForOS,
} from './keyboard-shortcuts';
import { useHistory } from '@/hooks/use-history';
import { useDialog } from '@/hooks/use-dialog';
import { useChartDB } from '@/hooks/use-chartdb';
import { useLayout } from '@/hooks/use-layout';

export const KeyboardShortcutsProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const { redo, undo } = useHistory();
    const { openOpenDiagramDialog } = useDialog();
    const { updateDiagramUpdatedAt } = useChartDB();
    const { toggleSidePanel } = useLayout();

    useHotkeys(
        keyboardShortcutsForOS[KeyboardShortcutAction.REDO].keyCombination,
        redo,
        {
            preventDefault: true,
        },
        [redo]
    );
    useHotkeys(
        keyboardShortcutsForOS[KeyboardShortcutAction.UNDO].keyCombination,
        undo,
        {
            preventDefault: true,
        },
        [undo]
    );
    useHotkeys(
        keyboardShortcutsForOS[KeyboardShortcutAction.OPEN_DIAGRAM]
            .keyCombination,
        openOpenDiagramDialog,
        {
            preventDefault: true,
        },
        [openOpenDiagramDialog]
    );
    useHotkeys(
        keyboardShortcutsForOS[KeyboardShortcutAction.SAVE_DIAGRAM]
            .keyCombination,
        updateDiagramUpdatedAt,
        {
            preventDefault: true,
        },
        [updateDiagramUpdatedAt]
    );
    useHotkeys(
        keyboardShortcutsForOS[KeyboardShortcutAction.TOGGLE_SIDE_PANEL]
            .keyCombination,
        toggleSidePanel,
        {
            preventDefault: true,
        },
        [toggleSidePanel]
    );

    return (
        <keyboardShortcutsContext.Provider value={{}}>
            {children}
        </keyboardShortcutsContext.Provider>
    );
};
