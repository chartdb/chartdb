import React, { useEffect } from 'react';
import {
    LocalConfigContext,
    SchemasFilter,
    ScrollAction,
} from './local-config-context';
import { Theme } from '../theme-context/theme-context';

const themeKey = 'theme';
const scrollActionKey = 'scroll_action';
const schemasFilterKey = 'schemas_filter';
const showCardinalityKey = 'show_cardinality';

export const LocalConfigProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const [theme, setTheme] = React.useState<Theme>(
        (localStorage.getItem(themeKey) as Theme) || 'system'
    );

    const [scrollAction, setScrollAction] = React.useState<ScrollAction>(
        (localStorage.getItem(scrollActionKey) as ScrollAction) || 'pan'
    );

    const [schemasFilter, setSchemasFilter] = React.useState<SchemasFilter>(
        JSON.parse(
            localStorage.getItem(schemasFilterKey) || '{}'
        ) as SchemasFilter
    );

    const [showCardinality, setShowCardinality] = React.useState<boolean>(
        (localStorage.getItem(showCardinalityKey) || 'true') === 'true'
    );

    useEffect(() => {
        localStorage.setItem(themeKey, theme);
    }, [theme]);

    useEffect(() => {
        localStorage.setItem(scrollActionKey, scrollAction);
    }, [scrollAction]);

    useEffect(() => {
        localStorage.setItem(schemasFilterKey, JSON.stringify(schemasFilter));
    }, [schemasFilter]);

    useEffect(() => {
        localStorage.setItem(showCardinalityKey, showCardinality.toString());
    }, [showCardinality]);

    return (
        <LocalConfigContext.Provider
            value={{
                theme,
                setTheme,
                scrollAction,
                setScrollAction,
                schemasFilter,
                setSchemasFilter,
                showCardinality,
                setShowCardinality,
            }}
        >
            {children}
        </LocalConfigContext.Provider>
    );
};
