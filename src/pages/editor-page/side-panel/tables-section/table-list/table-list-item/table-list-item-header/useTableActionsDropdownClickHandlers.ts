import { useChartDB } from '@/hooks/use-chartdb';
import { useCallback } from 'react';

export function useTableActionsDropdownClickHandlers(tableId: string) {
    const { removeTable, createIndex, createField, duplicateTable } =
        useChartDB();

    const selectedMethods = {
        createField,
        createIndex,
        duplicateTable,
        removeTable,
    };

    return Object.fromEntries(
        Object.entries(selectedMethods).map(([methodName, method]) => [
            methodName,
            // eslint-disable-next-line react-hooks/rules-of-hooks
            useCallback(
                (event) => {
                    event.stopPropagation();
                    method(tableId);
                },
                // eslint-disable-next-line react-hooks/exhaustive-deps
                [tableId, method]
            ),
        ])
    ) as Record<
        keyof typeof selectedMethods,
        React.MouseEventHandler<HTMLElement>
    >;
}
