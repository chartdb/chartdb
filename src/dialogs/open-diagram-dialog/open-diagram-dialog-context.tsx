import { createContext } from 'react';
import { emptyFn } from '@/lib/utils';

export interface OpenDiagramDialogContext {
    openOpenDiagramDialog: () => void;
    closeOpenDiagramDialog: () => void;
}

export const openDiagramDialogContext =
    createContext<OpenDiagramDialogContext>({
        openOpenDiagramDialog: emptyFn,
        closeOpenDiagramDialog: emptyFn,
    });
