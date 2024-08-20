import { redoUndoStackContext } from '@/context/history-context/redo-undo-stack-context';
import { useContext } from 'react';

export const useRedoUndoStack = () => useContext(redoUndoStackContext);
