import { useChartDB } from '@/hooks/use-chartdb';
import { useConfig } from '@/hooks/use-config';
import { useDialog } from '@/hooks/use-dialog';
import { useFullScreenLoader } from '@/hooks/use-full-screen-spinner';
import { useRedoUndoStack } from '@/hooks/use-redo-undo-stack';
import { useStorage } from '@/hooks/use-storage';
import { Diagram } from '@/lib/domain/diagram';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export const useDiagramLoader = () => {
    const [initialDiagram, setInitialDiagram] = useState<Diagram | undefined>();
    const { diagramId } = useParams<{ diagramId: string }>();
    const { config, updateConfig } = useConfig();
    const { loadDiagram, currentDiagram } = useChartDB();
    const { resetRedoStack, resetUndoStack } = useRedoUndoStack();
    const { showLoader, hideLoader } = useFullScreenLoader();
    const { openCreateDiagramDialog } = useDialog();
    const navigate = useNavigate();
    const { listDiagrams } = useStorage();

    useEffect(() => {
        if (!config) {
            return;
        }

        if (currentDiagram?.id === diagramId) {
            return;
        }

        const loadDefaultDiagram = async () => {
            if (diagramId) {
                setInitialDiagram(undefined);
                showLoader();
                resetRedoStack();
                resetUndoStack();
                const diagram = await loadDiagram(diagramId);
                if (!diagram) {
                    if (currentDiagram?.id) {
                        await updateConfig({
                            defaultDiagramId: currentDiagram.id,
                        });
                        navigate(`/diagrams/${currentDiagram.id}`);
                    } else {
                        navigate('/');
                    }
                }
                setInitialDiagram(diagram);
                hideLoader();
            } else if (!diagramId && config.defaultDiagramId) {
                const diagram = await loadDiagram(config.defaultDiagramId);
                if (!diagram) {
                    await updateConfig({
                        defaultDiagramId: '',
                    });
                    navigate('/');
                } else {
                    navigate(`/diagrams/${config.defaultDiagramId}`);
                }
            } else {
                const diagrams = await listDiagrams();

                if (diagrams.length > 0) {
                    const defaultDiagramId = diagrams[0].id;
                    await updateConfig({ defaultDiagramId });
                    navigate(`/diagrams/${defaultDiagramId}`);
                } else {
                    openCreateDiagramDialog();
                }
            }
        };
        loadDefaultDiagram();
    }, [
        diagramId,
        openCreateDiagramDialog,
        config,
        navigate,
        listDiagrams,
        loadDiagram,
        resetRedoStack,
        resetUndoStack,
        hideLoader,
        showLoader,
        currentDiagram?.id,
        updateConfig,
    ]);

    return { initialDiagram };
};
