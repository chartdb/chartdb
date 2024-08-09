import React from 'react';
import { Button, ButtonProps } from '@/components/button/button';

export const ListItemHeaderButton: React.FC<ButtonProps> = (props) => {
    return (
        <Button
            variant="ghost"
            className="hover:bg-primary-foreground p-2 w-8 h-8 text-slate-500 hover:text-slate-700"
            {...props}
        />
    );
};
