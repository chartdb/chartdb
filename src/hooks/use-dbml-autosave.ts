import { useEffect, useRef } from 'react';
import { useChartDB } from '@/hooks/use-chartdb';
import { useToast } from '@/components/toast/use-toast';
import { generateDBMLFromDiagram } from '@/lib/dbml/dbml-export/dbml-export';
import { diagramToJSONOutput } from '@/lib/export-import-utils';

const AUTOSAVE_ENDPOINT = '/api/autosave-dbml';
const AUTOSAVE_DEBOUNCE_MS = 2000;

// Dev-only: writes the current diagram's DBML + full JSON snapshot to
// schemas/ on disk via the dbml-autosave vite middleware. Inert in
// production builds, and self-disabling if the endpoint is unavailable.
export const useDbmlAutosave = (): void => {
    const { currentDiagram, diagramName, diagramId } = useChartDB();
    const { toast } = useToast();

    const disabledRef = useRef(false);
    const seenDiagramIdRef = useRef<string>();
    const saveSeqRef = useRef(0);

    useEffect(() => {
        if (!import.meta.env.DEV || disabledRef.current) {
            return;
        }

        if (!diagramId || !diagramName) {
            return;
        }

        // Loading or switching diagrams is not an edit — only save once this
        // diagram's content changes.
        if (seenDiagramIdRef.current !== diagramId) {
            seenDiagramIdRef.current = diagramId;
            return;
        }

        const seq = ++saveSeqRef.current;
        const timeout = setTimeout(async () => {
            const { standardDbml, error } =
                generateDBMLFromDiagram(currentDiagram);

            const payload: Record<string, string> = {
                diagramName,
                diagramJson: diagramToJSONOutput(currentDiagram),
            };
            // A broken export must never clobber the last good .dbml file;
            // the JSON snapshot is serialized from state and always valid.
            if (!error && standardDbml) {
                payload.dbml = standardDbml;
            }

            try {
                const response = await fetch(AUTOSAVE_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                if (!response.ok) {
                    throw new Error(`autosave failed (${response.status})`);
                }
            } catch (fetchError) {
                if (seq !== saveSeqRef.current || disabledRef.current) {
                    return;
                }
                disabledRef.current = true;
                console.warn('[dbml-autosave] disabled:', fetchError);
                toast({
                    title: 'DBML autosave disabled',
                    description:
                        'Could not write to disk — is the app running via the vite dev server? Autosave is off for this session.',
                    variant: 'destructive',
                });
            }
        }, AUTOSAVE_DEBOUNCE_MS);

        return () => clearTimeout(timeout);
    }, [currentDiagram, diagramName, diagramId, toast]);
};
