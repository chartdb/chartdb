import React from 'react';
import { Skeleton } from '../skeleton/skeleton';
import { cn } from '@/lib/utils';

export interface TreeItemSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export const TreeItemSkeleton: React.FC<TreeItemSkeletonProps> = ({
    className,
    style,
}) => {
    return (
        <div className={cn('px-2 py-1', className)} style={style}>
            <Skeleton className="h-3.5 w-full rounded-sm" />
        </div>
    );
};
