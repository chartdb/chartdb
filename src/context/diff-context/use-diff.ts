import { useContext } from 'react';
import { diffContext } from './diff-context';

export const useDiff = () => {
    const context = useContext(diffContext);
    if (context === undefined) {
        throw new Error('useDiff must be used within an DiffProvider');
    }
    return context;
};
