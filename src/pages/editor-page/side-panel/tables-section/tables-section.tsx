import React, { useCallback, useMemo, useState } from 'react';
import { TableList } from './table-list/table-list';
import { Button } from '@/components/button/button';
import { Table, ListCollapse, X, Code } from 'lucide-react';
import { Input } from '@/components/input/input';
import type { Monaco } from '@monaco-editor/react';
import Editor from '@monaco-editor/react';
import type { DBTable } from '@/lib/domain/db-table';
import { shouldShowTablesBySchemaFilter } from '@/lib/domain/db-table';
import { useChartDB } from '@/hooks/use-chartdb';
import { useLayout } from '@/hooks/use-layout';
import { EmptyState } from '@/components/empty-state/empty-state';
import { ScrollArea } from '@/components/scroll-area/scroll-area';
import { useTranslation } from 'react-i18next';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/tooltip/tooltip';
import { useViewport } from '@xyflow/react';
import { useDialog } from '@/hooks/use-dialog';
import { useTheme } from '@/hooks/use-theme';

export interface TablesSectionProps {}

const setupDBMLLanguage = (monaco: Monaco) => {
    monaco.languages.register({ id: 'dbml' });

    // Define themes for DBML
    monaco.editor.defineTheme('dbml-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
            { token: 'keyword', foreground: '569CD6' },
            { token: 'string', foreground: 'CE9178' },
            { token: 'annotation', foreground: '9CDCFE' },
            { token: 'delimiter', foreground: 'D4D4D4' },
            { token: 'operator', foreground: 'D4D4D4' },
        ],
        colors: {},
    });

    monaco.editor.defineTheme('dbml-light', {
        base: 'vs',
        inherit: true,
        rules: [
            { token: 'keyword', foreground: '0000FF' },
            { token: 'string', foreground: 'A31515' },
            { token: 'annotation', foreground: '001080' },
            { token: 'delimiter', foreground: '000000' },
            { token: 'operator', foreground: '000000' },
        ],
        colors: {},
    });

    monaco.languages.setMonarchTokensProvider('dbml', {
        keywords: ['Table', 'Ref'],
        tokenizer: {
            root: [
                [/\b(Table|Ref)\b/, 'keyword'],
                [/\[.*?\]/, 'annotation'],
                [/".*?"/, 'string'],
                [/'.*?'/, 'string'],
                [/[{}]/, 'delimiter'],
                [/[<>]/, 'operator'],
            ],
        },
    });
};

const getEditorTheme = (theme: 'dark' | 'light') => {
    return theme === 'dark' ? 'vs-dark' : 'vs';
};

export const TablesSection: React.FC<TablesSectionProps> = () => {
    const { createTable, tables, filteredSchemas, schemas, relationships } =
        useChartDB();
    const { openTableSchemaDialog } = useDialog();
    const viewport = useViewport();
    const { t } = useTranslation();
    const { openTableFromSidebar } = useLayout();
    const [filterText, setFilterText] = React.useState('');
    const [showDBML, setShowDBML] = useState(false);
    const { theme } = useTheme();

    const filteredTables = useMemo(() => {
        const filterTableName: (table: DBTable) => boolean = (table) =>
            !filterText?.trim?.() ||
            table.name.toLowerCase().includes(filterText.toLowerCase());

        const filterSchema: (table: DBTable) => boolean = (table) =>
            shouldShowTablesBySchemaFilter(table, filteredSchemas);

        return tables.filter(filterSchema).filter(filterTableName);
    }, [tables, filterText, filteredSchemas]);

    const createTableWithLocation = useCallback(
        async (schema?: string) => {
            const padding = 80;
            const centerX =
                -viewport.x / viewport.zoom + padding / viewport.zoom;
            const centerY =
                -viewport.y / viewport.zoom + padding / viewport.zoom;
            const table = await createTable({
                x: centerX,
                y: centerY,
                schema,
            });
            openTableFromSidebar(table.id);
        },
        [
            createTable,
            openTableFromSidebar,
            viewport.x,
            viewport.y,
            viewport.zoom,
        ]
    );

    const handleCreateTable = useCallback(async () => {
        setFilterText('');

        if ((filteredSchemas?.length ?? 0) > 1) {
            openTableSchemaDialog({
                onConfirm: createTableWithLocation,
                schemas: schemas.filter((schema) =>
                    filteredSchemas?.includes(schema.id)
                ),
            });
        } else {
            const schema =
                filteredSchemas?.length === 1
                    ? schemas.find((s) => s.id === filteredSchemas[0])?.name
                    : undefined;
            createTableWithLocation(schema);
        }
    }, [
        createTableWithLocation,
        filteredSchemas,
        openTableSchemaDialog,
        schemas,
        setFilterText,
    ]);

    const handleClearFilter = useCallback(() => {
        setFilterText('');
    }, []);

    const generateDBML = useCallback(() => {
        let dbml = '\n';

        // Generate Tables
        tables.forEach((table) => {
            dbml += `Table ${table.name} {\n`;
            table.fields?.forEach((field) => {
                // Temp fix for 'varchar' to be text
                if (field.type.name.toLowerCase().includes('character')) {
                    field.type.name = 'varchar';
                }

                let fieldLine = `  ${field.name} ${field.type.name}`;
                if (
                    field.primaryKey ||
                    field.unique ||
                    !field.nullable ||
                    field.default
                ) {
                    const attributes = [];
                    if (field.primaryKey) attributes.push('primary key');
                    if (field.unique && !field.primaryKey)
                        attributes.push('unique');
                    if (!field.nullable) attributes.push('not null');
                    if (field.default)
                        attributes.push(`default: ${field.default}`);

                    fieldLine += ` [${attributes.join(', ')}]`;
                }
                dbml += fieldLine + '\n';
            });
            dbml += '}\n\n';
        });

        // Generate Relationships
        relationships?.forEach((rel) => {
            const sourceTable = tables.find((t) => t.id === rel.sourceTableId);
            const targetTable = tables.find((t) => t.id === rel.targetTableId);
            if (sourceTable && targetTable) {
                const sourceField = sourceTable.fields.find(
                    (f) => f.id === rel.sourceFieldId
                );
                const targetField = targetTable.fields.find(
                    (f) => f.id === rel.targetFieldId
                );
                if (sourceField && targetField) {
                    const cardinality =
                        rel.sourceCardinality === 'many' ? '>' : '<';
                    dbml += `Ref: ${sourceTable.name}.${sourceField.name} ${cardinality} ${targetTable.name}.${targetField.name}\n\n`;
                }
            }
        });

        return dbml;
    }, [tables, relationships]);

    return (
        <section
            className="flex flex-1 flex-col overflow-hidden px-2"
            data-vaul-no-drag
        >
            <div className="flex items-center justify-between gap-4 py-1">
                <div>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span>
                                <Button
                                    variant="ghost"
                                    className="size-8 p-0"
                                    onClick={() => setShowDBML(!showDBML)}
                                >
                                    {showDBML ? (
                                        <ListCollapse className="size-4" />
                                    ) : (
                                        <Code className="size-4" />
                                    )}
                                </Button>
                            </span>
                        </TooltipTrigger>
                        <TooltipContent>
                            {showDBML
                                ? t('side_panel.tables_section.show_list')
                                : t('side_panel.tables_section.show_dbml')}
                        </TooltipContent>
                    </Tooltip>
                </div>
                <div className="flex-1">
                    <Input
                        type="text"
                        placeholder={t('side_panel.tables_section.filter')}
                        className="h-8 w-full focus-visible:ring-0"
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                    />
                </div>
                <Button
                    variant="secondary"
                    className="h-8 p-2 text-xs"
                    onClick={handleCreateTable}
                >
                    <Table className="h-4" />
                    {t('side_panel.tables_section.add_table')}
                </Button>
            </div>
            <div className="flex flex-1 flex-col overflow-hidden">
                {showDBML ? (
                    <Editor
                        height="100%"
                        defaultLanguage="dbml"
                        value={generateDBML()}
                        beforeMount={setupDBMLLanguage}
                        theme={getEditorTheme(theme)}
                        options={{
                            readOnly: true,
                            minimap: { enabled: false },
                            scrollBeyondLastLine: false,
                            wordWrap: 'on',
                        }}
                    />
                ) : (
                    <ScrollArea className="h-full">
                        {tables.length === 0 ? (
                            <EmptyState
                                title={t(
                                    'side_panel.tables_section.empty_state.title'
                                )}
                                description={t(
                                    'side_panel.tables_section.empty_state.description'
                                )}
                                className="mt-20"
                            />
                        ) : filterText && filteredTables.length === 0 ? (
                            <div className="mt-10 flex flex-col items-center gap-2">
                                <div className="text-sm text-muted-foreground">
                                    {t('side_panel.tables_section.no_results')}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleClearFilter}
                                    className="gap-1"
                                >
                                    <X className="size-3.5" />
                                    {t('side_panel.tables_section.clear')}
                                </Button>
                            </div>
                        ) : (
                            <TableList tables={filteredTables} />
                        )}
                    </ScrollArea>
                )}
            </div>
        </section>
    );
};
