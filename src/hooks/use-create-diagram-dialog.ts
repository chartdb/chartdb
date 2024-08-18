import { useContext } from 'react';
import { createDiagramDialogContext } from '@/dialogs/create-diagram-dialog/create-diagram-dialog-context';

export const useCreateDiagramDialog = () =>
    useContext(createDiagramDialogContext);
