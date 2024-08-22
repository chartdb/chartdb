import React from 'react';
import {
    FullScreenLoaderContext,
    fullScreenLoaderContext,
} from './full-screen-spinner-context';
import { Dialog, DialogContent } from '@/components/dialog/dialog';
import { Spinner } from '@/components/spinner/spinner';
import { Hourglass } from 'lucide-react';

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
                <DialogContent className="shadow-none bg-transparent border-none outline-none justify-center">
                    <div className="bg-white w-fit p-3 rounded-xl">
                        {animated ? (
                            <Spinner size={'large'} />
                        ) : (
                            <Hourglass className="size-12" />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </fullScreenLoaderContext.Provider>
    );
};
