import React, { useCallback, useMemo } from 'react';
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
import type { SelectBoxOption } from '@/components/select-box/select-box';
import { SelectBox } from '@/components/select-box/select-box';
import { useChartDB } from '@/hooks/use-chartdb';
import { DependenciesSection } from './dependencies-section/dependencies-section';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { AreasSection } from './areas-section/areas-section';

export interface SidePanelProps {}

export const SidePanel: React.FC<SidePanelProps> = () => {
    const { t } = useTranslation();
    const { schemas, filterSchemas, filteredSchemas } = useChartDB();
    const {
        selectSidebarSection,
        selectedSidebarSection,
        isSelectSchemaOpen,
        openSelectSchema,
        closeSelectSchema,
    } = useLayout();
    const { isMd: isDesktop } = useBreakpoint('md');

    const schemasOptions: SelectBoxOption[] = useMemo(
        () =>
            schemas.map(
                (schema): SelectBoxOption => ({
                    label: schema.name,
                    value: schema.id,
                    description: `(${schema.tableCount} tables)`,
                })
            ),
        [schemas]
    );

    const setIsSelectSchemaOpen = useCallback(
        (open: boolean) => {
            if (open) {
                openSelectSchema();
            } else {
                closeSelectSchema();
            }
        },
        [openSelectSchema, closeSelectSchema]
    );

    return (
        <aside className="flex h-full flex-col overflow-hidden">
            {schemasOptions.length > 0 ? (
                <div className="flex items-center justify-center border-b pl-3 pt-0.5">
                    <div className="shrink-0 text-sm font-semibold">
                        {t('side_panel.schema')}
                    </div>
                    <div className="flex min-w-0 flex-1">
                        <SelectBox
                            oneLine
                            className="w-full rounded-none border-none"
                            selectAll
                            deselectAll
                            options={schemasOptions}
                            value={filteredSchemas ?? []}
                            onChange={(values) => {
                                filterSchemas(values as string[]);
                            }}
                            placeholder={t('side_panel.filter_by_schema')}
                            inputPlaceholder={t('side_panel.search_schema')}
                            emptyPlaceholder={t('side_panel.no_schemas_found')}
                            multiple
                            open={isSelectSchemaOpen}
                            onOpenChange={setIsSelectSchemaOpen}
                        />
                    </div>
                </div>
            ) : null}

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
            ) : (
                <AreasSection />
            )}
        </aside>
    );
};
