import React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/button/button';
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

export type ComboboxOptions = {
    value: string;
    label: string;
};

type Mode = 'single' | 'multiple';

interface ComboboxProps {
    mode?: Mode;
    options: ComboboxOptions[];
    selected: string | string[]; // Updated to handle multiple selections
    className?: string;
    placeholder?: string;
    onChange?: (event: string | string[]) => void; // Updated to handle multiple selections
    onCreate?: (value: string) => void;
    emptyText?: string;
    popoverClassName?: string;
    buttonClassName?: string;
}

export const Combobox = React.forwardRef<HTMLDivElement, ComboboxProps>(
    (
        {
            options,
            selected,
            className,
            placeholder,
            mode = 'single',
            emptyText,
            onChange,
            onCreate,
            popoverClassName,
            buttonClassName,
        },
        ref
    ) => {
        const [open, setOpen] = React.useState(false);
        const [query, setQuery] = React.useState<string>('');

        return (
            <div className={cn('block', className)} ref={ref}>
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            key={'combobox-trigger'}
                            type="button"
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className={cn(
                                'h-auto w-full justify-between',
                                buttonClassName
                            )}
                        >
                            {selected && selected.length > 0 ? (
                                <div className="relative mr-auto flex grow flex-wrap items-center overflow-hidden">
                                    <span className="truncate">
                                        {mode === 'multiple' &&
                                        Array.isArray(selected)
                                            ? selected
                                                  .map(
                                                      (selectedValue: string) =>
                                                          options.find(
                                                              (item) =>
                                                                  item.value ===
                                                                  selectedValue
                                                          )?.label
                                                  )
                                                  .join(', ')
                                            : mode === 'single' &&
                                              options.find(
                                                  (item) =>
                                                      item.value === selected
                                              )?.label}
                                    </span>
                                </div>
                            ) : (
                                <div className="font-normal	text-gray-500">
                                    {placeholder ?? 'Select Item...'}
                                </div>
                            )}
                            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent
                        className={cn('w-40 max-w-sm p-0', popoverClassName)}
                    >
                        <Command
                            filter={(value, search) => {
                                if (
                                    value
                                        .toLowerCase()
                                        .includes(search.toLowerCase())
                                )
                                    return 1;
                                return 0;
                            }}
                            // shouldFilter={true}
                        >
                            <CommandInput
                                placeholder={placeholder ?? 'Cari Item...'}
                                value={query}
                                onValueChange={(value: string) =>
                                    setQuery(value)
                                }
                            />
                            {onCreate ? (
                                <CommandEmpty
                                    onClick={() => {
                                        if (onCreate) {
                                            onCreate(query);
                                            setQuery('');
                                        }
                                    }}
                                    className="flex cursor-pointer items-center justify-center gap-1 italic"
                                >
                                    <p>Create: </p>
                                    <p className="block max-w-48 truncate font-semibold text-primary">
                                        {query}
                                    </p>
                                </CommandEmpty>
                            ) : (
                                <CommandEmpty>
                                    {emptyText ?? 'No option found.'}
                                </CommandEmpty>
                            )}

                            <ScrollArea>
                                <div className="max-h-80 w-full">
                                    <CommandGroup>
                                        <CommandList>
                                            {options.map((option) => (
                                                <CommandItem
                                                    key={option.label}
                                                    value={option.label}
                                                    onSelect={() => {
                                                        if (onChange) {
                                                            if (
                                                                mode ===
                                                                    'multiple' &&
                                                                Array.isArray(
                                                                    selected
                                                                )
                                                            ) {
                                                                onChange(
                                                                    selected.includes(
                                                                        option.value
                                                                    )
                                                                        ? selected.filter(
                                                                              (
                                                                                  item
                                                                              ) =>
                                                                                  item !==
                                                                                  option.value
                                                                          )
                                                                        : [
                                                                              ...selected,
                                                                              option.value,
                                                                          ]
                                                                );
                                                            } else {
                                                                onChange(
                                                                    option.value
                                                                );
                                                            }
                                                        }
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            'mr-2 h-4 w-4',
                                                            (mode ===
                                                                'multiple' &&
                                                                Array.isArray(
                                                                    selected
                                                                ) &&
                                                                selected.includes(
                                                                    option.value
                                                                )) ||
                                                                (mode ===
                                                                    'single' &&
                                                                    selected ===
                                                                        option.value)
                                                                ? 'opacity-100'
                                                                : 'opacity-0'
                                                        )}
                                                    />
                                                    {option.label}
                                                </CommandItem>
                                            ))}
                                        </CommandList>
                                    </CommandGroup>
                                </div>
                            </ScrollArea>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>
        );
    }
);

Combobox.displayName = 'Combobox';
