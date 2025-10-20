import { Input } from '@/components/input/input';
import type { DBTable } from '@/lib/domain';
import { FileType2, X, SquarePlus, CircleDotDashed } from 'lucide-react';
import React, {
    useEffect,
    useState,
    useRef,
    useCallback,
    useMemo,
} from 'react';
import { TableEditModeField } from './table-edit-mode-field';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/scroll-area/scroll-area';
import { Button } from '@/components/button/button';
import { ColorPicker } from '@/components/color-picker/color-picker';
import { Separator } from '@/components/separator/separator';
import { useChartDB } from '@/hooks/use-chartdb';
import { useUpdateTable } from '@/hooks/use-update-table';
import { useTranslation } from 'react-i18next';
import { useLayout } from '@/hooks/use-layout';
import { SelectBox } from '@/components/select-box/select-box';
import type { SelectBoxOption } from '@/components/select-box/select-box';
import {
    databasesWithSchemas,
    schemaNameToSchemaId,
} from '@/lib/domain/db-schema';
import type { DBSchema } from '@/lib/domain/db-schema';
import { defaultSchemas } from '@/lib/data/default-schemas';

export interface TableEditModeProps {
    table: DBTable;
    color: string;
    focusFieldId?: string;
    onClose: () => void;
}

export const TableEditMode: React.FC<TableEditModeProps> = React.memo(
    ({ table, color, focusFieldId: focusFieldIdProp, onClose }) => {
        const containerRef = useRef<HTMLDivElement>(null);
        const scrollAreaRef = useRef<HTMLDivElement>(null);
        const fieldRefs = useRef<Map<string, HTMLDivElement>>(new Map());
        const [isVisible, setIsVisible] = useState(false);
        const { createField, updateTable, schemas, databaseType } =
            useChartDB();
        const { t } = useTranslation();
        const { openTableFromSidebar, selectSidebarSection } = useLayout();
        const { tableName, handleTableNameChange } = useUpdateTable(table);
        const [focusFieldId, setFocusFieldId] = useState<string | undefined>(
            focusFieldIdProp
        );
        const inputRef = useRef<HTMLInputElement>(null);

        // Schema-related state
        const [isCreatingNewSchema, setIsCreatingNewSchema] = useState(false);
        const [newSchemaName, setNewSchemaName] = useState('');
        const [selectedSchemaId, setSelectedSchemaId] = useState<string>(() =>
            table.schema ? schemaNameToSchemaId(table.schema) : ''
        );

        // Sync selectedSchemaId when table.schema changes
        useEffect(() => {
            setSelectedSchemaId(
                table.schema ? schemaNameToSchemaId(table.schema) : ''
            );
        }, [table.schema]);

        const supportsSchemas = useMemo(
            () => databasesWithSchemas.includes(databaseType),
            [databaseType]
        );

        const defaultSchemaName = useMemo(
            () => defaultSchemas?.[databaseType],
            [databaseType]
        );

        const schemaOptions: SelectBoxOption[] = useMemo(
            () =>
                schemas.map((schema) => ({
                    value: schema.id,
                    label: schema.name,
                })),
            [schemas]
        );

        useEffect(() => {
            setFocusFieldId(focusFieldIdProp);
            if (!focusFieldIdProp) {
                inputRef.current?.select();
            }
        }, [focusFieldIdProp]);

        // Callback to store field refs
        const setFieldRef = useCallback((fieldId: string) => {
            return (element: HTMLDivElement | null) => {
                if (element) {
                    fieldRefs.current.set(fieldId, element);
                } else {
                    fieldRefs.current.delete(fieldId);
                }
            };
        }, []);

        useEffect(() => {
            // Trigger animation after mount
            requestAnimationFrame(() => {
                setIsVisible(true);
            });
        }, []);

        const scrollToFieldId = useCallback((fieldId: string) => {
            const fieldElement = fieldRefs.current.get(fieldId);
            if (fieldElement) {
                fieldElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                });
            }
        }, []);

        // Scroll to focused field when component mounts
        useEffect(() => {
            if (focusFieldId) {
                scrollToFieldId(focusFieldId);
            }
        }, [focusFieldId, scrollToFieldId]);

        // Handle wheel events: allow zoom to pass through, but handle scroll locally
        useEffect(() => {
            const handleWheel = (e: WheelEvent) => {
                // If Ctrl or Cmd is pressed, it's a zoom gesture - let it pass through to canvas
                if (e.ctrlKey || e.metaKey) {
                    return;
                }

                // Otherwise, it's a scroll - stop propagation to prevent canvas panning
                e.stopPropagation();
            };

            const scrollArea = scrollAreaRef.current;
            if (scrollArea) {
                // Use passive: false to allow preventDefault if needed
                scrollArea.addEventListener('wheel', handleWheel, {
                    passive: false,
                });

                return () => {
                    scrollArea.removeEventListener('wheel', handleWheel);
                };
            }
        }, []);

        const handleAddField = useCallback(async () => {
            const field = await createField(table.id);

            if (field.id) {
                setFocusFieldId(field.id);
            }
        }, [createField, table.id]);

        const handleColorChange = useCallback(
            (newColor: string) => {
                updateTable(table.id, { color: newColor });
            },
            [updateTable, table.id]
        );

        const handleSchemaChange = useCallback(
            (schemaId: string) => {
                const schema = schemas.find((s) => s.id === schemaId);
                if (schema) {
                    updateTable(table.id, { schema: schema.name });
                    setSelectedSchemaId(schemaId);
                }
            },
            [schemas, updateTable, table.id]
        );

        const handleCreateNewSchema = useCallback(() => {
            if (newSchemaName.trim()) {
                const trimmedName = newSchemaName.trim();
                const newSchema: DBSchema = {
                    id: schemaNameToSchemaId(trimmedName),
                    name: trimmedName,
                    tableCount: 0,
                };
                updateTable(table.id, { schema: newSchema.name });
                setSelectedSchemaId(newSchema.id);
                setIsCreatingNewSchema(false);
                setNewSchemaName('');
            }
        }, [newSchemaName, updateTable, table.id]);

        const handleToggleSchemaMode = useCallback(() => {
            if (isCreatingNewSchema && newSchemaName.trim()) {
                // If we're leaving create mode with a value, create the schema
                handleCreateNewSchema();
            } else {
                // Otherwise just toggle modes
                setIsCreatingNewSchema(!isCreatingNewSchema);
                setNewSchemaName('');
            }
        }, [isCreatingNewSchema, newSchemaName, handleCreateNewSchema]);

        const openTableInEditor = useCallback(() => {
            selectSidebarSection('tables');
            openTableFromSidebar(table.id);
        }, [selectSidebarSection, openTableFromSidebar, table.id]);

        return (
            <div
                ref={containerRef}
                className={cn(
                    'flex z-50 border-slate-500 dark:border-slate-700 flex-col border-2 bg-slate-50 dark:bg-slate-950 rounded-lg shadow-lg absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-auto transition-all duration-100 ease-out',
                    {
                        'opacity-100 scale-100': isVisible,
                        'opacity-0 scale-95': !isVisible,
                    }
                )}
                style={{
                    minHeight: '300px',
                    minWidth: '350px',
                    height: 'max(calc(100% + 48px), 200px)',
                    width: 'max(calc(100% + 48px), 300px)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    className="h-2 cursor-move rounded-t-[6px]"
                    style={{ backgroundColor: color }}
                ></div>
                <div className="group flex h-9 cursor-move items-center justify-between gap-2 bg-slate-200 px-2 dark:bg-slate-900">
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                        {supportsSchemas && !isCreatingNewSchema && (
                            <SelectBox
                                options={schemaOptions}
                                value={selectedSchemaId}
                                onChange={(value) =>
                                    handleSchemaChange(value as string)
                                }
                                placeholder={
                                    defaultSchemaName || 'Select schema'
                                }
                                className="h-6 min-h-6 w-20 shrink-0 rounded-sm border-slate-600 bg-background py-0 pl-2 pr-0.5 text-sm"
                                popoverClassName="w-[200px]"
                                commandOnMouseDown={(e) => e.stopPropagation()}
                                commandOnClick={(e) => e.stopPropagation()}
                                footerButtons={
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full justify-center rounded-none text-xs"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggleSchemaMode();
                                        }}
                                    >
                                        <SquarePlus className="!size-3.5" />
                                        Create new schema
                                    </Button>
                                }
                            />
                        )}
                        {supportsSchemas && isCreatingNewSchema && (
                            <Input
                                value={newSchemaName}
                                onChange={(e) =>
                                    setNewSchemaName(e.target.value)
                                }
                                placeholder={`Enter schema name${defaultSchemaName ? ` (e.g. ${defaultSchemaName})` : ''}`}
                                className="h-6 w-28 shrink-0 rounded-sm border-slate-600 bg-background text-sm"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleCreateNewSchema();
                                    } else if (e.key === 'Escape') {
                                        handleToggleSchemaMode();
                                    }
                                }}
                                onBlur={handleToggleSchemaMode}
                                autoFocus
                            />
                        )}
                        <Input
                            ref={inputRef}
                            className="h-6 flex-1 rounded-sm border-slate-600 bg-background text-sm"
                            placeholder="Table name"
                            value={tableName}
                            onChange={(e) =>
                                handleTableNameChange(e.target.value)
                            }
                        />
                    </div>
                    <div className="flex shrink-0 flex-row gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="size-6 p-0 text-slate-500 hover:bg-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                            onClick={openTableInEditor}
                        >
                            <CircleDotDashed className="size-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="size-6 p-0 hover:bg-slate-300 dark:hover:bg-slate-700"
                            onClick={onClose}
                        >
                            <X className="size-4" />
                        </Button>
                    </div>
                </div>

                <ScrollArea ref={scrollAreaRef} className="nodrag flex-1 p-2">
                    {table.fields.map((field) => (
                        <div key={field.id} ref={setFieldRef(field.id)}>
                            <TableEditModeField
                                table={table}
                                field={field}
                                focused={focusFieldId === field.id}
                                databaseType={databaseType}
                            />
                        </div>
                    ))}
                </ScrollArea>

                <Separator />
                <div className="flex cursor-move items-center justify-between p-2">
                    <div className="flex items-center gap-2">
                        {!table.isView ? (
                            <>
                                <ColorPicker
                                    color={color}
                                    onChange={handleColorChange}
                                    popoverOnMouseDown={(e) =>
                                        e.stopPropagation()
                                    }
                                    popoverOnClick={(e) => e.stopPropagation()}
                                />
                            </>
                        ) : (
                            <div />
                        )}
                        <Button
                            variant="outline"
                            className="h-8 p-2 text-xs"
                            onClick={handleAddField}
                        >
                            <FileType2 className="mr-1 h-4" />
                            {t('side_panel.tables_section.table.add_field')}
                        </Button>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                        {table.fields.length}{' '}
                        {t('side_panel.tables_section.table.fields')}
                    </span>
                </div>
            </div>
        );
    }
);

TableEditMode.displayName = 'TableEditMode';
