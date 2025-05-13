import React, { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/button/button';
import { Check } from 'lucide-react';
import { Input } from '@/components/input/input';
import { useChartDB } from '@/hooks/use-chartdb';
import { useClickAway, useKeyPressEvent } from 'react-use';
import { DiagramIcon } from '@/components/diagram-icon/diagram-icon';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { labelVariants } from '@/components/label/label-variants';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/tooltip/tooltip';
import { useDialog } from '@/hooks/use-dialog';

export interface DiagramNameProps {}

export const DiagramName: React.FC<DiagramNameProps> = () => {
    const { diagramName, updateDiagramName, currentDiagram } = useChartDB();

    const { t } = useTranslation();
    const [editMode, setEditMode] = useState(false);
    const [editedDiagramName, setEditedDiagramName] =
        React.useState(diagramName);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const { openOpenDiagramDialog } = useDialog();

    useEffect(() => {
        setEditedDiagramName(diagramName);
    }, [diagramName]);

    const editDiagramName = useCallback(() => {
        if (!editMode) return;
        if (editedDiagramName.trim()) {
            updateDiagramName(editedDiagramName.trim());
        }
        setEditMode(false);
    }, [editedDiagramName, updateDiagramName, editMode]);

    useClickAway(inputRef, editDiagramName);
    useKeyPressEvent('Enter', editDiagramName);

    const enterEditMode = (
        event: React.MouseEvent<HTMLHeadingElement, MouseEvent>
    ) => {
        event.stopPropagation();
        setEditMode(true);
    };

    return (
        <div className="group">
            <div
                className={cn(
                    'flex flex-1 flex-row items-center justify-center px-2 py-1 whitespace-nowrap',
                    {
                        'text-editable': !editMode,
                    }
                )}
            >
                <DiagramIcon
                    databaseType={currentDiagram.databaseType}
                    databaseEdition={currentDiagram.databaseEdition}
                    onClick={(e) => {
                        e.stopPropagation();
                        openOpenDiagramDialog({ canClose: true });
                    }}
                />
                <div className="flex flex-row items-center gap-1">
                    {editMode ? (
                        <>
                            <Input
                                ref={inputRef}
                                autoFocus
                                type="text"
                                placeholder={diagramName}
                                value={editedDiagramName}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) =>
                                    setEditedDiagramName(e.target.value)
                                }
                                className="ml-1 h-7 focus-visible:ring-0"
                            />
                            <Button
                                variant="ghost"
                                className="flex size-7 p-2 text-slate-500 hover:bg-primary-foreground hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
                                onClick={editDiagramName}
                            >
                                <Check />
                            </Button>
                        </>
                    ) : (
                        <>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <h1
                                        className={cn(
                                            labelVariants(),
                                            'group-hover:underline'
                                        )}
                                        onDoubleClick={(e) => {
                                            enterEditMode(e);
                                        }}
                                    >
                                        {diagramName}
                                    </h1>
                                </TooltipTrigger>
                                <TooltipContent>
                                    {t('tool_tips.double_click_to_edit')}
                                </TooltipContent>
                            </Tooltip>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
