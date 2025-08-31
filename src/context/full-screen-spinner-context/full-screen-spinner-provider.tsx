import React from 'react';
import type { FullScreenLoaderContext } from './full-screen-spinner-context';
import { fullScreenLoaderContext } from './full-screen-spinner-context';
import {
    Dialog,
    DialogContent,
    DialogDescription,
} from '@/components/dialog/dialog';
import { Spinner } from '@/components/spinner/spinner';
import { Hourglass } from 'lucide-react';
import { DialogTitle } from '@radix-ui/react-dialog';

export const FullScreenLoaderProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const [open, setOpen] = React.useState(false);
    const [animated, setAnimated] = React.useState(true);

    const hideLoader: FullScreenLoaderContext['hideLoader'] =
        React.useCallback(() => {
            setOpen(false);
        }, []);

    const showLoader: FullScreenLoaderContext['showLoader'] = React.useCallback(
        (options) => {
            setAnimated(options?.animated ?? true);
            setOpen(true);
        },
        []
    );

    return (
        <fullScreenLoaderContext.Provider
            value={{
                showLoader,
                hideLoader,
            }}
        >
            {children}
            <Dialog open={open}>
                <DialogContent className="justify-center border-none bg-transparent shadow-none outline-none">
                    <DialogTitle className="hidden"></DialogTitle>
                    <DialogDescription className="hidden" />
                    <div className="w-fit rounded-xl bg-primary-foreground p-3">
                        {animated ? (
                            <Spinner size={'large'} className="text-primary" />
                        ) : (
                            <Hourglass className="size-12 text-primary" />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </fullScreenLoaderContext.Provider>
    );
};
