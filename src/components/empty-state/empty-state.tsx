import React, { forwardRef } from 'react';
import EmptyStateImage from '@/assets/empty_state.png';
import EmptyStateImageDark from '@/assets/empty_state_dark.png';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/use-theme';
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '../empty/empty';

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
                <Empty>
                    <EmptyHeader>
                        <EmptyMedia variant="icon">
                            {/* <Group /> */}
                            <img
                                src={
                                    effectiveTheme === 'dark'
                                        ? EmptyStateImageDark
                                        : EmptyStateImage
                                }
                                alt="Empty state"
                                className={cn('p-2', imageClassName)}
                            />
                        </EmptyMedia>
                        <EmptyTitle className={titleClassName}>
                            {title}
                        </EmptyTitle>
                        <EmptyDescription className={descriptionClassName}>
                            {description}
                        </EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent />
                </Empty>
            </div>
        );
    }
);

EmptyState.displayName = 'EmptyState';
