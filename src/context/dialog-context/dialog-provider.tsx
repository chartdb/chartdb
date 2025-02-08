import React, { useCallback, useState } from 'react';
import type { DialogContext } from './dialog-context';
import { dialogContext } from './dialog-context';
import { CreateDiagramDialog } from '@/dialogs/create-diagram-dialog/create-diagram-dialog';
import { OpenDiagramDialog } from '@/dialogs/open-diagram-dialog/open-diagram-dialog';
import type { ExportSQLDialogProps } from '@/dialogs/export-sql-dialog/export-sql-dialog';
import { ExportSQLDialog } from '@/dialogs/export-sql-dialog/export-sql-dialog';
import { DatabaseType } from '@/lib/domain/database-type';
import { CreateRelationshipDialog } from '@/dialogs/create-relationship-dialog/create-relationship-dialog';
import type { ImportDatabaseDialogProps } from '@/dialogs/import-database-dialog/import-database-dialog';
import { ImportDatabaseDialog } from '@/dialogs/import-database-dialog/import-database-dialog';
import type { TableSchemaDialogProps } from '@/dialogs/table-schema-dialog/table-schema-dialog';
import { TableSchemaDialog } from '@/dialogs/table-schema-dialog/table-schema-dialog';
import { emptyFn } from '@/lib/utils';
import { StarUsDialog } from '@/dialogs/star-us-dialog/star-us-dialog';
import type { ExportImageDialogProps } from '@/dialogs/export-image-dialog/export-image-dialog';
import { ExportImageDialog } from '@/dialogs/export-image-dialog/export-image-dialog';
import { ExportDiagramDialog } from '@/dialogs/export-diagram-dialog/export-diagram-dialog';
import { ImportDiagramDialog } from '@/dialogs/import-diagram-dialog/import-diagram-dialog';
import { BuckleDialog } from '@/dialogs/buckle-dialog/buckle-dialog';
import { ImportDBMLDialog } from '@/dialogs/import-dbml-dialog/import-dbml-dialog';

export const DialogProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const [openNewDiagramDialog, setOpenNewDiagramDialog] = useState(false);
    const [openOpenDiagramDialog, setOpenOpenDiagramDialog] = useState(false);

    const [openCreateRelationshipDialog, setOpenCreateRelationshipDialog] =
        useState(false);
    const [createRelationshipDialogParams, setCreateRelationshipDialogParams] =
        useState<{ sourceTableId?: string } | undefined>(undefined);
    const [openStarUsDialog, setOpenStarUsDialog] = useState(false);
    const [openBuckleDialog, setOpenBuckleDialog] = useState(false);

    // Export image dialog
    const [openExportImageDialog, setOpenExportImageDialog] = useState(false);
    const [exportImageDialogParams, setExportImageDialogParams] = useState<
        Omit<ExportImageDialogProps, 'dialog'>
    >({ format: 'png' });
    const openExportImageDialogHandler: DialogContext['openExportImageDialog'] =
        useCallback(
            (params) => {
                setExportImageDialogParams(params);
                setOpenExportImageDialog(true);
            },
            [setOpenExportImageDialog]
        );

    // Export SQL dialog
    const [openExportSQLDialog, setOpenExportSQLDialog] = useState(false);
    const [exportSQLDialogParams, setExportSQLDialogParams] = useState<
        Omit<ExportSQLDialogProps, 'dialog'>
    >({ targetDatabaseType: DatabaseType.GENERIC });
    const openExportSQLDialogHandler: DialogContext['openExportSQLDialog'] =
        useCallback(
            ({ targetDatabaseType }) => {
                setExportSQLDialogParams({ targetDatabaseType });
                setOpenExportSQLDialog(true);
            },
            [setOpenExportSQLDialog]
        );

    // Import database dialog
    const [openImportDatabaseDialog, setOpenImportDatabaseDialog] =
        useState(false);
    const [importDatabaseDialogParams, setImportDatabaseDialogParams] =
        useState<Omit<ImportDatabaseDialogProps, 'dialog'>>({
            databaseType: DatabaseType.GENERIC,
        });
    const openImportDatabaseDialogHandler: DialogContext['openImportDatabaseDialog'] =
        useCallback(
            ({ databaseType }) => {
                setImportDatabaseDialogParams({ databaseType });
                setOpenImportDatabaseDialog(true);
            },
            [setOpenImportDatabaseDialog]
        );

    // Table schema dialog
    const [openTableSchemaDialog, setOpenTableSchemaDialog] = useState(false);
    const [tableSchemaDialogParams, setTableSchemaDialogParams] = useState<
        Omit<TableSchemaDialogProps, 'dialog'>
    >({ schemas: [], onConfirm: emptyFn });
    const openTableSchemaDialogHandler: DialogContext['openTableSchemaDialog'] =
        useCallback(
            (params) => {
                setTableSchemaDialogParams(params);
                setOpenTableSchemaDialog(true);
            },
            [setOpenTableSchemaDialog]
        );

    // Export diagram dialog
    const [openExportDiagramDialog, setOpenExportDiagramDialog] =
        useState(false);

    // Import diagram dialog
    const [openImportDiagramDialog, setOpenImportDiagramDialog] =
        useState(false);

    // Import DBML dialog
    const [openImportDBMLDialog, setOpenImportDBMLDialog] = useState(false);

    const openCreateRelationshipDialogHandler: DialogContext['openCreateRelationshipDialog'] =
        useCallback(
            (params) => {
                setCreateRelationshipDialogParams(params);
                setOpenCreateRelationshipDialog(true);
            },
            [setOpenCreateRelationshipDialog]
        );

    return (
        <dialogContext.Provider
            value={{
                openCreateDiagramDialog: () => setOpenNewDiagramDialog(true),
                closeCreateDiagramDialog: () => setOpenNewDiagramDialog(false),
                openOpenDiagramDialog: () => setOpenOpenDiagramDialog(true),
                closeOpenDiagramDialog: () => setOpenOpenDiagramDialog(false),
                openExportSQLDialog: openExportSQLDialogHandler,
                closeExportSQLDialog: () => setOpenExportSQLDialog(false),
                openCreateRelationshipDialog:
                    openCreateRelationshipDialogHandler,
                closeCreateRelationshipDialog: () =>
                    setOpenCreateRelationshipDialog(false),
                openImportDatabaseDialog: openImportDatabaseDialogHandler,
                closeImportDatabaseDialog: () =>
                    setOpenImportDatabaseDialog(false),
                openTableSchemaDialog: openTableSchemaDialogHandler,
                closeTableSchemaDialog: () => setOpenTableSchemaDialog(false),
                openStarUsDialog: () => setOpenStarUsDialog(true),
                closeStarUsDialog: () => setOpenStarUsDialog(false),
                closeBuckleDialog: () => setOpenBuckleDialog(false),
                openBuckleDialog: () => setOpenBuckleDialog(true),
                closeExportImageDialog: () => setOpenExportImageDialog(false),
                openExportImageDialog: openExportImageDialogHandler,
                openExportDiagramDialog: () => setOpenExportDiagramDialog(true),
                closeExportDiagramDialog: () =>
                    setOpenExportDiagramDialog(false),
                openImportDiagramDialog: () => setOpenImportDiagramDialog(true),
                closeImportDiagramDialog: () =>
                    setOpenImportDiagramDialog(false),
                openImportDBMLDialog: () => setOpenImportDBMLDialog(true),
                closeImportDBMLDialog: () => setOpenImportDBMLDialog(false),
            }}
        >
            {children}
            <CreateDiagramDialog
                dialog={{
                    open: openNewDiagramDialog,
                    onOpenChange: setOpenNewDiagramDialog,
                }}
            />
            <OpenDiagramDialog
                dialog={{
                    open: openOpenDiagramDialog,
                    onOpenChange: setOpenOpenDiagramDialog,
                }}
            />
            <CreateRelationshipDialog
                dialog={{
                    open: openCreateRelationshipDialog,
                    onOpenChange: setOpenCreateRelationshipDialog,
                }}
                preSelectedSourceTableId={
                    createRelationshipDialogParams?.sourceTableId
                }
            />
            <ExportSQLDialog
                dialog={{ open: openExportSQLDialog }}
                {...exportSQLDialogParams}
            />
            <ImportDatabaseDialog
                dialog={{ open: openImportDatabaseDialog }}
                {...importDatabaseDialogParams}
            />
            <TableSchemaDialog
                dialog={{ open: openTableSchemaDialog }}
                {...tableSchemaDialogParams}
            />
            <StarUsDialog dialog={{ open: openStarUsDialog }} />
            <ExportImageDialog
                dialog={{ open: openExportImageDialog }}
                {...exportImageDialogParams}
            />
            <ExportDiagramDialog dialog={{ open: openExportDiagramDialog }} />
            <ImportDiagramDialog dialog={{ open: openImportDiagramDialog }} />
            <BuckleDialog dialog={{ open: openBuckleDialog }} />
            <ImportDBMLDialog dialog={{ open: openImportDBMLDialog }} />
        </dialogContext.Provider>
    );
};
