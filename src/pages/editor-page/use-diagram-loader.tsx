import { useChartDB } from '@/hooks/use-chartdb';
import { useConfig } from '@/hooks/use-config';
import { useDialog } from '@/hooks/use-dialog';
import { useFullScreenLoader } from '@/hooks/use-full-screen-spinner';
import { useRedoUndoStack } from '@/hooks/use-redo-undo-stack';
import { useStorage } from '@/hooks/use-storage';
import type { Diagram } from '@/lib/domain/diagram';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import {
    MINIO_ENDPOINT,
    MINIO_USE_SSL,
    MINIO_ACCESS_KEY,
    MINIO_SECRET_KEY,
    MINIO_BUCKET_NAME,
} from '@/lib/env';
import { diagramFromJSONInput } from '@/lib/export-import-utils';

export const useDiagramLoader = () => {
    const [initialDiagram, setInitialDiagram] = useState<Diagram | undefined>();
    const { diagramId } = useParams<{ diagramId: string }>();
    const [searchParams] = useSearchParams();
    const minioParam = searchParams.get('minio');
    const { config } = useConfig();
    const { loadDiagram, currentDiagram } = useChartDB();
    const { resetRedoStack, resetUndoStack } = useRedoUndoStack();
    const { showLoader, hideLoader } = useFullScreenLoader();
    const { openCreateDiagramDialog, openOpenDiagramDialog } = useDialog();
    const navigate = useNavigate();
    const { listDiagrams, addDiagram } = useStorage();

    const currentDiagramLoadingRef = useRef<string | undefined>(undefined);

    // Function for loading diagram from MinIO
    const loadDiagramFromMinio = useCallback(
        async (fileName: string) => {
            try {
                showLoader();

                // Create S3 client for working with MinIO
                const s3Client = new S3Client({
                    region: 'us-east-1', // MinIO doesn't use regions, but it's required to specify
                    endpoint: `${MINIO_USE_SSL ? 'https://' : 'http://'}${MINIO_ENDPOINT}`,
                    credentials: {
                        accessKeyId: MINIO_ACCESS_KEY,
                        secretAccessKey: MINIO_SECRET_KEY,
                    },
                    forcePathStyle: true, // Required for MinIO
                });

                const bucketName = MINIO_BUCKET_NAME;

                // Add .json extension if it's missing
                const fileKey = fileName.endsWith('.json')
                    ? fileName
                    : `${fileName}.json`;

                // Get object from MinIO
                const getCommand = new GetObjectCommand({
                    Bucket: bucketName,
                    Key: fileKey,
                });

                const response = await s3Client.send(getCommand);

                if (!response.Body) {
                    throw new Error('Failed to get file content');
                }

                // Read data from stream
                const jsonData = await response.Body.transformToString();

                // Convert JSON to diagram object
                const diagram = diagramFromJSONInput(jsonData);

                // Add diagram to storage
                await addDiagram({ diagram });

                // Return the diagram
                return diagram;
            } catch (error) {
                console.error('Error loading diagram from MinIO:', error);
                return null;
            } finally {
                hideLoader();
            }
        },
        [showLoader, hideLoader, addDiagram]
    );

    useEffect(() => {
        if (!config) {
            return;
        }

        if (currentDiagram?.id === diagramId) {
            return;
        }

        const loadDefaultDiagram = async () => {
            // If minio GET parameter exists, try to load diagram from MinIO
            if (minioParam) {
                setInitialDiagram(undefined);
                showLoader();
                resetRedoStack();
                resetUndoStack();

                const diagram = await loadDiagramFromMinio(minioParam);

                if (diagram) {
                    // If diagram was successfully loaded, set it and redirect to its ID
                    setInitialDiagram(diagram);
                    navigate(`/diagrams/${diagram.id}`, { replace: true });
                    return;
                } else {
                    // If loading from MinIO failed, continue with standard loading logic
                    console.warn(
                        `Failed to load diagram from MinIO with name: ${minioParam}`
                    );
                }
            }

            // Standard diagram loading logic
            if (diagramId) {
                setInitialDiagram(undefined);
                showLoader();
                resetRedoStack();
                resetUndoStack();
                const diagram = await loadDiagram(diagramId);
                if (!diagram) {
                    openOpenDiagramDialog({ canClose: false });
                    hideLoader();
                    return;
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
            const diagrams = await listDiagrams();

            if (diagrams.length > 0) {
                openOpenDiagramDialog({ canClose: false });
            } else {
                openCreateDiagramDialog();
            }
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
        minioParam,
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
        addDiagram,
        loadDiagramFromMinio,
    ]);

    return { initialDiagram };
};
