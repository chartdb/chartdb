import { useContext } from 'react';
import { openDiagramDialogContext } from '@/dialogs/open-diagram-dialog/open-diagram-dialog-context';

export const useOpenDiagramDialog = () =>
    useContext(openDiagramDialogContext);
