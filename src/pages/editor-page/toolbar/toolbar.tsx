import React from 'react';
import { Card, CardContent } from '@/components/card/card';
import { ZoomIn, ZoomOut, Save, Redo, Undo } from 'lucide-react';
import { Separator } from '@/components/separator/separator';
import { ToolbarButton } from './toolbar-button';
import { useHistory } from '@/hooks/use-history';

export interface ToolbarProps {}

export const Toolbar: React.FC<ToolbarProps> = () => {
    const { redo, undo, hasRedo, hasUndo } = useHistory();
    return (
        <div className="px-1">
            <Card className="shadow-none p-0 bg-secondary h-[44px]">
                <CardContent className="p-1 flex flex-row h-full items-center">
                    <ToolbarButton>
                        <ZoomIn />
                    </ToolbarButton>
                    <ToolbarButton>
                        <ZoomOut />
                    </ToolbarButton>
                    <Separator orientation="vertical" />
                    <ToolbarButton>
                        <Save />
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
