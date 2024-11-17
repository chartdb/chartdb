import { CaretSortIcon, CheckIcon, Cross2Icon } from '@radix-ui/react-icons';
import * as React from 'react';

import { cn } from '@/lib/utils';

import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/command/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/popover/popover';
import { ScrollArea } from '@/components/scroll-area/scroll-area';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

export interface SelectBoxOption {
    value: string;
    label: string;
    description?: string;
}

export interface SelectBoxProps {
    options: SelectBoxOption[];
    value?: string[] | string;
    onChange?: (values: string[] | string) => void;
    placeholder?: string;
    inputPlaceholder?: string;
    emptyPlaceholder?: string;
    className?: string;
    multiple?: boolean;
    oneLine?: boolean;
    selectAll?: boolean;
    deselectAll?: boolean;
    clearText?: string;
    showClear?: boolean;
    keepOrder?: boolean;
    disabled?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export const SelectBox = React.forwardRef<HTMLInputElement, SelectBoxProps>(
    (
        {
            inputPlaceholder,
            emptyPlaceholder,
            placeholder,
            className,
            options,
            value,
            onChange,
            multiple,
            oneLine,
            selectAll,
            deselectAll,
            clearText,
            showClear,
            keepOrder,
            disabled,
            open,
            onOpenChange: setOpen,
        },
        ref
    ) => {
        const [searchTerm, setSearchTerm] = React.useState<string>('');
        const [isOpen, setIsOpen] = React.useState(open ?? false);
        const { t } = useTranslation();

        useEffect(() => {
            setIsOpen(open ?? false);
        }, [open]);

        const onOpenChange = React.useCallback(
            (isOpen: boolean) => {
                setOpen?.(isOpen);
                setIsOpen(isOpen);
            },
            [setOpen]
        );

        const handleSelect = React.useCallback(
            (selectedValue: string) => {
                if (multiple) {
                    const newValue =
                        value?.includes(selectedValue) && Array.isArray(value)
                            ? value.filter((v) => v !== selectedValue)
                            : [...(value ?? []), selectedValue];
                    onChange?.(newValue);
                } else {
                    onChange?.(selectedValue);
                    setIsOpen(false);
                }
            },
            [multiple, onChange, value]
        );

        const handleClear = React.useCallback(() => {
            if (!multiple) return;

            onChange?.(multiple ? [] : '');
        }, [multiple, onChange]);

        const handleSelectAll = React.useCallback(() => {
            if (!multiple) return;
            const allIds = options.map((option) => option.value);
            onChange?.(allIds);
        }, [multiple, onChange, options]);

        const selectedMultipleOptions = React.useMemo(
            () =>
                options
                    .filter(
                        (option) =>
                            Array.isArray(value) && value.includes(option.value)
                    )
                    .sort((a, b) => {
                        if (keepOrder && Array.isArray(value)) {
                            return (
                                value.indexOf(a.value) - value.indexOf(b.value)
                            );
                        }
                        return 0;
                    })
                    .map((option) => (
                        <span
                            key={option.value}
                            className={`inline-flex min-w-0 shrink-0 items-center gap-1 rounded-md border py-0.5 pl-2 pr-1 text-xs font-medium text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${oneLine ? 'mx-0.5' : ''}`}
                        >
                            <span>{option.label}</span>
                            <span
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleSelect(option.value);
                                }}
                                className="flex items-center rounded-sm px-px text-muted-foreground/60 hover:bg-accent hover:text-muted-foreground"
                            >
                                <Cross2Icon />
                            </span>
                        </span>
                    )),
            [options, value, handleSelect, oneLine, keepOrder]
        );

        const isAllSelected = React.useMemo(
            () =>
                multiple &&
                Array.isArray(value) &&
                options.every((option) => value.includes(option.value)),
            [options, value, multiple]
        );

        const handleKeyDown = React.useCallback(
            (e: React.KeyboardEvent) => {
                if (!isOpen && e.code.toLowerCase() === 'space') {
                    e.preventDefault();
                    onOpenChange(true);
                }
            },
            [isOpen, onOpenChange]
        );

        return (
            <Popover open={isOpen} onOpenChange={onOpenChange} modal={true}>
                <PopoverTrigger asChild tabIndex={0} onKeyDown={handleKeyDown}>
                    <div
                        className={cn(
                            `flex min-h-[36px] cursor-pointer items-center justify-between rounded-md border px-3 py-1 data-[state=open]:border-ring ${disabled ? 'bg-muted pointer-events-none' : ''}`,
                            className
                        )}
                    >
                        <div
                            className={cn(
                                'items-center gap-1 overflow-hidden text-sm',
                                multiple
                                    ? 'flex flex-grow flex-wrap'
                                    : 'inline-flex whitespace-nowrap'
                            )}
                        >
                            {value && value.length > 0 ? (
                                multiple ? (
                                    oneLine ? (
                                        <div className="block w-full min-w-0 shrink-0 truncate">
                                            {selectedMultipleOptions}
                                        </div>
                                    ) : (
                                        selectedMultipleOptions
                                    )
                                ) : (
                                    <div className="block w-full min-w-0 shrink-0 truncate">
                                        {
                                            options.find(
                                                (opt) => opt.value === value
                                            )?.label
                                        }
                                    </div>
                                )
                            ) : (
                                <span className="mr-auto text-muted-foreground">
                                    {placeholder}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center self-stretch pl-1 text-muted-foreground/60 hover:text-foreground [&>div]:flex [&>div]:items-center [&>div]:self-stretch">
                            {value &&
                            value.length > 0 &&
                            multiple &&
                            showClear ? (
                                <div
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleClear();
                                    }}
                                >
                                    {clearText ? (
                                        <span className="text-xs">
                                            {clearText}
                                        </span>
                                    ) : (
                                        <Cross2Icon className="size-3.5" />
                                    )}
                                </div>
                            ) : (
                                <div>
                                    <CaretSortIcon className="size-4" />
                                </div>
                            )}
                        </div>
                    </div>
                </PopoverTrigger>
                <PopoverContent
                    className="w-fit min-w-[var(--radix-popover-trigger-width)] p-0"
                    align="center"
                >
                    <Command
                        filter={(value, search) =>
                            value.toLowerCase().includes(search.toLowerCase())
                                ? 1
                                : 0
                        }
                    >
                        <div className="relative">
                            <CommandInput
                                value={searchTerm}
                                onValueChange={(e) => setSearchTerm(e)}
                                ref={ref}
                                placeholder={inputPlaceholder ?? 'Search...'}
                                className="h-9"
                            />
                            {searchTerm && (
                                <div
                                    className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3 text-muted-foreground hover:text-foreground"
                                    onClick={() => setSearchTerm('')}
                                >
                                    <Cross2Icon className="size-4" />
                                </div>
                            )}
                            {!searchTerm &&
                                multiple &&
                                selectAll &&
                                !isAllSelected && (
                                    <div
                                        className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3 text-xs text-muted-foreground hover:text-foreground"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleSelectAll();
                                        }}
                                    >
                                        {t('select_all')}
                                    </div>
                                )}
                            {!searchTerm &&
                                multiple &&
                                deselectAll &&
                                isAllSelected && (
                                    <div
                                        className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3 text-xs text-muted-foreground hover:text-foreground"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleClear();
                                        }}
                                    >
                                        {t('deselect_all')}
                                    </div>
                                )}
                        </div>
                        <CommandEmpty>
                            {emptyPlaceholder ?? 'No results found.'}
                        </CommandEmpty>

                        <ScrollArea>
                            <div className="max-h-64 w-full">
                                <CommandGroup>
                                    <CommandList className="max-h-fit w-full">
                                        {options.map((option) => {
                                            const isSelected =
                                                Array.isArray(value) &&
                                                value.includes(option.value);
                                            return (
                                                <CommandItem
                                                    className="flex items-center"
                                                    key={option.value}
                                                    // value={option.value}
                                                    onSelect={() =>
                                                        handleSelect(
                                                            option.value
                                                        )
                                                    }
                                                >
                                                    {multiple && (
                                                        <div
                                                            className={cn(
                                                                'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                                                                isSelected
                                                                    ? 'bg-primary text-primary-foreground'
                                                                    : 'opacity-50 [&_svg]:invisible'
                                                            )}
                                                        >
                                                            <CheckIcon />
                                                        </div>
                                                    )}
                                                    <div className="flex items-center truncate">
                                                        <span>
                                                            {option.label}
                                                        </span>
                                                        {option.description && (
                                                            <span className="ml-1 text-xs text-muted-foreground">
                                                                {
                                                                    option.description
                                                                }
                                                            </span>
                                                        )}
                                                    </div>
                                                    {!multiple &&
                                                        option.value ===
                                                            value && (
                                                            <CheckIcon
                                                                className={cn(
                                                                    'ml-auto',
                                                                    option.value ===
                                                                        value
                                                                        ? 'opacity-100'
                                                                        : 'opacity-0'
                                                                )}
                                                            />
                                                        )}
                                                </CommandItem>
                                            );
                                        })}
                                    </CommandList>
                                </CommandGroup>
                            </div>
                        </ScrollArea>
                    </Command>
                </PopoverContent>
            </Popover>
        );
    }
);

SelectBox.displayName = 'SelectBox';
