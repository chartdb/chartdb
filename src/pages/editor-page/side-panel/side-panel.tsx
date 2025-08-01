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
import type { SidebarSection } from '@/context/layout-context/layout-context';
import { useTranslation } from 'react-i18next';
import { useChartDB } from '@/hooks/use-chartdb';
import { DependenciesSection } from './dependencies-section/dependencies-section';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { AreasSection } from './areas-section/areas-section';
import { CustomTypesSection } from './custom-types-section/custom-types-section';
import { DatabaseType } from '@/lib/domain/database-type';

export interface SidePanelProps {}

export const SidePanel: React.FC<SidePanelProps> = () => {
    const { t } = useTranslation();
    const { databaseType } = useChartDB();
    const { selectSidebarSection, selectedSidebarSection } = useLayout();
    const { isMd: isDesktop } = useBreakpoint('md');

    return (
        <aside className="flex h-full flex-col overflow-hidden">
            {!isDesktop ? (
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
                                <SelectItem value="dependencies">
                                    {t(
                                        'side_panel.dependencies_section.dependencies'
                                    )}
                                </SelectItem>
                                <SelectItem value="areas">
                                    {t('side_panel.areas_section.areas')}
                                </SelectItem>
                                {databaseType === DatabaseType.POSTGRESQL ? (
                                    <SelectItem value="customTypes">
                                        {t(
                                            'side_panel.custom_types_section.custom_types'
                                        )}
                                    </SelectItem>
                                ) : null}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>
            ) : null}
            {selectedSidebarSection === 'tables' ? (
                <TablesSection />
            ) : selectedSidebarSection === 'relationships' ? (
                <RelationshipsSection />
            ) : selectedSidebarSection === 'dependencies' ? (
                <DependenciesSection />
            ) : selectedSidebarSection === 'areas' ? (
                <AreasSection />
            ) : (
                <CustomTypesSection />
            )}
        </aside>
    );
};
