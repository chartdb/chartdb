import { Button } from '@/components/button/button';
import { DiagramIcon } from '@/components/diagram-icon/diagram-icon';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogInternalContent,
    DialogTitle,
} from '@/components/dialog/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/table/table';
import { useConfig } from '@/hooks/use-config';
import { useDialog } from '@/hooks/use-dialog';
import { useStorage } from '@/hooks/use-storage';
import type { Diagram } from '@/lib/domain/diagram';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { BaseDialogProps } from '../common/base-dialog-props';
import { useDebounce } from '@/hooks/use-debounce';

export interface OpenDiagramDialogProps extends BaseDialogProps {}

export const OpenDiagramDialog: React.FC<OpenDiagramDialogProps> = ({
    dialog,
}) => {
    const { closeOpenDiagramDialog } = useDialog();
    const { t } = useTranslation();
    const { updateConfig } = useConfig();
    const navigate = useNavigate();
    const { listDiagrams } = useStorage();
    const [diagrams, setDiagrams] = useState<Diagram[]>([]);
    const [selectedDiagramId, setSelectedDiagramId] = useState<
        string | undefined
    >();

    useEffect(() => {
        setSelectedDiagramId(undefined);
    }, [dialog.open]);

    useEffect(() => {
        const fetchDiagrams = async () => {
            const diagrams = await listDiagrams({ includeTables: true });
            setDiagrams(
                diagrams.sort(
                    (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
                )
            );
        };
        fetchDiagrams();
    }, [listDiagrams, setDiagrams, dialog.open]);

    const openDiagram = useCallback(
        (diagramId: string) => {
            if (diagramId) {
                updateConfig({ defaultDiagramId: diagramId });
                navigate(`/diagrams/${diagramId}`);
            }
        },
        [updateConfig, navigate]
    );

    const handleRowKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLTableRowElement>) => {
            const element = e.target as HTMLElement;
            const diagramId = element.getAttribute('data-diagram-id');
            const selectionIndexAttr = element.getAttribute(
                'data-selection-index'
            );

            if (!diagramId || !selectionIndexAttr) return;

            const selectionIndex = parseInt(selectionIndexAttr, 10);

            switch (e.key) {
                case 'Enter':
                case ' ':
                    e.preventDefault();
                    openDiagram(diagramId);
                    closeOpenDiagramDialog();
                    break;
                case 'ArrowDown': {
                    e.preventDefault();

                    (
                        document.querySelector(
                            `[data-selection-index="${selectionIndex + 1}"]`
                        ) as HTMLElement
                    )?.focus();
                    break;
                }
                case 'ArrowUp': {
                    e.preventDefault();

                    (
                        document.querySelector(
                            `[data-selection-index="${selectionIndex - 1}"]`
                        ) as HTMLElement
                    )?.focus();
                    break;
                }
            }
        },
        [openDiagram, closeOpenDiagramDialog]
    );

    const onFocusHandler = useDebounce(
        (diagramId: string) => setSelectedDiagramId(diagramId),
        50
    );

    return (
        <Dialog
            {...dialog}
            onOpenChange={(open) => {
                if (!open) {
                    closeOpenDiagramDialog();
                }
            }}
        >
            <DialogContent
                className="flex h-[30rem] max-h-screen flex-col overflow-y-auto md:min-w-[80vw] xl:min-w-[55vw]"
                showClose
            >
                <DialogHeader>
                    <DialogTitle>{t('open_diagram_dialog.title')}</DialogTitle>
                    <DialogDescription>
                        {t('open_diagram_dialog.description')}
                    </DialogDescription>
                </DialogHeader>
                <DialogInternalContent>
                    <div className="flex flex-1 items-center justify-center">
                        <Table>
                            <TableHeader className="sticky top-0 bg-background">
                                <TableRow>
                                    <TableHead />
                                    <TableHead>
                                        {t(
                                            'open_diagram_dialog.table_columns.name'
                                        )}
                                    </TableHead>
                                    <TableHead className="hidden items-center sm:inline-flex">
                                        {t(
                                            'open_diagram_dialog.table_columns.created_at'
                                        )}
                                    </TableHead>
                                    <TableHead>
                                        {t(
                                            'open_diagram_dialog.table_columns.last_modified'
                                        )}
                                    </TableHead>
                                    <TableHead className="text-center">
                                        {t(
                                            'open_diagram_dialog.table_columns.tables_count'
                                        )}
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {diagrams.map((diagram, index) => (
                                    <TableRow
                                        key={diagram.id}
                                        data-state={`${selectedDiagramId === diagram.id ? 'selected' : ''}`}
                                        data-diagram-id={diagram.id}
                                        data-selection-index={index}
                                        tabIndex={0}
                                        onFocus={() =>
                                            onFocusHandler(diagram.id)
                                        }
                                        className="focus:bg-accent focus:outline-none"
                                        onClick={(e) => {
                                            switch (e.detail) {
                                                case 1:
                                                    setSelectedDiagramId(
                                                        diagram.id
                                                    );
                                                    break;
                                                case 2:
                                                    openDiagram(diagram.id);
                                                    closeOpenDiagramDialog();
                                                    break;
                                                default:
                                                    setSelectedDiagramId(
                                                        diagram.id
                                                    );
                                            }
                                        }}
                                        onKeyDown={handleRowKeyDown}
                                    >
                                        <TableCell className="table-cell">
                                            <div className="flex justify-center">
                                                <DiagramIcon
                                                    databaseType={
                                                        diagram.databaseType
                                                    }
                                                    databaseEdition={
                                                        diagram.databaseEdition
                                                    }
                                                />
                                            </div>
                                        </TableCell>
                                        <TableCell>{diagram.name}</TableCell>
                                        <TableCell className="hidden items-center sm:table-cell">
                                            {diagram.createdAt.toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            {diagram.updatedAt.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {diagram.tables?.length}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </DialogInternalContent>

                <DialogFooter className="flex !justify-between gap-2">
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">
                            {t('open_diagram_dialog.cancel')}
                        </Button>
                    </DialogClose>
                    <DialogClose asChild>
                        <Button
                            type="submit"
                            disabled={!selectedDiagramId}
                            onClick={() => openDiagram(selectedDiagramId ?? '')}
                        >
                            {t('open_diagram_dialog.open')}
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
