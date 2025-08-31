import { useCallback, useState } from 'react';
import { useChartDB } from '@/hooks/use-chartdb';
import { waitFor } from '@/lib/utils';
import { diagramToStorageJSON } from '@/lib/export-import-utils';
import type { Diagram } from '@/lib/domain/diagram';

export const useSaveDiagram = () => {
    const [isSaving, setIsSaving] = useState(false);
    const { currentDiagram, updateDiagramData } = useChartDB();

    const saveDiagram = useCallback(async () => {
        setIsSaving(true);
        await waitFor(1000);
        try {
            const diagram: Diagram = diagramToStorageJSON({
                ...currentDiagram,
                updatedAt: new Date(),
            });
            await updateDiagramData(diagram, { forceUpdateStorage: true });
        } finally {
            setIsSaving(false);
        }
    }, [currentDiagram, updateDiagramData]);

    return { saveDiagram, isSaving };
};
