import React from 'react';
import { Toggle } from '@/components/toggle/toggle';

export const TableFieldToggle = React.forwardRef<
    React.ElementRef<typeof Toggle>,
    React.ComponentPropsWithoutRef<typeof Toggle>
>((props, ref) => {
    return (
        <Toggle
            {...props}
            ref={ref}
            variant="default"
            className="h-8 w-[32px] p-2 text-xs text-slate-500 hover:bg-primary-foreground hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        />
    );
});

TableFieldToggle.displayName = Toggle.displayName;
