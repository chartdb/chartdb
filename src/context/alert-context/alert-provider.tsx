import React, { useCallback, useState } from 'react';
import type { AlertContext } from './alert-context';
import { alertContext } from './alert-context';
import type { BaseAlertDialogProps } from '@/dialogs/base-alert-dialog/base-alert-dialog';
import { BaseAlertDialog } from '@/dialogs/base-alert-dialog/base-alert-dialog';

export const AlertProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const [showAlert, setShowAlert] = useState(false);
    const [alertParams, setAlertParams] = useState<BaseAlertDialogProps>({
        title: '',
    });
    const showAlertHandler: AlertContext['showAlert'] = useCallback(
        (params) => {
            setAlertParams(params);
            setShowAlert(true);
        },
        [setShowAlert, setAlertParams]
    );
    const closeAlertHandler = useCallback(() => {
        setShowAlert(false);
    }, [setShowAlert]);

    return (
        <alertContext.Provider
            value={{
                showAlert: showAlertHandler,
                closeAlert: closeAlertHandler,
            }}
        >
            {children}
            <BaseAlertDialog dialog={{ open: showAlert }} {...alertParams} />
        </alertContext.Provider>
    );
};
