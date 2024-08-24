import React, { useCallback } from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/alert-dialog/alert-dialog';
import { AlertDialogProps } from '@radix-ui/react-alert-dialog';
import { useDialog } from '@/hooks/use-dialog';

export interface BaseAlertDialogProps {
    title: string;
    description?: string;
    actionLabel?: string;
    closeLabel?: string;
    onAction?: () => void;
    dialog?: AlertDialogProps;
    content?: React.ReactNode;
}

export const BaseAlertDialog: React.FC<BaseAlertDialogProps> = ({
    title,
    description,
    actionLabel,
    closeLabel,
    onAction,
    dialog,
    content,
}) => {
    const { closeAlert } = useDialog();
    const alertHandler = useCallback(() => {
        onAction?.();
        closeAlert();
    }, [onAction, closeAlert]);
    return (
        <AlertDialog
            {...dialog}
            onOpenChange={(open) => {
                if (!open) {
                    closeAlert();
                }
            }}
        >
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    {description && (
                        <AlertDialogDescription>
                            {description}
                        </AlertDialogDescription>
                    )}
                    {content}
                </AlertDialogHeader>
                <AlertDialogFooter>
                    {closeLabel && (
                        <AlertDialogCancel onClick={closeAlert}>
                            {closeLabel}
                        </AlertDialogCancel>
                    )}
                    {actionLabel && (
                        <AlertDialogAction onClick={alertHandler}>
                            {actionLabel}
                        </AlertDialogAction>
                    )}
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};
