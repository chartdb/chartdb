import { emptyFn } from '@/lib/utils';
import { createContext } from 'react';

export interface HistoryContext {
    undo: () => void;
    redo: () => void;
    hasUndo: boolean;
    hasRedo: boolean;
}

export const historyContext = createContext<HistoryContext>({
    undo: emptyFn,
    redo: emptyFn,
    hasUndo: false,
    hasRedo: false,
});
