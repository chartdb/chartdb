import { getOperatingSystem } from '@/lib/utils';

export enum KeyboardShortcutAction {
    REDO = 'redo',
    UNDO = 'undo',
    OPEN_DIAGRAM = 'open_diagram',
    SAVE_DIAGRAM = 'save_diagram',
    TOGGLE_SIDE_PANEL = 'toggle_side_panel',
}

export interface KeyboardShortcut {
    action: KeyboardShortcutAction;
    keyCombinationLabelMac: string;
    keyCombinationLabelWin: string;
    keyCombinationMac: string;
    keyCombinationWin: string;
}

export const keyboardShortcuts: Record<
    KeyboardShortcutAction,
    KeyboardShortcut
> = {
    [KeyboardShortcutAction.REDO]: {
        action: KeyboardShortcutAction.REDO,
        keyCombinationLabelMac: '⇧⌘Z',
        keyCombinationLabelWin: 'Ctrl+Shift+Z',
        keyCombinationMac: 'meta+shift+z',
        keyCombinationWin: 'ctrl+shift+z',
    },
    [KeyboardShortcutAction.UNDO]: {
        action: KeyboardShortcutAction.UNDO,
        keyCombinationLabelMac: '⌘Z',
        keyCombinationLabelWin: 'Ctrl+Z',
        keyCombinationMac: 'meta+z',
        keyCombinationWin: 'ctrl+z',
    },
    [KeyboardShortcutAction.OPEN_DIAGRAM]: {
        action: KeyboardShortcutAction.OPEN_DIAGRAM,
        keyCombinationLabelMac: '⌘O',
        keyCombinationLabelWin: 'Ctrl+O',
        keyCombinationMac: 'meta+o',
        keyCombinationWin: 'ctrl+o',
    },
    [KeyboardShortcutAction.SAVE_DIAGRAM]: {
        action: KeyboardShortcutAction.SAVE_DIAGRAM,
        keyCombinationLabelMac: '⌘S',
        keyCombinationLabelWin: 'Ctrl+S',
        keyCombinationMac: 'meta+s',
        keyCombinationWin: 'ctrl+s',
    },
    [KeyboardShortcutAction.TOGGLE_SIDE_PANEL]: {
        action: KeyboardShortcutAction.TOGGLE_SIDE_PANEL,
        keyCombinationLabelMac: '⌘B',
        keyCombinationLabelWin: 'Ctrl+B',
        keyCombinationMac: 'meta+b',
        keyCombinationWin: 'ctrl+b',
    },
};

export interface KeyboardShortcutForOS {
    action: KeyboardShortcutAction;
    keyCombinationLabel: string;
    keyCombination: string;
}

const operatingSystem = getOperatingSystem();

export const keyboardShortcutsForOS: Record<
    KeyboardShortcutAction,
    KeyboardShortcutForOS
> = Object.keys(keyboardShortcuts).reduce(
    (acc, action) => {
        const keyboardShortcut =
            keyboardShortcuts[action as KeyboardShortcutAction];
        const keyCombinationLabel =
            operatingSystem === 'mac'
                ? keyboardShortcut.keyCombinationLabelMac
                : keyboardShortcut.keyCombinationLabelWin;
        const keyCombination =
            operatingSystem === 'mac'
                ? keyboardShortcut.keyCombinationMac
                : keyboardShortcut.keyCombinationWin;

        return {
            ...acc,
            [action]: {
                action: keyboardShortcut.action,
                keyCombinationLabel,
                keyCombination,
            },
        };
    },
    {} as Record<KeyboardShortcutAction, KeyboardShortcutForOS>
);
