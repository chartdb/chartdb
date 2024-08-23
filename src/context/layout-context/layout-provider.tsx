import React from 'react';
import { LayoutContext, layoutContext, SidebarSection } from './layout-context';

export const LayoutProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const [openedTableInSidebar, setOpenedTableInSidebar] = React.useState<
        string | undefined
    >();
    const [openedRelationshipInSidebar, setOpenedRelationshipInSidebar] =
        React.useState<string | undefined>();
    const [selectedSidebarSection, setSelectedSidebarSection] =
        React.useState<SidebarSection>('tables');

    const closeAllTablesInSidebar: LayoutContext['closeAllTablesInSidebar'] =
        () => setOpenedTableInSidebar('');

    const closeAllRelationshipsInSidebar: LayoutContext['closeAllRelationshipsInSidebar'] =
        () => setOpenedRelationshipInSidebar('');
    return (
        <layoutContext.Provider
            value={{
                openedTableInSidebar,
                selectedSidebarSection,
                openTableFromSidebar: setOpenedTableInSidebar,
                selectSidebarSection: setSelectedSidebarSection,
                openedRelationshipInSidebar,
                openRelationshipFromSidebar: setOpenedRelationshipInSidebar,
                closeAllTablesInSidebar,
                closeAllRelationshipsInSidebar,
            }}
        >
            {children}
        </layoutContext.Provider>
    );
};
