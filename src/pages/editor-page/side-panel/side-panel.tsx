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
                    <SelectTrigger className="rounded-none border-none font-semibold shadow-none hover:bg-secondary hover:underline focus:border-transparent focus:ring-0">
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
