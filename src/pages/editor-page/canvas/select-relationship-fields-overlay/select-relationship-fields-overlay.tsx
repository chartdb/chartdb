import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/button/button';
import { useChartDB } from '@/hooks/use-chartdb';
import type { SelectBoxOption } from '@/components/select-box/select-box';
import { SelectBox } from '@/components/select-box/select-box';
import { useReactFlow } from '@xyflow/react';
import { areFieldTypesCompatible } from '@/lib/data/data-types/data-types';
import { useLayout } from '@/hooks/use-layout';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateId } from '@/lib/utils';
import type { DBField } from '@/lib/domain/db-field';

export interface SelectRelationshipFieldsOverlayProps {
    sourceTableId: string;
    targetTableId: string;
    onClose: () => void;
}

export const SelectRelationshipFieldsOverlay: React.FC<
    SelectRelationshipFieldsOverlayProps
> = ({ sourceTableId, targetTableId, onClose }) => {
    const { getTable, createRelationship, databaseType, addField } =
        useChartDB();
    const { setEdges } = useReactFlow();
    const { openRelationshipFromSidebar } = useLayout();
    const [targetFieldId, setTargetFieldId] = useState<string | undefined>();
    const [errorMessage, setErrorMessage] = useState('');
    const [isVisible, setIsVisible] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [selectOpen, setSelectOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState<string>('');

    // Create a temporary edge to show the relationship line during field selection
    useEffect(() => {
        const tempEdgeId = 'temp-relationship-edge';

        // Use requestAnimationFrame for better timing
        const rafId = requestAnimationFrame(() => {
            setEdges((edges) => {
                // Remove any existing temp edge and any React Flow connection edges
                const filteredEdges = edges.filter(
                    (e) =>
                        e.id !== tempEdgeId && !e.id.includes('reactflow__edge')
                );

                return [
                    ...filteredEdges,
                    {
                        id: tempEdgeId,
                        source: sourceTableId,
                        target: targetTableId,
                        type: 'default',
                        style: {
                            stroke: '#3b82f6',
                            strokeWidth: 2,
                            strokeDasharray: '5 5',
                        },
                        animated: true,
                    },
                ];
            });
        });

        // Remove temporary edge when component unmounts
        return () => {
            cancelAnimationFrame(rafId);
            setEdges((edges) => edges.filter((e) => e.id !== tempEdgeId));
        };
    }, [sourceTableId, targetTableId]); // eslint-disable-line react-hooks/exhaustive-deps

    const sourceTable = useMemo(
        () => getTable(sourceTableId),
        [sourceTableId, getTable]
    );
    const targetTable = useMemo(
        () => getTable(targetTableId),
        [targetTableId, getTable]
    );

    // Get the PK field from source table
    const sourcePKField = useMemo(() => {
        if (!sourceTable) return null;
        return (
            sourceTable.fields.find((f) => f.primaryKey) ||
            sourceTable.fields[0]
        );
    }, [sourceTable]);

    // Get compatible target fields (FK columns)
    const targetFieldOptions = useMemo(() => {
        if (!targetTable || !sourcePKField) return [];

        const compatibleFields = targetTable.fields
            .filter((field) =>
                areFieldTypesCompatible(
                    sourcePKField.type,
                    field.type,
                    databaseType
                )
            )
            .map(
                (field) =>
                    ({
                        label: field.name,
                        value: field.id,
                        description: `(${field.type.name})`,
                    }) as SelectBoxOption
            );

        // Add option to create a new field if user typed a custom name
        if (
            searchTerm &&
            !compatibleFields.find(
                (f) => f.label.toLowerCase() === searchTerm.toLowerCase()
            )
        ) {
            compatibleFields.push({
                label: `Create "${searchTerm}"`,
                value: 'CREATE_NEW',
                description: `(${sourcePKField.type.name})`,
            });
        }

        return compatibleFields;
    }, [targetTable, sourcePKField, databaseType, searchTerm]);

    // Auto-select first compatible field OR pre-populate suggested name (only once on mount)
    useEffect(() => {
        if (targetFieldOptions.length > 0 && !targetFieldId) {
            setTargetFieldId(targetFieldOptions[0].value as string);
        } else if (
            targetFieldOptions.length === 0 &&
            !searchTerm &&
            sourceTable &&
            sourcePKField
        ) {
            // No compatible fields - suggest a field name based on source table + PK field
            const suggestedName =
                sourcePKField.name.toLowerCase() === 'id'
                    ? `${sourceTable.name}_${sourcePKField.name}`
                    : sourcePKField.name;
            setSearchTerm(suggestedName);
        }
    }, [targetFieldOptions.length, sourceTable, sourcePKField]); // eslint-disable-line react-hooks/exhaustive-deps

    // Auto-open the select immediately and trigger animation
    useEffect(() => {
        // Open select immediately
        setSelectOpen(true);

        // Trigger animation on next frame for smooth transition
        const rafId = requestAnimationFrame(() => {
            setIsVisible(true);
        });

        return () => cancelAnimationFrame(rafId);
    }, []);

    // Store the initial position permanently - calculate only once on mount
    const [fixedPosition] = useState(() => {
        // Always position at the same place in the viewport: left side, bottom area
        return {
            left: '20px',
            bottom: '80px',
            transform: 'translate(0, 0)',
        };
    });

    // Apply drag offset to the fixed position
    const position = useMemo(() => {
        if (dragOffset.x === 0 && dragOffset.y === 0) {
            return fixedPosition;
        }

        const leftValue = parseFloat(fixedPosition.left) + dragOffset.x;
        const bottomValue = parseFloat(fixedPosition.bottom) - dragOffset.y; // Subtract because bottom increases upward

        return {
            left: `${leftValue}px`,
            bottom: `${bottomValue}px`,
            transform: fixedPosition.transform,
        };
    }, [fixedPosition, dragOffset]);

    // Handle dragging
    const handleMouseDown = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            // Only start drag if clicking on the header
            const target = e.target as HTMLElement;
            if (!target.closest('[data-drag-handle]')) {
                return;
            }

            setIsDragging(true);
            e.preventDefault();
        },
        []
    );

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            setDragOffset((prev) => ({
                x: prev.x + e.movementX,
                y: prev.y + e.movementY,
            }));
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    const handleCreate = useCallback(async () => {
        if (!sourcePKField) return;

        try {
            let finalTargetFieldId = targetFieldId;

            // If user selected "CREATE_NEW", create the field first
            if (targetFieldId === 'CREATE_NEW' && searchTerm) {
                const newField: DBField = {
                    id: generateId(),
                    name: searchTerm,
                    type: sourcePKField.type,
                    unique: false,
                    nullable: true,
                    primaryKey: false,
                    createdAt: Date.now(),
                };

                await addField(targetTableId, newField);
                finalTargetFieldId = newField.id;
            }

            if (!finalTargetFieldId) return;

            const relationship = await createRelationship({
                sourceTableId,
                sourceFieldId: sourcePKField.id,
                targetTableId,
                targetFieldId: finalTargetFieldId,
            });

            setEdges((edges) =>
                edges.map((edge) =>
                    edge.id === relationship.id
                        ? { ...edge, selected: true }
                        : { ...edge, selected: false }
                )
            );

            openRelationshipFromSidebar(relationship.id);
            onClose();
        } catch (error) {
            console.error(error);
            setErrorMessage('Failed to create relationship');
        }
    }, [
        sourcePKField,
        targetFieldId,
        searchTerm,
        sourceTableId,
        targetTableId,
        createRelationship,
        addField,
        setEdges,
        openRelationshipFromSidebar,
        onClose,
    ]);

    // Handle ESC key to cancel
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    if (!sourceTable || !targetTable || !sourcePKField) {
        return null;
    }

    return (
        <div
            className={cn(
                'pointer-events-auto absolute flex cursor-auto flex-col rounded-lg border border-slate-300 bg-white shadow-xl transition-all duration-100 ease-out dark:border-slate-600 dark:bg-slate-800',
                {
                    'scale-100 opacity-100': isVisible,
                    'scale-95 opacity-0': !isVisible,
                }
            )}
            style={{
                left: position.left,
                bottom: position.bottom,
                transform: position.transform,
                minWidth: '380px',
                maxWidth: '420px',
                userSelect: isDragging ? 'none' : 'auto',
                zIndex: 1000, // Higher than React Flow's controls (z-10) and minimap (z-5)
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={handleMouseDown}
        >
            {/* Header - draggable */}
            <div
                data-drag-handle
                className={cn(
                    'flex items-center justify-between gap-2 rounded-t-lg border-b bg-blue-500 px-3 py-2 dark:border-slate-600 dark:bg-blue-600',
                    isDragging ? 'cursor-grabbing' : 'cursor-grab'
                )}
            >
                <div className="text-sm font-semibold text-white">
                    Create Relationship
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="size-6 p-0 text-white hover:bg-blue-600 dark:hover:bg-blue-700"
                    onClick={onClose}
                >
                    <X className="size-4" />
                </Button>
            </div>

            {/* Content */}
            <div className="nodrag flex flex-col gap-3 p-3">
                <div className="flex flex-row gap-2">
                    {/* PK Column (Source) */}
                    <div className="flex flex-1 flex-col gap-1.5">
                        <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                            From (PK)
                        </label>
                        <div className="flex h-9 items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 text-sm font-medium text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200">
                            {sourcePKField.name}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                            {sourceTable.name}
                        </div>
                    </div>

                    {/* Arrow indicator */}
                    <div className="flex items-center pt-5">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="size-4 text-blue-500 dark:text-blue-400"
                        >
                            <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </div>

                    {/* FK Column (Target) */}
                    <div className="flex flex-1 flex-col gap-1.5">
                        <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                            To (FK)
                        </label>
                        <SelectBox
                            className="flex h-9 w-full dark:border-slate-200"
                            popoverClassName="!z-[1001]" // Higher than the dialog's z-index
                            options={targetFieldOptions}
                            placeholder="Select field..."
                            inputPlaceholder="Search or Create..."
                            value={targetFieldId}
                            onChange={(value) => {
                                setTargetFieldId(value as string);
                            }}
                            emptyPlaceholder="No compatible fields"
                            onSearchChange={setSearchTerm}
                            open={selectOpen}
                            onOpenChange={setSelectOpen}
                        />
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                            {targetTable.name}
                        </div>
                    </div>
                </div>

                {errorMessage && (
                    <div className="rounded-md bg-red-50 p-2 text-xs text-red-600 dark:bg-red-900/20 dark:text-red-400">
                        {errorMessage}
                    </div>
                )}

                {targetFieldOptions.length === 0 && (
                    <div className="rounded-md bg-yellow-50 p-2 text-xs text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
                        No compatible fields found in target table
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 rounded-b-lg border-t border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-600 dark:bg-slate-900">
                <Button
                    disabled={!targetFieldId || targetFieldOptions.length === 0}
                    type="button"
                    onClick={handleCreate}
                    className="h-8 bg-blue-500 px-3 text-xs text-white hover:bg-blue-600 dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700"
                >
                    Create
                </Button>
            </div>
        </div>
    );
};
