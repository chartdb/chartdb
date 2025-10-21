import { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { useChartDB } from './use-chartdb';
import { useDebounce } from './use-debounce-v2';
import type { DatabaseType, DBField, DBTable } from '@/lib/domain';
import type {
    SelectBoxOption,
    SelectBoxProps,
} from '@/components/select-box/select-box';
import {
    dataTypeDataToDataType,
    sortedDataTypeMap,
    supportsArrayDataType,
    autoIncrementAlwaysOn,
    requiresNotNull,
} from '@/lib/data/data-types/data-types';
import { generateDBFieldSuffix } from '@/lib/domain/db-field';
import type { DataTypeData } from '@/lib/data/data-types/data-types';

const generateFieldRegexPatterns = (
    dataType: DataTypeData,
    databaseType: DatabaseType
): {
    regex?: string;
    extractRegex?: RegExp;
} => {
    const typeName = dataType.name;
    const supportsArrays = supportsArrayDataType(dataType.id, databaseType);
    const arrayPattern = supportsArrays ? '(\\[\\])?' : '';

    if (!dataType.fieldAttributes) {
        // For types without field attributes, support plain type + optional array notation
        return {
            regex: `^${typeName}${arrayPattern}$`,
            extractRegex: new RegExp(`^${typeName}${arrayPattern}$`),
        };
    }

    const fieldAttributes = dataType.fieldAttributes;

    if (fieldAttributes.hasCharMaxLength) {
        if (fieldAttributes.hasCharMaxLengthOption) {
            return {
                regex: `^${typeName}\\((\\d+|[mM][aA][xX])\\)${arrayPattern}$`,
                extractRegex: supportsArrays
                    ? /\((\d+|max)\)(\[\])?/i
                    : /\((\d+|max)\)/i,
            };
        }
        return {
            regex: `^${typeName}\\(\\d+\\)${arrayPattern}$`,
            extractRegex: supportsArrays ? /\((\d+)\)(\[\])?/ : /\((\d+)\)/,
        };
    }

    if (fieldAttributes.precision && fieldAttributes.scale) {
        return {
            regex: `^${typeName}\\s*\\(\\s*\\d+\\s*(?:,\\s*\\d+\\s*)?\\)${arrayPattern}$`,
            extractRegex: new RegExp(
                `${typeName}\\s*\\(\\s*(\\d+)\\s*(?:,\\s*(\\d+)\\s*)?\\)${arrayPattern}`
            ),
        };
    }

    if (fieldAttributes.precision) {
        return {
            regex: `^${typeName}\\s*\\(\\s*\\d+\\s*\\)${arrayPattern}$`,
            extractRegex: supportsArrays ? /\((\d+)\)(\[\])?/ : /\((\d+)\)/,
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

    const lastFieldNameRef = useRef<string>(field.name);

    useEffect(() => {
        if (localFieldName === lastFieldNameRef.current) {
            lastFieldNameRef.current = field.name;
            setLocalFieldName(field.name);
        }
    }, [field.name, localFieldName]);

    // Update local state when field properties change externally
    useEffect(() => {
        setLocalNullable(field.nullable);
        setLocalPrimaryKey(field.primaryKey);
    }, [field.nullable, field.primaryKey]);

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
            const regexPatterns = generateFieldRegexPatterns(
                type,
                databaseType
            );

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
            let isArray: boolean | undefined = undefined;

            if (regexMatches?.length) {
                // Check if the last captured group is the array indicator []
                const lastMatch = regexMatches[regexMatches.length - 1];
                const hasArrayIndicator = lastMatch === '[]';

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

                // Set isArray if the array indicator was found and the type supports arrays
                if (hasArrayIndicator) {
                    const typeId = value as string;
                    if (supportsArrayDataType(typeId, databaseType)) {
                        isArray = true;
                    }
                } else {
                    // Explicitly set to false/undefined if no array indicator
                    isArray = undefined;
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

            const newTypeName = dataType?.name ?? (value as string);
            const typeRequiresNotNull = requiresNotNull(newTypeName);
            const shouldForceIncrement = autoIncrementAlwaysOn(newTypeName);

            updateField(table.id, field.id, {
                characterMaximumLength,
                precision,
                scale,
                isArray,
                ...(typeRequiresNotNull ? { nullable: false } : {}),
                increment: shouldForceIncrement ? true : undefined,
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
                const updates: Partial<DBField> = { nullable: value };

                // If setting to nullable, clear increment (auto-increment requires NOT NULL)
                if (value && field.increment) {
                    updates.increment = undefined;
                }

                updateField(table.id, field.id, updates);
            },
            [updateField, table.id, field.id, field.increment]
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
            return generateDBFieldSuffix(
                {
                    ...field,
                    isArray: field.isArray && typeId === field.type.id,
                },
                {
                    databaseType,
                    forceExtended: true,
                    typeId,
                }
            );
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
