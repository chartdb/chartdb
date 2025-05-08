import { createContext } from 'react';
import { emptyFn } from '@/lib/utils';

export type ImageType = 'png' | 'jpeg' | 'svg';
export interface ExportImageContext {
    exportImage: (
        type: ImageType,
        options: {
            includePatternBG: boolean;
            transparent: boolean;
            scale: number;
        }
    ) => Promise<void>;
}

export const exportImageContext = createContext<ExportImageContext>({
    exportImage: emptyFn,
});
