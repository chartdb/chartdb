import React, { forwardRef, useMemo } from 'react';
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
import { Button } from '../button/button';

export interface EmptyStateActionButton {
    label: string;
    onClick?: () => void;
    icon?: React.ReactNode;
    disabled?: boolean;
}

export interface EmptyStateFooterAction {
    label: string;
    href?: string;
    onClick?: () => void;
    icon?: React.ReactNode;
    disabled?: boolean;
}

export interface EmptyStateProps {
    title: string;
    description: string;
    imageClassName?: string;
    titleClassName?: string;
    descriptionClassName?: string;
    primaryAction?: EmptyStateActionButton;
    secondaryAction?: EmptyStateActionButton;
    footerAction?: EmptyStateFooterAction;
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
            primaryAction,
            secondaryAction,
            footerAction,
        },
        ref
    ) => {
        const { effectiveTheme } = useTheme();

        // Determine if we have any actions to show
        const hasActions = useMemo(
            () => !!(primaryAction || secondaryAction),
            [primaryAction, secondaryAction]
        );
        const hasFooterAction = useMemo(() => !!footerAction, [footerAction]);

        const emptyStateImage = useMemo(
            () =>
                effectiveTheme === 'dark'
                    ? EmptyStateImageDark
                    : EmptyStateImage,
            [effectiveTheme]
        );

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
                                src={emptyStateImage}
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

                    {/* Action buttons section */}
                    {hasActions && (
                        <EmptyContent>
                            <div className="flex gap-2">
                                {primaryAction && (
                                    <Button
                                        onClick={primaryAction.onClick}
                                        disabled={primaryAction.disabled}
                                        className="h-8 font-normal"
                                    >
                                        {primaryAction.label}
                                        {primaryAction.icon}
                                    </Button>
                                )}
                                {secondaryAction && (
                                    <Button
                                        variant="outline"
                                        onClick={secondaryAction.onClick}
                                        disabled={secondaryAction.disabled}
                                        className="h-8 font-normal"
                                    >
                                        {secondaryAction.label}
                                        {secondaryAction.icon}
                                    </Button>
                                )}
                            </div>
                        </EmptyContent>
                    )}

                    {/* Footer action link */}
                    {hasFooterAction && footerAction && (
                        <Button
                            variant="link"
                            asChild={!!footerAction.href}
                            className="text-muted-foreground"
                            size="sm"
                            disabled={footerAction.disabled}
                            onClick={
                                !footerAction.href
                                    ? footerAction.onClick
                                    : undefined
                            }
                        >
                            {footerAction.href ? (
                                <a href={footerAction.href}>
                                    {footerAction.label}
                                    {footerAction.icon}
                                </a>
                            ) : (
                                <span>
                                    {footerAction.label}
                                    {footerAction.icon}
                                </span>
                            )}
                        </Button>
                    )}

                    {/* Render empty content if no actions */}
                    {!hasActions && !hasFooterAction && <EmptyContent />}
                </Empty>
            </div>
        );
    }
);

EmptyState.displayName = 'EmptyState';
