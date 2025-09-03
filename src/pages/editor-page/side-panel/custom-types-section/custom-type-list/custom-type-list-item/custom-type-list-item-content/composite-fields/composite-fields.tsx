import { Plus, RectangleEllipsis } from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/input/input';
import { Button } from '@/components/button/button';
import type { DBCustomTypeField } from '@/lib/domain/db-custom-type';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectSeparator,
    SelectTrigger,
    SelectValue,
} from '@/components/select/select';
import { useChartDB } from '@/hooks/use-chartdb';
import type { DataTypeData } from '@/lib/data/data-types/data-types';
import { dataTypeMap } from '@/lib/data/data-types/data-types';
import type { DragEndEvent } from '@dnd-kit/core';
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CompositeField } from './composite-field';

export interface CustomTypeCompositeFieldsProps {
    fields: DBCustomTypeField[];
    addField: (value: DBCustomTypeField) => void;
    removeField: (value: DBCustomTypeField) => void;
    reorderFields: (fields: DBCustomTypeField[]) => void;
}

export const CustomTypeCompositeFields: React.FC<
    CustomTypeCompositeFieldsProps
> = ({ fields, addField, removeField, reorderFields }) => {
    const { t } = useTranslation();
    const { currentDiagram, customTypes, readonly } = useChartDB();
    const [newFieldName, setNewFieldName] = useState('');
    const [newFieldType, setNewFieldType] = useState('');

    const dataTypes = useMemo(
        () => dataTypeMap[currentDiagram.databaseType] || [],
        [currentDiagram.databaseType]
    );

    const customDataTypes = useMemo<DataTypeData[]>(
        () =>
            customTypes.map<DataTypeData>((type) => ({
                id: type.name,
                name: type.name,
            })),
        [customTypes]
    );

    const sensors = useSensors(useSensor(PointerSensor));

    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            const { active, over } = event;

            if (active?.id !== over?.id && !!over && !!active) {
                const oldIndex = fields.findIndex(
                    (field) => field.field === active.id
                );
                const newIndex = fields.findIndex(
                    (field) => field.field === over.id
                );

                if (oldIndex !== -1 && newIndex !== -1) {
                    const reorderedFields = arrayMove(
                        fields,
                        oldIndex,
                        newIndex
                    );
                    reorderFields(reorderedFields);
                }
            }
        },
        [fields, reorderFields]
    );

    const handleAddField = useCallback(() => {
        if (newFieldName.trim() && newFieldType.trim()) {
            // Check if field name already exists
            const fieldExists = fields.some(
                (field) => field.field === newFieldName.trim()
            );
            if (fieldExists) {
                return; // Don't add duplicate field names
            }

            addField({
                field: newFieldName.trim(),
                type: newFieldType.trim(),
            });
            setNewFieldName('');
            setNewFieldType('');
        }
    }, [newFieldName, newFieldType, addField, fields]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleAddField();
            }
        },
        [handleAddField]
    );

    const handleRemoveField = useCallback(
        (field: DBCustomTypeField) => {
            removeField(field);
        },
        [removeField]
    );

    return (
        <div className="flex flex-col gap-2 text-xs">
            <div className="flex flex-row items-center gap-1">
                <RectangleEllipsis className="size-4 text-subtitle" />
                <div className="font-bold text-subtitle">
                    {t(
                        'side_panel.custom_types_section.custom_type.composite_fields'
                    )}
                </div>
            </div>

            {fields.length === 0 ? (
                <div className="py-2 text-muted-foreground">
                    {t('side_panel.custom_types_section.custom_type.no_fields')}
                </div>
            ) : (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={fields.map((f) => f.field)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="flex flex-col gap-1">
                            {fields.map((field) => (
                                <CompositeField
                                    key={field.field}
                                    field={field}
                                    onRemove={() => handleRemoveField(field)}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            )}

            {!readonly ? (
                <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                        <Input
                            placeholder={t(
                                'side_panel.custom_types_section.custom_type.field_name_placeholder'
                            )}
                            value={newFieldName}
                            onChange={(e) => setNewFieldName(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="h-8 flex-1 text-xs"
                        />
                        <Select
                            value={newFieldType}
                            onValueChange={setNewFieldType}
                        >
                            <SelectTrigger className="h-8 w-32 text-xs">
                                <SelectValue
                                    placeholder={t(
                                        'side_panel.custom_types_section.custom_type.field_type_placeholder'
                                    )}
                                />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>Standard Types</SelectLabel>
                                    {dataTypes.map((dataType) => (
                                        <SelectItem
                                            key={dataType.id}
                                            value={dataType.name}
                                        >
                                            {dataType.name}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                                {customDataTypes.length > 0 ? (
                                    <>
                                        <SelectSeparator />
                                        <SelectGroup>
                                            <SelectLabel>
                                                Custom Types
                                            </SelectLabel>
                                            {customDataTypes.map((dataType) => (
                                                <SelectItem
                                                    key={dataType.id}
                                                    value={dataType.name}
                                                >
                                                    {dataType.name}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </>
                                ) : null}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 gap-1 self-start text-xs"
                        onClick={handleAddField}
                        disabled={!newFieldName.trim() || !newFieldType.trim()}
                    >
                        <Plus className="size-3" />
                        {t(
                            'side_panel.custom_types_section.custom_type.add_field'
                        )}
                    </Button>
                </div>
            ) : null}
        </div>
    );
};
