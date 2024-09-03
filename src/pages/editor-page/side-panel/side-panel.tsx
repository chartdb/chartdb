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
import { useTranslation } from 'react-i18next';

export interface SidePanelProps {}

export const SidePanel: React.FC<SidePanelProps> = () => {
    const { t } = useTranslation();
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
                        <div className="flex flex-1 justify-end px-2 text-xs font-normal text-muted-foreground">
                            {t('side_panel.view_all_options')}
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectItem value="tables">
                                {t('side_panel.tables_section.tables')}
                            </SelectItem>
                            <SelectItem value="relationships">
                                {t(
                                    'side_panel.relationships_section.relationships'
                                )}
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
