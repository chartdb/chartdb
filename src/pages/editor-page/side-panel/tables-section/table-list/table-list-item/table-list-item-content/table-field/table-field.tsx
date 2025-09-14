import React from 'react';
import { GripVertical, KeyRound } from 'lucide-react';
import { Input } from '@/components/input/input';
import { generateDBFieldSuffix, type DBField } from '@/lib/domain/db-field';
import { useChartDB } from '@/hooks/use-chartdb';
import { useUpdateTableField } from '@/hooks/use-update-table-field';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/tooltip/tooltip';
import { useTranslation } from 'react-i18next';
import { TableFieldToggle } from './table-field-toggle';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SelectBox } from '@/components/select-box/select-box';
import { TableFieldPopover } from './table-field-modal/table-field-modal';
import type { DBTable } from '@/lib/domain';

export interface TableFieldProps {
    table: DBTable;
    field: DBField;
    updateField: (attrs: Partial<DBField>) => void;
    removeField: () => void;
}

export const TableField: React.FC<TableFieldProps> = ({
    table,
    field,
    updateField,
    removeField,
}) => {
    const { databaseType, readonly } = useChartDB();
    const { t } = useTranslation();

    const { attributes, listeners, setNodeRef, transform, transition } =
        useSortable({ id: field.id });

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
    } = useUpdateTableField(table, field, updateField);

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
    };

    return (
        <div
            className="flex flex-1 touch-none flex-row justify-between gap-2 p-1"
            ref={setNodeRef}
            style={style}
            {...attributes}
        >
            <div className="flex flex-1 items-center justify-start gap-1 overflow-hidden">
                {!readonly ? (
                    <div
                        className="flex w-4 shrink-0 cursor-move items-center justify-center"
                        {...listeners}
                    >
                        <GripVertical className="size-3.5  text-muted-foreground" />
                    </div>
                ) : null}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span className="min-w-0 flex-1">
                            <Input
                                className="h-8 w-full !truncate focus-visible:ring-0"
                                type="text"
                                placeholder={t(
                                    'side_panel.tables_section.table.field_name'
                                )}
                                value={fieldName}
                                onChange={(e) =>
                                    handleNameChange(e.target.value)
                                }
                                readOnly={readonly}
                            />
                        </span>
                    </TooltipTrigger>
                    <TooltipContent>{field.name}</TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger className="flex h-8 min-w-0 flex-1" asChild>
                        <span>
                            <SelectBox
                                className="flex h-8 min-h-8 w-full"
                                popoverClassName="min-w-[350px]"
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
                                readonly={readonly}
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
                                disabled={readonly}
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
                                disabled={readonly}
                            >
                                <KeyRound className="h-3.5" />
                            </TableFieldToggle>
                        </span>
                    </TooltipTrigger>
                    <TooltipContent>
                        {t('side_panel.tables_section.table.primary_key')}
                    </TooltipContent>
                </Tooltip>
                <TableFieldPopover
                    field={field}
                    table={table}
                    updateField={updateField}
                    removeField={removeField}
                    databaseType={databaseType}
                />
            </div>
        </div>
    );
};
