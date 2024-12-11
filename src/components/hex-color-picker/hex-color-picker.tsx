import React, { useState } from 'react';
import { HexColorPicker as HexColorPickerPrimitive } from 'react-colorful';
import { useDebounceFn } from 'ahooks';

export interface HexColorPickerProps {
    value?: string;
    onChange?: (color: string) => void;
}
const PREFIX = '#';
export const HexColorPicker = React.forwardRef<
    HTMLDivElement,
    HexColorPickerProps
>((props, ref) => {
    const { value: initialValue, onChange } = props;
    const [value, setValue] = useState(initialValue);
    const [inputValue, setInputValue] = useState(initialValue);

    const { run: debouncedChange } = useDebounceFn(
        (value) => {
            if (/^#([0-9a-f]{3}){1,2}$/i.test(value)) {
                onChange?.(value);
            }
        },
        {
            wait: 500,
        }
    );

    const handleChange = (color: string) => {
        setInputValue(color);
        setValue(color);
        debouncedChange(color);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        let color = newValue.toLowerCase().split('#').filter(Boolean).join('');
        color = PREFIX + color;
        if (!/^#[0-9a-f]*$/i.test(color)) {
            return;
        }
        color = color.slice(0, 7);
        setInputValue(color);
        setValue(color);
        debouncedChange(color);
    };

    return (
        <div ref={ref} className="flex flex-col gap-2">
            <HexColorPickerPrimitive color={value} onChange={handleChange} />
            <div className="flex rounded-md border border-input bg-transparent">
                <div className="flex flex-1 items-center justify-center px-2 ">
                    <span
                        aria-label={value}
                        className="relative flex size-5 items-center justify-center overflow-hidden rounded-full border border-input"
                    >
                        <span
                            className="absolute inset-0"
                            style={{
                                backgroundImage: `linear-gradient(to right, ${value}, ${value})`,
                            }}
                        />
                    </span>
                </div>
                <input
                    type="text"
                    placeholder=""
                    className="h-8 w-full border-none bg-transparent py-1 pl-0 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none"
                    autoComplete="off"
                    spellCheck={false}
                    value={inputValue}
                    onChange={handleInputChange}
                />
            </div>
        </div>
    );
});

HexColorPicker.displayName = 'HexColorPicker';
