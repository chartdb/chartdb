import React, { useCallback } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/dropdown-menu/dropdown-menu';
import { Button } from '@/components/button/button';
import { Ellipsis, Layers2, SquareArrowOutUpRight, Trash2 } from 'lucide-react';
import { useChartDB } from '@/hooks/use-chartdb';
import type { Diagram } from '@/lib/domain';
import { useStorage } from '@/hooks/use-storage';
import { cloneDiagram } from '@/lib/clone';
import { useTranslation } from 'react-i18next';

interface DiagramRowActionsMenuProps {
    diagram: Diagram;
    onOpen: () => void;
    refetch: () => void;
    numberOfDiagrams: number;
}

export const DiagramRowActionsMenu: React.FC<DiagramRowActionsMenuProps> = ({
    diagram,
    onOpen,
    refetch,
    numberOfDiagrams,
}) => {
    const { diagramId } = useChartDB();
    const { deleteDiagram, addDiagram } = useStorage();
    const { t } = useTranslation();

    const onDelete = useCallback(async () => {
        deleteDiagram(diagram.id);
        refetch();

        if (diagram.id === diagramId || numberOfDiagrams <= 1) {
            window.location.href = '/';
        }
    }, [deleteDiagram, diagram.id, diagramId, refetch, numberOfDiagrams]);

    const onDuplicate = useCallback(async () => {
        const duplicatedDiagram = cloneDiagram(diagram);

        const diagramToAdd = duplicatedDiagram.diagram;

        if (!diagramToAdd) {
            return;
        }

        diagramToAdd.name = `${diagram.name} (Copy)`;

        addDiagram({ diagram: diagramToAdd });
        refetch();
    }, [addDiagram, refetch, diagram]);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 p-0"
                    onClick={(e) => e.stopPropagation()}
                >
                    <Ellipsis className="size-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem
                    onClick={onOpen}
                    className="flex justify-between gap-4"
                >
                    {t('open_diagram_dialog.diagram_actions.open')}
                    <SquareArrowOutUpRight className="size-3.5" />
                </DropdownMenuItem>

                <DropdownMenuItem
                    onClick={onDuplicate}
                    className="flex justify-between gap-4"
                >
                    {t('open_diagram_dialog.diagram_actions.duplicate')}
                    <Layers2 className="size-3.5" />
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={onDelete}
                    className="flex justify-between gap-4 text-red-700"
                >
                    {t('open_diagram_dialog.diagram_actions.delete')}
                    <Trash2 className="size-3.5 text-red-700" />
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
