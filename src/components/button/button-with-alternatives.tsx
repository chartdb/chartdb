import React from 'react';
import { ChevronDownIcon } from '@radix-ui/react-icons';
import { Slot } from '@radix-ui/react-slot';
import { type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';
import { buttonVariants } from './button-variants';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/dropdown-menu/dropdown-menu';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/tooltip/tooltip';

export interface ButtonAlternative {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    icon?: React.ReactNode;
    className?: string;
    tooltip?: string;
}

export interface ButtonWithAlternativesProps
    extends
        React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    asChild?: boolean;
    alternatives: Array<ButtonAlternative>;
    dropdownTriggerClassName?: string;
    chevronDownIconClassName?: string;
}

const ButtonWithAlternatives = React.forwardRef<
    HTMLButtonElement,
    ButtonWithAlternativesProps
>(
    (
        {
            className,
            variant,
            size,
            asChild = false,
            alternatives,
            children,
            onClick,
            dropdownTriggerClassName,
            chevronDownIconClassName,
            ...props
        },
        ref
    ) => {
        const Comp = asChild ? Slot : 'button';
        const hasAlternatives = (alternatives?.length ?? 0) > 0;

        return (
            <div className="inline-flex items-stretch">
                <Comp
                    className={cn(
                        buttonVariants({ variant, size }),
                        { 'rounded-r-none': hasAlternatives },
                        className
                    )}
                    ref={ref}
                    onClick={onClick}
                    {...props}
                >
                    {children}
                </Comp>
                {hasAlternatives ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                className={cn(
                                    buttonVariants({ variant, size }),
                                    'rounded-l-none border-l border-l-primary/5 px-2 min-w-0',
                                    className?.includes('h-') &&
                                        className.match(/h-\d+/)?.[0],
                                    className?.includes('text-') &&
                                        className.match(/text-\w+/)?.[0],
                                    dropdownTriggerClassName
                                )}
                                type="button"
                            >
                                <ChevronDownIcon
                                    className={cn(
                                        'size-4 shrink-0',
                                        chevronDownIconClassName
                                    )}
                                />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {alternatives.map((alternative, index) => {
                                const menuItem = (
                                    <DropdownMenuItem
                                        key={index}
                                        onClick={alternative.onClick}
                                        disabled={alternative.disabled}
                                        className={cn(alternative.className)}
                                    >
                                        <span className="flex w-full items-center justify-between gap-2">
                                            {alternative.label}
                                            {alternative.icon}
                                        </span>
                                    </DropdownMenuItem>
                                );

                                if (alternative.tooltip) {
                                    return (
                                        <Tooltip key={index}>
                                            <TooltipTrigger asChild>
                                                {menuItem}
                                            </TooltipTrigger>
                                            <TooltipContent side="left">
                                                {alternative.tooltip}
                                            </TooltipContent>
                                        </Tooltip>
                                    );
                                }

                                return menuItem;
                            })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : null}
            </div>
        );
    }
);
ButtonWithAlternatives.displayName = 'ButtonWithAlternatives';

export { ButtonWithAlternatives };
