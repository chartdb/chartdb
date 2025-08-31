import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDialog } from '@/hooks/use-dialog';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/dialog/dialog';
import { Button } from '@/components/button/button';
import type { DBTable } from '@/lib/domain/db-table';
import type { SelectBoxOption } from '@/components/select-box/select-box';
import { SelectBox } from '@/components/select-box/select-box';
import type { DBSchema } from '@/lib/domain/db-schema';
import { schemaNameToSchemaId } from '@/lib/domain/db-schema';
import type { BaseDialogProps } from '../common/base-dialog-props';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/input/input';
import { Separator } from '@/components/separator/separator';
import { Group, SquarePlus } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/tooltip/tooltip';
import { useChartDB } from '@/hooks/use-chartdb';
import { defaultSchemas } from '@/lib/data/default-schemas';
import { Label } from '@/components/label/label';

export interface TableSchemaDialogProps extends BaseDialogProps {
    table?: DBTable;
    schemas: DBSchema[];
    onConfirm: ({ schema }: { schema: DBSchema }) => void;
    allowSchemaCreation?: boolean;
}

export const TableSchemaDialog: React.FC<TableSchemaDialogProps> = ({
    dialog,
    table,
    schemas,
    onConfirm,
    allowSchemaCreation = false,
}) => {
    const { t } = useTranslation();
    const { databaseType } = useChartDB();
    const [selectedSchemaId, setSelectedSchemaId] = useState<string>(
        table?.schema
            ? schemaNameToSchemaId(table.schema)
            : (schemas?.[0]?.id ?? '')
    );
    const allowSchemaSelection = useMemo(
        () => schemas && schemas.length > 0,
        [schemas]
    );

    const defaultSchemaName = useMemo(
        () => defaultSchemas?.[databaseType],
        [databaseType]
    );

    const [isCreatingNew, setIsCreatingNew] =
        useState<boolean>(!allowSchemaSelection);
    const [newSchemaName, setNewSchemaName] = useState<string>(
        allowSchemaCreation && !allowSchemaSelection
            ? (defaultSchemaName ?? '')
            : ''
    );

    useEffect(() => {
        if (!dialog.open) return;
        setSelectedSchemaId(
            table?.schema
                ? schemaNameToSchemaId(table.schema)
                : (schemas?.[0]?.id ?? '')
        );
        setIsCreatingNew(!allowSchemaSelection);
        setNewSchemaName(
            allowSchemaCreation && !allowSchemaSelection
                ? (defaultSchemaName ?? '')
                : ''
        );
    }, [
        defaultSchemaName,
        dialog.open,
        schemas,
        table?.schema,
        allowSchemaSelection,
        allowSchemaCreation,
    ]);

    const { closeTableSchemaDialog } = useDialog();

    const handleConfirm = useCallback(() => {
        if (isCreatingNew && newSchemaName.trim()) {
            const newSchema: DBSchema = {
                id: schemaNameToSchemaId(newSchemaName.trim()),
                name: newSchemaName.trim(),
                tableCount: 0,
            };

            onConfirm({ schema: newSchema });
        } else {
            const schema = schemas.find((s) => s.id === selectedSchemaId);
            if (!schema) return;

            onConfirm({ schema });
        }
    }, [onConfirm, selectedSchemaId, schemas, isCreatingNew, newSchemaName]);

    const schemaOptions: SelectBoxOption[] = useMemo(
        () =>
            schemas.map((schema) => ({
                value: schema.id,
                label: schema.name,
            })),
        [schemas]
    );

    const renderSwitchCreateOrSelectButton = useCallback(
        () => (
            <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setIsCreatingNew(!isCreatingNew)}
                disabled={!allowSchemaSelection || !allowSchemaCreation}
            >
                {!isCreatingNew ? (
                    <SquarePlus className="mr-2 size-4 " />
                ) : (
                    <Group className="mr-2 size-4 " />
                )}
                {isCreatingNew ? 'Select existing schema' : 'Create new schema'}
            </Button>
        ),
        [isCreatingNew, allowSchemaSelection, allowSchemaCreation]
    );

    return (
        <Dialog
            {...dialog}
            onOpenChange={(open) => {
                if (!open) {
                    closeTableSchemaDialog();
                }

                setTimeout(() => (document.body.style.pointerEvents = ''), 500);
            }}
        >
            <DialogContent className="flex flex-col" showClose>
                <DialogHeader>
                    <DialogTitle>
                        {!allowSchemaSelection && allowSchemaCreation
                            ? t('create_table_schema_dialog.title')
                            : table
                              ? t('update_table_schema_dialog.title')
                              : t('new_table_schema_dialog.title')}
                    </DialogTitle>
                    <DialogDescription>
                        {!allowSchemaSelection && allowSchemaCreation
                            ? t('create_table_schema_dialog.description')
                            : table
                              ? t('update_table_schema_dialog.description', {
                                    tableName: table.name,
                                })
                              : t('new_table_schema_dialog.description')}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-1">
                    <div className="grid w-full items-center gap-4">
                        {!isCreatingNew ? (
                            <SelectBox
                                options={schemaOptions}
                                multiple={false}
                                value={selectedSchemaId}
                                onChange={(value) =>
                                    setSelectedSchemaId(value as string)
                                }
                            />
                        ) : (
                            <div className="flex flex-col gap-2">
                                {allowSchemaCreation &&
                                !allowSchemaSelection ? (
                                    <Label htmlFor="new-schema-name">
                                        Schema Name
                                    </Label>
                                ) : null}
                                <Input
                                    id="new-schema-name"
                                    value={newSchemaName}
                                    onChange={(e) =>
                                        setNewSchemaName(e.target.value)
                                    }
                                    placeholder={`Enter schema name.${defaultSchemaName ? ` e.g. ${defaultSchemaName}.` : ''}`}
                                    autoFocus
                                />
                            </div>
                        )}

                        {allowSchemaCreation && allowSchemaSelection ? (
                            <>
                                <div className="relative">
                                    <Separator className="my-2" />
                                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
                                        or
                                    </span>
                                </div>
                                {allowSchemaSelection ? (
                                    renderSwitchCreateOrSelectButton()
                                ) : (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span>
                                                {renderSwitchCreateOrSelectButton()}
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>No existing schemas available</p>
                                        </TooltipContent>
                                    </Tooltip>
                                )}
                            </>
                        ) : null}
                    </div>
                </div>
                <DialogFooter className="flex gap-1 md:justify-between">
                    <DialogClose asChild>
                        <Button variant="secondary">
                            {isCreatingNew
                                ? t('create_table_schema_dialog.cancel')
                                : table
                                  ? t('update_table_schema_dialog.cancel')
                                  : t('new_table_schema_dialog.cancel')}
                        </Button>
                    </DialogClose>
                    <DialogClose asChild>
                        <Button
                            onClick={handleConfirm}
                            disabled={isCreatingNew && !newSchemaName.trim()}
                        >
                            {isCreatingNew
                                ? t('create_table_schema_dialog.create')
                                : table
                                  ? t('update_table_schema_dialog.confirm')
                                  : t('new_table_schema_dialog.confirm')}
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
