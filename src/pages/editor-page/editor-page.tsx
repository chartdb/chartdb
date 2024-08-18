import React, { useEffect } from 'react';
import { TopNavbar } from './top-navbar/top-navbar';
import { Toolbar } from './toolbar/toolbar';
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from '@/components/resizable/resizable';
import { SidePanel } from './side-panel/side-panel';
import { Canvas } from './canvas/canvas';
import { useParams } from 'react-router-dom';
import { useCreateDiagramDialog } from '@/hooks/use-create-diagram-dialog';

export const EditorPage: React.FC = () => {
    const { openCreateDiagramDialog } = useCreateDiagramDialog();
    const { diagramId } = useParams<{ diagramId: string }>();

    useEffect(() => {
        if (!diagramId) {
            openCreateDiagramDialog();
        }
    }, [diagramId, openCreateDiagramDialog]);

    return (
        <section className="bg-background h-screen w-screen flex flex-col">
            <TopNavbar />
            <Toolbar />
            <ResizablePanelGroup direction="horizontal">
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
