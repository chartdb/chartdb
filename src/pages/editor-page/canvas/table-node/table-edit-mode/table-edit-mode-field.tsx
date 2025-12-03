import React, { useEffect } from 'react';
import { KeyRound, Trash2 } from 'lucide-react';
import { Input } from '@/components/input/input';
import { generateDBFieldSuffix, type DBField } from '@/lib/domain/db-field';
import type { DatabaseType, DBTable } from '@/lib/domain';
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
import { requiresNotNull } from '@/lib/data/data-types/data-types';

export interface TableEditModeFieldProps {
    table: DBTable;
    field: DBField;
    focused?: boolean;
    databaseType: DatabaseType;
}

export const TableEditModeField: React.FC<TableEditModeFieldProps> = React.memo(
    ({ table, field, focused = false, databaseType }) => {
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

        const typeRequiresNotNull = requiresNotNull(field.type.name);

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
                    <span className="relative min-w-0 flex-1">
                        <Tooltip>
                            <TooltipTrigger asChild>
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
                            </TooltipTrigger>
                            <TooltipContent>{fieldName}</TooltipContent>
                        </Tooltip>
                        {field.comments ? (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="absolute right-0 top-0 h-full w-[10px] cursor-pointer">
                                        <div className="pointer-events-none absolute right-0 top-0 size-0 border-l-[10px] border-t-[10px] border-l-transparent border-t-pink-500" />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <div>
                                        <div className="font-normal text-white/70 dark:text-black/70">
                                            Comment:
                                        </div>
                                        <div>{field.comments}</div>
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        ) : null}
                    </span>
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
                                    valueSuffix={generateDBFieldSuffix(field, {
                                        databaseType,
                                    })}
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
                            {generateDBFieldSuffix(field, {
                                databaseType,
                            })}
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
                                    disabled={typeRequiresNotNull}
                                >
                                    N
                                </TableFieldToggle>
                            </span>
                        </TooltipTrigger>
                        <TooltipContent>
                            {nullable ? 'Null' : 'Not Null'}
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
