import React from 'react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/popover/popover';
import { colorOptions } from '@/lib/colors';

export interface ColorPickerProps {
    color: string;
    onChange: (color: string) => void;
}

export const ColorPicker = React.forwardRef<
    React.ElementRef<typeof PopoverTrigger>,
    ColorPickerProps
>(({ color, onChange }, ref) => {
    return (
        <Popover>
            <PopoverTrigger asChild ref={ref}>
                <div
                    className="h-6 w-8 cursor-pointer rounded-md border-2 border-muted transition-shadow hover:shadow-md"
                    style={{
                        backgroundColor: color,
                    }}
                />
            </PopoverTrigger>
            <PopoverContent className="w-fit">
                <div className="grid grid-cols-4 gap-2">
                    {colorOptions.map((option) => (
                        <div
                            key={option}
                            className="size-8 cursor-pointer rounded-md border-2 border-muted transition-shadow hover:shadow-md"
                            style={{
                                backgroundColor: option,
                            }}
                            onClick={() => onChange(option)}
                        />
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    );
});

ColorPicker.displayName = 'ColorPicker';
