import React from 'react';
import type { LayoutContext, SidebarSection } from './layout-context';
import { layoutContext } from './layout-context';
import { useBreakpoint } from '@/hooks/use-breakpoint';

export const LayoutProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const { isMd: isDesktop } = useBreakpoint('md');
    const [openedTableInSidebar, setOpenedTableInSidebar] = React.useState<
        string | undefined
    >();
    const [openedRefInSidebar, setOpenedRefInSidebar] = React.useState<
        string | undefined
    >();
    const [openedAreaInSidebar, setOpenedAreaInSidebar] = React.useState<
        string | undefined
    >();
    const [openedCustomTypeInSidebar, setOpenedCustomTypeInSidebar] =
        React.useState<string | undefined>();
    const [selectedSidebarSection, setSelectedSidebarSection] =
        React.useState<SidebarSection>('tables');
    const [isSidePanelShowed, setIsSidePanelShowed] =
        React.useState<boolean>(isDesktop);

    const closeAllTablesInSidebar: LayoutContext['closeAllTablesInSidebar'] =
        () => setOpenedTableInSidebar('');

    const closeAllRelationshipsInSidebar: LayoutContext['closeAllRelationshipsInSidebar'] =
        () => setOpenedRefInSidebar('');

    const closeAllDependenciesInSidebar: LayoutContext['closeAllDependenciesInSidebar'] =
        () => setOpenedRefInSidebar('');

    const closeAllRefsInSidebar: LayoutContext['closeAllRefsInSidebar'] = () =>
        setOpenedRefInSidebar('');

    const closeAllAreasInSidebar: LayoutContext['closeAllAreasInSidebar'] =
        () => setOpenedAreaInSidebar('');

    const closeAllCustomTypesInSidebar: LayoutContext['closeAllCustomTypesInSidebar'] =
        () => setOpenedCustomTypeInSidebar('');

    const hideSidePanel: LayoutContext['hideSidePanel'] = () =>
        setIsSidePanelShowed(false);

    const showSidePanel: LayoutContext['showSidePanel'] = () =>
        setIsSidePanelShowed(true);

    const toggleSidePanel: LayoutContext['toggleSidePanel'] = () => {
        setIsSidePanelShowed((prevIsSidePanelShowed) => !prevIsSidePanelShowed);
    };

    const openTableFromSidebar: LayoutContext['openTableFromSidebar'] = (
        tableId
    ) => {
        showSidePanel();
        setSelectedSidebarSection('tables');
        setOpenedTableInSidebar(tableId);
    };

    const openRelationshipFromSidebar: LayoutContext['openRelationshipFromSidebar'] =
        (relationshipId) => {
            showSidePanel();
            setSelectedSidebarSection('refs');
            setOpenedRefInSidebar(relationshipId);
        };

    const openDependencyFromSidebar: LayoutContext['openDependencyFromSidebar'] =
        (dependencyId) => {
            showSidePanel();
            setSelectedSidebarSection('refs');
            setOpenedRefInSidebar(dependencyId);
        };

    const openRefFromSidebar: LayoutContext['openRefFromSidebar'] = (refId) => {
        showSidePanel();
        setSelectedSidebarSection('refs');
        setOpenedRefInSidebar(refId);
    };

    const openAreaFromSidebar: LayoutContext['openAreaFromSidebar'] = (
        areaId
    ) => {
        showSidePanel();
        setSelectedSidebarSection('areas');
        setOpenedAreaInSidebar(areaId);
    };

    const openCustomTypeFromSidebar: LayoutContext['openCustomTypeFromSidebar'] =
        (customTypeId) => {
            showSidePanel();
            setSelectedSidebarSection('customTypes');
            setOpenedTableInSidebar(customTypeId);
        };

    return (
        <layoutContext.Provider
            value={{
                openedTableInSidebar,
                selectedSidebarSection,
                openTableFromSidebar,
                selectSidebarSection: setSelectedSidebarSection,
                openRelationshipFromSidebar,
                closeAllTablesInSidebar,
                closeAllRelationshipsInSidebar,
                isSidePanelShowed,
                hideSidePanel,
                showSidePanel,
                toggleSidePanel,
                openDependencyFromSidebar,
                closeAllDependenciesInSidebar,
                openedRefInSidebar,
                openRefFromSidebar,
                closeAllRefsInSidebar,
                openedAreaInSidebar,
                openAreaFromSidebar,
                closeAllAreasInSidebar,
                openedCustomTypeInSidebar,
                openCustomTypeFromSidebar,
                closeAllCustomTypesInSidebar,
            }}
        >
            {children}
        </layoutContext.Provider>
    );
};
