import React, { useCallback, useState } from 'react';
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
    Loader2,
} from 'lucide-react';
import { useStorage } from '@/hooks/use-storage';
import { useAlert } from '@/context/alert-context/alert-context';
import { useTranslation } from 'react-i18next';
import { cloneDiagram } from '@/lib/clone';
import { useParams, useNavigate } from 'react-router-dom';
import { useConfig } from '@/hooks/use-config';

interface DiagramRowActionsMenuProps {
    diagram: Diagram;
    onOpen: () => void;
    refetch: () => void;
    onSelectDiagram?: (diagramId: string | undefined) => void;
}

export const DiagramRowActionsMenu: React.FC<DiagramRowActionsMenuProps> = ({
    diagram,
    onOpen,
    refetch,
    onSelectDiagram,
}) => {
    const { addDiagram, deleteDiagram, listDiagrams, getDiagram } =
        useStorage();
    const { showAlert } = useAlert();
    const { t } = useTranslation();
    const { diagramId: currentDiagramId } = useParams<{ diagramId: string }>();
    const navigate = useNavigate();
    const { updateConfig } = useConfig();
    const [isDuplicating, setIsDuplicating] = useState(false);

    const handleDuplicateDiagram = useCallback(async () => {
        setIsDuplicating(true);

        try {
            // Load the full diagram with all components
            const fullDiagram = await getDiagram(diagram.id, {
                includeTables: true,
                includeRelationships: true,
                includeAreas: true,
                includeDependencies: true,
                includeCustomTypes: true,
            });

            if (!fullDiagram) {
                console.error('Failed to load diagram for duplication');
                setIsDuplicating(false);
                return;
            }

            const { diagram: clonedDiagram } = cloneDiagram(fullDiagram);

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
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            // Add 2 second delay for better UX
            await new Promise((resolve) => setTimeout(resolve, 2000));

            await addDiagram({ diagram: diagramToAdd });

            // Clear current selection first, then select the new diagram
            if (onSelectDiagram) {
                onSelectDiagram(undefined); // Clear selection
                await refetch(); // Refresh the list
                // Use setTimeout to ensure the DOM has updated with the new row
                setTimeout(() => {
                    onSelectDiagram(diagramToAdd.id);
                }, 100);
            } else {
                await refetch(); // Refresh the list
            }
        } catch (error) {
            console.error('Error duplicating diagram:', error);
        } finally {
            setIsDuplicating(false);
        }
    }, [
        diagram,
        addDiagram,
        listDiagrams,
        getDiagram,
        refetch,
        onSelectDiagram,
    ]);

    const handleDeleteDiagram = useCallback(() => {
        showAlert({
            title: t('delete_diagram_alert.title'),
            description: t('delete_diagram_alert.description'),
            actionLabel: t('delete_diagram_alert.delete'),
            closeLabel: t('delete_diagram_alert.cancel'),
            onAction: async () => {
                await deleteDiagram(diagram.id);

                // If we deleted the currently open diagram, navigate to another one
                if (currentDiagramId === diagram.id) {
                    // Get updated list of diagrams after deletion
                    const remainingDiagrams = await listDiagrams();

                    if (remainingDiagrams.length > 0) {
                        // Sort by last modified date (most recent first)
                        const sortedDiagrams = remainingDiagrams.sort(
                            (a, b) =>
                                b.updatedAt.getTime() - a.updatedAt.getTime()
                        );

                        // Navigate to the most recently modified diagram
                        const firstDiagram = sortedDiagrams[0];
                        updateConfig({
                            config: { defaultDiagramId: firstDiagram.id },
                        });
                        navigate(`/diagrams/${firstDiagram.id}`);
                    } else {
                        // No diagrams left, navigate to home
                        navigate('/');
                    }
                }

                refetch(); // Refresh the list
            },
        });
    }, [
        diagram.id,
        currentDiagramId,
        deleteDiagram,
        refetch,
        showAlert,
        t,
        listDiagrams,
        updateConfig,
        navigate,
    ]);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="size-8 p-0"
                    onClick={(e) => e.stopPropagation()}
                    disabled={isDuplicating}
                >
                    {isDuplicating ? (
                        <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                        <MoreHorizontal className="size-3.5" />
                    )}
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
                    {t('menu.databases.duplicate')}
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
                    {t('menu.databases.delete_diagram')}
                    <Trash2 className="size-3.5" />
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
