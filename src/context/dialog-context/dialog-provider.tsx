import React, { useState } from 'react';
import { dialogContext } from './dialog-context';
import { CreateDiagramDialog } from '@/dialogs/create-diagram-dialog/create-diagram-dialog';
import { OpenDiagramDialog } from '@/dialogs/open-diagram-dialog/open-diagram-dialog';

export const DialogProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const [openNewDiagramDialog, setOpenNewDiagramDialog] = useState(false);
    const [openOpenDiagramDialog, setOpenOpenDiagramDialog] = useState(false);

    return (
        <dialogContext.Provider
            value={{
                openCreateDiagramDialog: () => setOpenNewDiagramDialog(true),
                closeCreateDiagramDialog: () => setOpenNewDiagramDialog(false),
                openOpenDiagramDialog: () => setOpenOpenDiagramDialog(true),
                closeOpenDiagramDialog: () => setOpenOpenDiagramDialog(false),
            }}
        >
            {children}
            <CreateDiagramDialog dialog={{ open: openNewDiagramDialog }} />
            <OpenDiagramDialog dialog={{ open: openOpenDiagramDialog }} />
        </dialogContext.Provider>
    );
};
