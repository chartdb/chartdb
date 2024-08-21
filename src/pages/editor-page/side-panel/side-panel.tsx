import React from 'react';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/select/select';
import { TablesSection } from './tables-section/tables-section';
import { RelationshipsSection } from './relationships-section/relationships-section';
import { useLayout } from '@/hooks/use-layout';
import { SidebarSection } from '@/context/layout-context/layout-context';

export interface SidePanelProps {}

export const SidePanel: React.FC<SidePanelProps> = () => {
    // const [selected, setSelected] = React.useState('tables');
    const { selectSidebarSection, selectedSidebarSection } = useLayout();
    return (
        <aside className="flex h-full flex-col overflow-hidden">
            <div className="flex justify-center border-b pt-0.5">
                <Select
                    value={selectedSidebarSection}
                    onValueChange={(value) =>
                        selectSidebarSection(value as SidebarSection)
                    }
                >
                    <SelectTrigger className="border-none rounded-none shadow-none focus:border-transparent focus:ring-0 hover:underline hover:bg-secondary font-semibold">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectItem value="tables">Tables</SelectItem>
                            <SelectItem value="relationships">
                                Relationships
                            </SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>
            {selectedSidebarSection === 'tables' ? (
                <TablesSection />
            ) : (
                <RelationshipsSection />
            )}
        </aside>
    );
};
