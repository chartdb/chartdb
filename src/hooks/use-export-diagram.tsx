import { useCallback, useState } from 'react';
import { useDialog } from '@/hooks/use-dialog';
import { diagramToJSONOutput } from '@/lib/export-import-utils';
import { waitFor } from '@/lib/utils';
import type { Diagram } from '@/lib/domain/diagram';
import {
    S3Client,
    PutObjectCommand,
    HeadObjectCommand,
    NotFound,
} from '@aws-sdk/client-s3';
import {
    MINIO_ENDPOINT,
    MINIO_USE_SSL,
    MINIO_ACCESS_KEY,
    MINIO_SECRET_KEY,
    MINIO_BUCKET_NAME,
} from '@/lib/env';

interface ExportOptions {
    diagram: Diagram;
    destination?: 'local' | 'minio';
}

export const useExportDiagram = () => {
    const [isLoading, setIsLoading] = useState(false);
    const { closeExportDiagramDialog } = useDialog();

    const downloadOutput = useCallback((name: string, dataUrl: string) => {
        const a = document.createElement('a');
        a.setAttribute('download', `ChartDB(${name}).json`);
        a.setAttribute('href', dataUrl);
        a.click();
    }, []);

    const uploadToMinio = useCallback(async (name: string, blob: Blob) => {
        try {
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
            const fileName = `${name}.json`;

            // Check if the file already exists
            let fileExists = false;
            try {
                const headCommand = new HeadObjectCommand({
                    Bucket: bucketName,
                    Key: fileName,
                });
                await s3Client.send(headCommand);
                fileExists = true;
                console.log(`File ${fileName} already exists in MinIO`);
            } catch (headError) {
                // If file not found, get NotFound error
                if (headError instanceof NotFound) {
                    fileExists = false;
                    console.log(
                        `File ${fileName} not found in MinIO, creating new`
                    );
                } else {
                    // If another error occurred during checking, continue uploading
                    console.warn('Error checking file existence:', headError);
                }
            }

            // If file exists, generate unique name
            const finalFileName = fileName;
            if (fileExists) {
                //    // Add current date and time to file name
                //    const now = new Date();
                //    const timestamp = now.toISOString().replace(/[:.]/g, '-');
                //    finalFileName = `${name}_${timestamp}.json`;
                //    console.log(`Creating new version of file: ${finalFileName}`);
            }

            // Convert Blob to ArrayBuffer for upload
            const arrayBuffer = await blob.arrayBuffer();

            // Upload file to MinIO
            const putCommand = new PutObjectCommand({
                Bucket: bucketName,
                Key: finalFileName,
                Body: new Uint8Array(arrayBuffer),
                ContentType: 'application/json',
            });

            await s3Client.send(putCommand);
            console.log(`File ${finalFileName} successfully uploaded to MinIO`);
        } catch (error) {
            console.error('Error uploading file to MinIO:', error);
            throw error;
        }
    }, []);

    const handleExport = useCallback(
        async ({ diagram, destination = 'local' }: ExportOptions) => {
            setIsLoading(true);
            await waitFor(1000);
            try {
                const json = diagramToJSONOutput(diagram);
                const blob = new Blob([json], { type: 'application/json' });

                if (destination === 'minio') {
                    await uploadToMinio(diagram.name, blob);
                } else {
                    const dataUrl = URL.createObjectURL(blob);
                    downloadOutput(diagram.name, dataUrl);
                }

                setIsLoading(false);
                closeExportDiagramDialog();
            } catch (error) {
                console.error('Error exporting diagram:', error);
                throw error;
            } finally {
                setIsLoading(false);
            }
        },
        [downloadOutput, uploadToMinio, closeExportDiagramDialog]
    );

    return {
        exportDiagram: handleExport,
        isExporting: isLoading,
    };
};
