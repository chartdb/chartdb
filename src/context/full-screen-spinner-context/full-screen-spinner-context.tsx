import { createContext } from 'react';
import { emptyFn } from '@/lib/utils';

export interface FullScreenLoaderContext {
    showLoader: (options?: { animated?: boolean }) => void;
    hideLoader: () => void;
}

export const fullScreenLoaderContext = createContext<FullScreenLoaderContext>({
    showLoader: emptyFn,
    hideLoader: emptyFn,
});
