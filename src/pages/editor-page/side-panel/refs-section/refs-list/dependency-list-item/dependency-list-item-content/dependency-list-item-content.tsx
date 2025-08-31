import { Button } from '@/components/button/button';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/tooltip/tooltip';
import { useChartDB } from '@/hooks/use-chartdb';
import type { DBDependency } from '@/lib/domain/db-dependency';
import { useReactFlow } from '@xyflow/react';
import { FileMinus2, FileOutput, Trash2 } from 'lucide-react';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

export interface DependencyListItemContentProps {
    dependency: DBDependency;
}

export const DependencyListItemContent: React.FC<
    DependencyListItemContentProps
> = ({ dependency }) => {
    const { getTable, removeDependency } = useChartDB();
    const { deleteElements } = useReactFlow();
    const { t } = useTranslation();

    const table = getTable(dependency.tableId);
    const dependentTable = getTable(dependency.dependentTableId);

    const deleteDependencyHandler = useCallback(() => {
        removeDependency(dependency.id);
        deleteElements({
            edges: [{ id: dependency.id }],
        });
    }, [dependency.id, removeDependency, deleteElements]);

    return (
        <div className="my-1 flex flex-col rounded-b-md px-1">
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between gap-1 text-xs">
                    <div className="flex basis-1/2 flex-col gap-2 overflow-hidden text-xs">
                        <div className="flex flex-row items-center gap-1">
                            <FileMinus2 className="size-4 text-subtitle" />
                            <div className="font-bold text-subtitle">
                                {t(
                                    'side_panel.refs_section.dependency.dependent_table'
                                )}
                            </div>
                        </div>
                        <Tooltip>
                            <TooltipTrigger>
                                <div className="truncate text-left text-sm	">
                                    {dependentTable?.name}
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                {dependentTable?.name}
                            </TooltipContent>
                        </Tooltip>
                    </div>
                    <div className="flex basis-1/2 flex-col gap-2 overflow-hidden text-xs">
                        <div className="flex flex-row items-center gap-1">
                            <FileOutput className="size-4 text-subtitle" />
                            <div className="font-bold text-subtitle">
                                {t('side_panel.refs_section.dependency.table')}
                            </div>
                        </div>
                        <Tooltip>
                            <TooltipTrigger>
                                <div className="truncate text-left text-sm">
                                    {table?.name}
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>{table?.name}</TooltipContent>
                        </Tooltip>
                    </div>
                </div>
            </div>
            <div className="flex flex-1 items-center justify-center pt-2">
                <Button
                    variant="ghost"
                    className="h-8 p-2 text-xs"
                    onClick={deleteDependencyHandler}
                >
                    <Trash2 className="mr-1 size-3.5 text-red-700" />
                    <div className="text-red-700">
                        {t(
                            'side_panel.refs_section.dependency.delete_dependency'
                        )}
                    </div>
                </Button>
            </div>
        </div>
    );
};
