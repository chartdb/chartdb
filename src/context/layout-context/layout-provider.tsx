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
    const [openedRelationshipInSidebar, setOpenedRelationshipInSidebar] =
        React.useState<string | undefined>();
    const [openedDependencyInSidebar, setOpenedDependencyInSidebar] =
        React.useState<string | undefined>();
    const [openedAreaInSidebar, setOpenedAreaInSidebar] = React.useState<
        string | undefined
    >();
    const [openedCustomTypeInSidebar, setOpenedCustomTypeInSidebar] =
        React.useState<string | undefined>();
    const [selectedSidebarSection, setSelectedSidebarSection] =
        React.useState<SidebarSection>('tables');
    const [isSidePanelShowed, setIsSidePanelShowed] =
        React.useState<boolean>(isDesktop);
    const [isSelectSchemaOpen, setIsSelectSchemaOpen] =
        React.useState<boolean>(false);

    const closeAllTablesInSidebar: LayoutContext['closeAllTablesInSidebar'] =
        () => setOpenedTableInSidebar('');

    const closeAllRelationshipsInSidebar: LayoutContext['closeAllRelationshipsInSidebar'] =
        () => setOpenedRelationshipInSidebar('');

    const closeAllDependenciesInSidebar: LayoutContext['closeAllDependenciesInSidebar'] =
        () => setOpenedDependencyInSidebar('');

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
            setSelectedSidebarSection('relationships');
            setOpenedRelationshipInSidebar(relationshipId);
        };

    const openDependencyFromSidebar: LayoutContext['openDependencyFromSidebar'] =
        (dependencyId) => {
            showSidePanel();
            setSelectedSidebarSection('dependencies');
            setOpenedDependencyInSidebar(dependencyId);
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

    const openSelectSchema: LayoutContext['openSelectSchema'] = () =>
        setIsSelectSchemaOpen(true);

    const closeSelectSchema: LayoutContext['closeSelectSchema'] = () =>
        setIsSelectSchemaOpen(false);
    return (
        <layoutContext.Provider
            value={{
                openedTableInSidebar,
                selectedSidebarSection,
                openTableFromSidebar,
                selectSidebarSection: setSelectedSidebarSection,
                openedRelationshipInSidebar,
                openRelationshipFromSidebar,
                closeAllTablesInSidebar,
                closeAllRelationshipsInSidebar,
                isSidePanelShowed,
                hideSidePanel,
                showSidePanel,
                toggleSidePanel,
                isSelectSchemaOpen,
                openSelectSchema,
                closeSelectSchema,
                openedDependencyInSidebar,
                openDependencyFromSidebar,
                closeAllDependenciesInSidebar,
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
