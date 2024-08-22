import React, { useState } from 'react';
import { Card, CardContent } from '@/components/card/card';
import { ZoomIn, ZoomOut, Save, Redo, Undo, Scan } from 'lucide-react';
import { Separator } from '@/components/separator/separator';
import { ToolbarButton } from './toolbar-button';
import { useHistory } from '@/hooks/use-history';
import { useChartDB } from '@/hooks/use-chartdb';
import { useOnViewportChange, useReactFlow } from '@xyflow/react';

const convertToPercentage = (value: number) => `${Math.round(value * 100)}%`;

export interface ToolbarProps {}

export const Toolbar: React.FC<ToolbarProps> = () => {
    const { updateDiagramUpdatedAt } = useChartDB();
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
            <Card className="shadow-none p-0 bg-secondary h-[44px]">
                <CardContent className="p-1 flex flex-row h-full items-center">
                    <ToolbarButton onClick={updateDiagramUpdatedAt}>
                        <Save />
                    </ToolbarButton>
                    <Separator orientation="vertical" />
                    <ToolbarButton onClick={showAll}>
                        <Scan />
                    </ToolbarButton>
                    <Separator orientation="vertical" />
                    <ToolbarButton onClick={zoomOutHandler}>
                        <ZoomOut />
                    </ToolbarButton>
                    <ToolbarButton onClick={resetZoom}>{zoom}</ToolbarButton>
                    <ToolbarButton onClick={zoomInHandler}>
                        <ZoomIn />
                    </ToolbarButton>
                    <Separator orientation="vertical" />
                    <ToolbarButton onClick={undo} disabled={!hasUndo}>
                        <Undo />
                    </ToolbarButton>
                    <ToolbarButton onClick={redo} disabled={!hasRedo}>
                        <Redo />
                    </ToolbarButton>
                </CardContent>
            </Card>
        </div>
    );
};
