import { cn } from '@/lib/utils';
import React from 'react';

export interface AreaNodeStatusProps {
    status: 'new' | 'removed' | 'none';
}

export const AreaNodeStatus: React.FC<AreaNodeStatusProps> = ({ status }) => {
    if (status === 'none') {
        return null;
    }
    return (
        <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2">
            <span
                className={cn(
                    'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                    {
                        'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100':
                            status === 'new',
                        'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100':
                            status === 'removed',
                    }
                )}
            >
                {status === 'new' ? 'New' : 'Deleted'}
            </span>
        </div>
    );
};
