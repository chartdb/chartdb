import React from 'react';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/tabs/tabs';
import { AreasTab } from './areas-tab/areas-tab';
import { NotesTab } from './notes-tab/notes-tab';
import { useTranslation } from 'react-i18next';
import { useLayout } from '@/hooks/use-layout';
import type { VisualsTab } from '@/context/layout-context/layout-context';
import { Separator } from '@/components/separator/separator';
import { Group, StickyNote } from 'lucide-react';

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
                    <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-xl border bg-background p-1">
                        <TabsTrigger
                            value="areas"
                            className="gap-1.5 rounded-lg px-3 py-1 text-sm font-medium transition-all data-[state=active]:bg-sky-600 data-[state=active]:text-white data-[state=inactive]:text-muted-foreground data-[state=active]:shadow-sm data-[state=inactive]:hover:bg-muted/50 data-[state=inactive]:hover:text-foreground dark:data-[state=active]:bg-sky-500"
                        >
                            <Group className="size-3.5" />
                            {t('side_panel.visuals_section.tabs.areas')}
                        </TabsTrigger>
                        <TabsTrigger
                            value="notes"
                            className="gap-1.5 rounded-lg px-3 py-1 text-sm font-medium transition-all data-[state=active]:bg-sky-600 data-[state=active]:text-white data-[state=inactive]:text-muted-foreground data-[state=active]:shadow-sm data-[state=inactive]:hover:bg-muted/50 data-[state=inactive]:hover:text-foreground dark:data-[state=active]:bg-sky-500"
                        >
                            <StickyNote className="size-3.5" />
                            {t('side_panel.visuals_section.tabs.notes')}
                        </TabsTrigger>
                    </TabsList>
                    <Separator orientation="horizontal" className="my-2" />
                </div>

                <TabsContent
                    value="areas"
                    className="mt-0 flex flex-1 flex-col overflow-hidden data-[state=inactive]:hidden"
                >
                    <AreasTab />
                </TabsContent>

                <TabsContent
                    value="notes"
                    className="mt-0 flex flex-1 flex-col overflow-hidden data-[state=inactive]:hidden"
                >
                    <NotesTab />
                </TabsContent>
            </Tabs>
        </section>
    );
};
