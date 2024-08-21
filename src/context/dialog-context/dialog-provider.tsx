import React from 'react';
import { dialogContext } from './dialog-context';
import { CreateDiagramDialog } from '@/dialogs/create-diagram-dialog/create-diagram-dialog';

export const DialogProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const [openNewDiagramDialog, setOpenNewDiagramDialog] =
        React.useState(false);

    return (
        <dialogContext.Provider
            value={{
                openCreateDiagramDialog: () => setOpenNewDiagramDialog(true),
                closeCreateDiagramDialog: () => setOpenNewDiagramDialog(false),
            }}
        >
            {children}
            <CreateDiagramDialog dialog={{ open: openNewDiagramDialog }} />
        </dialogContext.Provider>
    );
};
