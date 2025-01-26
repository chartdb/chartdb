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
import { useToast } from '@/components/toast/use-toast';

export interface TablesSectionProps {}

let activeReadOnlyToast = false;

const setupDBMLLanguage = (monaco: Monaco) => {
    monaco.languages.register({ id: 'dbml' });

    // Define themes for DBML
    monaco.editor.defineTheme('dbml-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
            { token: 'keyword', foreground: '569CD6' }, // Table, Ref keywords
            { token: 'string', foreground: 'CE9178' }, // Strings
            { token: 'annotation', foreground: '9CDCFE' }, // [annotations]
            { token: 'delimiter', foreground: 'D4D4D4' }, // Braces {}
            { token: 'operator', foreground: 'D4D4D4' }, // Operators
            { token: 'datatype', foreground: '4EC9B0' }, // Data types
        ],
        colors: {},
    });

    monaco.editor.defineTheme('dbml-light', {
        base: 'vs',
        inherit: true,
        rules: [
            { token: 'keyword', foreground: '0000FF' }, // Table, Ref keywords
            { token: 'string', foreground: 'A31515' }, // Strings
            { token: 'annotation', foreground: '001080' }, // [annotations]
            { token: 'delimiter', foreground: '000000' }, // Braces {}
            { token: 'operator', foreground: '000000' }, // Operators
            { token: 'type', foreground: '267F99' }, // Data types
        ],
        colors: {},
    });

    // Create a regex pattern from the datatypes array
    const datatypes = [
        'varchar',
        'char',
        'text',
        'int',
        'bigint',
        'boolean',
        'date',
        'timestamp',
        'numeric',
        'decimal',
        'double',
        'float',
        'enum',
        'jsonb',
        'uuid',
        'time',
        'integer',
        'character',
        'character_varying',
        'smallint',
        'tinyint',
        'datetime',
        'timestamp_without_time_zone',
        'timestamp_with_time_zone',
    ];
    const datatypePattern = datatypes.join('|');

    monaco.languages.setMonarchTokensProvider('dbml', {
        keywords: ['Table', 'Ref'],
        datatypes: datatypes,
        tokenizer: {
            root: [
                [/\b(Table|Ref)\b/, 'keyword'],
                [/\[.*?\]/, 'annotation'],
                [/".*?"/, 'string'],
                [/'.*?'/, 'string'],
                [/[{}]/, 'delimiter'],
                [/[<>]/, 'operator'],
                [new RegExp(`\\b(${datatypePattern})\\b`, 'i'), 'type'], // Added 'i' flag for case-insensitive matching
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
    const { toast } = useToast();

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

        // Use filteredTables instead of tables for sorting
        const sortedTables = [...filteredTables].sort((table1, table2) => {
            // if one table has order and the other doesn't, the one with order should come first
            if (table1.order && table2.order === undefined) {
                return -1;
            }

            if (table1.order === undefined && table2.order) {
                return 1;
            }

            // if both tables have order, sort by order
            if (table1.order !== undefined && table2.order !== undefined) {
                return table1.order - table2.order;
            }

            // if both tables don't have order, sort by name
            if (table1.isView === table2.isView) {
                // Both are either tables or views, so sort alphabetically by name
                return table1.name.localeCompare(table2.name);
            }
            // If one is a view and the other is not, put tables first
            return table1.isView ? 1 : -1;
        });

        // Generate Tables
        sortedTables.forEach((table) => {
            // Add table with note if description exists
            if (table.comments) {
                dbml += `Table ${table.name} [note: "${table.comments}"] {\n`;
            } else {
                dbml += `Table ${table.name} {\n`;
            }

            table.fields?.forEach((field) => {
                // Temp fix for 'varchar' to be text
                if (field.type.name.toLowerCase().includes('character')) {
                    field.type.name = 'varchar';
                }

                let fieldLine = `  ${field.name} ${field.type.name}`;

                // Collect field attributes
                const attributes = [];
                if (field.primaryKey) attributes.push('primary key');
                if (field.unique && !field.primaryKey)
                    attributes.push('unique');
                if (!field.nullable) attributes.push('not null');
                if (field.default) attributes.push(`default: ${field.default}`);

                // Add field attributes if any exist
                if (attributes.length > 0) {
                    fieldLine += ` [${attributes.join(', ')}`;
                    // Add field note if description exists
                    if (field.comments) {
                        fieldLine += `, note: "${field.comments}"`;
                    }
                    fieldLine += ']';
                }
                // Add field note if description exists but no other attributes
                else if (field.comments) {
                    fieldLine += ` [note: "${field.comments}"]`;
                }

                dbml += fieldLine + '\n';
            });
            dbml += '}\n\n';
        });

        // Filter relationships to only include those between filtered tables
        const filteredRelationships = relationships?.filter((rel) => {
            const sourceTable = filteredTables.find(
                (t) => t.id === rel.sourceTableId
            );
            const targetTable = filteredTables.find(
                (t) => t.id === rel.targetTableId
            );
            const included = sourceTable || targetTable;

            return included;
        });

        // Generate Relationships
        filteredRelationships?.forEach((rel) => {
            const sourceTable = tables.find((t) => t.id === rel.sourceTableId);
            const targetTable = tables.find((t) => t.id === rel.targetTableId);
            const sourceField = sourceTable?.fields.find(
                (f) => f.id === rel.sourceFieldId
            );
            const targetField = targetTable?.fields.find(
                (f) => f.id === rel.targetFieldId
            );
            if (sourceField && targetField) {
                const cardinality =
                    rel.sourceCardinality === 'many' ? '>' : '<';
                dbml += `Ref: ${sourceTable?.name}.${sourceField.name} ${cardinality} ${targetTable?.name}.${targetField.name}\n\n`;
            }
        });

        console.log('Generated DBML:', dbml);
        return dbml;
    }, [tables, filteredTables, relationships]);

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
                        onMount={(editor) => {
                            console.log('Editor mounted');
                            const messageController = editor.getContribution(
                                'editor.contrib.messageController'
                            );
                            console.log(
                                'Message controller:',
                                messageController
                            );

                            // Make sure the editor is read-only
                            editor.updateOptions({
                                readOnly: true,
                                domReadOnly: true,
                            });

                            console.log('onMount');

                            // Add the message controller
                            editor.onKeyDown((e) => {
                                const isModifierKey = e.metaKey || e.ctrlKey;

                                if (!isModifierKey && !activeReadOnlyToast) {
                                    activeReadOnlyToast = true;

                                    toast({
                                        title: t('editor.read_only_mode'),
                                        description: t(
                                            'editor.read_only_mode_description'
                                        ),
                                        duration: 5000,
                                        className:
                                            'fixed top-12 left-4 w-full max-w-sm',
                                    });
                                    // Reset the flag after the toast is dismissed
                                    setTimeout(() => {
                                        activeReadOnlyToast = false;
                                    }, 5000); // Small delay to ensure smooth transitions
                                }
                            });
                        }}
                        theme={getEditorTheme(theme as 'dark' | 'light')}
                        options={{
                            readOnly: true,
                            minimap: { enabled: false },
                            scrollBeyondLastLine: false,
                            wordWrap: 'off',
                            mouseWheelZoom: false,
                            domReadOnly: true,
                            contextmenu: false,
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
