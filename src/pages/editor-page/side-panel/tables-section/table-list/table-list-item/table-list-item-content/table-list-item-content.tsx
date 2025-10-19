import React, { useCallback } from 'react';
import { Plus, FileType2, FileKey2, MessageCircleMore } from 'lucide-react';
import { Button } from '@/components/button/button';
import {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
} from '@/components/accordion/accordion';
import { Separator } from '@/components/separator/separator';
import type { DBTable } from '@/lib/domain/db-table';
import type { DBField } from '@/lib/domain/db-field';
import { useChartDB } from '@/hooks/use-chartdb';
import { TableField } from './table-field/table-field';
import { TableIndex } from './table-index/table-index';
import type { DBIndex } from '@/lib/domain/db-index';
import { useTranslation } from 'react-i18next';
import { Textarea } from '@/components/textarea/textarea';
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
import { ColorPicker } from '@/components/color-picker/color-picker';

type AccordionItemValue = 'fields' | 'indexes';

export interface TableListItemContentProps {
    table: DBTable;
}

export const TableListItemContent: React.FC<TableListItemContentProps> = ({
    table,
}) => {
    const {
        updateField,
        removeField,
        createField,
        createIndex,
        removeIndex,
        updateIndex,
        updateTable,
        readonly,
        databaseType,
    } = useChartDB();
    const { t } = useTranslation();
    const { color } = table;
    const [selectedItems, setSelectedItems] = React.useState<
        AccordionItemValue[]
    >(['fields']);
    const sensors = useSensors(useSensor(PointerSensor));

    // Create a memoized version of the field updater that handles primary key logic
    const handleFieldUpdate = useCallback(
        (fieldId: string, attrs: Partial<DBField>) => {
            updateField(table.id, fieldId, attrs);

            // Handle the case when removing a primary key and only one remains
            if (attrs.primaryKey === false) {
                const remainingPrimaryKeys = table.fields.filter(
                    (f) => f.id !== fieldId && f.primaryKey
                );
                if (remainingPrimaryKeys.length === 1) {
                    // Set the remaining primary key field as unique
                    updateField(
                        table.id,
                        remainingPrimaryKeys[0].id,
                        {
                            unique: true,
                        },
                        { updateHistory: false }
                    );
                }
            }
        },
        [table.id, table.fields, updateField]
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (active?.id !== over?.id && !!over && !!active) {
            const items = table.fields;
            const oldIndex = items.findIndex((item) => item.id === active.id);
            const newIndex = items.findIndex((item) => item.id === over.id);

            updateTable(table.id, {
                fields: arrayMove(items, oldIndex, newIndex),
            });
        }
    };

    const createIndexHandler = useCallback(
        (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
            e.stopPropagation();
            setSelectedItems((prev) => {
                if (prev.includes('indexes')) {
                    return prev;
                }

                return [...prev, 'indexes'];
            });

            createIndex(table.id);
        },
        [createIndex, table.id, setSelectedItems]
    );

    const createFieldHandler = useCallback(
        (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
            e.stopPropagation();
            createField(table.id);
        },
        [createField, table.id]
    );

    return (
        <div
            className="flex flex-col gap-1 rounded-b-md border-l-[6px] px-1"
            style={{
                borderColor: color,
            }}
        >
            <Accordion
                type="multiple"
                className="w-full"
                value={selectedItems}
                onValueChange={(value) =>
                    setSelectedItems(value as AccordionItemValue[])
                }
            >
                <AccordionItem value="fields" className="mb-2 border-y-0">
                    <AccordionTrigger
                        iconPosition="right"
                        className="group flex flex-1 p-0 px-2 py-1 text-xs text-subtitle hover:bg-secondary"
                        asChild
                    >
                        <div className="flex flex-1 items-center justify-between">
                            <div className="flex flex-row items-center gap-1">
                                <FileType2 className="size-4" />
                                {t('side_panel.tables_section.table.fields')}
                            </div>
                            {!readonly ? (
                                <div className="flex flex-row-reverse">
                                    <div className="hidden flex-row-reverse group-hover:flex">
                                        <Button
                                            variant="ghost"
                                            className="size-4 p-0 text-xs hover:bg-primary-foreground"
                                            onClick={createFieldHandler}
                                        >
                                            <Plus className="size-4 shrink-0 text-muted-foreground transition-transform duration-200" />
                                        </Button>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="flex flex-col pb-0 pt-1">
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={table.fields}
                                strategy={verticalListSortingStrategy}
                            >
                                {table.fields.map((field) => (
                                    <TableField
                                        key={field.id}
                                        field={field}
                                        table={table}
                                        updateField={(attrs) =>
                                            handleFieldUpdate(field.id, attrs)
                                        }
                                        removeField={() =>
                                            removeField(table.id, field.id)
                                        }
                                        databaseType={databaseType}
                                        readonly={readonly}
                                    />
                                ))}
                            </SortableContext>
                            {!readonly ? (
                                <div className="flex justify-start p-1">
                                    <Button
                                        variant="ghost"
                                        className="flex h-7 items-center gap-1 px-2 text-xs"
                                        onClick={createFieldHandler}
                                    >
                                        <Plus className="size-4 text-muted-foreground" />
                                        {t(
                                            'side_panel.tables_section.table.add_field'
                                        )}
                                    </Button>
                                </div>
                            ) : null}
                        </DndContext>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="indexes" className="mb-2 border-y-0">
                    <AccordionTrigger
                        iconPosition="right"
                        className="group flex flex-1 p-0 px-2 py-1 text-xs text-subtitle hover:bg-secondary"
                        asChild
                    >
                        <div className="flex flex-1 items-center justify-between">
                            <div className="flex flex-row items-center gap-1">
                                <FileKey2 className="size-4" />
                                {t('side_panel.tables_section.table.indexes')}
                            </div>
                            {!readonly ? (
                                <div className="flex flex-row-reverse">
                                    <div className="hidden flex-row-reverse group-hover:flex">
                                        <Button
                                            variant="ghost"
                                            className="size-4 p-0 text-xs hover:bg-primary-foreground"
                                            onClick={createIndexHandler}
                                        >
                                            <Plus className="size-4 shrink-0 text-muted-foreground transition-transform duration-200" />
                                        </Button>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-0 pt-1">
                        {[...table.indexes]
                            .sort((a, b) => {
                                // Sort PK indexes first
                                if (a.isPrimaryKey && !b.isPrimaryKey)
                                    return -1;
                                if (!a.isPrimaryKey && b.isPrimaryKey) return 1;
                                return 0;
                            })
                            .map((index) => (
                                <TableIndex
                                    key={index.id}
                                    index={index}
                                    removeIndex={() =>
                                        removeIndex(table.id, index.id)
                                    }
                                    updateIndex={(attrs: Partial<DBIndex>) =>
                                        updateIndex(table.id, index.id, attrs)
                                    }
                                    fields={table.fields}
                                />
                            ))}

                        {!readonly ? (
                            <div className="flex justify-start p-1">
                                <Button
                                    variant="ghost"
                                    className="flex h-7 items-center gap-1 px-2 text-xs"
                                    onClick={createIndexHandler}
                                >
                                    <Plus className="size-4 text-muted-foreground" />
                                    {t(
                                        'side_panel.tables_section.table.add_index'
                                    )}
                                </Button>
                            </div>
                        ) : null}
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="comments" className="border-y-0">
                    <AccordionTrigger
                        iconPosition="right"
                        className="group flex flex-1 p-0 px-2 py-1 text-xs text-subtitle hover:bg-secondary"
                        asChild
                    >
                        <div className="flex flex-1 items-center justify-between">
                            <div className="flex flex-row items-center gap-1">
                                <MessageCircleMore className="size-4" />
                                {t('side_panel.tables_section.table.comments')}
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-0 pt-1">
                        <Textarea
                            value={table.comments ?? undefined}
                            onChange={(e) =>
                                updateTable(table.id, {
                                    comments: e.target.value,
                                })
                            }
                            placeholder={t(
                                'side_panel.tables_section.table.no_comments'
                            )}
                            className="w-full rounded-md bg-muted text-sm focus-visible:ring-0"
                            readOnly={readonly}
                        />
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
            {!readonly ? <Separator className="" /> : null}

            <div className="flex flex-1 items-center justify-between">
                {!table.isView && !readonly ? (
                    <ColorPicker
                        color={color}
                        onChange={(color) => updateTable(table.id, { color })}
                    />
                ) : (
                    <div />
                )}

                {!readonly ? (
                    <div className="flex gap-1">
                        <Button
                            variant="outline"
                            className="h-8 p-2 text-xs"
                            onClick={createIndexHandler}
                        >
                            <FileKey2 className="h-4" />
                            {t('side_panel.tables_section.table.add_index')}
                        </Button>
                        <Button
                            variant="outline"
                            className="h-8 p-2 text-xs"
                            onClick={createFieldHandler}
                        >
                            <FileType2 className="h-4" />
                            {t('side_panel.tables_section.table.add_field')}
                        </Button>
                    </div>
                ) : null}
            </div>
        </div>
    );
};
