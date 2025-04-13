import React from 'react';
import { SidePanel } from './side-panel/side-panel';
import { Canvas } from './canvas/canvas';
import { useLayout } from '@/hooks/use-layout';
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
} from '@/components/drawer/drawer';
import { Separator } from '@/components/separator/separator';
import type { Diagram } from '@/lib/domain/diagram';
import { TopNavbarMobile } from './top-navbar/top-navbar-mobile';
import { SidebarProvider } from '@/components/sidebar/sidebar';
import { EditorSidebar } from './editor-sidebar/editor-sidebar';

export interface EditorMobileLayoutProps {
    initialDiagram?: Diagram;
}
export const EditorMobileLayout: React.FC<EditorMobileLayoutProps> = ({
    initialDiagram,
}) => {
    const { isSidePanelShowed, hideSidePanel } = useLayout();
    return (
        <>
            <SidebarProvider
                defaultOpen={false}
                open={false}
                className="flex-col"
            >
                <EditorSidebar />
                <TopNavbarMobile />
                <Drawer
                    open={isSidePanelShowed}
                    onClose={() => hideSidePanel()}
                >
                    <DrawerContent className="h-full" fullScreen>
                        <DrawerHeader>
                            <DrawerTitle>Manage Diagram</DrawerTitle>
                            <DrawerDescription>
                                Manage your diagram objects
                            </DrawerDescription>
                        </DrawerHeader>
                        <Separator orientation="horizontal" />
                        <SidePanel data-vaul-no-drag />
                    </DrawerContent>
                </Drawer>
                <Canvas initialTables={initialDiagram?.tables ?? []} />
            </SidebarProvider>
        </>
    );
};

export default EditorMobileLayout;
