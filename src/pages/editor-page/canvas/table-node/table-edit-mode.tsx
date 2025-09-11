import React, {
    useState,
    useCallback,
    useEffect,
    useRef,
    useMemo,
    memo,
} from 'react';
import { Button } from '@/components/button/button';
import { Input } from '@/components/input/input';
import { Plus, Trash2, X } from 'lucide-react';
import type { DBField } from '@/lib/domain/db-field';
import type { DBTable } from '@/lib/domain/db-table';
import { useChartDB } from '@/hooks/use-chartdb';
import { generateId } from '@/lib/utils';
import type { SelectBoxOption } from '@/components/select-box/select-box';
import { SelectBox } from '@/components/select-box/select-box';
import { generateDBFieldSuffix } from '@/lib/domain/db-field';
import { dataTypeDataToDataType } from '@/lib/data/data-types/data-types';
import type { DataTypeData } from '@/lib/data/data-types/data-types';
import { sortedDataTypeMap } from '@/lib/data/data-types/data-types';
import { DatabaseType } from '@/lib/domain/database-type';
import { Checkbox } from '@/components/checkbox/checkbox';
import { cn } from '@/lib/utils';
import './table-edit-mode.css';

interface TableEditModeProps {
    table: DBTable;
    color?: string;
    focusFieldId?: string;
    onClose: () => void;
}

interface FieldRowProps {
    field: DBField;
    dataTypeOptions: SelectBoxOption[];
    databaseType: DatabaseType;
    onTypeChange: (
        fieldId: string,
        value: string,
        regexMatches?: string[]
    ) => void;
    onNameChange: (
        fieldId: string,
        e: React.ChangeEvent<HTMLInputElement>
    ) => void;
    onPrimaryKeyChange: (fieldId: string, checked: boolean) => void;
    onRemove: (fieldId: string) => void;
    inputRef?: (el: HTMLInputElement | null) => void;
}

const FieldRow = memo<FieldRowProps>(
    ({
        field,
        dataTypeOptions,
        databaseType,
        onTypeChange,
        onNameChange,
        onPrimaryKeyChange,
        onRemove,
        inputRef,
    }) => {
        return (
            <div className="mb-2 grid grid-cols-[1fr,150px,60px,40px] items-center gap-3 rounded-md p-2 hover:bg-slate-50 dark:hover:bg-slate-800">
                <Input
                    ref={inputRef}
                    value={field.name}
                    onChange={(e) => onNameChange(field.id, e)}
                    className="h-9 text-sm font-medium"
                    placeholder="Field name"
                />

                <SelectBox
                    className="h-9 min-h-9 w-[150px] text-sm"
                    popoverClassName="min-w-[350px]"
                    options={dataTypeOptions}
                    value={field.type.id}
                    valueSuffix={generateDBFieldSuffix(field)}
                    optionSuffix={(option) =>
                        generateDBFieldSuffix(field, {
                            databaseType,
                            forceExtended: true,
                            typeId: option.value,
                        })
                    }
                    onChange={(value, regexMatches) =>
                        onTypeChange(
                            field.id,
                            value as string,
                            Array.isArray(regexMatches)
                                ? regexMatches
                                : undefined
                        )
                    }
                    placeholder="Select type"
                    emptyPlaceholder="No types found"
                />

                <div className="flex justify-center">
                    <Checkbox
                        checked={field.primaryKey || false}
                        onCheckedChange={(checked) =>
                            onPrimaryKeyChange(field.id, checked as boolean)
                        }
                        className="size-5"
                    />
                </div>

                <Button
                    variant="ghost"
                    size="sm"
                    className="size-8 p-0 hover:bg-red-100 dark:hover:bg-red-900"
                    onClick={() => onRemove(field.id)}
                >
                    <Trash2 className="size-4 text-red-600" />
                </Button>
            </div>
        );
    }
);

FieldRow.displayName = 'FieldRow';

// Helper function to generate field regex patterns
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

export const TableEditMode: React.FC<TableEditModeProps> = memo(
    ({ table, color, focusFieldId, onClose }) => {
        const { updateTable, databaseType, customTypes } = useChartDB();
        const [tableName, setTableName] = useState(() => table.name);
        const [localFields, setLocalFields] = useState<DBField[]>(() =>
            (table.fields || []).map((field) => ({
                ...field,
                primaryKey: field.primaryKey || false,
            }))
        );
        const [removedFieldIds, setRemovedFieldIds] = useState<string[]>(
            () => []
        );
        const [newlyCreatedFields, setNewlyCreatedFields] = useState<DBField[]>(
            () => []
        );
        const [newFieldId, setNewFieldId] = useState<string | null>(null);
        const containerRef = useRef<HTMLDivElement>(null);
        const scrollContainerRef = useRef<HTMLDivElement>(null);
        const tableNameInputRef = useRef<HTMLInputElement>(null);
        const fieldInputRefs = useRef<{
            [key: string]: HTMLInputElement | null;
        }>({});
        const hasInitialFocusedRef = useRef(false);

        // Use refs to get latest state values in callbacks
        const tableNameRef = useRef(tableName);
        const localFieldsRef = useRef(localFields);
        const removedFieldIdsRef = useRef(removedFieldIds);
        const newlyCreatedFieldsRef = useRef(newlyCreatedFields);

        useEffect(() => {
            tableNameRef.current = tableName;
        }, [tableName]);

        useEffect(() => {
            localFieldsRef.current = localFields;
        }, [localFields]);

        useEffect(() => {
            removedFieldIdsRef.current = removedFieldIds;
        }, [removedFieldIds]);

        useEffect(() => {
            newlyCreatedFieldsRef.current = newlyCreatedFields;
        }, [newlyCreatedFields]);

        const dataTypes = useMemo(
            () =>
                sortedDataTypeMap[databaseType] ||
                sortedDataTypeMap[DatabaseType.GENERIC],
            [databaseType]
        );

        // Generate options for SelectBox similar to side panel
        const dataTypeOptions = useMemo(() => {
            const standardTypes: SelectBoxOption[] = dataTypes.map((type) => {
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
                        type.kind === 'enum'
                            ? `${type.values?.join(' | ')}`
                            : '',
                    group: 'Custom Types',
                })
            );

            return [...standardTypes, ...customTypeOptions];
        }, [dataTypes, customTypes]);

        // Focus on specific field when opened from pencil click, or table name when double-clicked
        useEffect(() => {
            // Only perform initial focus once
            if (hasInitialFocusedRef.current) {
                return;
            }

            hasInitialFocusedRef.current = true;

            if (focusFieldId && scrollContainerRef.current) {
                // Find the field index to calculate scroll position
                const fieldIndex = localFields.findIndex(
                    (f) => f.id === focusFieldId
                );
                if (fieldIndex !== -1) {
                    // Scroll to the field (each field is approximately 56px height)
                    const scrollPosition = fieldIndex * 56;
                    scrollContainerRef.current.scrollTo({
                        top: scrollPosition,
                        behavior: 'smooth',
                    });

                    // Focus and select the field name after scroll
                    setTimeout(() => {
                        const input = fieldInputRefs.current[focusFieldId];
                        if (input) {
                            input.focus();
                            input.select();
                        }
                    }, 300);
                }
            } else if (!focusFieldId && tableNameInputRef.current) {
                // Only focus table name on initial mount when no specific field is targeted
                // This prevents focus jumping when typing in field names
                setTimeout(() => {
                    if (tableNameInputRef.current) {
                        tableNameInputRef.current.focus();
                        tableNameInputRef.current.select();
                    }
                }, 100);
            }
        }, [focusFieldId, localFields]);

        // Focus and select text when a new field is added
        useEffect(() => {
            if (newFieldId) {
                // Wait for the next render cycle and for the scroll to complete
                const focusTimer = setTimeout(() => {
                    const input = fieldInputRefs.current[newFieldId];
                    if (input) {
                        input.focus();
                        // Small delay to ensure focus is set before selecting
                        setTimeout(() => {
                            input.select();
                        }, 50);
                    }
                    setNewFieldId(null);
                }, 100);

                return () => clearTimeout(focusTimer);
            }
        }, [newFieldId]);

        // Save all changes when closing the edit mode
        const saveAllChanges = useCallback(() => {
            const currentTableName = tableNameRef.current;
            const currentLocalFields = localFieldsRef.current;
            const currentRemovedFieldIds = removedFieldIdsRef.current;
            const currentNewlyCreatedFields = newlyCreatedFieldsRef.current;

            // Always save to ensure field changes are persisted
            // Build the final fields array with all changes
            const finalFields: DBField[] = [];

            // Process all fields - both existing and new
            for (const field of currentLocalFields) {
                const isNewField = currentNewlyCreatedFields.some(
                    (f) => f.id === field.id
                );

                if (isNewField) {
                    // For new fields, replace temp ID with a proper ID
                    finalFields.push({
                        ...field,
                        id: generateId(), // Generate a proper ID for the new field
                        primaryKey: field.primaryKey || false,
                        createdAt: Date.now(),
                    });
                } else if (!currentRemovedFieldIds.includes(field.id)) {
                    // Existing field that wasn't removed - ensure all properties are included
                    finalFields.push({
                        ...field,
                        primaryKey: field.primaryKey || false,
                    });
                }
            }

            // Build the update object with all changes
            const tableUpdates: Partial<DBTable> = {
                fields: finalFields,
            };

            // Add name change if needed
            if (currentTableName.trim() && currentTableName !== table.name) {
                tableUpdates.name = currentTableName.trim();
            }

            // Make a single update call with all changes
            // Return the promise so we can handle it properly
            return updateTable(table.id, tableUpdates);
        }, [table, updateTable]);

        // Save on unmount if there are changes
        useEffect(() => {
            return () => {
                // Clean up refs
                fieldInputRefs.current = {};

                // Save any pending changes when component unmounts
                // This ensures changes are saved even if the component is unmounted quickly

                // Check if any existing fields have been modified
                const fieldsModified = localFieldsRef.current.some(
                    (localField) => {
                        const originalField = table.fields.find(
                            (f) => f.id === localField.id
                        );
                        if (!originalField) return false; // This is a new field

                        // Check if any properties have changed
                        return (
                            originalField.name !== localField.name ||
                            (originalField.primaryKey || false) !==
                                (localField.primaryKey || false) ||
                            originalField.type.id !== localField.type.id ||
                            originalField.nullable !== localField.nullable ||
                            originalField.unique !== localField.unique
                        );
                    }
                );

                const hasChanges =
                    tableNameRef.current !== table.name ||
                    localFieldsRef.current.length !== table.fields.length ||
                    removedFieldIdsRef.current.length > 0 ||
                    newlyCreatedFieldsRef.current.length > 0 ||
                    fieldsModified;

                if (hasChanges) {
                    // Use the refs directly since the component is unmounting
                    const finalFields: DBField[] = [];
                    for (const field of localFieldsRef.current) {
                        const isNewField = newlyCreatedFieldsRef.current.some(
                            (f) => f.id === field.id
                        );
                        if (isNewField) {
                            finalFields.push({
                                ...field,
                                id: generateId(),
                                primaryKey: field.primaryKey || false,
                                createdAt: Date.now(),
                            });
                        } else if (
                            !removedFieldIdsRef.current.includes(field.id)
                        ) {
                            finalFields.push({
                                ...field,
                                primaryKey: field.primaryKey || false,
                            });
                        }
                    }

                    const tableUpdates: Partial<DBTable> = {
                        fields: finalFields,
                    };

                    if (
                        tableNameRef.current.trim() &&
                        tableNameRef.current !== table.name
                    ) {
                        tableUpdates.name = tableNameRef.current.trim();
                    }

                    // Fire and forget - component is unmounting
                    updateTable(table.id, tableUpdates);
                }
            };
        }, [table, updateTable]);

        // Handle click outside - using both mousedown and click for better compatibility
        useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                // Check if click is inside the edit mode container
                if (
                    containerRef.current &&
                    !containerRef.current.contains(event.target as Node)
                ) {
                    // Check if the click is on a select dropdown portal element
                    const target = event.target as HTMLElement;
                    const isSelectPortal =
                        target.closest('[data-radix-select-viewport]') ||
                        target.closest('[role="listbox"]') ||
                        target.closest('[data-radix-popper-content-wrapper]') ||
                        target.closest('[data-state="open"]') ||
                        target.closest('[data-radix-select-content]');

                    // Don't close if clicking on select dropdown
                    if (isSelectPortal) {
                        return;
                    }

                    event.stopPropagation();
                    // Save and close - optimized approach
                    const savePromise = saveAllChanges();
                    onClose();
                    // Ensure save completes even after component unmounts
                    if (savePromise) {
                        savePromise.catch((error) => {
                            console.error(
                                'Failed to save table changes:',
                                error
                            );
                        });
                    }
                }
            };

            // Prevent wheel events from propagating to the canvas
            const handleWheel = (event: WheelEvent) => {
                if (
                    containerRef.current &&
                    containerRef.current.contains(event.target as Node)
                ) {
                    event.stopPropagation();
                }
            };

            // Add event listener after a very small delay to avoid immediate closing
            const timer = setTimeout(() => {
                // Only use mousedown to handle outside clicks
                // Using both mousedown and click can cause issues with dropdowns
                document.addEventListener(
                    'mousedown',
                    handleClickOutside,
                    true
                );
                document.addEventListener('wheel', handleWheel, {
                    passive: false,
                    capture: true,
                });
            }, 50);

            return () => {
                clearTimeout(timer);
                document.removeEventListener(
                    'mousedown',
                    handleClickOutside,
                    true
                );
                document.removeEventListener('wheel', handleWheel, true);
            };
        }, [onClose, saveAllChanges]);

        const handleTableNameChange = useCallback(
            (e: React.ChangeEvent<HTMLInputElement>) => {
                setTableName(e.target.value);
            },
            []
        );

        const handleFieldNameChange = useCallback(
            (fieldId: string, e: React.ChangeEvent<HTMLInputElement>) => {
                const newName = e.target.value;
                setLocalFields((prev) => {
                    const newFields = [...prev];
                    const index = newFields.findIndex((f) => f.id === fieldId);
                    if (index !== -1) {
                        newFields[index] = {
                            ...newFields[index],
                            name: newName,
                        };
                    }
                    return newFields;
                });
            },
            []
        );

        const handleFieldTypeChange = useCallback(
            (fieldId: string, typeId: string, regexMatches?: string[]) => {
                const field = localFields.find((f) => f.id === fieldId);
                if (!field) return;

                const dataType = dataTypes.find((v) => v.id === typeId) ?? {
                    id: typeId,
                    name: typeId,
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
                    // Preserve existing values if compatible
                    if (
                        dataType?.fieldAttributes?.hasCharMaxLength &&
                        field.characterMaximumLength
                    ) {
                        characterMaximumLength = field.characterMaximumLength;
                    }

                    if (
                        dataType?.fieldAttributes?.precision &&
                        field.precision
                    ) {
                        precision = field.precision;
                    }

                    if (dataType?.fieldAttributes?.scale && field.scale) {
                        scale = field.scale;
                    }
                }

                setLocalFields((prev) =>
                    prev.map((f) =>
                        f.id === fieldId
                            ? {
                                  ...f,
                                  type: dataTypeDataToDataType(dataType),
                                  characterMaximumLength,
                                  precision,
                                  scale,
                                  increment: undefined,
                                  default: undefined,
                              }
                            : f
                    )
                );
            },
            [dataTypes, localFields]
        );

        const handleFieldPrimaryKeyChange = useCallback(
            (fieldId: string, primaryKey: boolean) => {
                setLocalFields((prev) =>
                    prev.map((field) =>
                        field.id === fieldId
                            ? { ...field, primaryKey: primaryKey }
                            : field
                    )
                );
            },
            []
        );

        const handleAddField = useCallback(() => {
            // Create a temporary field locally without saving to database
            // Default to varchar(100) if available, otherwise use first type
            const varcharType = dataTypes.find(
                (dt) => dt.id === 'varchar' || dt.id === 'character_varying'
            );
            const defaultType = varcharType ||
                dataTypes[0] || { id: 'text', name: 'text' };

            const tempField: DBField = {
                id: `temp-${generateId()}`, // Temporary ID
                name: `field${localFields.length + 1}`,
                type: dataTypeDataToDataType(defaultType),
                characterMaximumLength: varcharType ? '100' : undefined,
                nullable: true,
                unique: false,
                primaryKey: false,
                createdAt: Date.now(),
            };

            setLocalFields((prev) => [...prev, tempField]);
            setNewlyCreatedFields((prev) => [...prev, tempField]);
            setNewFieldId(tempField.id);

            // Scroll to bottom after a minimal delay to ensure the new field is rendered
            requestAnimationFrame(() => {
                if (scrollContainerRef.current) {
                    scrollContainerRef.current.scrollTo({
                        top: scrollContainerRef.current.scrollHeight,
                        behavior: 'smooth',
                    });
                }
            });
        }, [localFields.length, dataTypes]);

        const handleRemoveField = useCallback(
            (fieldId: string) => {
                // Check if this field was created in this session
                const isNewField = newlyCreatedFields.some(
                    (f) => f.id === fieldId
                );

                if (isNewField) {
                    // Just remove from local state, it was never saved to database
                    setNewlyCreatedFields((prev) =>
                        prev.filter((f) => f.id !== fieldId)
                    );
                    setLocalFields((prev) =>
                        prev.filter((field) => field.id !== fieldId)
                    );
                } else {
                    // Mark existing field for removal on close
                    setRemovedFieldIds((prev) => [...prev, fieldId]);
                    setLocalFields((prev) =>
                        prev.filter((field) => field.id !== fieldId)
                    );
                }
            },
            [newlyCreatedFields]
        );

        // Calculate dynamic height based on number of fields
        // Max height is 80% of viewport or 600px, whichever is smaller
        const maxHeight = Math.min(window.innerHeight * 0.8, 600);
        const calculatedHeight = 240 + localFields.length * 56; // header + fields + button + padding
        const editModeHeight = Math.min(
            maxHeight,
            Math.max(320, calculatedHeight)
        );
        const isScrollable = calculatedHeight > maxHeight;

        return (
            <>
                {/* Invisible overlay to capture clicks in the canvas */}
                <div
                    className="fixed inset-[-9999px] z-40"
                    style={{ width: '99999px', height: '99999px' }}
                    onMouseDown={(e) => {
                        e.stopPropagation();
                        // Save and close
                        const savePromise = saveAllChanges();
                        onClose();
                        // Ensure save completes
                        if (savePromise) {
                            savePromise.catch((error) => {
                                console.error(
                                    'Failed to save table changes:',
                                    error
                                );
                            });
                        }
                    }}
                />
                <div
                    ref={containerRef}
                    // eslint-disable-next-line tailwindcss/no-custom-classname
                    className="nowheel nopan nodrag absolute z-50 flex min-w-[500px] flex-col rounded-lg border-2 border-blue-500 bg-white shadow-2xl dark:bg-slate-950"
                    style={{
                        left: '-50%',
                        right: '-50%',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        height: `${editModeHeight}px`,
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                    onPointerMove={(e) => e.stopPropagation()}
                    onWheel={(e) => e.stopPropagation()}
                >
                    {/* Color header bar */}
                    <div
                        className="h-2 rounded-t-[6px]"
                        style={{ backgroundColor: color || '#6b7280' }}
                    />
                    <div className="flex items-center justify-between border-b bg-slate-100 p-4 dark:bg-slate-900">
                        <Input
                            ref={tableNameInputRef}
                            value={tableName}
                            onChange={handleTableNameChange}
                            className="mr-3 h-10 flex-1 text-base font-bold"
                            placeholder="Table name"
                        />
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                // Save and close
                                const savePromise = saveAllChanges();
                                onClose();
                                // Ensure save completes
                                if (savePromise) {
                                    savePromise.catch((error) => {
                                        console.error(
                                            'Failed to save table changes:',
                                            error
                                        );
                                    });
                                }
                            }}
                            className="hover:bg-slate-200 dark:hover:bg-slate-800"
                        >
                            <X className="size-5" />
                        </Button>
                    </div>

                    <div className="relative flex flex-1 flex-col overflow-hidden">
                        <div className="p-4 pb-0">
                            {localFields.length > 0 && (
                                <div className="mb-3 grid grid-cols-[1fr,150px,60px,40px] gap-3 px-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    <div>Field Name</div>
                                    <div>Type</div>
                                    <div className="text-center">PK</div>
                                    <div></div>
                                </div>
                            )}
                        </div>

                        <div
                            ref={scrollContainerRef}
                            className={cn(
                                'flex-1 overflow-y-auto px-4 pr-3 custom-scrollbar relative nowheel',
                                isScrollable && 'pb-2'
                            )}
                            style={{
                                scrollbarGutter: 'stable',
                                overflowY:
                                    localFields.length > 0 ? 'auto' : 'hidden',
                            }}
                            onWheel={(e) => e.stopPropagation()}
                            onPointerMove={(e) => e.stopPropagation()}
                            onMouseMove={(e) => e.stopPropagation()}
                        >
                            {localFields.length > 0 ? (
                                <>
                                    {localFields.map((field) => (
                                        <FieldRow
                                            key={field.id}
                                            field={field}
                                            dataTypeOptions={dataTypeOptions}
                                            databaseType={databaseType}
                                            onNameChange={handleFieldNameChange}
                                            onTypeChange={handleFieldTypeChange}
                                            onPrimaryKeyChange={
                                                handleFieldPrimaryKeyChange
                                            }
                                            onRemove={handleRemoveField}
                                            inputRef={(el) => {
                                                if (el)
                                                    fieldInputRefs.current[
                                                        field.id
                                                    ] = el;
                                            }}
                                        />
                                    ))}
                                </>
                            ) : (
                                <div className="py-8 text-center text-base text-slate-500 dark:text-slate-400">
                                    No fields yet. Click "Add Field" to create
                                    one.
                                </div>
                            )}
                        </div>

                        {/* Fade overlay at bottom when scrollable */}
                        {isScrollable && localFields.length > 5 && (
                            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent dark:from-slate-950" />
                        )}

                        <div className="relative z-10 flex items-center justify-between gap-4 border-t bg-slate-50 p-4 dark:bg-slate-900">
                            <Button
                                variant="outline"
                                size="default"
                                className="h-11 max-w-[45%] flex-1 text-base"
                                onClick={handleAddField}
                            >
                                <Plus className="mr-2 size-5" />
                                Add Field
                            </Button>
                            <span className="mr-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                                {localFields.length}{' '}
                                {localFields.length === 1
                                    ? 'Column'
                                    : 'Columns'}
                            </span>
                        </div>
                    </div>
                </div>
            </>
        );
    }
);

TableEditMode.displayName = 'TableEditMode';
