import { Button } from '@/components/button/button';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/select/select';
import { useChartDB } from '@/hooks/use-chartdb';
import type {
    DBCustomType,
    DBCustomTypeField,
} from '@/lib/domain/db-custom-type';
import {
    customTypeKindToLabel,
    DBCustomTypeKind,
} from '@/lib/domain/db-custom-type';
import { Trash2, Braces, Highlighter } from 'lucide-react';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CustomTypeEnumValues } from './enum-values/enum-values';
import { CustomTypeCompositeFields } from './composite-fields/composite-fields';
import { cn } from '@/lib/utils';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
    TooltipProvider,
} from '@/components/tooltip/tooltip';

export interface CustomTypeListItemContentProps {
    customType: DBCustomType;
}

export const CustomTypeListItemContent: React.FC<
    CustomTypeListItemContentProps
> = ({ customType }) => {
    const {
        removeCustomType,
        updateCustomType,
        highlightedCustomTypeId,
        setHighlightedCustomTypeId,
        isCustomTypeUsed,
    } = useChartDB();
    const { t } = useTranslation();

    const deleteCustomTypeHandler = useCallback(() => {
        removeCustomType(customType.id);
    }, [customType.id, removeCustomType]);

    const updateCustomTypeKind = useCallback(
        (kind: DBCustomTypeKind) => {
            updateCustomType(customType.id, {
                kind,
            });
        },
        [customType.id, updateCustomType]
    );

    const addEnumValue = useCallback(
        (value: string) => {
            updateCustomType(customType.id, {
                values: [...(customType.values || []), value],
            });
        },
        [customType.id, customType.values, updateCustomType]
    );

    const removeEnumValue = useCallback(
        (value: string) => {
            updateCustomType(customType.id, {
                values: (customType.values || []).filter((v) => v !== value),
            });
        },
        [customType.id, customType.values, updateCustomType]
    );

    const addCompositeField = useCallback(
        (field: DBCustomTypeField) => {
            updateCustomType(customType.id, {
                fields: [...(customType.fields || []), field],
            });
        },
        [customType.id, customType.fields, updateCustomType]
    );

    const removeCompositeField = useCallback(
        (field: DBCustomTypeField) => {
            updateCustomType(customType.id, {
                fields: (customType.fields || []).filter(
                    (f) => f.field !== field.field
                ),
            });
        },
        [customType.id, customType.fields, updateCustomType]
    );

    const reorderCompositeFields = useCallback(
        (fields: DBCustomTypeField[]) => {
            updateCustomType(customType.id, {
                fields,
            });
        },
        [customType.id, updateCustomType]
    );

    const toggleHighlightCustomType = useCallback(() => {
        setHighlightedCustomTypeId(customType.id);
    }, [customType.id, setHighlightedCustomTypeId]);

    const canHighlight = useMemo(
        () => isCustomTypeUsed(customType.id),
        [isCustomTypeUsed, customType.id]
    );

    const highlightButtonContent = (
        <Button
            variant="ghost"
            disabled={!canHighlight}
            className={cn(
                'h-8 p-2 text-xs w-full flex justify-center items-center',
                highlightedCustomTypeId === customType.id
                    ? '!text-yellow-700 dark:!text-yellow-500'
                    : ''
            )}
            onClick={toggleHighlightCustomType}
        >
            <Highlighter
                className={cn(
                    'mr-1 size-3.5',
                    highlightedCustomTypeId === customType.id
                        ? 'text-yellow-600'
                        : canHighlight
                          ? 'text-muted-foreground'
                          : 'text-slate-400 dark:text-slate-600'
                )}
            />
            {t(
                'side_panel.custom_types_section.custom_type.custom_type_actions.highlight_fields'
            )}
        </Button>
    );

    return (
        <div className="my-1 flex flex-col rounded-b-md px-1">
            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2 text-xs">
                    <div className="flex flex-row items-center gap-1">
                        <Braces className="size-4 text-subtitle" />
                        <div className="font-bold text-subtitle">
                            {t(
                                'side_panel.custom_types_section.custom_type.kind'
                            )}
                        </div>
                    </div>

                    <Select
                        value={customType.kind}
                        onValueChange={updateCustomTypeKind}
                    >
                        <SelectTrigger className="h-8">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectItem value={DBCustomTypeKind.composite}>
                                    {
                                        customTypeKindToLabel[
                                            DBCustomTypeKind.composite
                                        ]
                                    }
                                </SelectItem>
                                <SelectItem value={DBCustomTypeKind.enum}>
                                    {
                                        customTypeKindToLabel[
                                            DBCustomTypeKind.enum
                                        ]
                                    }
                                </SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>

                {customType.kind === DBCustomTypeKind.enum ? (
                    <CustomTypeEnumValues
                        values={customType.values || []}
                        addValue={addEnumValue}
                        removeValue={removeEnumValue}
                    />
                ) : (
                    <CustomTypeCompositeFields
                        fields={customType.fields || []}
                        addField={addCompositeField}
                        removeField={removeCompositeField}
                        reorderFields={reorderCompositeFields}
                    />
                )}
            </div>
            <div className="mt-4 flex flex-col items-center justify-center gap-2 pt-2">
                {!canHighlight ? (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="w-full cursor-default">
                                    {highlightButtonContent}
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>
                                    {t(
                                        'side_panel.custom_types_section.custom_type.no_fields_tooltip'
                                    )}
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                ) : (
                    highlightButtonContent
                )}
                <Button
                    variant="ghost"
                    className="flex h-8 w-full items-center justify-center p-2 text-xs"
                    onClick={deleteCustomTypeHandler}
                >
                    <Trash2 className="mr-1 size-3.5 text-red-700" />
                    <div className="text-red-700">
                        {t(
                            'side_panel.custom_types_section.custom_type.delete_custom_type'
                        )}
                    </div>
                </Button>
            </div>
        </div>
    );
};
