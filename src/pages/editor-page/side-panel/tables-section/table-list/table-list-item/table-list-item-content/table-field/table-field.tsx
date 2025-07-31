import React, { useCallback, useMemo } from 'react';
import { GripVertical, KeyRound } from 'lucide-react';
import { Input } from '@/components/input/input';
import { generateDBFieldSuffix, type DBField } from '@/lib/domain/db-field';
import { useChartDB } from '@/hooks/use-chartdb';
import type { DataTypeData } from '@/lib/data/data-types/data-types';
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
import type { DBTable } from '@/lib/domain';

export interface TableFieldProps {
    table: DBTable;
    field: DBField;
    updateField: (attrs: Partial<DBField>) => void;
    removeField: () => void;
}

const generateFieldRegexPatterns = (
    dataType: DataTypeData
): {
    regex?: string;
    extractRegex?: RegExp;
} => {
    if (!dataType.fieldAttributes) {
        return { regex: undefined, extractRegex: undefined };
    }

    const typeName = dataType.name;
    const fieldAttributes = dataType.fieldAttributes;

    if (fieldAttributes.hasCharMaxLength) {
        if (fieldAttributes.hasCharMaxLengthOption) {
            return {
                regex: `^${typeName}\\((\\d+|[mM][aA][xX])\\)$`,
                extractRegex: /\((\d+|max)\)/i,
            };
        }
        return {
            regex: `^${typeName}\\(\\d+\\)$`,
            extractRegex: /\((\d+)\)/,
        };
    }

    if (fieldAttributes.precision && fieldAttributes.scale) {
        return {
            regex: `^${typeName}\\s*\\(\\s*\\d+\\s*(?:,\\s*\\d+\\s*)?\\)$`,
            extractRegex: new RegExp(
                `${typeName}\\s*\\(\\s*(\\d+)\\s*(?:,\\s*(\\d+)\\s*)?\\)`
            ),
        };
    }

    if (fieldAttributes.precision) {
        return {
            regex: `^${typeName}\\s*\\(\\s*\\d+\\s*\\)$`,
            extractRegex: /\((\d+)\)/,
        };
    }

    return { regex: undefined, extractRegex: undefined };
};

export const TableField: React.FC<TableFieldProps> = ({
    table,
    field,
    updateField,
    removeField,
}) => {
    const { databaseType, customTypes } = useChartDB();
    const { t } = useTranslation();

    // Only calculate primary key fields, not just count
    const primaryKeyFields = useMemo(() => {
        return table.fields.filter((f) => f.primaryKey);
    }, [table.fields]);

    const primaryKeyCount = primaryKeyFields.length;

    const { attributes, listeners, setNodeRef, transform, transition } =
        useSortable({ id: field.id });

    const dataFieldOptions = useMemo(() => {
        const standardTypes: SelectBoxOption[] = sortedDataTypeMap[
            databaseType
        ].map((type) => {
            const regexPatterns = generateFieldRegexPatterns(type);

            return {
                label: type.name,
                value: type.id,
                regex: regexPatterns.regex,
                extractRegex: regexPatterns.extractRegex,
                group: customTypes?.length ? 'Standard Types' : undefined,
            };
        });

        if (!customTypes?.length) {
            return standardTypes;
        }

        // Add custom types as options
        const customTypeOptions: SelectBoxOption[] = customTypes.map(
            (type) => ({
                label: type.name,
                value: type.name,
                description:
                    type.kind === 'enum' ? `${type.values?.join(' | ')}` : '',
                group: 'Custom Types',
            })
        );

        return [...standardTypes, ...customTypeOptions];
    }, [databaseType, customTypes]);

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
            let precision: number | undefined = undefined;
            let scale: number | undefined = undefined;

            if (regexMatches?.length) {
                if (dataType?.fieldAttributes?.hasCharMaxLength) {
                    characterMaximumLength = regexMatches[1]?.toLowerCase();
                } else if (
                    dataType?.fieldAttributes?.precision &&
                    dataType?.fieldAttributes?.scale
                ) {
                    precision = parseInt(regexMatches[1]);
                    scale = regexMatches[2]
                        ? parseInt(regexMatches[2])
                        : undefined;
                } else if (dataType?.fieldAttributes?.precision) {
                    precision = parseInt(regexMatches[1]);
                }
            } else {
                if (
                    dataType?.fieldAttributes?.hasCharMaxLength &&
                    field.characterMaximumLength
                ) {
                    characterMaximumLength = field.characterMaximumLength;
                }

                if (dataType?.fieldAttributes?.precision && field.precision) {
                    precision = field.precision;
                }

                if (dataType?.fieldAttributes?.scale && field.scale) {
                    scale = field.scale;
                }
            }

            updateField({
                characterMaximumLength,
                precision,
                scale,
                type: dataTypeDataToDataType(
                    dataType ?? {
                        id: value as string,
                        name: value as string,
                    }
                ),
            });
        },
        [
            updateField,
            databaseType,
            field.characterMaximumLength,
            field.precision,
            field.scale,
        ]
    );

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
    };

    const handlePrimaryKeyToggle = useCallback(
        (value: boolean) => {
            if (value) {
                // When setting as primary key
                const updates: Partial<DBField> = {
                    primaryKey: true,
                };
                // Only auto-set unique if this will be the only primary key
                if (primaryKeyCount === 0) {
                    updates.unique = true;
                }
                updateField(updates);
            } else {
                // When removing primary key
                updateField({
                    primaryKey: false,
                });
            }
        },
        [primaryKeyCount, updateField]
    );

    const handleNullableToggle = useCallback(
        (value: boolean) => {
            updateField({ nullable: value });
        },
        [updateField]
    );

    const handleNameChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            updateField({ name: e.target.value });
        },
        [updateField]
    );

    return (
        <div
            className="flex flex-1 touch-none flex-row justify-between gap-2 p-1"
            ref={setNodeRef}
            style={style}
            {...attributes}
        >
            <div className="flex flex-1 items-center justify-start gap-1 overflow-hidden">
                <div
                    className="flex w-4 shrink-0 cursor-move items-center justify-center"
                    {...listeners}
                >
                    <GripVertical className="size-3.5  text-muted-foreground" />
                </div>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span className="min-w-0 flex-1">
                            <Input
                                className="h-8 w-full !truncate focus-visible:ring-0"
                                type="text"
                                placeholder={t(
                                    'side_panel.tables_section.table.field_name'
                                )}
                                value={field.name}
                                onChange={handleNameChange}
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
                                    generateDBFieldSuffix(field, {
                                        databaseType,
                                        forceExtended: true,
                                        typeId: option.value,
                                    })
                                }
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
            <div className="flex shrink-0 items-center justify-end gap-1">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span>
                            <TableFieldToggle
                                pressed={field.nullable}
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
                                pressed={field.primaryKey}
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
