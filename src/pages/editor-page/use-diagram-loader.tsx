import { useChartDB } from '@/hooks/use-chartdb';
import { useConfig } from '@/hooks/use-config';
import { useDialog } from '@/hooks/use-dialog';
import { useFullScreenLoader } from '@/hooks/use-full-screen-spinner';
import { useRedoUndoStack } from '@/hooks/use-redo-undo-stack';
import { useStorage } from '@/hooks/use-storage';
import type { Diagram } from '@/lib/domain/diagram';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
// ZANDER CHANGES - START
// import zanderApiDbJson from './zanderApiDb.json';
// import zanderWebDnbJson from './zanderWebDb.json';
import { loadFromDatabaseMetadata } from '@/lib/domain/diagram';
import type { DatabaseMetadata } from '@/lib/data/import-metadata/metadata-types/database-metadata';
import { loadDatabaseMetadata } from '@/lib/data/import-metadata/metadata-types/database-metadata';
import { DatabaseType } from '@/lib/domain/database-type';
import axios from 'axios';
// ZANDER CHANGES - END

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

    const apiUrl = import.meta.env.VITE_MAIN_API_URL;

    const fetchDatabaseMetadata = async (diagramId: string) => {
        try {
            const response = await axios.post(
                `${apiUrl}/database/schema?db=${diagramId.toLowerCase()}`
            );

            return response.data.data;
        } catch (error) {
            console.error(`Error fetching metadata for ${diagramId}:`, error);
            return null;
        }
    };

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

                    let databaseMetadata: DatabaseMetadata =
                        {} as DatabaseMetadata; // Initialize to an empty object to avoid TypeScript errors
                    let databaseType = DatabaseType.GENERIC;

                    databaseType = DatabaseType.MYSQL;

                    const metadataResponse =
                        await fetchDatabaseMetadata(diagramId);

                    if (metadataResponse) {
                        databaseMetadata = loadDatabaseMetadata(
                            JSON.stringify(metadataResponse)
                        );
                    }

                    // switch (diagramId) {
                    //     case 'zanderApiDb':
                    //         databaseType = DatabaseType.MYSQL;
                    //         databaseMetadata = loadDatabaseMetadata(
                    //             JSON.stringify(zanderApiDbJson)
                    //         );
                    //         break;
                    //     case 'zanderWebDb':
                    //         databaseType = DatabaseType.MYSQL;
                    //         databaseMetadata = loadDatabaseMetadata(
                    //             JSON.stringify(zanderWebDnbJson)
                    //         );
                    //         break;
                    // }

                    diagram = await loadFromDatabaseMetadata({
                        databaseType,
                        databaseMetadata,
                        diagramNumber: 1,
                    });
                    await addDiagram({ diagram });
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
            // openCreateDiagramDialog();
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
