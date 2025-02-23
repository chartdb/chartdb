import { useEffect, useRef } from 'react';
import { useStorage } from '@/hooks/use-storage';
import { diagramFromJSONInput } from '@/lib/export-import-utils';
import { AUTO_LOAD_DIAGRAM } from '@/lib/env';

export function useAutoImportDiagram(onImport: (diagramId: string) => void): {
    current: boolean;
} {
    const { addDiagram, listDiagrams } = useStorage();
    const hasAttemptedImport = useRef(false);
    const hasImportedDiagrams = useRef(false);

    useEffect(() => {
        if (!AUTO_LOAD_DIAGRAM || hasAttemptedImport.current) {
            return;
        }

        const loadDiagrams = async () => {
            try {
                hasAttemptedImport.current = true;

                const existingDiagrams = await listDiagrams();
                if (existingDiagrams.length > 0) {
                    return;
                }

                // Get list of files from the diagrams directory
                const dirResponse = await fetch('/diagrams/');
                const dirText = await dirResponse.text();

                // Parse the HTML directory listing to find .json files
                const regex = /href="([^"]+\.json)"/g;
                const matches = [...dirText.matchAll(regex)];
                const jsonFiles = matches.map((match) => match[1]);

                let firstDiagramId: string | undefined;

                for (const jsonFile of jsonFiles) {
                    try {
                        console.log(`Loading diagram from ${jsonFile}`);
                        const response = await fetch(`/diagrams/${jsonFile}`);

                        if (!response.ok) {
                            console.error(
                                `Failed to load ${jsonFile}: ${response.statusText}`
                            );
                            continue;
                        }

                        const json = await response.text();
                        const diagram = diagramFromJSONInput(json);

                        // Use skipDefaultName to keep original diagram name
                        await addDiagram({ diagram });
                        console.log(`Successfully imported ${jsonFile}`);

                        if (!firstDiagramId) {
                            firstDiagramId = diagram.id;
                        }
                        hasImportedDiagrams.current = true;
                    } catch (error) {
                        console.error(`Error importing ${jsonFile}:`, error);
                    }
                }

                if (firstDiagramId) {
                    onImport(firstDiagramId);
                }
            } catch (error) {
                console.error('Error in loadDiagrams:', error);
            }
        };

        loadDiagrams();
    }, [addDiagram, listDiagrams, onImport]);

    return hasImportedDiagrams;
}
