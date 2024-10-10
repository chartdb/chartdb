import React from 'react';
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from '@/components/resizable/resizable';
import { SidePanel } from './side-panel/side-panel';
import { Canvas } from './canvas/canvas';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useLayout } from '@/hooks/use-layout';
import type { Diagram } from '@/lib/domain/diagram';

export interface EditorDesktopLayoutProps {
    initialDiagram?: Diagram;
}
export const EditorDesktopLayout: React.FC<EditorDesktopLayoutProps> = ({
    initialDiagram,
}) => {
    const { isSidePanelShowed } = useLayout();
    const { isLg } = useBreakpoint('lg');
    const { isXl } = useBreakpoint('xl');

    return (
        <ResizablePanelGroup direction="horizontal">
            <ResizablePanel
                defaultSize={isXl ? 25 : isLg ? 35 : 50}
                minSize={isXl ? 25 : isLg ? 35 : 50}
                maxSize={isSidePanelShowed ? 99 : 0}
                // eslint-disable-next-line
                className="transition-[flex-grow] duration-200"
            >
                <SidePanel />
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize={isXl ? 75 : isLg ? 65 : 50}>
                <Canvas initialTables={initialDiagram?.tables ?? []} />
            </ResizablePanel>
        </ResizablePanelGroup>
    );
};

export default EditorDesktopLayout;
