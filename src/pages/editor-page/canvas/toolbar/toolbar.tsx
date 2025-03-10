import React, { useCallback, useState } from 'react';
import { Card, CardContent } from '@/components/card/card';
import { ZoomIn, ZoomOut, Save, Redo, Undo, Scan } from 'lucide-react';
import { Separator } from '@/components/separator/separator';
import { ToolbarButton } from './toolbar-button';
import { useHistory } from '@/hooks/use-history';
import { useChartDB } from '@/hooks/use-chartdb';
import { useOnViewportChange, useReactFlow } from '@xyflow/react';
import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
} from '@/components/tooltip/tooltip';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/button/button';
import { keyboardShortcutsForOS } from '@/context/keyboard-shortcuts-context/keyboard-shortcuts';
import { KeyboardShortcutAction } from '@/context/keyboard-shortcuts-context/keyboard-shortcuts';
import { useIsLostInCanvas } from '../hooks/use-is-lost-in-canvas';

const convertToPercentage = (value: number) => `${Math.round(value * 100)}%`;

export interface ToolbarProps {
    readonly?: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({ readonly }) => {
    const { updateDiagramUpdatedAt } = useChartDB();
    const { t } = useTranslation();
    const { redo, undo, hasRedo, hasUndo } = useHistory();
    const { getZoom, zoomIn, zoomOut, fitView } = useReactFlow();
    const [zoom, setZoom] = useState<string>(convertToPercentage(getZoom()));
    const { isLostInCanvas } = useIsLostInCanvas();

    useOnViewportChange({
        onChange: ({ zoom }) => {
            setZoom(convertToPercentage(zoom));
        },
    });

    const zoomDuration = 200;
    const zoomInHandler = () => {
        zoomIn({ duration: zoomDuration });
    };

    const zoomOutHandler = () => {
        zoomOut({ duration: zoomDuration });
    };

    const resetZoom = () => {
        fitView({
            minZoom: 1,
            maxZoom: 1,
            duration: zoomDuration,
        });
    };

    const showAll = useCallback(() => {
        fitView({
            duration: 500,
            padding: 0.1,
            maxZoom: 0.8,
        });
    }, [fitView]);

    return (
        <div className="px-1">
            <Card className="h-[44px] bg-secondary p-0 shadow-none">
                <CardContent className="flex h-full flex-row items-center p-1">
                    {!readonly ? (
                        <>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span>
                                        <ToolbarButton
                                            onClick={updateDiagramUpdatedAt}
                                        >
                                            <Save />
                                        </ToolbarButton>
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                    {t('toolbar.save')}
                                    <span className="ml-2 text-muted-foreground">
                                        {
                                            keyboardShortcutsForOS[
                                                KeyboardShortcutAction
                                                    .SAVE_DIAGRAM
                                            ].keyCombinationLabel
                                        }
                                    </span>
                                </TooltipContent>
                            </Tooltip>
                            <Separator orientation="vertical" />
                        </>
                    ) : null}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span>
                                <ToolbarButton
                                    onClick={showAll}
                                    className={
                                        isLostInCanvas
                                            ? 'bg-pink-500 text-white hover:bg-pink-600 hover:text-white'
                                            : ''
                                    }
                                >
                                    <Scan />
                                </ToolbarButton>
                            </span>
                        </TooltipTrigger>
                        <TooltipContent>
                            {t('toolbar.show_all')}
                            <span className="ml-2 text-muted-foreground">
                                {
                                    keyboardShortcutsForOS[
                                        KeyboardShortcutAction.SHOW_ALL
                                    ].keyCombinationLabel
                                }
                            </span>
                        </TooltipContent>
                    </Tooltip>
                    <Separator orientation="vertical" />
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span>
                                <ToolbarButton onClick={zoomOutHandler}>
                                    <ZoomOut />
                                </ToolbarButton>
                            </span>
                        </TooltipTrigger>
                        <TooltipContent>{t('toolbar.zoom_out')}</TooltipContent>
                    </Tooltip>
                    <Button
                        variant="ghost"
                        onClick={resetZoom}
                        className="w-[60px] p-2 hover:bg-primary-foreground"
                    >
                        {zoom}
                    </Button>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span>
                                <ToolbarButton onClick={zoomInHandler}>
                                    <ZoomIn />
                                </ToolbarButton>
                            </span>
                        </TooltipTrigger>
                        <TooltipContent>{t('toolbar.zoom_in')}</TooltipContent>
                    </Tooltip>
                    <Separator orientation="vertical" />
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span>
                                <ToolbarButton
                                    onClick={undo}
                                    disabled={!hasUndo}
                                >
                                    <Undo />
                                </ToolbarButton>
                            </span>
                        </TooltipTrigger>
                        <TooltipContent>
                            {t('toolbar.undo')}
                            <span className="ml-2 text-muted-foreground">
                                {
                                    keyboardShortcutsForOS[
                                        KeyboardShortcutAction.UNDO
                                    ].keyCombinationLabel
                                }
                            </span>
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span>
                                <ToolbarButton
                                    onClick={redo}
                                    disabled={!hasRedo}
                                >
                                    <Redo />
                                </ToolbarButton>
                            </span>
                        </TooltipTrigger>
                        <TooltipContent>
                            {t('toolbar.redo')}
                            <span className="ml-2 text-muted-foreground">
                                {
                                    keyboardShortcutsForOS[
                                        KeyboardShortcutAction.REDO
                                    ].keyCombinationLabel
                                }
                            </span>
                        </TooltipContent>
                    </Tooltip>
                </CardContent>
            </Card>
        </div>
    );
};
