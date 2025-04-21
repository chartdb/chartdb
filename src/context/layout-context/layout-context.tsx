import { emptyFn } from '@/lib/utils';
import { createContext } from 'react';

export type SidebarSection =
    | 'tables'
    | 'relationships'
    | 'dependencies'
    | 'areas';

export interface LayoutContext {
    openedTableInSidebar: string | undefined;
    openTableFromSidebar: (tableId: string) => void;
    closeAllTablesInSidebar: () => void;

    openedRelationshipInSidebar: string | undefined;
    openRelationshipFromSidebar: (relationshipId: string) => void;
    closeAllRelationshipsInSidebar: () => void;

    openedDependencyInSidebar: string | undefined;
    openDependencyFromSidebar: (dependencyId: string) => void;
    closeAllDependenciesInSidebar: () => void;

    openedAreaInSidebar: string | undefined;
    openAreaFromSidebar: (areaId: string) => void;
    closeAllAreasInSidebar: () => void;

    selectedSidebarSection: SidebarSection;
    selectSidebarSection: (section: SidebarSection) => void;

    isSidePanelShowed: boolean;
    hideSidePanel: () => void;
    showSidePanel: () => void;
    toggleSidePanel: () => void;

    isSelectSchemaOpen: boolean;
    openSelectSchema: () => void;
    closeSelectSchema: () => void;
}

export const layoutContext = createContext<LayoutContext>({
    openedTableInSidebar: undefined,
    selectedSidebarSection: 'tables',

    openedRelationshipInSidebar: undefined,
    openRelationshipFromSidebar: emptyFn,
    closeAllRelationshipsInSidebar: emptyFn,

    openedDependencyInSidebar: undefined,
    openDependencyFromSidebar: emptyFn,
    closeAllDependenciesInSidebar: emptyFn,

    openedAreaInSidebar: undefined,
    openAreaFromSidebar: emptyFn,
    closeAllAreasInSidebar: emptyFn,

    selectSidebarSection: emptyFn,
    openTableFromSidebar: emptyFn,
    closeAllTablesInSidebar: emptyFn,

    isSidePanelShowed: false,
    hideSidePanel: emptyFn,
    showSidePanel: emptyFn,
    toggleSidePanel: emptyFn,

    isSelectSchemaOpen: false,
    openSelectSchema: emptyFn,
    closeSelectSchema: emptyFn,
});
