import React, { useEffect } from 'react';
import { TopNavbar } from './top-navbar/top-navbar';
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from '@/components/resizable/resizable';
import { SidePanel } from './side-panel/side-panel';
import { Canvas } from './canvas/canvas';
import { useNavigate, useParams } from 'react-router-dom';
import { useConfig } from '@/hooks/use-config';
import { useChartDB } from '@/hooks/use-chartdb';
import { useDialog } from '@/hooks/use-dialog';
import { useRedoUndoStack } from '@/hooks/use-redo-undo-stack';

export const EditorPage: React.FC = () => {
    const { loadDiagram } = useChartDB();
    const { resetRedoStack, resetUndoStack } = useRedoUndoStack();
    const { openCreateDiagramDialog } = useDialog();
    const { diagramId } = useParams<{ diagramId: string }>();
    const { config } = useConfig();
    const navigate = useNavigate();

    useEffect(() => {
        if (!config) {
            return;
        }

        const loadDefaultDiagram = async () => {
            if (diagramId) {
                resetRedoStack();
                resetUndoStack();
                const diagram = await loadDiagram(diagramId);
                if (!diagram) {
                    navigate('/');
                }
            } else if (!diagramId && config.defaultDiagramId) {
                navigate(`/diagrams/${config.defaultDiagramId}`);
            } else {
                openCreateDiagramDialog();
            }
        };
        loadDefaultDiagram();
    }, [
        diagramId,
        openCreateDiagramDialog,
        config,
        navigate,
        loadDiagram,
        resetRedoStack,
        resetUndoStack,
    ]);

    return (
        <section className="bg-background h-screen w-screen flex flex-col">
            <TopNavbar />
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
