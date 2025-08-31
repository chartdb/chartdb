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
import { useDialog } from '@/hooks/use-dialog';
import { FileOutput, FileMinus2, FileType2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useChartDB } from '@/hooks/use-chartdb';
import type { SelectBoxOption } from '@/components/select-box/select-box';
import { SelectBox } from '@/components/select-box/select-box';
import { useLayout } from '@/hooks/use-layout';
import { useReactFlow } from '@xyflow/react';
import type { BaseDialogProps } from '../common/base-dialog-props';
import { areFieldTypesCompatible } from '@/lib/data/data-types/data-types';

const ErrorMessageRelationshipFieldsNotSameType =
    'Relationships can only be created between fields of the same type';

export interface CreateRelationshipDialogProps extends BaseDialogProps {
    sourceTableId?: string;
}

export const CreateRelationshipDialog: React.FC<
    CreateRelationshipDialogProps
> = ({ dialog, sourceTableId: preSelectedSourceTableId }) => {
    const { closeCreateRelationshipDialog } = useDialog();
    const [primaryTableId, setPrimaryTableId] = useState<string | undefined>(
        preSelectedSourceTableId
    );
    const [primaryFieldId, setPrimaryFieldId] = useState<string | undefined>();
    const [referencedTableId, setReferencedTableId] = useState<
        string | undefined
    >();
    const [referencedFieldId, setReferencedFieldId] = useState<
        string | undefined
    >();
    const [errorMessage, setErrorMessage] = useState('');
    const { t } = useTranslation();
    const { tables, getTable, createRelationship, getField } = useChartDB();
    const { openRelationshipFromSidebar } = useLayout();
    const [canCreateRelationship, setCanCreateRelationship] = useState(false);
    const { fitView, setEdges } = useReactFlow();
    const { databaseType } = useChartDB();
    const [primaryFieldSelectOpen, setPrimaryFieldSelectOpen] = useState(false);
    const [referencedTableSelectOpen, setReferencedTableSelectOpen] =
        useState(false);

    const tableOptions = useMemo(() => {
        return tables.map(
            (table) =>
                ({
                    label: table.name,
                    value: table.id,
                }) as SelectBoxOption
        );
    }, [tables]);

    const primaryFieldOptions = useMemo(() => {
        if (!primaryTableId) return [];
        const table = getTable(primaryTableId);
        if (!table) return [];
        return table.fields.map(
            (field) =>
                ({
                    label: field.name,
                    value: field.id,
                    description: `(${field.type.name})`,
                }) as SelectBoxOption
        );
    }, [primaryTableId, getTable]);

    const referencedFieldOptions = useMemo(() => {
        if (!referencedTableId) return [];
        const table = getTable(referencedTableId);
        if (!table) return [];
        return table.fields.map(
            (field) =>
                ({
                    label: field.name,
                    value: field.id,
                    description: `(${field.type.name})`,
                }) as SelectBoxOption
        );
    }, [referencedTableId, getTable]);

    useEffect(() => {
        if (!dialog.open) return;
        setPrimaryTableId(undefined);
        setPrimaryFieldId(undefined);
        setReferencedTableId(undefined);
        setReferencedFieldId(undefined);
        setErrorMessage('');
        setPrimaryFieldSelectOpen(false);
        setReferencedTableSelectOpen(false);
    }, [dialog.open]);

    useEffect(() => {
        if (preSelectedSourceTableId) {
            const table = getTable(preSelectedSourceTableId);
            if (table) {
                setPrimaryTableId(preSelectedSourceTableId);
            }

            setTimeout(() => {
                setPrimaryFieldSelectOpen(true);
            }, 100);
        }
    }, [preSelectedSourceTableId, getTable]);

    useEffect(() => {
        setCanCreateRelationship(false);
        setErrorMessage('');
        if (
            !primaryTableId ||
            !primaryFieldId ||
            !referencedTableId ||
            !referencedFieldId
        ) {
            return;
        }

        const primaryField = getField(primaryTableId, primaryFieldId);
        const referencedField = getField(referencedTableId, referencedFieldId);

        if (!primaryField || !referencedField) {
            return;
        }

        if (
            !areFieldTypesCompatible(
                primaryField.type,
                referencedField.type,
                databaseType
            )
        ) {
            setErrorMessage(ErrorMessageRelationshipFieldsNotSameType);
            return;
        }

        setCanCreateRelationship(true);
    }, [
        primaryTableId,
        primaryFieldId,
        referencedTableId,
        referencedFieldId,
        setErrorMessage,
        getField,
        databaseType,
    ]);

    const handleCreateRelationship = useCallback(async () => {
        if (
            !primaryTableId ||
            !primaryFieldId ||
            !referencedTableId ||
            !referencedFieldId
        ) {
            return;
        }

        const relationship = await createRelationship({
            sourceFieldId: primaryFieldId,
            sourceTableId: primaryTableId,
            targetFieldId: referencedFieldId,
            targetTableId: referencedTableId,
        });

        setEdges((edges) =>
            edges.map((edge) =>
                edge.id == relationship.id
                    ? {
                          ...edge,
                          selected: true,
                      }
                    : {
                          ...edge,
                          selected: false,
                      }
            )
        );
        fitView({
            duration: 500,
            maxZoom: 1,
            minZoom: 1,
            nodes: [
                {
                    id: relationship.sourceTableId,
                },
                {
                    id: relationship.targetTableId,
                },
            ],
        });

        openRelationshipFromSidebar(relationship.id);
    }, [
        primaryTableId,
        primaryFieldId,
        referencedTableId,
        referencedFieldId,
        createRelationship,
        openRelationshipFromSidebar,
        setEdges,
        fitView,
    ]);

    return (
        <Dialog
            {...dialog}
            onOpenChange={(open) => {
                if (!open) {
                    closeCreateRelationshipDialog();
                }
            }}
            modal={false}
        >
            <DialogContent
                className="flex flex-col overflow-y-auto"
                showClose
                forceOverlay
                onInteractOutside={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle>
                        {t('create_relationship_dialog.title')}
                    </DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4 pt-3">
                    <div className="flex flex-row justify-between gap-2">
                        <div className="flex flex-1 basis-1/2 flex-col gap-2 overflow-hidden">
                            <div className="flex gap-1 text-xs">
                                <FileOutput className="size-4 text-subtitle" />
                                <div className="font-bold text-subtitle">
                                    {t(
                                        'create_relationship_dialog.primary_table'
                                    )}
                                </div>
                            </div>
                            <div className="flex min-w-0 grow-0">
                                <SelectBox
                                    className="flex h-8 min-h-8 w-full"
                                    options={tableOptions}
                                    placeholder={t(
                                        'create_relationship_dialog.primary_table_placeholder'
                                    )}
                                    value={primaryTableId}
                                    onChange={(value) => {
                                        const newTableId = value as string;
                                        setPrimaryTableId(newTableId);
                                        if (
                                            newTableId !==
                                            preSelectedSourceTableId
                                        ) {
                                            setPrimaryFieldId(undefined);
                                        }
                                    }}
                                    emptyPlaceholder={t(
                                        'create_relationship_dialog.no_tables_found'
                                    )}
                                />
                            </div>
                        </div>
                        <div className="flex flex-1 basis-1/2 flex-col gap-2 overflow-hidden">
                            <div className="flex gap-1 text-xs">
                                <FileType2 className="size-4 text-subtitle" />
                                <div className="font-bold text-subtitle">
                                    {t(
                                        'create_relationship_dialog.primary_field'
                                    )}
                                </div>
                            </div>
                            <div>
                                <div className="flex min-w-0 grow-0">
                                    <SelectBox
                                        disabled={
                                            primaryFieldOptions.length === 0
                                        }
                                        className="flex h-8 min-h-8 w-full min-w-0"
                                        options={primaryFieldOptions}
                                        placeholder={t(
                                            'create_relationship_dialog.primary_field_placeholder'
                                        )}
                                        value={primaryFieldId}
                                        open={primaryFieldSelectOpen}
                                        onOpenChange={setPrimaryFieldSelectOpen}
                                        onChange={(value) =>
                                            setPrimaryFieldId(value as string)
                                        }
                                        emptyPlaceholder={t(
                                            'create_relationship_dialog.no_fields_found'
                                        )}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-row justify-between gap-2">
                        <div className="flex flex-1 basis-1/2 flex-col gap-2 overflow-hidden">
                            <div className="flex gap-1 text-xs">
                                <FileMinus2 className="size-4 text-subtitle" />
                                <div className="font-bold text-subtitle">
                                    {t(
                                        'create_relationship_dialog.referenced_table'
                                    )}
                                </div>
                            </div>
                            <div className="flex min-w-0 grow-0">
                                <SelectBox
                                    className="flex h-8 min-h-8 w-full"
                                    options={tableOptions}
                                    placeholder={t(
                                        'create_relationship_dialog.referenced_table_placeholder'
                                    )}
                                    value={referencedTableId}
                                    open={referencedTableSelectOpen}
                                    onOpenChange={setReferencedTableSelectOpen}
                                    onChange={(value) => {
                                        setReferencedTableId(value as string);
                                        setReferencedFieldId(undefined);
                                    }}
                                    emptyPlaceholder={t(
                                        'create_relationship_dialog.no_tables_found'
                                    )}
                                />
                            </div>
                        </div>
                        <div className="flex flex-1 basis-1/2 flex-col gap-2 overflow-hidden">
                            <div className="flex gap-1 text-xs">
                                <FileType2 className="size-4 text-subtitle" />
                                <div className="font-bold text-subtitle">
                                    {t(
                                        'create_relationship_dialog.referenced_field'
                                    )}
                                </div>
                            </div>
                            <div>
                                <div className="flex min-w-0 grow-0">
                                    <SelectBox
                                        disabled={
                                            referencedFieldOptions.length === 0
                                        }
                                        className="flex h-8 min-h-8 w-full min-w-0"
                                        options={referencedFieldOptions}
                                        placeholder={t(
                                            'create_relationship_dialog.referenced_field_placeholder'
                                        )}
                                        value={referencedFieldId}
                                        onChange={(value) =>
                                            setReferencedFieldId(
                                                value as string
                                            )
                                        }
                                        emptyPlaceholder={t(
                                            'create_relationship_dialog.no_fields_found'
                                        )}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <p className="mt-2 text-sm text-red-700">{errorMessage}</p>
                </div>
                <DialogFooter className="flex !justify-between gap-2">
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">
                            {t('create_relationship_dialog.cancel')}
                        </Button>
                    </DialogClose>
                    <DialogClose asChild>
                        <Button
                            disabled={!canCreateRelationship}
                            type="button"
                            onClick={handleCreateRelationship}
                        >
                            {t('create_relationship_dialog.create')}
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
