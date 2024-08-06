import React from 'react';
import { TopNavbar } from './top-navbar/top-navbar';
import { Toolbar } from './toolbar/toolbar';
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from '@/components/resizable/resizable';
import { SidePanel } from './side-panel/side-panel';
import { Canvas } from './canvas/canvas';

export const EditorPage: React.FC = () => {
    return (
        <section className="bg-background h-screen w-screen">
            <TopNavbar />
            <Toolbar />
            <ResizablePanelGroup direction="horizontal" className="h-full">
                <ResizablePanel defaultSize={25} minSize={25} maxSize={99}>
                    <SidePanel />
                </ResizablePanel>
                <ResizableHandle />
                <ResizablePanel defaultSize={75}>
                    <Canvas />
                </ResizablePanel>
            </ResizablePanelGroup>
        </section>
    );
};
