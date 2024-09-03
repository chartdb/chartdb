import React from 'react';
import { Button, ButtonProps } from '@/components/button/button';

export const ToolbarButton = React.forwardRef<
    React.ElementRef<typeof Button>,
    ButtonProps
>((props, ref) => {
    return (
        <Button
            ref={ref}
            variant="ghost"
            className={'w-[36px] p-2 hover:bg-primary-foreground'}
            {...props}
        />
    );
});

ToolbarButton.displayName = Button.displayName;
