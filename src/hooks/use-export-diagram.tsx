import { useCallback, useState } from 'react';
import { useDialog } from '@/hooks/use-dialog';
import { diagramToJSONOutput } from '@/lib/export-import-utils';
import { waitFor } from '@/lib/utils';
import type { Diagram } from '@/lib/domain/diagram';

import { useExportImage } from './use-export-image';

export const useExportDiagram = () => {
    const [isLoading, setIsLoading] = useState(false);
    const { closeExportDiagramDialog } = useDialog();
    const { exportImage } = useExportImage();

    const downloadOutput = useCallback((name: string, dataUrl: string) => {
        const a = document.createElement('a');
        a.setAttribute('download', `ChartDB(${name}).json`);
        a.setAttribute('href', dataUrl);
        a.click();
    }, []);

    // Function to copy SVG to clipboard
    const copyImageToClipboard = useCallback(async () => {
        try {
            // Get PNG with transparent background
            const pngUrl = await exportImage('png', {
                scale: 2, // Increase scale for better quality
                transparent: true, // Transparent background
                includePatternBG: false, // Without background pattern
            });

            if (!pngUrl) {
                throw new Error('Failed to get image URL');
            }

            // Get Blob from URL
            const response = await fetch(pngUrl);
            const blob = await response.blob();

            // Copy to clipboard
            await navigator.clipboard.write([
                new ClipboardItem({
                    'image/png': blob,
                }),
            ]);

            console.log('Diagram copied to clipboard as PNG');
            return true;
        } catch (error) {
            console.error('Error copying PNG to clipboard:', error);
            return false;
        }
    }, [exportImage]);

    const handleExport = useCallback(
        async ({ diagram }: { diagram: Diagram }) => {
            setIsLoading(true);
            await waitFor(1000);
            try {
                const json = diagramToJSONOutput(diagram);
                const blob = new Blob([json], { type: 'application/json' });
                const dataUrl = URL.createObjectURL(blob);
                downloadOutput(diagram.name, dataUrl);
                setIsLoading(false);
                closeExportDiagramDialog();
            } catch (error) {
                console.error('Error exporting diagram:', error);
                throw error;
            } finally {
                setIsLoading(false);
            }
        },
        [downloadOutput, closeExportDiagramDialog]
    );

    return {
        exportDiagram: handleExport,
        isExporting: isLoading,
        copyImageToClipboard,
    };
};
