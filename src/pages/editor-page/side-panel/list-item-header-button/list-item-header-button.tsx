import React from 'react';
import { Button, ButtonProps } from '@/components/button/button';

export const ListItemHeaderButton: React.FC<ButtonProps> = React.forwardRef<
    HTMLButtonElement,
    ButtonProps
>((props, ref) => {
    return (
        <Button
            ref={ref}
            variant="ghost"
            className="size-8 p-2 text-slate-500 hover:cursor-pointer hover:bg-primary-foreground hover:text-slate-700"
            asChild
            {...props}
        />
    );
});

ListItemHeaderButton.displayName = 'ListItemHeaderButton';
