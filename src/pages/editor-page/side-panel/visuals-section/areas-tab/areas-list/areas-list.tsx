import React, { useCallback, useMemo } from 'react';
import { AreaListItem } from './area-list-item/area-list-item';
import type { Area } from '@/lib/domain/area';
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

export interface AreaListProps {
    areas: Area[];
}

export const AreaList: React.FC<AreaListProps> = ({ areas }) => {
    const { updateArea } = useChartDB();

    const { openedAreaInSidebar } = useLayout();
    const lastSelectedArea = React.useRef<string | null>(null);
    const refs = useMemo(
        () =>
            areas.reduce(
                (acc, area) => {
                    acc[area.id] = React.createRef();
                    return acc;
                },
                {} as Record<string, React.RefObject<HTMLDivElement>>
            ),
        [areas]
    );

    const scrollToArea = useCallback(
        (id: string) =>
            refs[id]?.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            }),
        [refs]
    );

    const sensors = useSensors(useSensor(PointerSensor));

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (active?.id !== over?.id && !!over && !!active) {
            const oldIndex = areas.findIndex((area) => area.id === active.id);
            const newIndex = areas.findIndex((area) => area.id === over.id);

            const newAreasOrder = arrayMove<Area>(areas, oldIndex, newIndex);

            newAreasOrder.forEach((area, index) => {
                updateArea(area.id, { order: index });
            });
        }
    };

    const handleScrollToArea = useCallback(() => {
        if (
            openedAreaInSidebar &&
            lastSelectedArea.current !== openedAreaInSidebar
        ) {
            lastSelectedArea.current = openedAreaInSidebar;
            scrollToArea(openedAreaInSidebar);
        }
    }, [scrollToArea, openedAreaInSidebar]);

    React.useEffect(() => {
        handleScrollToArea();
    }, [openedAreaInSidebar, handleScrollToArea]);

    return (
        <div className="flex w-full flex-col gap-1">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={areas}
                    strategy={verticalListSortingStrategy}
                >
                    {areas
                        .sort((area1: Area, area2: Area) => {
                            if (area1.order && area2.order === undefined) {
                                return -1;
                            }

                            if (area1.order === undefined && area2.order) {
                                return 1;
                            }

                            if (
                                area1.order !== undefined &&
                                area2.order !== undefined
                            ) {
                                return area1.order - area2.order;
                            }

                            // if both areas don't have order, sort by name
                            return area1.name.localeCompare(area2.name);
                        })
                        .map((area) => (
                            <AreaListItem
                                key={area.id}
                                area={area}
                                ref={refs[area.id]}
                            />
                        ))}
                </SortableContext>
            </DndContext>
        </div>
    );
};
