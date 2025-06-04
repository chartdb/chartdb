import React, { useCallback } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/dropdown-menu/dropdown-menu';
import { Button } from '@/components/button/button';
import type { Diagram } from '@/lib/domain/diagram';
import {
    Copy,
    MoreHorizontal,
    SquareArrowOutUpRight,
    Trash2,
} from 'lucide-react';
import { useStorage } from '@/hooks/use-storage';
import { useAlert } from '@/context/alert-context/alert-context';
import { useTranslation } from 'react-i18next';
import { cloneDiagram } from '@/lib/clone';

interface DiagramRowActionsMenuProps {
    diagram: Diagram;
    onOpen: () => void;
    refetch: () => void;
}

export const DiagramRowActionsMenu: React.FC<DiagramRowActionsMenuProps> = ({
    diagram,
    onOpen,
    refetch,
}) => {
    const { addDiagram, deleteDiagram, listDiagrams } = useStorage();
    const { showAlert } = useAlert();
    const { t } = useTranslation();

    const handleDuplicateDiagram = useCallback(async () => {
        const clonedDiagram = cloneDiagram(diagram);

        // Generate a unique name for the duplicated diagram
        const diagrams = await listDiagrams();
        const existingNames = diagrams.map((d) => d.name);
        let duplicatedName = `${diagram.name} - Copy`;
        let counter = 1;

        while (existingNames.includes(duplicatedName)) {
            duplicatedName = `${diagram.name} - Copy ${counter}`;
            counter++;
        }

        const diagramToAdd = {
            ...clonedDiagram,
            name: duplicatedName,
        };

        await addDiagram({ diagram: diagramToAdd });
        refetch(); // Refresh the list
    }, [diagram, addDiagram, listDiagrams, refetch]);

    const handleDeleteDiagram = useCallback(() => {
        showAlert({
            title: t('delete_diagram_alert.title'),
            description: t('delete_diagram_alert.description'),
            actionLabel: t('delete_diagram_alert.delete'),
            closeLabel: t('delete_diagram_alert.cancel'),
            onAction: async () => {
                await deleteDiagram(diagram.id);
                refetch(); // Refresh the list
            },
        });
    }, [diagram.id, deleteDiagram, refetch, showAlert, t]);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="size-8 p-0"
                    onClick={(e) => e.stopPropagation()}
                >
                    <MoreHorizontal className="size-3.5" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem
                    onClick={(e) => {
                        e.stopPropagation();
                        onOpen();
                    }}
                    className="flex justify-between gap-4"
                >
                    Open
                    <SquareArrowOutUpRight className="size-3.5" />
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicateDiagram();
                    }}
                    className="flex justify-between gap-4"
                >
                    {t('menu.file.duplicate')}
                    <Copy className="size-3.5" />
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDiagram();
                    }}
                    className="flex items-center justify-between text-red-600 focus:text-red-600"
                >
                    {t('menu.file.delete_diagram')}
                    <Trash2 className="size-3.5" />
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
