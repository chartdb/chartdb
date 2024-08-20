import { emptyFn } from '@/lib/utils';
import { createContext } from 'react';

export interface HistoryContext {
    undo: () => void;
    redo: () => void;
}

export const historyContext = createContext<HistoryContext>({
    undo: emptyFn,
    redo: emptyFn,
});
