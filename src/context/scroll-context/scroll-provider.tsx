import React, { useEffect, useState } from 'react';
import { ScrollContext, ScrollActionType } from './scroll-context';

export const ScrollProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const [scrollAction, setScrollAction] = useState<ScrollActionType>(() => {
        const savedAction = localStorage.getItem(
            'scrollAction'
        ) as ScrollActionType | null;
        return savedAction || 'pan';
    });

    const [effectiveScrollAction, setEffectiveScrollAction] =
        useState<ScrollActionType>('pan');

    useEffect(() => {
        console.log('coucou');
        localStorage.setItem('scrollAction', scrollAction);
        setEffectiveScrollAction(scrollAction);
    }, [scrollAction]);

    return (
        <ScrollContext.Provider
            value={{ scrollAction, setScrollAction, effectiveScrollAction }}
        >
            {children}
        </ScrollContext.Provider>
    );
};
