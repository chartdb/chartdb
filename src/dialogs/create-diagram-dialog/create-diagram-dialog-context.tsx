import { createContext } from 'react';
import { emptyFn } from '@/lib/utils';

export interface CreateDiagramDialogContext {
    openCreateDiagramDialog: () => void;
    closeCreateDiagramDialog: () => void;
}

export const createDiagramDialogContext =
    createContext<CreateDiagramDialogContext>({
        openCreateDiagramDialog: emptyFn,
        closeCreateDiagramDialog: emptyFn,
    });
