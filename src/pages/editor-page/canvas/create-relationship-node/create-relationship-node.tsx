import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { NodeProps, Node } from '@xyflow/react';
import { Button } from '@/components/button/button';
import { useChartDB } from '@/hooks/use-chartdb';
import type { SelectBoxOption } from '@/components/select-box/select-box';
import { SelectBox } from '@/components/select-box/select-box';
import { areFieldTypesCompatible } from '@/lib/data/data-types/data-types';
import { useLayout } from '@/hooks/use-layout';
import { ArrowRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateId } from '@/lib/utils';
import type { DBField } from '@/lib/domain/db-field';
import { useReactFlow } from '@xyflow/react';
import { useCanvas } from '@/hooks/use-canvas';

export const CREATE_RELATIONSHIP_NODE_ID = '__create-relationship-node__';

const CREATE_NEW_FIELD_VALUE = 'CREATE_NEW';

export type CreateRelationshipNodeType = Node<
    {
        sourceTableId: string;
        targetTableId: string;
    },
    'create-relationship'
>;

export const CreateRelationshipNode: React.FC<
    NodeProps<CreateRelationshipNodeType>
> = React.memo(({ data }) => {
    const { sourceTableId, targetTableId } = data;
    const { getTable, createRelationship, databaseType, addField } =
        useChartDB();
    const { hideCreateRelationshipNode } = useCanvas();
    const { setEdges } = useReactFlow();
    const { openRelationshipFromSidebar } = useLayout();
    const [targetFieldId, setTargetFieldId] = useState<string | undefined>();
    const [errorMessage, setErrorMessage] = useState('');
    const [isVisible, setIsVisible] = useState(false);
    const [selectOpen, setSelectOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState<string>('');

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
    // Reset state when source or target table changes
    useEffect(() => {
        setTargetFieldId(undefined);
        setSearchTerm('');
        setErrorMessage('');
        setSelectOpen(true);
    }, [sourceTableId, targetTableId]);

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
                value: CREATE_NEW_FIELD_VALUE,
                description: `(${sourcePKField.type.name})`,
            });
        }

        return compatibleFields;
    }, [targetTable, sourcePKField, databaseType, searchTerm]);

    // Auto-select first compatible field OR pre-populate suggested name
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
    }, [
        targetFieldOptions.length,
        sourceTable,
        sourcePKField,
        searchTerm,
        targetFieldId,
        targetFieldOptions,
    ]);

    // Auto-open the select immediately and trigger animation
    useEffect(() => {
        setSelectOpen(true);
        const rafId = requestAnimationFrame(() => {
            setIsVisible(true);
        });
        return () => cancelAnimationFrame(rafId);
    }, []);

    const handleCreate = useCallback(async () => {
        if (!sourcePKField) return;

        try {
            let finalTargetFieldId = targetFieldId;

            // If user selected "CREATE_NEW", create the field first
            if (targetFieldId === CREATE_NEW_FIELD_VALUE && searchTerm) {
                const newField: DBField = {
                    id: generateId(),
                    name: searchTerm,
                    type: sourcePKField.type,
                    unique: false,
                    nullable: true,
                    primaryKey: false,
                    createdAt: Date.now(),
                };

                try {
                    await addField(targetTableId, newField);
                    finalTargetFieldId = newField.id;
                } catch (fieldError) {
                    console.error('Failed to create field:', fieldError);
                    setErrorMessage('Failed to create new field');
                    return;
                }
            }

            if (!finalTargetFieldId) {
                setErrorMessage('Please select a target field');
                return;
            }

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
            hideCreateRelationshipNode();
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
        hideCreateRelationshipNode,
    ]);

    // Note: Escape key handling is done in canvas.tsx to avoid duplicate listeners

    if (!sourceTable || !targetTable || !sourcePKField) {
        return null;
    }

    return (
        <div
            className={cn(
                'pointer-events-auto flex cursor-auto flex-col rounded-lg border border-slate-300 bg-white shadow-xl transition-all duration-150 ease-out dark:border-slate-600 dark:bg-slate-800',
                {
                    'scale-100 opacity-100': isVisible,
                    'scale-95 opacity-0': !isVisible,
                }
            )}
            style={{
                minWidth: '380px',
                maxWidth: '420px',
            }}
            onClick={(e) => e.stopPropagation()}
        >
            {/* Header - draggable */}
            <div className="flex cursor-move items-center justify-between gap-2 rounded-t-[7px] border-b bg-sky-600 px-3 py-1 dark:border-slate-600 dark:bg-sky-800">
                <div className="text-xs font-semibold text-white">
                    Create Relationship
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="size-6 p-0 text-white hover:bg-white/20 hover:text-white dark:hover:bg-white/10"
                    onClick={hideCreateRelationshipNode}
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
                        <div className="flex h-7 items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 text-sm font-medium text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200">
                            {sourcePKField.name}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                            {sourceTable.name}
                        </div>
                    </div>

                    {/* Arrow indicator */}
                    <div className="flex items-center">
                        <ArrowRight className="size-3.5 text-slate-400 dark:text-slate-500" />
                    </div>

                    {/* FK Column (Target) */}
                    <div className="flex flex-1 flex-col gap-1.5">
                        <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                            To (FK)
                        </label>
                        <SelectBox
                            className="flex h-7 min-h-0 w-full dark:border-slate-200"
                            popoverClassName="!z-[1001]"
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
            <div className="flex cursor-move items-center justify-end gap-2 rounded-b-lg border-t border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-600 dark:bg-slate-900">
                <Button
                    disabled={!targetFieldId || targetFieldOptions.length === 0}
                    type="button"
                    onClick={handleCreate}
                    variant="default"
                    className="h-7 bg-sky-600 px-3 text-xs text-white hover:bg-sky-700 dark:bg-sky-800 dark:text-white dark:hover:bg-sky-900"
                >
                    Create
                </Button>
            </div>
        </div>
    );
});

CreateRelationshipNode.displayName = 'CreateRelationshipNode';
