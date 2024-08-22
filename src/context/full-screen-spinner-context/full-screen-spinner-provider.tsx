import React from 'react';
import { fullScreenLoaderContext } from './full-screen-spinner-context';
import { Dialog, DialogContent } from '@/components/dialog/dialog';
import { Spinner } from '@/components/spinner/spinner';

export const FullScreenLoaderProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const [open, setOpen] = React.useState(false);

    const hideLoader = React.useCallback(() => {
        setOpen(false);
    }, []);

    const showLoader = React.useCallback(() => {
        setOpen(true);
    }, []);

    return (
        <fullScreenLoaderContext.Provider
            value={{
                showLoader,
                hideLoader,
            }}
        >
            {children}
            <Dialog open={open}>
                <DialogContent className="shadow-none bg-transparent border-none outline-none">
                    <Spinner className="text-black" size={'large'} />
                </DialogContent>
            </Dialog>
        </fullScreenLoaderContext.Provider>
    );
};
