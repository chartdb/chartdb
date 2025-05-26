import { X, GripVertical } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/button/button';
import type { DBCustomTypeField } from '@/lib/domain/db-custom-type';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export interface CompositeFieldProps {
    field: DBCustomTypeField;
    onRemove: () => void;
}

export const CompositeField: React.FC<{
    field: DBCustomTypeField;
    onRemove: () => void;
}> = ({ field, onRemove }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: field.field });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center gap-2 rounded-md border p-2"
        >
            <div
                className="flex cursor-move items-center justify-center"
                {...attributes}
                {...listeners}
            >
                <GripVertical className="size-3 text-muted-foreground" />
            </div>
            <div className="flex-1 text-sm">{field.field}</div>
            <div className="text-xs text-muted-foreground">{field.type}</div>
            <Button
                variant="ghost"
                size="sm"
                className="size-6 p-0 text-muted-foreground hover:text-red-500"
                onClick={onRemove}
            >
                <X className="size-3" />
            </Button>
        </div>
    );
};
