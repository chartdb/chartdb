import React from 'react';
import { createDiagramDialogContext } from './create-diagram-dialog-context';
import { CreateDiagramDialog } from './create-diagram-dialog';

export const CreateDiagramDialogProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const [open, setOpen] = React.useState(false);

    return (
        <createDiagramDialogContext.Provider
            value={{
                openCreateDiagramDialog: () => setOpen(true),
                closeCreateDiagramDialog: () => setOpen(false),
            }}
        >
            {children}
            <CreateDiagramDialog dialog={{ open }} />
        </createDiagramDialogContext.Provider>
    );
};
