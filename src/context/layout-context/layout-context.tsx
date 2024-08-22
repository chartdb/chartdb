import { emptyFn } from '@/lib/utils';
import { createContext } from 'react';

export type SidebarSection = 'tables' | 'relationships';

export interface LayoutContext {
    openedTableInSidebar: string | undefined;
    openTableFromSidebar: (tableId: string) => void;

    openedRelationshipInSidebar: string | undefined;
    openRelationshipFromSidebar: (relationshipId: string) => void;

    selectedSidebarSection: SidebarSection;
    selectSidebarSection: (section: SidebarSection) => void;
}

export const layoutContext = createContext<LayoutContext>({
    openedTableInSidebar: undefined,
    selectedSidebarSection: 'tables',

    openedRelationshipInSidebar: undefined,
    openRelationshipFromSidebar: emptyFn,

    selectSidebarSection: emptyFn,
    openTableFromSidebar: emptyFn,
});
