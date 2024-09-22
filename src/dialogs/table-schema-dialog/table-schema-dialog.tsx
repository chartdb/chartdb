import React, { useCallback, useEffect, useMemo } from 'react';
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

export interface TableSchemaDialogProps extends BaseDialogProps {
    table?: DBTable;
    schemas: DBSchema[];
    onConfirm: (schema: string) => void;
}

export const TableSchemaDialog: React.FC<TableSchemaDialogProps> = ({
    dialog,
    table,
    schemas,
    onConfirm,
}) => {
    const { t } = useTranslation();
    const [selectedSchema, setSelectedSchema] = React.useState<string>(
        table?.schema
            ? schemaNameToSchemaId(table.schema)
            : (schemas?.[0]?.id ?? '')
    );

    useEffect(() => {
        if (!dialog.open) return;
        setSelectedSchema(
            table?.schema
                ? schemaNameToSchemaId(table.schema)
                : (schemas?.[0]?.id ?? '')
        );
    }, [dialog.open, schemas, table?.schema]);
    const { closeTableSchemaDialog } = useDialog();

    const handleConfirm = useCallback(() => {
        onConfirm(selectedSchema);
    }, [onConfirm, selectedSchema]);

    const schemaOptions: SelectBoxOption[] = useMemo(
        () =>
            schemas.map((schema) => ({
                value: schema.id,
                label: schema.name,
            })),
        [schemas]
    );

    return (
        <Dialog
            {...dialog}
            onOpenChange={(open) => {
                if (!open) {
                    closeTableSchemaDialog();
                }
            }}
        >
            <DialogContent className="flex flex-col" showClose>
                <DialogHeader>
                    <DialogTitle>
                        {table
                            ? t('update_table_schema_dialog.title')
                            : t('new_table_schema_dialog.title')}
                    </DialogTitle>
                    <DialogDescription>
                        {table
                            ? t('update_table_schema_dialog.description', {
                                  tableName: table.name,
                              })
                            : t('new_table_schema_dialog.description')}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-1">
                    <div className="grid w-full items-center gap-4">
                        <SelectBox
                            options={schemaOptions}
                            multiple={false}
                            value={selectedSchema}
                            onChange={(value) =>
                                setSelectedSchema(value as string)
                            }
                        />
                    </div>
                </div>
                <DialogFooter className="flex gap-1 md:justify-between">
                    <DialogClose asChild>
                        <Button variant="secondary">
                            {table
                                ? t('update_table_schema_dialog.cancel')
                                : t('new_table_schema_dialog.cancel')}
                        </Button>
                    </DialogClose>
                    <DialogClose asChild>
                        <Button onClick={handleConfirm}>
                            {table
                                ? t('update_table_schema_dialog.confirm')
                                : t('new_table_schema_dialog.confirm')}
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
