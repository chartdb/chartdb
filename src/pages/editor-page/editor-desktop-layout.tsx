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
import { cn } from '@/lib/utils';
import { SidebarProvider } from '@/components/sidebar/sidebar';
import { EditorSidebar } from './editor-sidebar/editor-sidebar';
import { TopNavbar } from './top-navbar/top-navbar';

export interface EditorDesktopLayoutProps {
    initialDiagram?: Diagram;
}
export const EditorDesktopLayout: React.FC<EditorDesktopLayoutProps> = ({
    initialDiagram,
}) => {
    const { isSidePanelShowed } = useLayout();

    return (
        <>
            <TopNavbar />
            <SidebarProvider
                defaultOpen={false}
                open={false}
                className="h-full min-h-0"
            >
                <EditorSidebar />
                <ResizablePanelGroup direction="horizontal">
                    <ResizablePanel
                        defaultSize={25}
                        minSize={25}
                        maxSize={isSidePanelShowed ? 99 : 0}
                        className={cn('transition-[flex-grow] duration-200', {
                            'min-w-[350px]': isSidePanelShowed,
                        })}
                    >
                        <SidePanel />
                    </ResizablePanel>
                    <ResizableHandle
                        disabled={!isSidePanelShowed}
                        className={!isSidePanelShowed ? 'hidden' : ''}
                    />
                    <ResizablePanel defaultSize={75}>
                        <Canvas initialTables={initialDiagram?.tables ?? []} />
                    </ResizablePanel>
                </ResizablePanelGroup>
            </SidebarProvider>
        </>
    );
};

export default EditorDesktopLayout;
