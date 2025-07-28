import React, { useMemo, useState, useEffect, useCallback } from 'react';
import type { DBTable } from '@/lib/domain/db-table';
import { useChartDB } from '@/hooks/use-chartdb';
import { useTheme } from '@/hooks/use-theme';
import { CodeSnippet } from '@/components/code-snippet/code-snippet';
import type { EffectiveTheme } from '@/context/theme-context/theme-context';
import type { Diagram } from '@/lib/domain/diagram';
import { useToast } from '@/components/toast/use-toast';
import { setupDBMLLanguage } from '@/components/code-snippet/languages/dbml-language';
import { ArrowLeftRight } from 'lucide-react';
import { generateDBMLFromDiagram } from '@/lib/dbml/dbml-export/dbml-export';

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

    // Generate both standard and inline DBML formats
    const { standardDbml, inlineDbml } = useMemo(() => {
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

        return {
            standardDbml: result.standardDbml,
            inlineDbml: result.inlineDbml,
        };
    }, [currentDiagram, filteredTables, toast]);

    // Determine which DBML string to display
    const dbmlToDisplay = useMemo(
        () => (dbmlFormat === 'inline' ? inlineDbml : standardDbml),
        [dbmlFormat, inlineDbml, standardDbml]
    );

    // Toggle function
    const toggleFormat = useCallback(() => {
        setDbmlFormat((prev) => (prev === 'inline' ? 'standard' : 'inline'));
    }, []);

    return (
        <CodeSnippet
            code={dbmlToDisplay}
            actionsTooltipSide="right"
            className="my-0.5"
            actions={[
                {
                    label: `Show ${dbmlFormat === 'inline' ? 'Standard' : 'Inline'} Refs`,
                    icon: ArrowLeftRight,
                    onClick: toggleFormat,
                },
            ]}
            editorProps={{
                height: '100%',
                defaultLanguage: 'dbml',
                beforeMount: setupDBMLLanguage,
                loading: false,
                theme: getEditorTheme(effectiveTheme),
                options: {
                    wordWrap: 'off',
                    mouseWheelZoom: false,
                    domReadOnly: true,
                },
            }}
        />
    );
};
