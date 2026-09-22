import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

export const useCleanTableId = (): string | undefined => {
    const { search } = useLocation();

    return useMemo(() => {
        const params = new URLSearchParams(search);
        return params.get('tableId') ?? undefined;
    }, [search]);
};
