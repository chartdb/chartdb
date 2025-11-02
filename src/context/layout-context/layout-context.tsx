import { emptyFn } from '@/lib/utils';
import { createContext } from 'react';

export type SidebarSection =
    | 'dbml'
    | 'tables'
    | 'refs'
    | 'customTypes'
    | 'visuals';

export type VisualsTab = 'areas' | 'notes';

export interface LayoutContext {
    openedTableInSidebar: string | undefined;
    openTableFromSidebar: (tableId: string) => void;
    closeAllTablesInSidebar: () => void;

    openRelationshipFromSidebar: (relationshipId: string) => void;
    closeAllRelationshipsInSidebar: () => void;

    openDependencyFromSidebar: (dependencyId: string) => void;
    closeAllDependenciesInSidebar: () => void;

    openedRefInSidebar: string | undefined;
    openRefFromSidebar: (refId: string) => void;
    closeAllRefsInSidebar: () => void;

    openedAreaInSidebar: string | undefined;
    openAreaFromSidebar: (areaId: string) => void;
    closeAllAreasInSidebar: () => void;

    openedNoteInSidebar: string | undefined;
    openNoteFromSidebar: (noteId: string) => void;
    closeAllNotesInSidebar: () => void;

    openedCustomTypeInSidebar: string | undefined;
    openCustomTypeFromSidebar: (customTypeId: string) => void;
    closeAllCustomTypesInSidebar: () => void;

    selectedSidebarSection: SidebarSection;
    selectSidebarSection: (section: SidebarSection) => void;

    selectedVisualsTab: VisualsTab;
    selectVisualsTab: (tab: VisualsTab) => void;

    isSidePanelShowed: boolean;
    hideSidePanel: () => void;
    showSidePanel: () => void;
    toggleSidePanel: () => void;
}

export const layoutContext = createContext<LayoutContext>({
    openedTableInSidebar: undefined,
    selectedSidebarSection: 'tables',

    openRelationshipFromSidebar: emptyFn,
    closeAllRelationshipsInSidebar: emptyFn,

    openDependencyFromSidebar: emptyFn,
    closeAllDependenciesInSidebar: emptyFn,

    openedRefInSidebar: undefined,
    openRefFromSidebar: emptyFn,
    closeAllRefsInSidebar: emptyFn,

    openedAreaInSidebar: undefined,
    openAreaFromSidebar: emptyFn,
    closeAllAreasInSidebar: emptyFn,

    openedNoteInSidebar: undefined,
    openNoteFromSidebar: emptyFn,
    closeAllNotesInSidebar: emptyFn,

    openedCustomTypeInSidebar: undefined,
    openCustomTypeFromSidebar: emptyFn,
    closeAllCustomTypesInSidebar: emptyFn,

    selectSidebarSection: emptyFn,
    openTableFromSidebar: emptyFn,
    closeAllTablesInSidebar: emptyFn,

    selectedVisualsTab: 'areas',
    selectVisualsTab: emptyFn,

    isSidePanelShowed: false,
    hideSidePanel: emptyFn,
    showSidePanel: emptyFn,
    toggleSidePanel: emptyFn,
});
