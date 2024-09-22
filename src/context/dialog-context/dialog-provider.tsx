import React, { useCallback, useState } from 'react';
import type { DialogContext } from './dialog-context';
import { dialogContext } from './dialog-context';
import { CreateDiagramDialog } from '@/dialogs/create-diagram-dialog/create-diagram-dialog';
import { OpenDiagramDialog } from '@/dialogs/open-diagram-dialog/open-diagram-dialog';
import { ExportSQLDialog } from '@/dialogs/export-sql-dialog/export-sql-dialog';
import { DatabaseType } from '@/lib/domain/database-type';
import type { BaseAlertDialogProps } from '@/dialogs/base-alert-dialog/base-alert-dialog';
import { BaseAlertDialog } from '@/dialogs/base-alert-dialog/base-alert-dialog';
import { CreateRelationshipDialog } from '@/dialogs/create-relationship-dialog/create-relationship-dialog';
import { ImportDatabaseDialog } from '@/dialogs/import-database-dialog/import-database-dialog';

export const DialogProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const [openNewDiagramDialog, setOpenNewDiagramDialog] = useState(false);
    const [openOpenDiagramDialog, setOpenOpenDiagramDialog] = useState(false);
    const [openExportSQLDialog, setOpenExportSQLDialog] = useState(false);
    const [openExportSQLDialogParams, setOpenExportSQLDialogParams] = useState<{
        targetDatabaseType: DatabaseType;
    }>({ targetDatabaseType: DatabaseType.GENERIC });
    const [openCreateRelationshipDialog, setOpenCreateRelationshipDialog] =
        useState(false);
    const [openImportDatabaseDialog, setOpenImportDatabaseDialog] =
        useState(false);
    const [openImportDatabaseDialogParams, setOpenImportDatabaseDialogParams] =
        useState<{ databaseType: DatabaseType }>({
            databaseType: DatabaseType.GENERIC,
        });
    const [showAlert, setShowAlert] = useState(false);
    const [alertParams, setAlertParams] = useState<BaseAlertDialogProps>({
        title: '',
    });

    const openExportSQLDialogHandler: DialogContext['openExportSQLDialog'] =
        useCallback(
            ({ targetDatabaseType }) => {
                setOpenExportSQLDialog(true);
                setOpenExportSQLDialogParams({ targetDatabaseType });
            },
            [setOpenExportSQLDialog]
        );

    const openImportDatabaseDialogHandler: DialogContext['openImportDatabaseDialog'] =
        useCallback(
            ({ databaseType }) => {
                setOpenImportDatabaseDialog(true);
                setOpenImportDatabaseDialogParams({ databaseType });
            },
            [setOpenImportDatabaseDialog]
        );

    const showAlertHandler: DialogContext['showAlert'] = useCallback(
        (params) => {
            setAlertParams(params);
            setShowAlert(true);
        },
        [setShowAlert, setAlertParams]
    );

    const closeAlertHandler = useCallback(() => {
        setShowAlert(false);
    }, [setShowAlert]);

    return (
        <dialogContext.Provider
            value={{
                openCreateDiagramDialog: () => setOpenNewDiagramDialog(true),
                closeCreateDiagramDialog: () => setOpenNewDiagramDialog(false),
                openOpenDiagramDialog: () => setOpenOpenDiagramDialog(true),
                closeOpenDiagramDialog: () => setOpenOpenDiagramDialog(false),
                openExportSQLDialog: openExportSQLDialogHandler,
                closeExportSQLDialog: () => setOpenExportSQLDialog(false),
                showAlert: showAlertHandler,
                closeAlert: closeAlertHandler,
                openCreateRelationshipDialog: () =>
                    setOpenCreateRelationshipDialog(true),
                closeCreateRelationshipDialog: () =>
                    setOpenCreateRelationshipDialog(false),
                openImportDatabaseDialog: openImportDatabaseDialogHandler,
                closeImportDatabaseDialog: () =>
                    setOpenImportDatabaseDialog(false),
            }}
        >
            {children}
            <CreateDiagramDialog dialog={{ open: openNewDiagramDialog }} />
            <OpenDiagramDialog dialog={{ open: openOpenDiagramDialog }} />
            <ExportSQLDialog
                dialog={{ open: openExportSQLDialog }}
                {...openExportSQLDialogParams}
            />
            <BaseAlertDialog dialog={{ open: showAlert }} {...alertParams} />
            <CreateRelationshipDialog
                dialog={{ open: openCreateRelationshipDialog }}
            />
            <ImportDatabaseDialog
                dialog={{ open: openImportDatabaseDialog }}
                {...openImportDatabaseDialogParams}
            />
        </dialogContext.Provider>
    );
};
