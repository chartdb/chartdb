import { createContext } from 'react';
import { emptyFn } from '@/lib/utils';
import { DatabaseType } from '@/lib/domain/database-type';
import { BaseAlertDialogProps } from '@/dialogs/base-alert-dialog/base-alert-dialog';

export interface DialogContext {
    // Create diagram dialog
    openCreateDiagramDialog: () => void;
    closeCreateDiagramDialog: () => void;

    // Open diagram dialog
    openOpenDiagramDialog: () => void;
    closeOpenDiagramDialog: () => void;

    // Export SQL dialog
    openExportSQLDialog: (params: { targetDatabaseType: DatabaseType }) => void;
    closeExportSQLDialog: () => void;

    // Alert dialog
    showAlert: (params: BaseAlertDialogProps) => void;
    closeAlert: () => void;

    // Create relationship dialog
    openCreateRelationshipDialog: () => void;
    closeCreateRelationshipDialog: () => void;

    // Import database dialog
    openImportDatabaseDialog: (params: { databaseType: DatabaseType }) => void;
    closeImportDatabaseDialog: () => void;
}

export const dialogContext = createContext<DialogContext>({
    openCreateDiagramDialog: emptyFn,
    closeCreateDiagramDialog: emptyFn,
    openOpenDiagramDialog: emptyFn,
    closeOpenDiagramDialog: emptyFn,
    openExportSQLDialog: emptyFn,
    closeExportSQLDialog: emptyFn,
    closeAlert: emptyFn,
    showAlert: emptyFn,
    closeCreateRelationshipDialog: emptyFn,
    openCreateRelationshipDialog: emptyFn,
    openImportDatabaseDialog: emptyFn,
    closeImportDatabaseDialog: emptyFn,
});
