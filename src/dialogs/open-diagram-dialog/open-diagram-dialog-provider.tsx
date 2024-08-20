import React from 'react';
import { openDiagramDialogContext } from './open-diagram-dialog-context';
import { OpenDiagramDialog } from './open-diagram-dialog';

export const OpenDiagramDialogProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const [open, setOpen] = React.useState(false);

    return (
        <openDiagramDialogContext.Provider
            value={{
                openOpenDiagramDialog: () => setOpen(true),
                closeOpenDiagramDialog: () => setOpen(false),
            }}
        >
            {children}
            <OpenDiagramDialog dialog={{ open }} />
        </openDiagramDialogContext.Provider>
    );
};
