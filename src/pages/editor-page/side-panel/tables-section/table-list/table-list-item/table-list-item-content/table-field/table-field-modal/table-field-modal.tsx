import React, { useEffect, useRef, useCallback, useMemo } from 'react';
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
import { useDebounce } from '@/hooks/use-debounce';
import equal from 'fast-deep-equal';
import type { DatabaseType } from '@/lib/domain';

export interface TableFieldPopoverProps {
    field: DBField;
    databaseType: DatabaseType;
    updateField: (attrs: Partial<DBField>) => void;
    removeField: () => void;
}

export const TableFieldPopover: React.FC<TableFieldPopoverProps> = ({
    field,
    databaseType,
    updateField,
    removeField,
}) => {
    const { t } = useTranslation();
    const [localField, setLocalField] = React.useState<DBField>(field);
    const [isOpen, setIsOpen] = React.useState(false);

    useEffect(() => {
        setLocalField(field);
    }, [field]);

    const updateFieldStable = useCallback(
        (attrs: Partial<DBField>) => {
            updateField(attrs);
        },
        [updateField]
    );

    const debouncedUpdateField = useDebounce(updateFieldStable, 200);

    const prevFieldRef = useRef<DBField>(field);

    useEffect(() => {
        if (isOpen && !equal(prevFieldRef.current, localField)) {
            debouncedUpdateField({
                comments: localField.comments,
                characterMaximumLength: localField.characterMaximumLength,
                precision: localField.precision,
                scale: localField.scale,
                unique: localField.unique,
                default: localField.default,
            });
        }
        prevFieldRef.current = localField;
    }, [localField, debouncedUpdateField, isOpen]);

    const dataFieldType = useMemo(
        () => findDataTypeDataById(field.type.id, databaseType),
        [field.type.id, databaseType]
    );

    return (
        <Popover
            open={isOpen}
            onOpenChange={(open) => {
                setIsOpen(open);
                if (open) {
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
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="default" className="text-subtitle">
                                {t(
                                    'side_panel.tables_section.table.field_actions.default_value'
                                )}
                            </Label>
                            <Input
                                value={localField.default ?? ''}
                                onChange={(e) =>
                                    setLocalField((current) => ({
                                        ...current,
                                        default: e.target.value || null,
                                    }))
                                }
                                placeholder={t(
                                    'side_panel.tables_section.table.field_actions.no_default'
                                )}
                                className="w-full rounded-md bg-muted text-sm"
                            />
                        </div>
                        {dataFieldType?.fieldAttributes?.hasCharMaxLength ? (
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
                        {dataFieldType?.fieldAttributes?.precision ||
                        dataFieldType?.fieldAttributes?.scale ? (
                            <div className="flex gap-2">
                                <div className="flex flex-1 flex-col gap-2">
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
                                            dataFieldType?.fieldAttributes
                                                ?.precision
                                                ? (
                                                      dataFieldType
                                                          ?.fieldAttributes
                                                          ?.precision as FieldAttributeRange
                                                  ).max
                                                : undefined
                                        }
                                        min={
                                            dataFieldType?.fieldAttributes
                                                ?.precision
                                                ? (
                                                      dataFieldType
                                                          ?.fieldAttributes
                                                          ?.precision as FieldAttributeRange
                                                  ).min
                                                : undefined
                                        }
                                        placeholder={
                                            dataFieldType?.fieldAttributes
                                                ?.precision
                                                ? `${(dataFieldType?.fieldAttributes?.precision as FieldAttributeRange).default}`
                                                : 'Optional'
                                        }
                                        onChange={(e) =>
                                            setLocalField((current) => ({
                                                ...current,
                                                precision: e.target.value
                                                    ? parseInt(e.target.value)
                                                    : undefined,
                                            }))
                                        }
                                        className="w-full rounded-md bg-muted text-sm"
                                    />
                                </div>
                                <div className="flex flex-1 flex-col gap-2">
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
                                            dataFieldType?.fieldAttributes
                                                ?.scale
                                                ? (
                                                      dataFieldType
                                                          ?.fieldAttributes
                                                          ?.scale as FieldAttributeRange
                                                  ).max
                                                : undefined
                                        }
                                        min={
                                            dataFieldType?.fieldAttributes
                                                ?.scale
                                                ? (
                                                      findDataTypeDataById(
                                                          field.type.id
                                                      )?.fieldAttributes
                                                          ?.scale as FieldAttributeRange
                                                  ).min
                                                : undefined
                                        }
                                        placeholder={
                                            dataFieldType?.fieldAttributes
                                                ?.scale
                                                ? `${(dataFieldType?.fieldAttributes?.scale as FieldAttributeRange).default}`
                                                : 'Optional'
                                        }
                                        type="number"
                                        onChange={(e) =>
                                            setLocalField((current) => ({
                                                ...current,
                                                scale: e.target.value
                                                    ? parseInt(e.target.value)
                                                    : undefined,
                                            }))
                                        }
                                        className="w-full rounded-md bg-muted text-sm"
                                    />
                                </div>
                            </div>
                        ) : null}
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="width" className="text-subtitle">
                                {t(
                                    'side_panel.tables_section.table.field_actions.comments'
                                )}
                            </Label>
                            <Textarea
                                value={localField.comments ?? undefined}
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
