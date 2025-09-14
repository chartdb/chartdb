import { Input } from '@/components/input/input';
import type { DBTable } from '@/lib/domain';
import { FileType2, X } from 'lucide-react';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { TableEditModeField } from './table-edit-mode-field';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/scroll-area/scroll-area';
import { Button } from '@/components/button/button';
import { ColorPicker } from '@/components/color-picker/color-picker';
import { Separator } from '@/components/separator/separator';
import { useChartDB } from '@/hooks/use-chartdb';
import { useUpdateTable } from '@/hooks/use-update-table';
import { useTranslation } from 'react-i18next';

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
        const { createField, updateTable } = useChartDB();
        const { t } = useTranslation();
        const { tableName, handleTableNameChange } = useUpdateTable(table);
        const [focusFieldId, setFocusFieldId] = useState<string | undefined>(
            focusFieldIdProp
        );
        const inputRef = useRef<HTMLInputElement>(null);

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
                    className="h-2 rounded-t-[6px]"
                    style={{ backgroundColor: color }}
                ></div>
                <div className="group flex h-9 items-center justify-between gap-2 bg-slate-200 px-2 dark:bg-slate-900">
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                        <ColorPicker
                            color={color}
                            onChange={handleColorChange}
                            disabled={table.isView}
                            popoverOnMouseDown={(e) => e.stopPropagation()}
                            popoverOnClick={(e) => e.stopPropagation()}
                        />
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
                    <Button
                        variant="ghost"
                        size="sm"
                        className="size-6 p-0 hover:bg-slate-300 dark:hover:bg-slate-700"
                        onClick={onClose}
                    >
                        <X className="size-4" />
                    </Button>
                </div>

                <ScrollArea ref={scrollAreaRef} className="nodrag flex-1 p-2">
                    {table.fields.map((field) => (
                        <div key={field.id} ref={setFieldRef(field.id)}>
                            <TableEditModeField
                                table={table}
                                field={field}
                                focused={focusFieldId === field.id}
                            />
                        </div>
                    ))}
                </ScrollArea>

                <Separator />
                <div className="flex items-center justify-between p-2">
                    <Button
                        variant="outline"
                        className="h-8 p-2 text-xs"
                        onClick={handleAddField}
                    >
                        <FileType2 className="mr-1 h-4" />
                        {t('side_panel.tables_section.table.add_field')}
                    </Button>
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
