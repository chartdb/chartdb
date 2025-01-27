import React, { forwardRef } from 'react';
import EmptyStateImage from '@/assets/empty_state.png';
import { Label } from '@/components/label/label';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
    title: string;
    description: string;
    imageClassName?: string;
    titleClassName?: string;
    descriptionClassName?: string;
}

export const EmptyState = forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & EmptyStateProps
>(
    (
        {
            title,
            description,
            className,
            titleClassName,
            descriptionClassName,
            imageClassName,
        },
        ref
    ) => (
        <div
            ref={ref}
            className={cn(
                'flex flex-1 flex-col items-center justify-center space-y-1',
                className
            )}
        >
            <img
                src={EmptyStateImage}
                alt="Empty state"
                className={cn('mb-2 w-20', imageClassName)}
            />
            <Label className={cn('text-base', titleClassName)}>{title}</Label>
            <Label
                className={cn(
                    'text-sm font-normal text-muted-foreground',
                    descriptionClassName
                )}
            >
                {description}
            </Label>
        </div>
    )
);

EmptyState.displayName = 'EmptyState';
