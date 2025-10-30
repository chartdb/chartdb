import React from 'react';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/tabs/tabs';
import { AreasTab } from './areas-tab/areas-tab';
import { useTranslation } from 'react-i18next';
import { useLayout } from '@/hooks/use-layout';
import type { VisualsTab } from '@/context/layout-context/layout-context';

export interface VisualsSectionProps {}

export const VisualsSection: React.FC<VisualsSectionProps> = () => {
    const { t } = useTranslation();
    const { selectedVisualsTab, selectVisualsTab } = useLayout();

    return (
        <section
            className="flex flex-1 flex-col overflow-hidden"
            data-vaul-no-drag
        >
            <Tabs
                value={selectedVisualsTab}
                onValueChange={(value) => selectVisualsTab(value as VisualsTab)}
                className="flex flex-1 flex-col overflow-hidden"
            >
                <div className="px-2 pt-2">
                    <TabsList className="w-full">
                        <TabsTrigger value="areas" className="flex-1">
                            {t('side_panel.visuals_section.tabs.areas')}
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent
                    value="areas"
                    className="mt-0 flex flex-1 flex-col overflow-hidden"
                >
                    <AreasTab />
                </TabsContent>
            </Tabs>
        </section>
    );
};
