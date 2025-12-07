import React, { useRef } from 'react';
import { Trash2, ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/button/button';
import type { Cardinality } from '@/lib/domain/db-relationship';
import { cn } from '@/lib/utils';
import { useClickAway } from 'react-use';
import { useCanvas } from '@/hooks/use-canvas';

export interface EditRelationshipPopoverProps {
    anchorPosition: { x: number; y: number };
    sourceCardinality: Cardinality;
    targetCardinality: Cardinality;
    onCardinalityChange: (
        sourceCardinality: Cardinality,
        targetCardinality: Cardinality
    ) => void;
    onSwitch: () => void;
    onDelete: () => void;
}

type RelationshipTypeOption = {
    label: string;
    sourceCardinality: Cardinality;
    targetCardinality: Cardinality;
};

const relationshipTypes: RelationshipTypeOption[] = [
    { label: '1:1', sourceCardinality: 'one', targetCardinality: 'one' },
    { label: '1:N', sourceCardinality: 'one', targetCardinality: 'many' },
    { label: 'N:1', sourceCardinality: 'many', targetCardinality: 'one' },
];

export const EditRelationshipPopover: React.FC<
    EditRelationshipPopoverProps
> = ({
    anchorPosition,
    sourceCardinality,
    targetCardinality,
    onCardinalityChange,
    onSwitch,
    onDelete,
}) => {
    const popoverRef = useRef<HTMLDivElement>(null);
    const { closeRelationshipPopover } = useCanvas();

    useClickAway(popoverRef, closeRelationshipPopover);

    return (
        <div
            ref={popoverRef}
            className="fixed z-50 rounded-md border bg-popover p-2 text-popover-foreground shadow-md"
            style={{
                left: anchorPosition.x,
                top: anchorPosition.y + 10,
            }}
        >
            <div className="flex items-center gap-1">
                {relationshipTypes.map((type) => {
                    const isActive =
                        type.sourceCardinality === sourceCardinality &&
                        type.targetCardinality === targetCardinality;
                    return (
                        <Button
                            key={type.label}
                            variant={isActive ? 'default' : 'outline'}
                            size="sm"
                            className={cn(
                                'h-7 w-11 text-xs font-medium',
                                isActive &&
                                    'bg-slate-700 text-white hover:bg-slate-600'
                            )}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onCardinalityChange(
                                    type.sourceCardinality,
                                    type.targetCardinality
                                );
                            }}
                        >
                            {type.label}
                        </Button>
                    );
                })}
                <div className="mx-1 h-6 w-px bg-slate-300" />
                <Button
                    variant="ghost"
                    size="sm"
                    className="size-7 p-0 text-sky-600 hover:bg-sky-50 hover:text-sky-700"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onSwitch();
                    }}
                    title="Switch tables"
                >
                    <ArrowLeftRight className="!size-3.5" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className="size-7 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={onDelete}
                    title="Delete relationship"
                >
                    <Trash2 className="!size-3.5" />
                </Button>
            </div>
        </div>
    );
};
