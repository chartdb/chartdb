import React from 'react';
import { DialogTrigger } from '@/components/command/dialog';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '../dialog/dialog';

export const ZoomableImage = React.forwardRef<
    React.ElementRef<typeof DialogTrigger>,
    React.DetailedHTMLProps<
        React.ImgHTMLAttributes<HTMLImageElement>,
        HTMLImageElement
    >
>((props, ref) => {
    if (!props.src) return null;
    return (
        <Dialog>
            <DialogTrigger asChild ref={ref}>
                {props.children ? props.children : <img {...props} />}
            </DialogTrigger>
            <DialogContent className="max-w-4xl border-0 bg-transparent p-0">
                <DialogTitle className="hidden" />
                <DialogDescription className="hidden" />
                <img
                    src={props.src}
                    alt={props.alt}
                    className="object-contain"
                />
            </DialogContent>
        </Dialog>
    );
});

ZoomableImage.displayName = 'ZoomableImage';
