import React from 'react';
import { Toggle } from '@/components/toggle/toggle';
import { cn } from '@/lib/utils';

export const TableFieldToggle = React.forwardRef<
    React.ElementRef<typeof Toggle>,
    React.ComponentPropsWithoutRef<typeof Toggle>
>(({ className, ...props }, ref) => {
    return (
        <Toggle
            {...props}
            ref={ref}
            variant="default"
            className={cn(
                'h-8 w-[32px] p-2 text-xs text-slate-500 hover:bg-primary-foreground hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200',
                className
            )}
        />
    );
});

TableFieldToggle.displayName = Toggle.displayName;
