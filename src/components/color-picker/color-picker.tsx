import React, { useEffect, useMemo, useState } from 'react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/popover/popover';
import { Input } from '@/components/input/input';
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
    const [recentColors, setRecentColors] = useState<string[]>([]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            const stored = window.localStorage.getItem('chartdb.recentColors');
            if (!stored) return;
            const parsed = JSON.parse(stored) as string[];
            if (Array.isArray(parsed)) {
                setRecentColors(
                    parsed.filter(
                        (item) =>
                            typeof item === 'string' && item.startsWith('#')
                    )
                );
            }
        } catch {
            // Ignore malformed localStorage content.
        }
    }, []);

    const resolvedRgb = useMemo(() => {
        if (!color) return null;
        const trimmed = color.trim();
        if (!trimmed) return null;

        const hexMatch = trimmed.match(/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
        if (hexMatch) {
            const raw = hexMatch[1];
            const expanded =
                raw.length === 3
                    ? raw
                          .split('')
                          .map((char) => char + char)
                          .join('')
                    : raw;
            const r = parseInt(expanded.slice(0, 2), 16);
            const g = parseInt(expanded.slice(2, 4), 16);
            const b = parseInt(expanded.slice(4, 6), 16);
            if ([r, g, b].some((channel) => Number.isNaN(channel))) return null;
            return { r, g, b };
        }

        if (typeof document === 'undefined') return null;
        const probe = document.createElement('span');
        probe.style.position = 'absolute';
        probe.style.left = '-9999px';
        probe.style.color = trimmed;
        if (!probe.style.color) return null;
        const container = document.body ?? document.documentElement;
        container.appendChild(probe);
        const computed = getComputedStyle(probe).color;
        probe.remove();
        const parts = computed.match(/[\d.]+/g);
        if (!parts || parts.length < 3) return null;
        const [r, g, b] = parts.slice(0, 3).map((part) => Number(part));
        if ([r, g, b].some((channel) => Number.isNaN(channel))) return null;
        return { r, g, b };
    }, [color]);

    const resolvedHex = useMemo(() => {
        if (!resolvedRgb) return '';
        return `#${[resolvedRgb.r, resolvedRgb.g, resolvedRgb.b]
            .map((channel) => channel.toString(16).padStart(2, '0'))
            .join('')}`;
    }, [resolvedRgb]);

    const [hexValue, setHexValue] = useState(resolvedHex);
    const [rgbValues, setRgbValues] = useState(() => ({
        r: resolvedRgb ? String(resolvedRgb.r) : '',
        g: resolvedRgb ? String(resolvedRgb.g) : '',
        b: resolvedRgb ? String(resolvedRgb.b) : '',
    }));

    useEffect(() => {
        if (!resolvedHex) return;
        setHexValue(resolvedHex);
        setRgbValues({
            r: String(resolvedRgb?.r ?? ''),
            g: String(resolvedRgb?.g ?? ''),
            b: String(resolvedRgb?.b ?? ''),
        });
    }, [resolvedHex, resolvedRgb?.r, resolvedRgb?.g, resolvedRgb?.b]);

    const normalizeHex = (value: string) => {
        const trimmed = value.trim();
        const match = trimmed.match(/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
        if (!match) return null;
        const raw = match[1].toLowerCase();
        const expanded =
            raw.length === 3
                ? raw
                      .split('')
                      .map((char) => char + char)
                      .join('')
                : raw;
        return `#${expanded}`;
    };

    const clampChannel = (value: string) => {
        if (value === '') return null;
        const parsed = Number(value);
        if (!Number.isFinite(parsed)) return null;
        const rounded = Math.round(parsed);
        if (rounded < 0 || rounded > 255) return null;
        return rounded;
    };

    const applyColor = (nextColor: string) => {
        setRecentColors((prev) => {
            const next = [
                nextColor,
                ...prev.filter(
                    (item) => item.toLowerCase() !== nextColor.toLowerCase()
                ),
            ].slice(0, 8);
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(
                    'chartdb.recentColors',
                    JSON.stringify(next)
                );
            }
            return next;
        });
        onChange(nextColor);
    };

    const handleHexChange = (value: string) => {
        setHexValue(value);
        const normalized = normalizeHex(value);
        if (normalized) {
            applyColor(normalized);
        }
    };

    const handleRgbChange = (channel: 'r' | 'g' | 'b', value: string) => {
        setRgbValues((prev) => {
            const next = { ...prev, [channel]: value };
            const r = clampChannel(next.r);
            const g = clampChannel(next.g);
            const b = clampChannel(next.b);
            if (r !== null && g !== null && b !== null) {
                applyColor(
                    `#${[r, g, b]
                        .map((item) => item.toString(16).padStart(2, '0'))
                        .join('')}`
                );
            }
            return next;
        });
    };

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
                className="w-72"
                onMouseDown={popoverOnMouseDown}
                onClick={popoverOnClick}
            >
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                        <Input
                            aria-label="Color picker"
                            type="color"
                            value={resolvedHex || '#000000'}
                            onChange={(event) => applyColor(event.target.value)}
                            className="h-12 w-16 cursor-pointer p-1"
                        />
                        <div className="flex flex-1 flex-col gap-2">
                            <label className="text-xs font-medium text-muted-foreground">
                                Hex
                            </label>
                            <Input
                                value={hexValue}
                                onChange={(event) =>
                                    handleHexChange(event.target.value)
                                }
                                placeholder="#8eb7ff"
                                className="h-9"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex flex-1 flex-col gap-2">
                            <label className="text-xs font-medium text-muted-foreground">
                                RGB
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                <Input
                                    aria-label="Red channel"
                                    type="number"
                                    min={0}
                                    max={255}
                                    value={rgbValues.r}
                                    onChange={(event) =>
                                        handleRgbChange('r', event.target.value)
                                    }
                                    placeholder="R"
                                    className="h-9"
                                />
                                <Input
                                    aria-label="Green channel"
                                    type="number"
                                    min={0}
                                    max={255}
                                    value={rgbValues.g}
                                    onChange={(event) =>
                                        handleRgbChange('g', event.target.value)
                                    }
                                    placeholder="G"
                                    className="h-9"
                                />
                                <Input
                                    aria-label="Blue channel"
                                    type="number"
                                    min={0}
                                    max={255}
                                    value={rgbValues.b}
                                    onChange={(event) =>
                                        handleRgbChange('b', event.target.value)
                                    }
                                    placeholder="B"
                                    className="h-9"
                                />
                            </div>
                        </div>
                    </div>
                    {recentColors.length > 0 && (
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-medium text-muted-foreground">
                                Recent
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {recentColors.map((option) => (
                                    <button
                                        key={option}
                                        type="button"
                                        className="size-7 cursor-pointer rounded-md border-2 border-muted transition-shadow hover:shadow-md"
                                        style={{
                                            backgroundColor: option,
                                        }}
                                        onClick={() => applyColor(option)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
});

ColorPicker.displayName = 'ColorPicker';
