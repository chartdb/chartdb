import React, { useState } from 'react';

interface ReorderableListProps<T> {
    items: T[];
    onReorder: (newOrder: T[]) => void;
    renderItem: (item: T, index: number, isDragging: boolean) => React.ReactNode;
}

export function ReorderableList<T>({ items, onReorder, renderItem }: ReorderableListProps<T>) {
    const [draggedItem, setDraggedItem] = useState<T | null>(null);

    const onDragStart = (index: number) => {
        setDraggedItem(items[index]);
    };

    const onDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        e.preventDefault();
        const draggedOverItem = items[index];

        if (draggedItem === draggedOverItem) {
            return;
        }

        const newItems = items.filter((item) => item !== draggedItem);
        newItems.splice(index, 0, draggedItem!);
        onReorder(newItems);
    };

    const onDragEnd = () => {
        setDraggedItem(null);
    };

    return (
        <div>
            {items.map((item, index) => (
                <div
                    key={index}
                    draggable
                    onDragStart={() => onDragStart(index)}
                    onDragOver={(e) => onDragOver(e, index)}
                    onDragEnd={onDragEnd}
                    className="cursor-move"
                >
                    {renderItem(item, index, item === draggedItem)}
                </div>
            ))}
        </div>
    );
}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                