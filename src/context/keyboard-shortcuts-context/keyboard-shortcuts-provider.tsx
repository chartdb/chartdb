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
import { useReactFlow } from '@xyflow/react';

export interface KeyboardShortcutsProviderProps
    extends React.PropsWithChildren {
    enabled?: boolean;
}

export const KeyboardShortcutsProvider: React.FC<
    KeyboardShortcutsProviderProps
> = ({ children, enabled = true }) => {
    const { redo, undo } = useHistory();
    const { openOpenDiagramDialog } = useDialog();
    const { updateDiagramUpdatedAt } = useChartDB();
    const { toggleSidePanel } = useLayout();
    const { fitView } = useReactFlow();

    useHotkeys(
        keyboardShortcutsForOS[KeyboardShortcutAction.REDO].keyCombination,
        redo,
        {
            preventDefault: true,
            enabled,
        },
        [redo]
    );
    useHotkeys(
        keyboardShortcutsForOS[KeyboardShortcutAction.UNDO].keyCombination,
        undo,
        {
            preventDefault: true,
            enabled,
        },
        [undo]
    );
    useHotkeys(
        keyboardShortcutsForOS[KeyboardShortcutAction.OPEN_DIAGRAM]
            .keyCombination,
        () => openOpenDiagramDialog(),
        {
            preventDefault: true,
            enabled,
        },
        [openOpenDiagramDialog]
    );
    useHotkeys(
        keyboardShortcutsForOS[KeyboardShortcutAction.SAVE_DIAGRAM]
            .keyCombination,
        updateDiagramUpdatedAt,
        {
            preventDefault: true,
            enabled,
        },
        [updateDiagramUpdatedAt]
    );
    useHotkeys(
        keyboardShortcutsForOS[KeyboardShortcutAction.TOGGLE_SIDE_PANEL]
            .keyCombination,
        toggleSidePanel,
        {
            preventDefault: true,
            enabled,
        },
        [toggleSidePanel]
    );
    useHotkeys(
        keyboardShortcutsForOS[KeyboardShortcutAction.SHOW_ALL].keyCombination,
        () => {
            fitView({
                duration: 500,
                padding: 0.1,
                maxZoom: 0.8,
            });
        },
        {
            preventDefault: true,
            enabled,
        },
        [fitView]
    );

    return (
        <keyboardShortcutsContext.Provider value={{}}>
            {children}
        </keyboardShortcutsContext.Provider>
    );
};
