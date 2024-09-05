import { createContext } from 'react';
import { emptyFn } from '@/lib/utils';

export type ScrollActionType = 'pan' | 'zoom';

export interface ScrollContext {
    scrollAction: ScrollActionType;
    setScrollAction: (action: ScrollActionType) => void;
    effectiveScrollAction: ScrollActionType;
}

export const ScrollContext = createContext<ScrollContext>({
    scrollAction: 'pan',
    setScrollAction: emptyFn,
    effectiveScrollAction: 'pan',
});
