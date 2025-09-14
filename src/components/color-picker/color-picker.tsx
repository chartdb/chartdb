import React from 'react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/popover/popover';
import { colorOptions } from '@/lib/colors';
import { cn } from '@/lib/utils';

export interface ColorPickerProps {
    color: string;
    onChange: (color: string) => void;
    disabled?: boolean;
    popoverOnMouseDown?: (e: React.MouseEvent) => void;
    popoverOnClick?: (e: React.MouseEvent) => void;
}

export const ColorPicker = React.forwardRef<
    React.ElementRef<typeof PopoverTrigger>,
    ColorPickerProps
>(({ color, onChange, disabled, popoverOnMouseDown, popoverOnClick }, ref) => {
    return (
        <Popover>
            <PopoverTrigger
                asChild
                ref={ref}
                disabled={disabled}
                {...(disabled ? { onClick: (e) => e.preventDefault() } : {})}
            >
                <div
                    className={cn(
                        'h-6 w-8 cursor-pointer rounded-md border-2 border-muted transition-shadow hover:shadow-md',
                        {
                            'hover:shadow-none cursor-default': disabled,
                        }
                    )}
                    style={{
                        backgroundColor: color,
                    }}
                />
            </PopoverTrigger>
            <PopoverContent
                className="w-fit"
                onMouseDown={popoverOnMouseDown}
                onClick={popoverOnClick}
            >
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
