import React, {
    useMemo,
    useState,
    useEffect,
    useCallback,
    useRef,
} from 'react';
import type { DBTable } from '@/lib/domain/db-table';
import { useChartDB } from '@/hooks/use-chartdb';
import { useTheme } from '@/hooks/use-theme';
import { CodeSnippet } from '@/components/code-snippet/code-snippet';
import type { EffectiveTheme } from '@/context/theme-context/theme-context';
import type { Diagram } from '@/lib/domain/diagram';
import { useToast } from '@/components/toast/use-toast';
import { setupDBMLLanguage } from '@/components/code-snippet/languages/dbml-language';
import { ArrowLeftRight, Pencil, PencilOff } from 'lucide-react';
import { generateDBMLFromDiagram } from '@/lib/dbml/dbml-export/dbml-export';
import { useDiff } from '@/context/diff-context/use-diff';
import { importDBMLToDiagram } from '@/lib/dbml/dbml-import/dbml-import';
import { applyDBMLChanges } from '@/lib/dbml/apply-dbml/apply-dbml';
import { useDebounce } from '@/hooks/use-debounce';

export interface TableDBMLProps {
    filteredTables: DBTable[];
}

const getEditorTheme = (theme: EffectiveTheme) => {
    return theme === 'dark' ? 'dbml-dark' : 'dbml-light';
};

export const TableDBML: React.FC<TableDBMLProps> = ({ filteredTables }) => {
    const { currentDiagram } = useChartDB();
    const { effectiveTheme } = useTheme();
    const { toast } = useToast();
    const [dbmlFormat, setDbmlFormat] = useState<'inline' | 'standard'>(
        'inline'
    );
    const [isLoading, setIsLoading] = useState(true);
    const [standardDbml, setStandardDbml] = useState('');
    const [inlineDbml, setInlineDbml] = useState('');

    // Determine which DBML string to display
    const dbmlToDisplay = useMemo(
        () => (dbmlFormat === 'inline' ? inlineDbml : standardDbml),
        [dbmlFormat, inlineDbml, standardDbml]
    );

    // Toggle function
    const toggleFormat = useCallback(() => {
        setDbmlFormat((prev) => (prev === 'inline' ? 'standard' : 'inline'));
    }, []);

    const [isEditMode, setIsEditMode] = useState(false);
    const [editedDbml, setEditedDbml] = useState<string>('');
    const lastDBMLChange = useRef(editedDbml);
    const { calculateDiff, originalDiagram, resetDiff, diffMap } = useDiff();
    const { loadDiagramFromData } = useChartDB();

    // --- Effect for handling empty field name warnings ---
    useEffect(() => {
        let foundInvalidFields = false;
        const invalidTableNames = new Set<string>();

        filteredTables.forEach((table) => {
            table.fields.forEach((field) => {
                if (field.name === '') {
                    foundInvalidFields = true;
                    invalidTableNames.add(table.name);
                }
            });
        });

        if (foundInvalidFields) {
            const tableNamesString = Array.from(invalidTableNames).join(', ');
            toast({
                title: 'Warning',
                description: `Some fields had empty names in tables: [${tableNamesString}] and were excluded from the DBML export.`,
                variant: 'default',
            });
        }
    }, [filteredTables, toast]); // Depend on filteredTables and toast

    // Generate DBML asynchronously
    useEffect(() => {
        if (isEditMode) {
            setIsLoading(false);
            return;
        }

        const generateDBML = async () => {
            setIsLoading(true);

            // Create a filtered diagram with only the selected tables
            const filteredDiagram: Diagram = {
                ...currentDiagram,
                tables: filteredTables,
            };

            const result = generateDBMLFromDiagram(filteredDiagram);

            // Handle errors
            if (result.error) {
                toast({
                    title: 'DBML Export Error',
                    description: `Could not generate DBML: ${result.error.substring(0, 100)}${result.error.length > 100 ? '...' : ''}`,
                    variant: 'destructive',
                });
            }

            setStandardDbml(result.standardDbml);
            setInlineDbml(result.inlineDbml);
            setIsLoading(false);
        };

        generateDBML();
    }, [currentDiagram, filteredTables, toast, isEditMode]);

    // Update editedDbml when dbmlToDisplay changes
    useEffect(() => {
        if (!isLoading && dbmlToDisplay && !isEditMode) {
            setEditedDbml(dbmlToDisplay);
            lastDBMLChange.current = dbmlToDisplay;
        }
    }, [dbmlToDisplay, isLoading, isEditMode]);

    console.log('Diff Map:', diffMap);

    // Create the showDiff function
    const showDiff = useCallback(
        async (dbmlContent: string) => {
            if (originalDiagram) {
                resetDiff();
                loadDiagramFromData(originalDiagram);
            }

            const diagramFromDBML: Diagram =
                await importDBMLToDiagram(dbmlContent);

            const sourceDiagram: Diagram = originalDiagram ?? currentDiagram;

            const targetDiagram: Diagram = {
                ...sourceDiagram,
                tables: diagramFromDBML.tables,
                relationships: diagramFromDBML.relationships,
                customTypes: diagramFromDBML.customTypes,
            };

            console.log({ sourceDiagram, targetDiagram });

            const newDiagram = applyDBMLChanges({
                sourceDiagram,
                targetDiagram,
            });

            console.log({ newDiagram });

            console.log('New Diagram from DBML:', newDiagram);

            calculateDiff({
                diagram: sourceDiagram,
                newDiagram,
                options: { summaryOnly: true },
            });
        },
        [
            originalDiagram,
            currentDiagram,
            resetDiff,
            loadDiagramFromData,
            calculateDiff,
        ]
    );

    // Create debounced version of showDiff
    const debouncedShowDiff = useDebounce(showDiff, 1000);

    useEffect(() => {
        if (!isEditMode || !editedDbml) {
            return;
        }

        // Only calculate diff if the DBML has changed
        if (editedDbml === lastDBMLChange.current) {
            return;
        }

        lastDBMLChange.current = editedDbml;

        debouncedShowDiff(editedDbml);
    }, [editedDbml, isEditMode, debouncedShowDiff]);

    return (
        <CodeSnippet
            code={editedDbml}
            loading={isLoading}
            actionsTooltipSide="right"
            className="my-0.5"
            allowCopy={!isEditMode}
            actions={
                isEditMode
                    ? [
                          {
                              label: 'View',
                              icon: PencilOff,
                              onClick: () => setIsEditMode((prev) => !prev),
                          },
                      ]
                    : [
                          {
                              label: `Show ${dbmlFormat === 'inline' ? 'Standard' : 'Inline'} Refs`,
                              icon: ArrowLeftRight,
                              onClick: toggleFormat,
                          },
                          {
                              label: 'Edit',
                              icon: Pencil,
                              onClick: () => setIsEditMode((prev) => !prev),
                          },
                      ]
            }
            editorProps={{
                height: '100%',
                defaultLanguage: 'dbml',
                beforeMount: setupDBMLLanguage,
                theme: getEditorTheme(effectiveTheme),
                options: {
                    wordWrap: 'off',
                    mouseWheelZoom: false,
                    domReadOnly: true,
                    readOnly: !isEditMode,
                },
                onChange: (value) => {
                    setEditedDbml(value ?? '');
                },
            }}
        />
    );
};
