import React, { useEffect } from 'react';
import {
    LocalConfigContext,
    SchemasFilter,
    ScrollAction,
} from './local-config-context';
import { Theme } from '../theme-context/theme-context';

export const LocalConfigProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const [theme, setTheme] = React.useState<Theme>(
        (localStorage.getItem('theme') as Theme) || 'system'
    );

    const [scrollAction, setScrollAction] = React.useState<ScrollAction>(
        (localStorage.getItem('scroll_action') as ScrollAction) || 'pan'
    );

    const [schemasFilter, setSchemasFilter] = React.useState<SchemasFilter>(
        JSON.parse(
            localStorage.getItem('schemas_filter') || '{}'
        ) as SchemasFilter
    );

    useEffect(() => {
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        localStorage.setItem('scroll_action', scrollAction);
    }, [scrollAction]);

    useEffect(() => {
        localStorage.setItem('schemas_filter', JSON.stringify(schemasFilter));
    }, [schemasFilter]);

    return (
        <LocalConfigContext.Provider
            value={{
                theme,
                setTheme,
                scrollAction,
                setScrollAction,
                schemasFilter,
                setSchemasFilter,
            }}
        >
            {children}
        </LocalConfigContext.Provider>
    );
};
