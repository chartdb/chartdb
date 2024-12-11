import React from 'react';
import { Plus } from 'lucide-react';
import ColorPickerImage from '@/assets/color_picker.png';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/popover/popover';
import { HexColorPicker } from '@/components/hex-color-picker/hex-color-picker';
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
                    <Popover>
                        <PopoverTrigger asChild>
                            <div
                                className="flex size-8 cursor-pointer items-center justify-center rounded-md border-2 border-muted transition-shadow hover:shadow-md"
                                style={{
                                    backgroundImage: `url(${ColorPickerImage})`,
                                    backgroundSize: '100% 100%',
                                }}
                            >
                                <div className="rounded-full bg-white p-[2px] text-black">
                                    <Plus className="size-3" />
                                </div>
                            </div>
                        </PopoverTrigger>
                        <PopoverContent>
                            <HexColorPicker value={color} onChange={onChange} />
                        </PopoverContent>
                    </Popover>
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
