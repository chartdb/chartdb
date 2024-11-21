import React from 'react';
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from '@/components/resizable/resizable';
import { SidePanel } from './side-panel/side-panel';
import { Canvas } from './canvas/canvas';
import { useLayout } from '@/hooks/use-layout';
import type { Diagram } from '@/lib/domain/diagram';

export interface EditorDesktopLayoutProps {
    initialDiagram?: Diagram;
}
export const EditorDesktopLayout: React.FC<EditorDesktopLayoutProps> = ({
    initialDiagram,
}) => {
    const { isSidePanelShowed } = useLayout();

    return (
        <ResizablePanelGroup direction="horizontal">
            <ResizablePanel
                defaultSize={25}
                minSize={25}
                maxSize={isSidePanelShowed ? 99 : 0}
                // eslint-disable-next-line
                className="transition-[flex-grow] duration-200 min-w-[350px]"
            >
                <SidePanel />
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize={75}>
                <Canvas initialTables={initialDiagram?.tables ?? []} />
            </ResizablePanel>
        </ResizablePanelGroup>
    );
};

export default EditorDesktopLayout;
