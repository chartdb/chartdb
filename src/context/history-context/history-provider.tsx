import React, { useMemo } from 'react';
import { historyContext } from './history-context';
import { RedoUndoActionHandlers } from './redo-undo-action';
import { useChartDB } from '@/hooks/use-chartdb';
import { useRedoUndoStack } from '@/hooks/use-redo-undo-stack';

export const HistoryProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const { setRedoStack, setUndoStack, undoStack, redoStack } =
        useRedoUndoStack();
    console.log({ setRedoStack, setUndoStack, undoStack, redoStack });
    const { addTable, removeTable, updateTable } = useChartDB();

    const redoActionHandlers = useMemo(
        (): Partial<RedoUndoActionHandlers> => ({
            addTable: ({ table }) => {
                return addTable(table!);
            },
        }),
        [addTable]
    );

    const undoActionHandlers = useMemo(
        (): Partial<RedoUndoActionHandlers> => ({
            addTable: ({ tableId }) => {
                return removeTable(tableId!);
            },
            removeTable: ({ table }) => {
                return addTable(table!);
            },
            updateTable: ({ tableId, table }) => {
                return updateTable(tableId!, table!);
            },
        }),
        [addTable, removeTable, updateTable]
    );

    const undo = async () => {
        if (undoStack.length === 0) {
            return;
        }

        const action = undoStack[undoStack.length - 1];
        if (action) {
            const handler = undoActionHandlers[action.action];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await handler?.(action.data as any);
            setRedoStack([...redoStack, action]);
            setUndoStack(undoStack.slice(0, undoStack.length - 1));
        }
    };

    const redo = async () => {
        if (redoStack.length === 0) {
            return;
        }

        const action = redoStack[redoStack.length - 1];
        if (action) {
            const handler = redoActionHandlers[action.action];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await handler?.(action.data as any);
            setUndoStack([...undoStack, action]);
            setRedoStack(redoStack.slice(0, redoStack.length - 1));
        }
    };

    return (
        <historyContext.Provider value={{ undo, redo }}>
            {children}
        </historyContext.Provider>
    );
};
