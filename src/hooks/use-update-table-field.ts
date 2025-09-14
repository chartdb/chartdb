import { useCallback, useMemo, useState, useEffect } from 'react';
import { useChartDB } from './use-chartdb';
import { useDebounce } from './use-debounce-v2';
import type { DBField, DBTable } from '@/lib/domain';
import type {
    SelectBoxOption,
    SelectBoxProps,
} from '@/components/select-box/select-box';
import {
    dataTypeDataToDataType,
    sortedDataTypeMap,
} from '@/lib/data/data-types/data-types';
import { generateDBFieldSuffix } from '@/lib/domain/db-field';
import type { DataTypeData } from '@/lib/data/data-types/data-types';

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

export const useUpdateTableField = (
    table: DBTable,
    field: DBField,
    customUpdateField?: (attrs: Partial<DBField>) => void
) => {
    const {
        databaseType,
        customTypes,
        updateField: chartDBUpdateField,
        removeField: chartDBRemoveField,
    } = useChartDB();

    // Local state for responsive UI
    const [localFieldName, setLocalFieldName] = useState(field.name);
    const [localNullable, setLocalNullable] = useState(field.nullable);
    const [localPrimaryKey, setLocalPrimaryKey] = useState(field.primaryKey);

    // Update local state when field properties change externally
    useEffect(() => {
        setLocalFieldName(field.name);
        setLocalNullable(field.nullable);
        setLocalPrimaryKey(field.primaryKey);
    }, [field.name, field.nullable, field.primaryKey]);

    // Use custom updateField if provided, otherwise use the chartDB one
    const updateField = useMemo(
        () =>
            customUpdateField
                ? (
                      _tableId: string,
                      _fieldId: string,
                      attrs: Partial<DBField>
                  ) => customUpdateField(attrs)
                : chartDBUpdateField,
        [customUpdateField, chartDBUpdateField]
    );

    // Calculate primary key fields for validation
    const primaryKeyFields = useMemo(() => {
        return table.fields.filter((f) => f.primaryKey);
    }, [table.fields]);

    const primaryKeyCount = useMemo(
        () => primaryKeyFields.length,
        [primaryKeyFields.length]
    );

    // Generate data type options for select box
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

    // Handle data type change
    const handleDataTypeChange = useCallback<
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

            updateField(table.id, field.id, {
                characterMaximumLength,
                precision,
                scale,
                increment: undefined,
                default: undefined,
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
            field.id,
            table.id,
        ]
    );

    // Debounced update for field name
    const debouncedNameUpdate = useDebounce(
        useCallback(
            (value: string) => {
                if (value.trim() !== field.name) {
                    updateField(table.id, field.id, { name: value });
                }
            },
            [updateField, table.id, field.id, field.name]
        ),
        300 // 300ms debounce for text input
    );

    // Debounced update for nullable toggle
    const debouncedNullableUpdate = useDebounce(
        useCallback(
            (value: boolean) => {
                updateField(table.id, field.id, { nullable: value });
            },
            [updateField, table.id, field.id]
        ),
        100 // 100ms debounce for toggle
    );

    // Debounced update for primary key toggle
    const debouncedPrimaryKeyUpdate = useDebounce(
        useCallback(
            (value: boolean, primaryKeyCount: number) => {
                if (value) {
                    // When setting as primary key
                    const updates: Partial<DBField> = {
                        primaryKey: true,
                    };
                    // Only auto-set unique if this will be the only primary key
                    if (primaryKeyCount === 0) {
                        updates.unique = true;
                    }
                    updateField(table.id, field.id, updates);
                } else {
                    // When removing primary key
                    updateField(table.id, field.id, {
                        primaryKey: false,
                    });
                }
            },
            [updateField, table.id, field.id]
        ),
        100 // 100ms debounce for toggle
    );

    // Handle primary key toggle with optimistic update
    const handlePrimaryKeyToggle = useCallback(
        (value: boolean) => {
            setLocalPrimaryKey(value);
            debouncedPrimaryKeyUpdate(value, primaryKeyCount);
        },
        [primaryKeyCount, debouncedPrimaryKeyUpdate]
    );

    // Handle nullable toggle with optimistic update
    const handleNullableToggle = useCallback(
        (value: boolean) => {
            setLocalNullable(value);
            debouncedNullableUpdate(value);
        },
        [debouncedNullableUpdate]
    );

    // Handle name change with optimistic update
    const handleNameChange = useCallback(
        (value: string) => {
            setLocalFieldName(value);
            debouncedNameUpdate(value);
        },
        [debouncedNameUpdate]
    );

    // Utility function to generate field suffix for display
    const generateFieldSuffix = useCallback(
        (typeId?: string) => {
            return generateDBFieldSuffix(field, {
                databaseType,
                forceExtended: true,
                typeId,
            });
        },
        [field, databaseType]
    );

    const removeField = useCallback(() => {
        chartDBRemoveField(table.id, field.id);
    }, [chartDBRemoveField, table.id, field.id]);

    return {
        dataFieldOptions,
        handleDataTypeChange,
        handlePrimaryKeyToggle,
        handleNullableToggle,
        handleNameChange,
        generateFieldSuffix,
        primaryKeyCount,
        fieldName: localFieldName,
        nullable: localNullable,
        primaryKey: localPrimaryKey,
        removeField,
    };
};
