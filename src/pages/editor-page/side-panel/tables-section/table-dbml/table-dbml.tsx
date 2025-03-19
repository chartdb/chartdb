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
import { DatabaseType } from '@/lib/domain/database-type';

export interface TableDBMLProps {
    filteredTables: DBTable[];
}

const getEditorTheme = (theme: EffectiveTheme) => {
    return theme === 'dark' ? 'dbml-dark' : 'dbml-light';
};

const databaseTypeToImportFormat = (
    type: DatabaseType
): 'mysql' | 'postgres' | 'mssql' => {
    switch (type) {
        case DatabaseType.SQL_SERVER:
            return 'mssql';
        case DatabaseType.MYSQL:
        case DatabaseType.MARIADB:
            return 'mysql';
        case DatabaseType.POSTGRESQL:
        case DatabaseType.COCKROACHDB:
        case DatabaseType.SQLITE:
            return 'postgres';
        default:
            return 'postgres';
    }
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

        const baseScript = exportBaseSQL({
            diagram: filteredDiagramWithoutSpaces,
            targetDatabaseType: currentDiagram.databaseType,
            isDBMLFlow: true,
        });

        try {
            const importFormat = databaseTypeToImportFormat(
                currentDiagram.databaseType
            );
            return importer.import(baseScript, importFormat);
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
