import type { ImportDatabaseDialogProps } from '@/dialogs/import-database-dialog/import-database-dialog';
import type { TableSchemaDialogProps } from '@/dialogs/table-schema-dialog/table-schema-dialog';
import type { ExportImageDialogProps } from '@/dialogs/export-image-dialog/export-image-dialog';
import type { DatabaseType } from '@/lib/domain/database-type';
import { emptyFn } from '@/lib/utils';
import { createContext } from 'react';

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

    // Create relationship dialog
    openCreateRelationshipDialog: (params?: { sourceTableId?: string }) => void;
    closeCreateRelationshipDialog: () => void;

    // Import database dialog
    openImportDatabaseDialog: (
        params: Omit<ImportDatabaseDialogProps, 'dialog'>
    ) => void;
    closeImportDatabaseDialog: () => void;

    // Change table schema dialog
    openTableSchemaDialog: (
        params: Omit<TableSchemaDialogProps, 'dialog'>
    ) => void;
    closeTableSchemaDialog: () => void;

    // Star us dialog
    openStarUsDialog: () => void;
    closeStarUsDialog: () => void;

    // Buckle dialog
    openBuckleDialog: () => void;
    closeBuckleDialog: () => void;

    // Export image dialog
    openExportImageDialog: (
        params: Omit<ExportImageDialogProps, 'dialog'>
    ) => void;
    closeExportImageDialog: () => void;

    // Export diagram dialog
    openExportDiagramDialog: () => void;
    closeExportDiagramDialog: () => void;

    // Import diagram dialog
    openImportDiagramDialog: () => void;
    closeImportDiagramDialog: () => void;

    // Import DBML dialog
    openImportDBMLDialog: () => void;
    closeImportDBMLDialog: () => void;
}

export const dialogContext = createContext<DialogContext>({
    openCreateDiagramDialog: emptyFn,
    closeCreateDiagramDialog: emptyFn,
    openOpenDiagramDialog: emptyFn,
    closeOpenDiagramDialog: emptyFn,
    openExportSQLDialog: emptyFn,
    closeExportSQLDialog: emptyFn,
    closeCreateRelationshipDialog: emptyFn,
    openCreateRelationshipDialog: emptyFn,
    openImportDatabaseDialog: emptyFn,
    closeImportDatabaseDialog: emptyFn,
    openTableSchemaDialog: emptyFn,
    closeTableSchemaDialog: emptyFn,
    openStarUsDialog: emptyFn,
    closeStarUsDialog: emptyFn,
    openExportImageDialog: emptyFn,
    closeExportImageDialog: emptyFn,
    openExportDiagramDialog: emptyFn,
    closeExportDiagramDialog: emptyFn,
    openImportDiagramDialog: emptyFn,
    closeImportDiagramDialog: emptyFn,
    openBuckleDialog: emptyFn,
    closeBuckleDialog: emptyFn,
    openImportDBMLDialog: emptyFn,
    closeImportDBMLDialog: emptyFn,
});
