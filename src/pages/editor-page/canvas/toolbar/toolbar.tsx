import React, { useState } from 'react';
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

const convertToPercentage = (value: number) => `${Math.round(value * 100)}%`;

export interface ToolbarProps {}

export const Toolbar: React.FC<ToolbarProps> = () => {
    const { updateDiagramUpdatedAt } = useChartDB();
    const { t } = useTranslation();
    const { redo, undo, hasRedo, hasUndo } = useHistory();
    const { getZoom, zoomIn, zoomOut, fitView } = useReactFlow();
    const [zoom, setZoom] = useState<string>(convertToPercentage(getZoom()));
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

    const showAll = () => {
        fitView({ duration: zoomDuration });
    };

    return (
        <div className="px-1">
            <Card className="h-[44px] bg-secondary p-0 shadow-none">
                <CardContent className="flex h-full flex-row items-center p-1">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span>
                                <ToolbarButton onClick={updateDiagramUpdatedAt}>
                                    <Save />
                                </ToolbarButton>
                            </span>
                        </TooltipTrigger>
                        <TooltipContent>{t('toolbar.save')}</TooltipContent>
                    </Tooltip>
                    <Separator orientation="vertical" />
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span>
                                <ToolbarButton onClick={showAll}>
                                    <Scan />
                                </ToolbarButton>
                            </span>
                        </TooltipTrigger>
                        <TooltipContent>{t('toolbar.show_all')}</TooltipContent>
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
                        <TooltipContent>{t('toolbar.undo')}</TooltipContent>
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
                        <TooltipContent>{t('toolbar.redo')}</TooltipContent>
                    </Tooltip>
                </CardContent>
            </Card>
        </div>
    );
};
