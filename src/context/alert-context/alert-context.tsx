import { createContext, useContext } from 'react';
import { emptyFn } from '@/lib/utils';
import type { BaseAlertDialogProps } from '@/dialogs/base-alert-dialog/base-alert-dialog';

export interface AlertContext {
    showAlert: (params: BaseAlertDialogProps) => void;
    closeAlert: () => void;
}

export const alertContext = createContext<AlertContext>({
    closeAlert: emptyFn,
    showAlert: emptyFn,
});

export const useAlert = () => useContext(alertContext);
