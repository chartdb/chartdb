import React from 'react';
import { RedoUndoAction } from './redo-undo-action';
import { redoUndoStackContext } from './redo-undo-stack-context';

export const RedoUndoStackProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const [undoStack, setUndoStack] = React.useState<RedoUndoAction[]>([]);
    const [redoStack, setRedoStack] = React.useState<RedoUndoAction[]>([]);

    return (
        <redoUndoStackContext.Provider
            value={{
                redoStack,
                undoStack,
                setRedoStack,
                setUndoStack,
            }}
        >
            {children}
        </redoUndoStackContext.Provider>
    );
};
