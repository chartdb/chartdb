import React from 'react';
import { layoutContext, SidebarSection } from './layout-context';

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

    return (
        <layoutContext.Provider
            value={{
                openedTableInSidebar,
                selectedSidebarSection,
                openTableFromSidebar: setOpenedTableInSidebar,
                selectSidebarSection: setSelectedSidebarSection,
                openedRelationshipInSidebar,
                openRelationshipFromSidebar: setOpenedRelationshipInSidebar,
            }}
        >
            {children}
        </layoutContext.Provider>
    );
};
