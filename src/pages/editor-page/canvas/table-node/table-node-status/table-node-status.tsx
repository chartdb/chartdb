import { cn } from '@/lib/utils';
import React from 'react';

export interface TableNodeStatusProps {
    status: 'new' | 'changed' | 'removed' | 'none';
}

export const TableNodeStatus: React.FC<TableNodeStatusProps> = ({ status }) => {
    if (status === 'none') {
        return null;
    }
    return (
        <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2">
            <span
                className={cn(
                    'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white',
                    {
                        'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100':
                            status === 'new',
                        'bg-sky-100 text-sky-800 dark:bg-sky-800 dark:text-sky-100':
                            status === 'changed',
                        'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100':
                            status === 'removed',
                    }
                )}
            >
                {status === 'new'
                    ? 'New'
                    : status === 'changed'
                      ? 'Modified'
                      : 'Deleted'}
            </span>
        </div>
    );
};
