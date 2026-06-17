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
import { DiagramRowActionsMenu } from './diagram-row-actions-menu/diagram-row-actions-menu';
import { useLocalSchemaPackages } from '@/hooks/use-local-schema-packages';
import { Badge } from '@/components/badge/badge';
import { shouldRenderLocalSchemaPackages } from './open-diagram-dialog-utils';

export interface OpenDiagramDialogProps extends BaseDialogProps {
    canClose?: boolean;
}

export const OpenDiagramDialog: React.FC<OpenDiagramDialogProps> = ({
    dialog,
    canClose = true,
}) => {
    const { closeOpenDiagramDialog, openCreateDiagramDialog } = useDialog();
    const { t } = useTranslation();
    const { updateConfig } = useConfig();
    const navigate = useNavigate();
    const { listDiagrams } = useStorage();
    const {
        packages: localPackages,
        isLoading: isLoadingLocalPackages,
        isUnavailable: areLocalPackagesUnavailable,
        refreshPackages,
        openPackage,
    } = useLocalSchemaPackages();
    const [diagrams, setDiagrams] = useState<Diagram[]>([]);
    const [selectedDiagramId, setSelectedDiagramId] = useState<
        string | undefined
    >();

    const fetchDiagrams = useCallback(async () => {
        const diagrams = await listDiagrams({ includeTables: true });
        setDiagrams(
            diagrams.sort(
                (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
            )
        );
    }, [listDiagrams]);

    useEffect(() => {
        if (!dialog.open) {
            return;
        }
        setSelectedDiagramId(undefined);
        fetchDiagrams();
        refreshPackages();
    }, [dialog.open, fetchDiagrams, refreshPackages]);

    const openDiagram = useCallback(
        (diagramId: string) => {
            if (diagramId) {
                updateConfig({ config: { defaultDiagramId: diagramId } });
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
    const shouldShowLocalPackages = shouldRenderLocalSchemaPackages({
        isDev: import.meta.env.DEV,
        isUnavailable: areLocalPackagesUnavailable,
        isLoading: isLoadingLocalPackages,
        packagesCount: localPackages.length,
    });

    return (
        <Dialog
            {...dialog}
            onOpenChange={(open) => {
                if (!open && canClose) {
                    closeOpenDiagramDialog();
                }
            }}
        >
            <DialogContent
                className="flex h-[30rem] max-h-screen flex-col overflow-y-auto md:min-w-[80vw] xl:min-w-[55vw]"
                showClose={canClose}
            >
                <DialogHeader>
                    <DialogTitle>{t('open_diagram_dialog.title')}</DialogTitle>
                    <DialogDescription>
                        {t('open_diagram_dialog.description')}
                    </DialogDescription>
                </DialogHeader>
                <DialogInternalContent>
                    <div className="flex flex-1 flex-col gap-4">
                        {shouldShowLocalPackages ? (
                            <div>
                                <div className="mb-2 flex items-center gap-2 px-2 text-xs font-medium text-muted-foreground">
                                    <span>Local schemas</span>
                                    <span className="font-normal">
                                        schemas/
                                    </span>
                                </div>
                                <Table>
                                    <TableBody>
                                        {isLoadingLocalPackages ? (
                                            <TableRow>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    Loading local packages...
                                                </TableCell>
                                            </TableRow>
                                        ) : null}
                                        {localPackages.map((schemaPackage) => (
                                            <TableRow
                                                key={schemaPackage.packageName}
                                            >
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">
                                                            {
                                                                schemaPackage.diagramName
                                                            }
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {
                                                                schemaPackage.relativePath
                                                            }
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                                                    {new Date(
                                                        schemaPackage.updatedAt
                                                    ).toLocaleString()}
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell">
                                                    {schemaPackage.hasDbml ? (
                                                        <Badge
                                                            variant="secondary"
                                                            className="w-fit text-xs"
                                                        >
                                                            DBML
                                                        </Badge>
                                                    ) : null}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="secondary"
                                                        onClick={() => {
                                                            void openPackage(
                                                                schemaPackage
                                                            ).catch(
                                                                () => undefined
                                                            );
                                                        }}
                                                    >
                                                        Open
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : null}
                        <div className={shouldShowLocalPackages ? 'pt-1' : ''}>
                            {shouldShowLocalPackages || diagrams.length > 0 ? (
                                <div className="mb-2 px-2 text-xs font-medium text-muted-foreground">
                                    This browser
                                </div>
                            ) : null}
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
                                        <TableHead />
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
                                            <TableCell>
                                                {diagram.name}
                                            </TableCell>
                                            <TableCell className="hidden items-center sm:table-cell">
                                                {diagram.createdAt.toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                {diagram.updatedAt.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {diagram.tables?.length}
                                            </TableCell>
                                            <TableCell className="items-center p-0 pr-1 text-right">
                                                <DiagramRowActionsMenu
                                                    diagram={diagram}
                                                    onOpen={() => {
                                                        openDiagram(diagram.id);
                                                        closeOpenDiagramDialog();
                                                    }}
                                                    numberOfDiagrams={
                                                        diagrams.length
                                                    }
                                                    refetch={fetchDiagrams}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </DialogInternalContent>

                <DialogFooter className="flex !justify-between gap-2">
                    {canClose ? (
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">
                                {t('open_diagram_dialog.cancel')}
                            </Button>
                        </DialogClose>
                    ) : (
                        <div />
                    )}
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                                closeOpenDiagramDialog();
                                openCreateDiagramDialog();
                            }}
                        >
                            {t('open_diagram_dialog.new_database')}
                        </Button>
                        <DialogClose asChild>
                            <Button
                                type="submit"
                                disabled={!selectedDiagramId}
                                onClick={() =>
                                    openDiagram(selectedDiagramId ?? '')
                                }
                            >
                                {t('open_diagram_dialog.open')}
                            </Button>
                        </DialogClose>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
