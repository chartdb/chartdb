import React, { useEffect, useRef } from 'react';
import { Ellipsis, Trash2 } from 'lucide-react';
import { Input } from '@/components/input/input';
import { Button } from '@/components/button/button';
import { Separator } from '@/components/separator/separator';
import type { DBField } from '@/lib/domain/db-field';
import type { FieldAttributeRange } from '@/lib/data/data-types/data-types';
import { findDataTypeDataById } from '@/lib/data/data-types/data-types';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/popover/popover';
import { Label } from '@/components/label/label';
import { Checkbox } from '@/components/checkbox/checkbox';
import { useTranslation } from 'react-i18next';
import { Textarea } from '@/components/textarea/textarea';
import { debounce } from '@/lib/utils';
import equal from 'fast-deep-equal';

export interface TableFieldPopoverProps {
    field: DBField;
    updateField: (attrs: Partial<DBField>) => void;
    removeField: () => void;
}

export const TableFieldPopover: React.FC<TableFieldPopoverProps> = ({
    field,
    updateField,
    removeField,
}) => {
    const { t } = useTranslation();
    const [localField, setLocalField] = React.useState<DBField>(field);

    const debouncedUpdateFieldRef = useRef<((value?: DBField) => void) | null>(
        null
    );

    useEffect(() => {
        debouncedUpdateFieldRef.current = debounce((value?: DBField) => {
            updateField({
                comments: value?.comments,
                characterMaximumLength: value?.characterMaximumLength,
                precision: value?.precision,
                scale: value?.scale,
                unique: value?.unique,
            });
        }, 200);

        return () => {
            debouncedUpdateFieldRef.current = null;
        };
    }, [updateField]);

    useEffect(() => {
        if (debouncedUpdateFieldRef.current && !equal(field, localField)) {
            debouncedUpdateFieldRef.current(localField);
        }
    }, [localField, field]);

    return (
        <Popover
            onOpenChange={(isOpen) => {
                if (isOpen) {
                    setLocalField(field);
                }
            }}
        >
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    className="h-8 w-[32px] p-2 text-slate-500 hover:bg-primary-foreground hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                    <Ellipsis className="size-3.5" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-52">
                <div className="flex flex-col gap-2">
                    <div className="text-sm font-semibold">
                        {t(
                            'side_panel.tables_section.table.field_actions.title'
                        )}
                    </div>
                    <Separator orientation="horizontal" />
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="width" className="text-subtitle">
                                {t(
                                    'side_panel.tables_section.table.field_actions.unique'
                                )}
                            </Label>
                            <Checkbox
                                checked={localField.unique}
                                disabled={field.primaryKey}
                                onCheckedChange={(value) =>
                                    setLocalField((current) => ({
                                        ...current,
                                        unique: !!value,
                                    }))
                                }
                            />
                        </div>
                        {findDataTypeDataById(field.type.id)?.fieldAttributes
                            ?.hasCharMaxLength ? (
                            <div className="flex flex-col gap-2">
                                <Label
                                    htmlFor="width"
                                    className="text-subtitle"
                                >
                                    {t(
                                        'side_panel.tables_section.table.field_actions.character_length'
                                    )}
                                </Label>
                                <Input
                                    value={
                                        localField.characterMaximumLength ?? ''
                                    }
                                    type="number"
                                    onChange={(e) =>
                                        setLocalField((current) => ({
                                            ...current,
                                            characterMaximumLength:
                                                e.target.value,
                                        }))
                                    }
                                    className="w-full rounded-md bg-muted text-sm"
                                />
                            </div>
                        ) : null}
                        {findDataTypeDataById(field.type.id)?.fieldAttributes
                            ?.precision &&
                        findDataTypeDataById(field.type.id)?.fieldAttributes
                            ?.scale ? (
                            <>
                                <div className="flex flex-col gap-2">
                                    <Label
                                        htmlFor="width"
                                        className="text-subtitle"
                                    >
                                        {t(
                                            'side_panel.tables_section.table.field_actions.precision'
                                        )}
                                    </Label>
                                    <Input
                                        value={localField.precision ?? ''}
                                        type="number"
                                        max={
                                            (
                                                findDataTypeDataById(
                                                    field.type.id
                                                )?.fieldAttributes
                                                    ?.precision as FieldAttributeRange
                                            ).max
                                        }
                                        min={
                                            (
                                                findDataTypeDataById(
                                                    field.type.id
                                                )?.fieldAttributes
                                                    ?.precision as FieldAttributeRange
                                            ).min
                                        }
                                        placeholder={`${(findDataTypeDataById(field.type.id)?.fieldAttributes?.precision as FieldAttributeRange).default}`}
                                        onChange={(e) =>
                                            setLocalField((current) => ({
                                                ...current,
                                                precision: parseInt(
                                                    e.target.value
                                                ),
                                                scale:
                                                    typeof current.scale ===
                                                        'number' &&
                                                    !Number.isNaN(current.scale)
                                                        ? current.scale
                                                        : (
                                                              findDataTypeDataById(
                                                                  field.type.id
                                                              )?.fieldAttributes
                                                                  ?.scale as FieldAttributeRange
                                                          ).min,
                                            }))
                                        }
                                        className="w-full rounded-md bg-muted text-sm"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label
                                        htmlFor="width"
                                        className="text-subtitle"
                                    >
                                        {t(
                                            'side_panel.tables_section.table.field_actions.scale'
                                        )}
                                    </Label>
                                    <Input
                                        value={localField.scale ?? ''}
                                        max={
                                            (
                                                findDataTypeDataById(
                                                    field.type.id
                                                )?.fieldAttributes
                                                    ?.scale as FieldAttributeRange
                                            ).max
                                        }
                                        min={
                                            (
                                                findDataTypeDataById(
                                                    field.type.id
                                                )?.fieldAttributes
                                                    ?.scale as FieldAttributeRange
                                            ).min
                                        }
                                        placeholder={`${(findDataTypeDataById(field.type.id)?.fieldAttributes?.scale as FieldAttributeRange).default}`}
                                        type="number"
                                        onChange={(e) =>
                                            setLocalField((current) => ({
                                                ...current,
                                                scale: parseInt(e.target.value),
                                                precision:
                                                    typeof current.precision ===
                                                        'number' &&
                                                    !Number.isNaN(
                                                        current.precision
                                                    )
                                                        ? current.precision
                                                        : (
                                                              findDataTypeDataById(
                                                                  field.type.id
                                                              )?.fieldAttributes
                                                                  ?.precision as FieldAttributeRange
                                                          ).min,
                                            }))
                                        }
                                        className="w-full rounded-md bg-muted text-sm"
                                    />
                                </div>
                                <Button
                                    disabled={
                                        localField.scale === undefined &&
                                        localField.precision === undefined
                                    }
                                    variant="destructive"
                                    onClick={() => {
                                        setLocalField((current) => ({
                                            ...current,
                                            precision: undefined,
                                            scale: undefined,
                                        }));
                                    }}
                                >
                                    Clear
                                </Button>
                            </>
                        ) : null}
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="width" className="text-subtitle">
                                {t(
                                    'side_panel.tables_section.table.field_actions.comments'
                                )}
                            </Label>
                            <Textarea
                                value={localField.comments}
                                onChange={(e) =>
                                    setLocalField((current) => ({
                                        ...current,
                                        comments: e.target.value,
                                    }))
                                }
                                placeholder={t(
                                    'side_panel.tables_section.table.field_actions.no_comments'
                                )}
                                className="w-full rounded-md bg-muted text-sm"
                            />
                        </div>
                    </div>
                    <Separator orientation="horizontal" />
                    <Button
                        variant="outline"
                        className="flex gap-2 !text-red-700"
                        onClick={removeField}
                    >
                        <Trash2 className="size-3.5 text-red-700" />
                        {t(
                            'side_panel.tables_section.table.field_actions.delete_field'
                        )}
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
};
