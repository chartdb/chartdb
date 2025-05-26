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
import { Trash2, Braces } from 'lucide-react';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { CustomTypeEnumValues } from './enum-values/enum-values';
import { CustomTypeCompositeFields } from './composite-fields/composite-fields';

export interface CustomTypeListItemContentProps {
    customType: DBCustomType;
}

export const CustomTypeListItemContent: React.FC<
    CustomTypeListItemContentProps
> = ({ customType }) => {
    const { removeCustomType, updateCustomType } = useChartDB();
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
            <div className="flex flex-1 items-center justify-center pt-2">
                <Button
                    variant="ghost"
                    className="h-8 p-2 text-xs"
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
