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

    useEffect(() => {
        localStorage.setItem('scrollAction', scrollAction);
    }, [scrollAction]);

    return (
        <ScrollContext.Provider value={{ scrollAction, setScrollAction }}>
            {children}
        </ScrollContext.Provider>
    );
};
