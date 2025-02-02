import React, { useMemo } from 'react';
import type { DBTable } from '@/lib/domain/db-table';
import { useChartDB } from '@/hooks/use-chartdb';
import { useTheme } from '@/hooks/use-theme';
import { CodeSnippet } from '@/components/code-snippet/code-snippet';
import type { EffectiveTheme } from '@/context/theme-context/theme-context';
import { importer } from '@dbml/core';
import { exportBaseSQL } from '@/lib/data/export-metadata/export-sql-script';
import type { Diagram } from '@/lib/domain/diagram';
import { useToast } from '@/components/toast/use-toast';
import { setupDBMLLanguage } from '@/components/code-snippet/languages/dbml-language';

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

    const generateDBML = useMemo(() => {
        const filteredDiagram: Diagram = {
            ...currentDiagram,
            tables: filteredTables,
            relationships:
                currentDiagram.relationships?.filter((rel) => {
                    const sourceTable = filteredTables.find(
                        (t) => t.id === rel.sourceTableId
                    );
                    const targetTable = filteredTables.find(
                        (t) => t.id === rel.targetTableId
                    );

                    return sourceTable && targetTable;
                }) ?? [],
        } satisfies Diagram;

        const filteredDiagramWithoutSpaces: Diagram = {
            ...filteredDiagram,
            tables:
                filteredDiagram.tables?.map((table) => ({
                    ...table,
                    name: table.name.replace(/\s/g, '_'),
                    fields: table.fields.map((field) => ({
                        ...field,
                        name: field.name.replace(/\s/g, '_'),
                    })),
                    indexes: table.indexes?.map((index) => ({
                        ...index,
                        name: index.name.replace(/\s/g, '_'),
                    })),
                })) ?? [],
        } satisfies Diagram;

        const baseScript = exportBaseSQL(filteredDiagramWithoutSpaces);

        try {
            return importer.import(baseScript, 'postgres');
        } catch (e) {
            console.error(e);

            toast({
                title: 'Error',
                description:
                    'Failed to generate DBML. We would appreciate if you could report this issue!',
                variant: 'destructive',
            });

            return '';
        }
    }, [currentDiagram, filteredTables, toast]);

    return (
        <CodeSnippet
            code={generateDBML}
            className="my-0.5"
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
