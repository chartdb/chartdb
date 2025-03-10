import React from 'react';
import type { ButtonProps } from '@/components/button/button';
import { Button } from '@/components/button/button';
import { cn } from '@/lib/utils';

export const ToolbarButton = React.forwardRef<
    React.ElementRef<typeof Button>,
    ButtonProps
>((props, ref) => {
    const { className, ...rest } = props;
    return (
        <Button
            ref={ref}
            variant="ghost"
            className={cn(
                'w-[36px] p-2 hover:bg-primary-foreground',
                className
            )}
            {...rest}
        />
    );
});

ToolbarButton.displayName = Button.displayName;
