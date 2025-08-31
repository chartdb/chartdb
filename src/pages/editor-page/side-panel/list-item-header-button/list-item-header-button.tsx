import React from 'react';
import type { ButtonProps } from '@/components/button/button';
import { Button } from '@/components/button/button';

export const ListItemHeaderButton: React.FC<ButtonProps> = React.forwardRef<
    HTMLButtonElement,
    ButtonProps
>((props, ref) => {
    return (
        <Button
            ref={ref}
            variant="ghost"
            className="size-8 p-2 text-slate-500 hover:cursor-pointer hover:bg-primary-foreground hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            asChild
            {...props}
        />
    );
});

ListItemHeaderButton.displayName = 'ListItemHeaderButton';
