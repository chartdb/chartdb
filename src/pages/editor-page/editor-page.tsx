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
import { Toaster } from '@/components/toast/toaster';
import { useFullScreenLoader } from '@/hooks/use-full-screen-spinner';
import { useBreakpoint } from '@/hooks/use-breakpoint';

export const EditorPage: React.FC = () => {
    const { loadDiagram } = useChartDB();
    const { resetRedoStack, resetUndoStack } = useRedoUndoStack();
    const { showLoader, hideLoader } = useFullScreenLoader();
    const { openCreateDiagramDialog } = useDialog();
    const { diagramId } = useParams<{ diagramId: string }>();
    const { config } = useConfig();
    const navigate = useNavigate();
    const { isLg } = useBreakpoint('lg');
    const { isXl } = useBreakpoint('xl');

    useEffect(() => {
        if (!config) {
            return;
        }

        const loadDefaultDiagram = async () => {
            if (diagramId) {
                showLoader();
                resetRedoStack();
                resetUndoStack();
                const diagram = await loadDiagram(diagramId);
                if (!diagram) {
                    navigate('/');
                }
                hideLoader();
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
        hideLoader,
        showLoader,
    ]);

    return (
        <>
            <section className="bg-background h-screen w-screen flex flex-col">
                <TopNavbar />
                <ResizablePanelGroup direction="horizontal">
                    <ResizablePanel
                        defaultSize={isXl ? 25 : isLg ? 35 : 50}
                        minSize={isXl ? 25 : isLg ? 35 : 50}
                        maxSize={99}
                    >
                        <SidePanel />
                    </ResizablePanel>
                    <ResizableHandle />
                    <ResizablePanel defaultSize={isXl ? 75 : isLg ? 65 : 50}>
                        <Canvas />
                    </ResizablePanel>
                </ResizablePanelGroup>
            </section>
            <Toaster />
        </>
    );
};
