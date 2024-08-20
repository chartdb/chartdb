import React from 'react';
import { createContext } from 'react';
import { RedoUndoAction } from './redo-undo-action';
import { emptyFn } from '@/lib/utils';

export interface RedoUndoStackContext {
    redoStack: RedoUndoAction[];
    undoStack: RedoUndoAction[];
    setRedoStack: React.Dispatch<React.SetStateAction<RedoUndoAction[]>>;
    setUndoStack: React.Dispatch<React.SetStateAction<RedoUndoAction[]>>;
}

export const redoUndoStackContext = createContext<RedoUndoStackContext>({
    redoStack: [],
    undoStack: [],
    setRedoStack: emptyFn,
    setUndoStack: emptyFn,
});
