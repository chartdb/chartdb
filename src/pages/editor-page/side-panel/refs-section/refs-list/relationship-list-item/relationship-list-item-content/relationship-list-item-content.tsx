import { Button } from '@/components/button/button';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/select/select';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/tooltip/tooltip';
import { useChartDB } from '@/hooks/use-chartdb';
import type {
    DBRelationship,
    RelationshipType,
} from '@/lib/domain/db-relationship';
import {
    determineCardinalities,
    determineRelationshipType,
} from '@/lib/domain/db-relationship';
import { useReactFlow } from '@xyflow/react';
import {
    FileMinus2,
    FileOutput,
    Trash2,
    ChevronsLeftRightEllipsis,
} from 'lucide-react';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export interface RelationshipListItemContentProps {
    relationship: DBRelationship;
}

export const RelationshipListItemContent: React.FC<
    RelationshipListItemContentProps
> = ({ relationship }) => {
    const {
        getTable,
        getField,
        updateRelationship,
        removeRelationship,
        readonly,
    } = useChartDB();
    const { deleteElements } = useReactFlow();
    const { t } = useTranslation();
    const relationshipType = useMemo(
        () =>
            determineRelationshipType({
                sourceCardinality: relationship.sourceCardinality,
                targetCardinality: relationship.targetCardinality,
            }),
        [relationship.sourceCardinality, relationship.targetCardinality]
    );

    const updateCardinalities = useCallback(
        (type: RelationshipType) => {
            const { sourceCardinality, targetCardinality } =
                determineCardinalities(type);
            updateRelationship(relationship.id, {
                sourceCardinality,
                targetCardinality,
            });
        },
        [relationship.id, updateRelationship]
    );

    const targetTable = getTable(relationship.targetTableId);
    const targetField = getField(
        relationship.targetTableId,
        relationship.targetFieldId
    );

    const sourceTable = getTable(relationship.sourceTableId);
    const sourceField = getField(
        relationship.sourceTableId,
        relationship.sourceFieldId
    );

    const deleteRelationshipHandler = useCallback(() => {
        removeRelationship(relationship.id);
        deleteElements({
            edges: [{ id: relationship.id }],
        });
    }, [relationship.id, removeRelationship, deleteElements]);

    return (
        <div className="my-1 flex flex-col rounded-b-md px-1 py-2">
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between gap-1 text-xs">
                    <div className="flex basis-1/2 flex-col gap-2 overflow-hidden text-xs">
                        <div className="flex flex-row items-center gap-1">
                            <FileOutput className="size-4 text-subtitle" />
                            <div className="font-bold text-subtitle">
                                {t(
                                    'side_panel.refs_section.relationship.primary'
                                )}
                            </div>
                        </div>
                        <Tooltip>
                            <TooltipTrigger>
                                <div className="truncate text-left text-sm">
                                    {sourceTable?.schema
                                        ? `${sourceTable.schema}.`
                                        : ''}
                                    {sourceTable?.name}({sourceField?.name})
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                {sourceTable?.schema
                                    ? `${sourceTable.schema}.`
                                    : ''}
                                {sourceTable?.name}({sourceField?.name})
                            </TooltipContent>
                        </Tooltip>
                    </div>
                    <div className="flex basis-1/2 flex-col gap-2 overflow-hidden text-xs">
                        <div className="flex flex-row items-center gap-1">
                            <FileMinus2 className="size-4 text-subtitle" />
                            <div className="font-bold text-subtitle">
                                {t(
                                    'side_panel.refs_section.relationship.foreign'
                                )}
                            </div>
                        </div>
                        <Tooltip>
                            <TooltipTrigger>
                                <div className="truncate text-left text-sm">
                                    {targetTable?.schema
                                        ? `${targetTable.schema}.`
                                        : ''}
                                    {targetTable?.name}({targetField?.name})
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                {targetTable?.schema
                                    ? `${targetTable.schema}.`
                                    : ''}
                                {targetTable?.name}({targetField?.name})
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </div>
                <div className="flex flex-col gap-2 text-xs">
                    <div className="flex flex-row items-center gap-1">
                        <ChevronsLeftRightEllipsis className="size-4 text-subtitle" />
                        <div className="font-bold text-subtitle">
                            {t(
                                'side_panel.refs_section.relationship.cardinality'
                            )}
                        </div>
                    </div>

                    <Select
                        value={relationshipType}
                        onValueChange={updateCardinalities}
                        disabled={readonly}
                    >
                        <SelectTrigger className="h-8">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectItem value="one_to_one">
                                    {t('relationship_type.one_to_one')}
                                </SelectItem>
                                <SelectItem value="one_to_many">
                                    {t('relationship_type.one_to_many')}
                                </SelectItem>
                                <SelectItem value="many_to_one">
                                    {t('relationship_type.many_to_one')}
                                </SelectItem>
                                {relationshipType === 'many_to_many' ? (
                                    <SelectItem value="many_to_many">
                                        {t('relationship_type.many_to_many')}
                                    </SelectItem>
                                ) : null}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            {!readonly ? (
                <div className="flex flex-1 items-center justify-center pt-2">
                    <Button
                        variant="ghost"
                        className="h-8 p-2 text-xs"
                        onClick={deleteRelationshipHandler}
                    >
                        <Trash2 className="mr-1 size-3.5 text-red-700" />
                        <div className="text-red-700">
                            {t(
                                'side_panel.refs_section.relationship.delete_relationship'
                            )}
                        </div>
                    </Button>
                </div>
            ) : null}
        </div>
    );
};
