import React from 'react';
import { Button, ButtonProps } from '@/components/button/button';

export const ToolbarButton: React.FC<ButtonProps> = (props) => {
    return (
        <Button
            variant="ghost"
            className="w-[36px] p-2 hover:bg-primary-foreground"
            {...props}
        />
    );
};
