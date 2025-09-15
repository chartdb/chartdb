import React, { useEffect } from 'react';
import { KeyRound, Trash2 } from 'lucide-react';
import { Input } from '@/components/input/input';
import { generateDBFieldSuffix, type DBField } from '@/lib/domain/db-field';
import type { DBTable } from '@/lib/domain';
import { useUpdateTableField } from '@/hooks/use-update-table-field';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/tooltip/tooltip';
import { useTranslation } from 'react-i18next';
import { SelectBox } from '@/components/select-box/select-box';
import { cn } from '@/lib/utils';
import { TableFieldToggle } from './table-field-toggle';

export interface TableEditModeFieldProps {
    table: DBTable;
    field: DBField;
    focused?: boolean;
}

export const TableEditModeField: React.FC<TableEditModeFieldProps> = React.memo(
    ({ table, field, focused = false }) => {
        const { t } = useTranslation();
        const [showHighlight, setShowHighlight] = React.useState(false);

        const {
            dataFieldOptions,
            handleDataTypeChange,
            handlePrimaryKeyToggle,
            handleNullableToggle,
            handleNameChange,
            generateFieldSuffix,
            fieldName,
            nullable,
            primaryKey,
            removeField,
        } = useUpdateTableField(table, field);

        const inputRef = React.useRef<HTMLInputElement>(null);

        // Animate the highlight after mount if focused
        useEffect(() => {
            if (focused) {
                const timer = setTimeout(() => {
                    setShowHighlight(true);
                    inputRef.current?.select();

                    setTimeout(() => {
                        setShowHighlight(false);
                    }, 2000);
                }, 200); // Small delay for the animation to be noticeable

                return () => clearTimeout(timer);
            } else {
                setShowHighlight(false);
            }
        }, [focused]);

        return (
            <div
                className={cn(
                    'flex flex-1 flex-row justify-between gap-2 p-1 transition-colors duration-1000 ease-out',
                    {
                        'bg-sky-100 dark:bg-sky-950': showHighlight,
                    }
                )}
            >
                <div className="flex flex-1 items-center justify-start gap-1 overflow-hidden">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span className="min-w-0 flex-1">
                                <Input
                                    ref={inputRef}
                                    className="h-8 w-full !truncate bg-background focus-visible:ring-0"
                                    type="text"
                                    placeholder={t(
                                        'side_panel.tables_section.table.field_name'
                                    )}
                                    value={fieldName}
                                    onChange={(e) =>
                                        handleNameChange(e.target.value)
                                    }
                                    autoFocus={focused}
                                />
                            </span>
                        </TooltipTrigger>
                        <TooltipContent>{fieldName}</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger
                            className="flex h-8 min-w-0 flex-1"
                            asChild
                        >
                            <span>
                                <SelectBox
                                    className="flex h-8 min-h-8 w-full bg-background"
                                    popoverClassName="min-w-[200px]"
                                    options={dataFieldOptions}
                                    placeholder={t(
                                        'side_panel.tables_section.table.field_type'
                                    )}
                                    value={field.type.id}
                                    valueSuffix={generateDBFieldSuffix(field)}
                                    optionSuffix={(option) =>
                                        generateFieldSuffix(option.value)
                                    }
                                    onChange={handleDataTypeChange}
                                    emptyPlaceholder={t(
                                        'side_panel.tables_section.table.no_types_found'
                                    )}
                                    commandOnClick={(e) => e.stopPropagation()}
                                    commandOnMouseDown={(e) =>
                                        e.stopPropagation()
                                    }
                                />
                            </span>
                        </TooltipTrigger>
                        <TooltipContent>
                            {field.type.name}
                            {field.characterMaximumLength
                                ? `(${field.characterMaximumLength})`
                                : ''}
                        </TooltipContent>
                    </Tooltip>
                </div>
                <div className="flex shrink-0 items-center justify-end gap-1">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span>
                                <TableFieldToggle
                                    pressed={nullable}
                                    onPressedChange={handleNullableToggle}
                                >
                                    N
                                </TableFieldToggle>
                            </span>
                        </TooltipTrigger>
                        <TooltipContent>
                            {t('side_panel.tables_section.table.nullable')}
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span>
                                <TableFieldToggle
                                    pressed={primaryKey}
                                    onPressedChange={handlePrimaryKeyToggle}
                                >
                                    <KeyRound className="h-3.5" />
                                </TableFieldToggle>
                            </span>
                        </TooltipTrigger>
                        <TooltipContent>
                            {t('side_panel.tables_section.table.primary_key')}
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span>
                                <TableFieldToggle onPressedChange={removeField}>
                                    <Trash2 className="h-3.5 text-red-700" />
                                </TableFieldToggle>
                            </span>
                        </TooltipTrigger>
                        <TooltipContent>
                            {t(
                                'side_panel.tables_section.table.field_actions.delete_field'
                            )}
                        </TooltipContent>
                    </Tooltip>
                </div>
            </div>
        );
    }
);

TableEditModeField.displayName = 'TableEditModeField';
