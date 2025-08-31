import { createContext } from 'react';
import { emptyFn } from '@/lib/utils';
import type { TableSchemaDialogProps } from '@/dialogs/table-schema-dialog/table-schema-dialog';
import type { ImportDatabaseDialogProps } from '@/dialogs/import-database-dialog/import-database-dialog';
import type { ExportSQLDialogProps } from '@/dialogs/export-sql-dialog/export-sql-dialog';
import type { ExportImageDialogProps } from '@/dialogs/export-image-dialog/export-image-dialog';
import type { ExportDiagramDialogProps } from '@/dialogs/export-diagram-dialog/export-diagram-dialog';
import type { ImportDiagramDialogProps } from '@/dialogs/import-diagram-dialog/import-diagram-dialog';
import type { CreateRelationshipDialogProps } from '@/dialogs/create-relationship-dialog/create-relationship-dialog';
import type { ImportDBMLDialogProps } from '@/dialogs/import-dbml-dialog/import-dbml-dialog';
import type { OpenDiagramDialogProps } from '@/dialogs/open-diagram-dialog/open-diagram-dialog';
import type { CreateDiagramDialogProps } from '@/dialogs/create-diagram-dialog/create-diagram-dialog';

export interface DialogContext {
    // Create diagram dialog
    openCreateDiagramDialog: (
        params?: Omit<CreateDiagramDialogProps, 'dialog'>
    ) => void;
    closeCreateDiagramDialog: () => void;

    // Open diagram dialog
    openOpenDiagramDialog: (
        params?: Omit<OpenDiagramDialogProps, 'dialog'>
    ) => void;
    closeOpenDiagramDialog: () => void;

    // Export SQL dialog
    openExportSQLDialog: (params: Omit<ExportSQLDialogProps, 'dialog'>) => void;
    closeExportSQLDialog: () => void;

    // Create relationship dialog
    openCreateRelationshipDialog: (
        params?: Omit<CreateRelationshipDialogProps, 'dialog'>
    ) => void;
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

    // Export image dialog
    openExportImageDialog: (
        params: Omit<ExportImageDialogProps, 'dialog'>
    ) => void;
    closeExportImageDialog: () => void;

    // Export diagram dialog
    openExportDiagramDialog: (
        params: Omit<ExportDiagramDialogProps, 'dialog'>
    ) => void;
    closeExportDiagramDialog: () => void;

    // Import diagram dialog
    openImportDiagramDialog: (
        params: Omit<ImportDiagramDialogProps, 'dialog'>
    ) => void;
    closeImportDiagramDialog: () => void;

    // Import DBML dialog
    openImportDBMLDialog: (
        params?: Omit<ImportDBMLDialogProps, 'dialog'>
    ) => void;
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
    openImportDBMLDialog: emptyFn,
    closeImportDBMLDialog: emptyFn,
});
