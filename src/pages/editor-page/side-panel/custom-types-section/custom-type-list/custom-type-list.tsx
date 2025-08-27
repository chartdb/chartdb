import React, { useCallback, useMemo } from 'react';
import { Accordion } from '@/components/accordion/accordion';
import { useLayout } from '@/hooks/use-layout';
import {
    closestCenter,
    DndContext,
    type DragEndEvent,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useChartDB } from '@/hooks/use-chartdb.ts';
import type { DBCustomType } from '@/lib/domain/db-custom-type';
import { CustomTypeListItem } from './custom-type-list-item/custom-type-list-item';

export interface CustomTypeProps {
    customTypes: DBCustomType[];
}

export const CustomTypeList: React.FC<CustomTypeProps> = ({ customTypes }) => {
    const { updateCustomType } = useChartDB();

    const { openCustomTypeFromSidebar, openedCustomTypeInSidebar } =
        useLayout();
    const lastOpenedCustomType = React.useRef<string | null>(null);
    const refs = useMemo(
        () =>
            customTypes.reduce(
                (acc, customType) => {
                    acc[customType.id] = React.createRef();
                    return acc;
                },
                {} as Record<string, React.RefObject<HTMLDivElement>>
            ),
        [customTypes]
    );

    const scrollToCustomType = useCallback(
        (id: string) =>
            refs[id]?.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            }),
        [refs]
    );

    const sensors = useSensors(useSensor(PointerSensor));

    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            const { active, over } = event;

            if (active?.id !== over?.id && !!over && !!active) {
                const oldIndex = customTypes.findIndex(
                    (customType) => customType.id === active.id
                );
                const newIndex = customTypes.findIndex(
                    (customType) => customType.id === over.id
                );

                const newCustomTypesOrder = arrayMove<DBCustomType>(
                    customTypes,
                    oldIndex,
                    newIndex
                );

                newCustomTypesOrder.forEach((customType, index) => {
                    updateCustomType(customType.id, { order: index });
                });
            }
        },
        [customTypes, updateCustomType]
    );

    const handleScrollToCustomType = useCallback(() => {
        if (
            openedCustomTypeInSidebar &&
            lastOpenedCustomType.current !== openedCustomTypeInSidebar
        ) {
            lastOpenedCustomType.current = openedCustomTypeInSidebar;
            scrollToCustomType(openedCustomTypeInSidebar);
        }
    }, [scrollToCustomType, openedCustomTypeInSidebar]);

    return (
        <Accordion
            type="single"
            collapsible
            className="flex w-full flex-col gap-1"
            value={openedCustomTypeInSidebar}
            onValueChange={openCustomTypeFromSidebar}
            onAnimationEnd={handleScrollToCustomType}
        >
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={customTypes}
                    strategy={verticalListSortingStrategy}
                >
                    {customTypes
                        .sort(
                            (
                                customType1: DBCustomType,
                                customType2: DBCustomType
                            ) => {
                                // if one has order and the other doesn't, the one with order should come first
                                if (
                                    customType1.order &&
                                    customType2.order === undefined
                                ) {
                                    return -1;
                                }

                                if (
                                    customType1.order === undefined &&
                                    customType2.order
                                ) {
                                    return 1;
                                }

                                // if both have order, sort by order
                                if (
                                    customType1.order != null &&
                                    customType2.order != null
                                ) {
                                    return (
                                        customType1.order - customType2.order
                                    );
                                }

                                // sort by name
                                return customType1.name.localeCompare(
                                    customType2.name
                                );
                            }
                        )
                        .map((customType) => (
                            <CustomTypeListItem
                                key={customType.id}
                                customType={customType}
                                ref={refs[customType.id]}
                            />
                        ))}
                </SortableContext>
            </DndContext>
        </Accordion>
    );
};
