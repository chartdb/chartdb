import { createContext } from 'react';
import { emptyFn } from '@/lib/utils';

export interface DialogContext {
    openCreateDiagramDialog: () => void;
    closeCreateDiagramDialog: () => void;
}

export const dialogContext = createContext<DialogContext>({
    openCreateDiagramDialog: emptyFn,
    closeCreateDiagramDialog: emptyFn,
});
