import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/button/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/dialog/dialog';
import { useChartDB } from '@/hooks/use-chartdb';
import type { SelectBoxOption } from '@/components/select-box/select-box';
import { SelectBox } from '@/components/select-box/select-box';
import { useReactFlow } from '@xyflow/react';
import { areFieldTypesCompatible } from '@/lib/data/data-types/data-types';
import { useLayout } from '@/hooks/use-layout';

export interface SelectRelationshipFieldsDialogProps {
    open: boolean;
    sourceTableId: string;
    targetTableId: string;
    onClose: () => void;
}

export const SelectRelationshipFieldsDialog: React.FC<
    SelectRelationshipFieldsDialogProps
> = ({ open, sourceTableId, targetTableId, onClose }) => {
    const { getTable, createRelationship, databaseType } = useChartDB();
    const { fitView, setEdges } = useReactFlow();
    const { openRelationshipFromSidebar } = useLayout();
    const [targetFieldId, setTargetFieldId] = useState<string | undefined>();
    const [errorMessage, setErrorMessage] = useState('');

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

        return targetTable.fields
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
    }, [targetTable, sourcePKField, databaseType]);

    // Auto-select first compatible field
    useEffect(() => {
        if (open && targetFieldOptions.length > 0 && !targetFieldId) {
            setTargetFieldId(targetFieldOptions[0].value as string);
        }
    }, [open, targetFieldOptions, targetFieldId]);

    // Reset state when dialog closes
    useEffect(() => {
        if (!open) {
            setTargetFieldId(undefined);
            setErrorMessage('');
        }
    }, [open]);

    const handleCreate = useCallback(async () => {
        if (!sourcePKField || !targetFieldId) return;

        try {
            const relationship = await createRelationship({
                sourceTableId,
                sourceFieldId: sourcePKField.id,
                targetTableId,
                targetFieldId,
            });

            setEdges((edges) =>
                edges.map((edge) =>
                    edge.id === relationship.id
                        ? { ...edge, selected: true }
                        : { ...edge, selected: false }
                )
            );

            fitView({
                duration: 500,
                maxZoom: 1,
                minZoom: 1,
                nodes: [
                    { id: relationship.sourceTableId },
                    { id: relationship.targetTableId },
                ],
            });

            openRelationshipFromSidebar(relationship.id);
            onClose();
        } catch (error) {
            console.error(error);
            setErrorMessage('Failed to create relationship');
        }
    }, [
        sourcePKField,
        targetFieldId,
        sourceTableId,
        targetTableId,
        createRelationship,
        setEdges,
        fitView,
        openRelationshipFromSidebar,
        onClose,
    ]);

    if (!sourceTable || !targetTable || !sourcePKField) {
        return null;
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(isOpen) => !isOpen && onClose()}
            modal={false}
        >
            <DialogContent
                className="flex max-w-md flex-col overflow-y-auto"
                showClose
                forceOverlay
                onInteractOutside={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle>Select Relationship Fields</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4 pt-3">
                    <div className="flex flex-row justify-between gap-4">
                        {/* PK Column (Source) */}
                        <div className="flex flex-1 flex-col gap-2">
                            <div className="text-sm font-semibold">
                                PK Column
                            </div>
                            <div className="flex h-10 items-center rounded-md border border-slate-300 bg-slate-100 px-3 text-sm dark:border-slate-700 dark:bg-slate-800">
                                {sourcePKField.name}
                            </div>
                        </div>

                        {/* FK Column (Target) */}
                        <div className="flex flex-1 flex-col gap-2">
                            <div className="text-sm font-semibold">
                                FK Column
                            </div>
                            <SelectBox
                                className="flex h-10 w-full"
                                options={targetFieldOptions}
                                placeholder="Select field..."
                                value={targetFieldId}
                                onChange={(value) =>
                                    setTargetFieldId(value as string)
                                }
                                emptyPlaceholder="No compatible fields"
                            />
                        </div>
                    </div>

                    {errorMessage && (
                        <p className="text-sm text-red-700">{errorMessage}</p>
                    )}

                    {targetFieldOptions.length === 0 && (
                        <p className="text-sm text-yellow-700">
                            No compatible fields found in target table
                        </p>
                    )}
                </div>
                <DialogFooter className="flex !justify-between gap-2">
                    <DialogClose asChild>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                    </DialogClose>
                    <Button
                        disabled={
                            !targetFieldId || targetFieldOptions.length === 0
                        }
                        type="button"
                        onClick={handleCreate}
                    >
                        Create
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
