import { useCallback, useState } from 'react';
import { useDialog } from '@/hooks/use-dialog';
import { diagramToJSONOutput } from '@/lib/export-import-utils';
import { waitFor } from '@/lib/utils';
import type { Diagram } from '@/lib/domain/diagram';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

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
            // Создаем клиент S3 для работы с MinIO
            const s3Client = new S3Client({
                region: 'us-east-1', // MinIO не использует регионы, но требуется указать
                endpoint: `${import.meta.env.VITE_MINIO_USE_SSL === 'true' ? 'https://' : 'http://'}${import.meta.env.VITE_MINIO_ENDPOINT}`,
                credentials: {
                    accessKeyId: import.meta.env.VITE_MINIO_ACCESS_KEY,
                    secretAccessKey: import.meta.env.VITE_MINIO_SECRET_KEY,
                },
                forcePathStyle: true, // Необходимо для MinIO
            });

            const bucketName = import.meta.env.VITE_MINIO_BUCKET_NAME;
            const fileName = `ChartDB(${name}).json`;

            // Преобразуем Blob в ArrayBuffer для загрузки
            const arrayBuffer = await blob.arrayBuffer();

            // Загружаем файл в MinIO
            const putCommand = new PutObjectCommand({
                Bucket: bucketName,
                Key: fileName,
                Body: new Uint8Array(arrayBuffer),
                ContentType: 'application/json',
            });

            await s3Client.send(putCommand);
            console.log(`Файл ${fileName} успешно загружен в MinIO`);
        } catch (error) {
            console.error('Ошибка при загрузке файла в MinIO:', error);
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
                console.error('Ошибка при экспорте диаграммы:', error);
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
