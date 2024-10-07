import React, { useCallback, useMemo } from 'react';
import { EllipsisVertical, CircleDotDashed, Trash2 } from 'lucide-react';
import { ListItemHeaderButton } from '../../../../list-item-header-button/list-item-header-button';
import { useReactFlow } from '@xyflow/react';
import { useChartDB } from '@/hooks/use-chartdb';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/dropdown-menu/dropdown-menu';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useTranslation } from 'react-i18next';
import type { DBDependency } from '@/lib/domain/db-dependency';
import { useLayout } from '@/hooks/use-layout';

export interface DependencyListItemHeaderProps {
    dependency: DBDependency;
}

export const DependencyListItemHeader: React.FC<
    DependencyListItemHeaderProps
> = ({ dependency }) => {
    const { removeDependency, getTable } = useChartDB();
    const { fitView, deleteElements, setEdges } = useReactFlow();
    const { t } = useTranslation();
    const { hideSidePanel } = useLayout();
    const { isMd: isDesktop } = useBreakpoint('md');

    const dependencyName = useMemo(() => {
        const table = getTable(dependency.tableId);
        const dependentTable = getTable(dependency.dependentTableId);

        // should not happen
        if (!table || !dependentTable) {
            return '';
        }

        return `${dependentTable.name} -> ${table.name}`;
    }, [dependency.tableId, dependency.dependentTableId, getTable]);

    const focusOnDependency = useCallback(
        (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
            event.stopPropagation();
            setEdges((edges) =>
                edges.map((edge) =>
                    edge.id == dependency.id
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
                        id: dependency.tableId,
                    },
                    {
                        id: dependency.dependentTableId,
                    },
                ],
            });

            if (!isDesktop) {
                hideSidePanel();
            }
        },
        [
            fitView,
            dependency.tableId,
            dependency.dependentTableId,
            setEdges,
            dependency.id,
            isDesktop,
            hideSidePanel,
        ]
    );

    const deleteDependencyHandler = useCallback(() => {
        removeDependency(dependency.id);
        deleteElements({
            edges: [{ id: dependency.id }],
        });
    }, [dependency.id, removeDependency, deleteElements]);

    const renderDropDownMenu = useCallback(
        () => (
            <DropdownMenu>
                <DropdownMenuTrigger>
                    <ListItemHeaderButton>
                        <EllipsisVertical />
                    </ListItemHeaderButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-40">
                    <DropdownMenuLabel>
                        {t(
                            'side_panel.dependencies_section.dependency.dependency_actions.title'
                        )}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                        <DropdownMenuItem
                            onClick={deleteDependencyHandler}
                            className="flex justify-between !text-red-700"
                        >
                            {t(
                                'side_panel.dependencies_section.dependency.dependency_actions.delete_dependency'
                            )}
                            <Trash2 className="size-3.5 text-red-700" />
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>
        ),
        [deleteDependencyHandler, t]
    );

    return (
        <div className="group flex h-11 flex-1 items-center justify-between overflow-hidden">
            <div className="flex min-w-0 flex-1">
                <div className="truncate">{dependencyName}</div>
            </div>
            <div className="flex flex-row-reverse">
                <div>{renderDropDownMenu()}</div>
                <div className="flex flex-row-reverse md:hidden md:group-hover:flex">
                    <ListItemHeaderButton onClick={focusOnDependency}>
                        <CircleDotDashed />
                    </ListItemHeaderButton>
                </div>
            </div>
        </div>
    );
};
