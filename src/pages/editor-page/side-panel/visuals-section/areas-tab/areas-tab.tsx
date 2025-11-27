import React, { useCallback, useMemo } from 'react';
import { Button } from '@/components/button/button';
import { Group, X } from 'lucide-react';
import { Input } from '@/components/input/input';
import type { Area } from '@/lib/domain/area';
import { useChartDB } from '@/hooks/use-chartdb';
import { useLayout } from '@/hooks/use-layout';
import { EmptyState } from '@/components/empty-state/empty-state';
import { ScrollArea } from '@/components/scroll-area/scroll-area';
import { useTranslation } from 'react-i18next';
import { useViewport } from '@xyflow/react';
import { AreaList } from './areas-list/areas-list';

export interface AreasTabProps {}

export const AreasTab: React.FC<AreasTabProps> = () => {
    const { createArea, areas, readonly } = useChartDB();
    const viewport = useViewport();
    const { t } = useTranslation();
    const { openAreaFromSidebar } = useLayout();
    const [filterText, setFilterText] = React.useState('');
    const filterInputRef = React.useRef<HTMLInputElement>(null);

    const filteredAreas = useMemo(() => {
        const filterAreaName: (area: Area) => boolean = (area) =>
            !filterText?.trim?.() ||
            area.name.toLowerCase().includes(filterText.toLowerCase());

        return areas.filter(filterAreaName);
    }, [areas, filterText]);

    const createAreaWithLocation = useCallback(async () => {
        const padding = 80;
        const centerX = -viewport.x / viewport.zoom + padding / viewport.zoom;
        const centerY = -viewport.y / viewport.zoom + padding / viewport.zoom;
        const area = await createArea({
            x: centerX,
            y: centerY,
        });
        if (openAreaFromSidebar) {
            openAreaFromSidebar(area.id);
        }
    }, [
        createArea,
        openAreaFromSidebar,
        viewport.x,
        viewport.y,
        viewport.zoom,
    ]);

    const handleCreateArea = useCallback(async () => {
        setFilterText('');
        createAreaWithLocation();
    }, [createAreaWithLocation, setFilterText]);

    const handleClearFilter = useCallback(() => {
        setFilterText('');
    }, []);

    return (
        <div className="flex flex-1 flex-col overflow-hidden px-2">
            <div className="flex items-center justify-between gap-4 pb-1">
                <div className="flex-1">
                    <Input
                        ref={filterInputRef}
                        type="text"
                        placeholder={t('side_panel.areas_section.filter')}
                        className="h-8 w-full focus-visible:ring-0"
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                    />
                </div>
                {!readonly ? (
                    <Button
                        variant="secondary"
                        className="h-8 p-2 text-xs"
                        onClick={handleCreateArea}
                    >
                        <Group className="h-4" />
                        {t('side_panel.areas_section.add_area')}
                    </Button>
                ) : null}
            </div>
            <div className="flex flex-1 flex-col overflow-hidden">
                <ScrollArea className="h-full">
                    {areas.length === 0 ? (
                        <EmptyState
                            title={t(
                                'side_panel.areas_section.empty_state.title'
                            )}
                            description={t(
                                'side_panel.areas_section.empty_state.description'
                            )}
                            className="mt-20"
                            secondaryAction={
                                !readonly
                                    ? {
                                          label: t(
                                              'side_panel.areas_section.add_area'
                                          ),
                                          onClick: handleCreateArea,
                                      }
                                    : undefined
                            }
                        />
                    ) : filterText && filteredAreas.length === 0 ? (
                        <div className="mt-10 flex flex-col items-center gap-2">
                            <div className="text-sm text-muted-foreground">
                                {t('side_panel.areas_section.no_results')}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleClearFilter}
                                className="gap-1"
                            >
                                <X className="size-3.5" />
                                {t('side_panel.areas_section.clear')}
                            </Button>
                        </div>
                    ) : (
                        <AreaList areas={filteredAreas} />
                    )}
                </ScrollArea>
            </div>
        </div>
    );
};
