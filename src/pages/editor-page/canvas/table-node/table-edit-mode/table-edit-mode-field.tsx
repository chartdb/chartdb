import React, { useEffect, useState } from 'react';
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
        const typeRef = React.useRef<HTMLSpanElement>(null);
        const [isNameTruncated, setIsNameTruncated] = useState(false);
        const [isTypeTruncated, setIsTypeTruncated] = useState(false);
        const [isCommentTooltipOpen, setIsCommentTooltipOpen] = useState(false);

        const typeRequiresNotNull = requiresNotNull(field.type.name);

        useEffect(() => {
            const checkTruncation = () => {
                if (inputRef.current) {
                    setIsNameTruncated(
                        inputRef.current.scrollWidth >
                            inputRef.current.clientWidth
                    );
                }
            };
            checkTruncation();
        }, [fieldName]);

        useEffect(() => {
            const checkTypeTruncation = () => {
                if (typeRef.current) {
                    const selectBoxValue =
                        typeRef.current.querySelector('.truncate');
                    if (selectBoxValue) {
                        setIsTypeTruncated(
                            selectBoxValue.scrollWidth >
                                selectBoxValue.clientWidth
                        );
                    }
                }
            };
            checkTypeTruncation();
        }, [field.type.id, field.characterMaximumLength]);

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
                    <Tooltip
                        open={
                            isNameTruncated && !isCommentTooltipOpen
                                ? undefined
                                : false
                        }
                    >
                        <TooltipTrigger asChild>
                            <span className="relative min-w-0 flex-1">
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
                                {field.comments ? (
                                    <Tooltip
                                        onOpenChange={setIsCommentTooltipOpen}
                                    >
                                        <TooltipTrigger asChild>
                                            <div className="absolute right-0 top-0 size-0 cursor-pointer border-l-[10px] border-t-[10px] border-l-transparent border-t-red-500" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            {field.comments}
                                        </TooltipContent>
                                    </Tooltip>
                                ) : null}
                            </span>
                        </TooltipTrigger>
                        <TooltipContent>{fieldName}</TooltipContent>
                    </Tooltip>
                    <Tooltip open={isTypeTruncated ? undefined : false}>
                        <TooltipTrigger
                            className="flex h-8 min-w-0 flex-1"
                            asChild
                        >
                            <span ref={typeRef}>
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
