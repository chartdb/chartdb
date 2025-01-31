import React, { forwardRef } from 'react';
import EmptyStateImage from '@/assets/empty_state.png';
import EmptyStateImageDark from '@/assets/empty_state_dark.png';
import { Label } from '@/components/label/label';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/use-theme';

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
    ) => {
        const { effectiveTheme } = useTheme();

        return (
            <div
                ref={ref}
                className={cn(
                    'flex flex-1 flex-col items-center justify-center space-y-1',
                    className
                )}
            >
                <img
                    src={
                        effectiveTheme === 'dark'
                            ? EmptyStateImageDark
                            : EmptyStateImage
                    }
                    alt="Empty state"
                    className={cn('mb-2 w-20', imageClassName)}
                />
                <Label className={cn('text-base', titleClassName)}>
                    {title}
                </Label>
                <Label
                    className={cn(
                        'text-sm font-normal text-muted-foreground',
                        descriptionClassName
                    )}
                >
                    {description}
                </Label>
            </div>
        );
    }
);

EmptyState.displayName = 'EmptyState';
