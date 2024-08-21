import { emptyFn } from '@/lib/utils';
import { createContext } from 'react';

export type SidebarSection = 'tables' | 'relationships';

export interface LayoutContext {
    openedTableInSidebar: string | undefined;
    openTableFromSidebar: (tableId: string) => void;
    selectedSidebarSection: SidebarSection;
    selectSidebarSection: (section: SidebarSection) => void;
}

export const layoutContext = createContext<LayoutContext>({
    openedTableInSidebar: undefined,
    selectedSidebarSection: 'tables',
    selectSidebarSection: emptyFn,
    openTableFromSidebar: emptyFn,
});
