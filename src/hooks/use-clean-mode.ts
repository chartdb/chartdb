import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

export const useCleanMode = (): boolean => {
    const { search } = useLocation();

    return useMemo(() => {
        const params = new URLSearchParams(search);
        return params.get('clean') === 'true';
    }, [search]);
};
