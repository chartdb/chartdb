import React, { useCallback } from 'react';
import { GripVertical, KeyRound } from 'lucide-react';
import { Input } from '@/components/input/input';
import type { DBField } from '@/lib/domain/db-field';
import { useChartDB } from '@/hooks/use-chartdb';
import {
    dataTypeDataToDataType,
    sortedDataTypeMap,
} from '@/lib/data/data-types/data-types';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/tooltip/tooltip';
import { useTranslation } from 'react-i18next';
import { TableFieldToggle } from './table-field-toggle';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type {
    SelectBoxOption,
    SelectBoxProps,
} from '@/components/select-box/select-box';
import { SelectBox } from '@/components/select-box/select-box';
import { TableFieldPopover } from './table-field-modal/table-field-modal';

export interface TableFieldProps {
    field: DBField;
    updateField: (attrs: Partial<DBField>) => void;
    removeField: () => void;
}

export const TableField: React.FC<TableFieldProps> = ({
    field,
    updateField,
    removeField,
}) => {
    const { databaseType } = useChartDB();
    const { t } = useTranslation();

    const { attributes, listeners, setNodeRef, transform, transition } =
        useSortable({ id: field.id });

    const dataFieldOptions: SelectBoxOption[] = sortedDataTypeMap[
        databaseType
    ].map((type) => ({
        label: type.name,
        value: type.id,
        regex: type.hasCharMaxLength ? `^${type.name}\\(\\d+\\)$` : undefined,
        extractRegex: type.hasCharMaxLength ? /\((\d+)\)/ : undefined,
    }));

    const onChangeDataType = useCallback<
        NonNullable<SelectBoxProps['onChange']>
    >(
        (value, regexMatches) => {
            const dataType = sortedDataTypeMap[databaseType].find(
                (v) => v.id === value
            ) ?? {
                id: value as string,
                name: value as string,
            };

            let characterMaximumLength: string | undefined = undefined;

            if (regexMatches?.length && dataType?.hasCharMaxLength) {
                characterMaximumLength = regexMatches[1];
            } else if (
                field.characterMaximumLength &&
                dataType?.hasCharMaxLength
            ) {
                characterMaximumLength = field.characterMaximumLength;
            }

            updateField({
                characterMaximumLength,
                type: dataTypeDataToDataType(
                    dataType ?? {
                        id: value as string,
                        name: value as string,
                    }
                ),
            });
        },
        [updateField, databaseType, field.characterMaximumLength]
    );

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
    };

    return (
        <div
            className="flex flex-1 touch-none flex-row justify-between p-1"
            ref={setNodeRef}
            style={style}
            {...attributes}
        >
            <div className="flex w-8/12 items-center justify-start gap-1 overflow-hidden">
                <div
                    className="flex w-4 shrink-0 cursor-move items-center justify-center"
                    {...listeners}
                >
                    <GripVertical className="size-3.5  text-muted-foreground" />
                </div>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span className="w-5/12">
                            <Input
                                className="h-8 w-full !truncate focus-visible:ring-0"
                                type="text"
                                placeholder={t(
                                    'side_panel.tables_section.table.field_name'
                                )}
                                value={field.name}
                                onChange={(e) =>
                                    updateField({
                                        name: e.target.value,
                                    })
                                }
                            />
                        </span>
                    </TooltipTrigger>
                    <TooltipContent>{field.name}</TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger className="flex h-8 !w-5/12" asChild>
                        <span>
                            <SelectBox
                                className="flex h-8 min-h-8 w-full"
                                options={dataFieldOptions}
                                placeholder={t(
                                    'side_panel.tables_section.table.field_type'
                                )}
                                value={field.type.id}
                                valueSuffix={
                                    field.characterMaximumLength
                                        ? `(${field.characterMaximumLength})`
                                        : ''
                                }
                                optionSuffix={(option) => {
                                    const type = sortedDataTypeMap[
                                        databaseType
                                    ].find((v) => v.id === option.value);

                                    if (!type) {
                                        return '';
                                    }

                                    if (type.hasCharMaxLength) {
                                        return `(${!field.characterMaximumLength ? 'n' : field.characterMaximumLength})`;
                                    }

                                    return '';
                                }}
                                onChange={onChangeDataType}
                                emptyPlaceholder={t(
                                    'side_panel.tables_section.table.no_types_found'
                                )}
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
            <div className="flex w-4/12 justify-end gap-1 overflow-hidden">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span>
                            <TableFieldToggle
                                pressed={field.nullable}
                                onPressedChange={(value) =>
                                    updateField({
                                        nullable: value,
                                    })
                                }
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
                                pressed={field.primaryKey}
                                onPressedChange={(value) =>
                                    updateField({
                                        unique: value,
                                        primaryKey: value,
                                    })
                                }
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
                    updateField={updateField}
                    removeField={removeField}
                />
            </div>
        </div>
    );
};
