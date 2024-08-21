import { createContext } from 'react';
import { emptyFn } from '@/lib/utils';
import { DatabaseType } from '@/lib/domain/database-type';

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
}

export const dialogContext = createContext<DialogContext>({
    openCreateDiagramDialog: emptyFn,
    closeCreateDiagramDialog: emptyFn,
    openOpenDiagramDialog: emptyFn,
    closeOpenDiagramDialog: emptyFn,
    openExportSQLDialog: emptyFn,
    closeExportSQLDialog: emptyFn,
});
