import { useChartDB } from '@/hooks/use-chartdb';
import { useConfig } from '@/hooks/use-config';
import { useDialog } from '@/hooks/use-dialog';
import { useFullScreenLoader } from '@/hooks/use-full-screen-spinner';
import { useRedoUndoStack } from '@/hooks/use-redo-undo-stack';
import { useStorage } from '@/hooks/use-storage';
import type { Diagram } from '@/lib/domain/diagram';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { diagramFromJSONInput } from '@/lib/export-import-utils';
import zanderApiDbJson from './zanderApiDb.json';
import zanderWebDnbJson from './zanderWebDb.json';

export const useDiagramLoader = () => {
    const [initialDiagram, setInitialDiagram] = useState<Diagram | undefined>();
    const { diagramId } = useParams<{ diagramId: string }>();
    const { config } = useConfig();
    const { loadDiagram, currentDiagram } = useChartDB();
    const { resetRedoStack, resetUndoStack } = useRedoUndoStack();
    const { showLoader, hideLoader } = useFullScreenLoader();
    const { openCreateDiagramDialog, openOpenDiagramDialog } = useDialog();
    const navigate = useNavigate();
    const { listDiagrams, addDiagram } = useStorage();

    const currentDiagramLoadingRef = useRef<string | undefined>(undefined);

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

                let diagram = await loadDiagram(diagramId);
                if (!diagram) {
                    // ZANDER CHANGES - START
                    // openOpenDiagramDialog({ canClose: false });
                    // hideLoader();
                    // return;
                    switch (diagramId) {
                        case 'zanderApiDb':
                            diagram = diagramFromJSONInput(
                                JSON.stringify(zanderApiDbJson)
                            );
                            break;
                        case 'zanderWebDb':
                            diagram = diagramFromJSONInput(
                                JSON.stringify(zanderWebDnbJson)
                            );
                    }
                    //@ts-ignore
                    await addDiagram({ diagram });
                    //@ts-ignore
                    navigate(`/diagrams/${diagram.id}`);
                    // ZANDER CHANGES - END
                }

                setInitialDiagram(diagram);
                hideLoader();

                return;
            } else if (!diagramId && config.defaultDiagramId) {
                const diagram = await loadDiagram(config.defaultDiagramId);
                if (diagram) {
                    navigate(`/diagrams/${config.defaultDiagramId}`);

                    return;
                }
            }

            // ZANDER CHANGES - START
            // const diagrams = await listDiagrams();

            // if (diagrams.length > 0) {
            //     openOpenDiagramDialog({ canClose: false });
            // } else {
            //     openCreateDiagramDialog();
            // }
            // ZANDER CHANGES - END
        };

        if (
            currentDiagramLoadingRef.current === (diagramId ?? '') &&
            currentDiagramLoadingRef.current !== undefined
        ) {
            return;
        }
        currentDiagramLoadingRef.current = diagramId ?? '';

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
        openOpenDiagramDialog,
    ]);

    return { initialDiagram };
};
