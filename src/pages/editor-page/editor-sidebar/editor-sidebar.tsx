import React, { useMemo } from 'react';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/sidebar/sidebar';
import { Twitter, BookOpen } from 'lucide-react';
import { SquareStack, Table, Workflow } from 'lucide-react';
import { useLayout } from '@/hooks/use-layout';
import { useTranslation } from 'react-i18next';
import { DiscordLogoIcon } from '@radix-ui/react-icons';

export interface SidebarItem {
    title: string;
    icon: React.FC;
    onClick: () => void;
    active: boolean;
    badge?: string;
}

export interface EditorSidebarProps {}

export const EditorSidebar: React.FC<EditorSidebarProps> = () => {
    const { selectSidebarSection, selectedSidebarSection, showSidePanel } =
        useLayout();
    const { t } = useTranslation();
    const items: SidebarItem[] = useMemo(
        () => [
            {
                title: t('side_panel.tables_section.tables'),
                icon: Table,
                onClick: () => {
                    showSidePanel();
                    selectSidebarSection('tables');
                },
                active: selectedSidebarSection === 'tables',
            },
            {
                title: t('side_panel.relationships_section.relationships'),
                icon: Workflow,
                onClick: () => {
                    showSidePanel();
                    selectSidebarSection('relationships');
                },
                active: selectedSidebarSection === 'relationships',
            },
            {
                title: t('side_panel.dependencies_section.dependencies'),
                icon: SquareStack,
                onClick: () => {
                    showSidePanel();
                    selectSidebarSection('dependencies');
                },
                active: selectedSidebarSection === 'dependencies',
            },
        ],
        [selectSidebarSection, selectedSidebarSection, t, showSidePanel]
    );

    const footerItems: SidebarItem[] = useMemo(
        () => [
            {
                title: 'Discord',
                icon: DiscordLogoIcon,
                onClick: () =>
                    window.open('https://discord.gg/QeFwyWSKwC', '_blank'),
                active: false,
            },
            {
                title: 'Twitter',
                icon: Twitter,
                onClick: () =>
                    window.open('https://x.com/jonathanfishner', '_blank'),
                active: false,
            },
            {
                title: 'Documentation',
                icon: BookOpen,
                onClick: () => window.open('https://docs.chartdb.io', '_blank'),
                active: false,
            },
        ],
        []
    );

    return (
        <Sidebar
            side="left"
            collapsible="icon"
            variant="sidebar"
            className="relative h-full"
        >
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel />
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        className="hover:bg-gray-200 data-[active=true]:bg-gray-100 data-[active=true]:text-pink-600 data-[active=true]:hover:bg-pink-100 dark:hover:bg-gray-800 dark:data-[active=true]:bg-gray-900 dark:data-[active=true]:text-pink-400 dark:data-[active=true]:hover:bg-pink-950"
                                        isActive={item.active}
                                        asChild
                                        tooltip={item.title}
                                    >
                                        <button onClick={item.onClick}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </button>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <SidebarMenu>
                    {footerItems.map((item) => (
                        <SidebarMenuItem key={item.title}>
                            {item.badge && (
                                <span className="absolute -right-1 -top-1 rounded-full bg-pink-500 px-[3px] py-px text-[8px] font-semibold text-white">
                                    {item.badge}
                                </span>
                            )}
                            <SidebarMenuButton
                                className="hover:bg-gray-200 data-[active=true]:bg-gray-100 data-[active=true]:text-pink-600 data-[active=true]:hover:bg-pink-100 dark:hover:bg-gray-800 dark:data-[active=true]:bg-gray-900 dark:data-[active=true]:text-pink-400 dark:data-[active=true]:hover:bg-pink-950"
                                isActive={item.active}
                                asChild
                                tooltip={item.title}
                            >
                                <button onClick={item.onClick}>
                                    <item.icon />
                                    <span>{item.title}</span>
                                </button>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
};
