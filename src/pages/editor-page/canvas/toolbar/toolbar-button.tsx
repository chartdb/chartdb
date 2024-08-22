import React from 'react';
import { Button, ButtonProps } from '@/components/button/button';

export const ToolbarButton: React.FC<ButtonProps> = (props) => {
    return (
        <Button
            variant="ghost"
            className="hover:bg-primary-foreground p-2 w-[36px]"
            {...props}
        />
    );
};
