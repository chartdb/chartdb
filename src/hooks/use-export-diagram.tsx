import { useCallback, useState } from 'react';
import { useDialog } from '@/hooks/use-dialog';
import { diagramToJSONOutput } from '@/lib/export-import-utils';
import { waitFor } from '@/lib/utils';
import type { Diagram } from '@/lib/domain/diagram';

export const useExportDiagram = () => {
    const [isLoading, setIsLoading] = useState(false);
    const { closeExportDiagramDialog } = useDialog();

    const downloadOutput = useCallback((name: string, dataUrl: string) => {
        const a = document.createElement('a');
        a.setAttribute('download', `ChartDB(${name}).json`);
        a.setAttribute('href', dataUrl);
        a.click();
    }, []);

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
            } finally {
                setIsLoading(false);
            }
        },
        [downloadOutput, closeExportDiagramDialog]
    );

    return {
        exportDiagram: handleExport,
        isExporting: isLoading,
    };
};
