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
            className="hover:bg-primary-foreground p-2 w-8 h-8 text-slate-500 hover:text-slate-700"
            {...props}
        />
    );
});

ListItemHeaderButton.displayName = 'ListItemHeaderButton';
