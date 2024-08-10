import React from 'react';
import {
    Menubar,
    MenubarCheckboxItem,
    MenubarContent,
    MenubarItem,
    MenubarMenu,
    MenubarSeparator,
    MenubarShortcut,
    MenubarSub,
    MenubarSubContent,
    MenubarSubTrigger,
    MenubarTrigger,
} from '@/components/menubar/menubar';
import { Label } from '@/components/label/label';

export interface TopNavbarProps {}

export const TopNavbar: React.FC<TopNavbarProps> = () => {
    return (
        <nav className="flex flex-row items-center justify-between px-4">
            <div className="flex flex-1 justify-start gap-x-3">
                <div className="flex font-primary items-center">chartDB</div>
                <div>
                    <Menubar className="border-none shadow-none">
                        <MenubarMenu>
                            <MenubarTrigger>File</MenubarTrigger>
                            <MenubarContent>
                                <MenubarItem>
                                    New Tab{' '}
                                    <MenubarShortcut>⌘T</MenubarShortcut>
                                </MenubarItem>
                                <MenubarItem>
                                    New Window{' '}
                                    <MenubarShortcut>⌘N</MenubarShortcut>
                                </MenubarItem>
                                <MenubarItem disabled>
                                    New Incognito Window
                                </MenubarItem>
                                <MenubarSeparator />
                                <MenubarSub>
                                    <MenubarSubTrigger>Share</MenubarSubTrigger>
                                    <MenubarSubContent>
                                        <MenubarItem>Email link</MenubarItem>
                                        <MenubarItem>Messages</MenubarItem>
                                        <MenubarItem>Notes</MenubarItem>
                                    </MenubarSubContent>
                                </MenubarSub>
                                <MenubarSeparator />
                                <MenubarItem>
                                    Print...{' '}
                                    <MenubarShortcut>⌘P</MenubarShortcut>
                                </MenubarItem>
                            </MenubarContent>
                        </MenubarMenu>
                        <MenubarMenu>
                            <MenubarTrigger>Edit</MenubarTrigger>
                            <MenubarContent>
                                <MenubarItem>
                                    Undo <MenubarShortcut>⌘Z</MenubarShortcut>
                                </MenubarItem>
                                <MenubarItem>
                                    Redo <MenubarShortcut>⇧⌘Z</MenubarShortcut>
                                </MenubarItem>
                                <MenubarSeparator />
                                <MenubarSub>
                                    <MenubarSubTrigger>Find</MenubarSubTrigger>
                                    <MenubarSubContent>
                                        <MenubarItem>
                                            Search the web
                                        </MenubarItem>
                                        <MenubarSeparator />
                                        <MenubarItem>Find...</MenubarItem>
                                        <MenubarItem>Find Next</MenubarItem>
                                        <MenubarItem>Find Previous</MenubarItem>
                                    </MenubarSubContent>
                                </MenubarSub>
                                <MenubarSeparator />
                                <MenubarItem>Cut</MenubarItem>
                                <MenubarItem>Copy</MenubarItem>
                                <MenubarItem>Paste</MenubarItem>
                            </MenubarContent>
                        </MenubarMenu>
                        <MenubarMenu>
                            <MenubarTrigger>View</MenubarTrigger>
                            <MenubarContent>
                                <MenubarCheckboxItem>
                                    Always Show Bookmarks Bar
                                </MenubarCheckboxItem>
                                <MenubarCheckboxItem checked>
                                    Always Show Full URLs
                                </MenubarCheckboxItem>
                                <MenubarSeparator />
                                <MenubarItem inset>
                                    Reload <MenubarShortcut>⌘R</MenubarShortcut>
                                </MenubarItem>
                                <MenubarItem disabled inset>
                                    Force Reload{' '}
                                    <MenubarShortcut>⇧⌘R</MenubarShortcut>
                                </MenubarItem>
                                <MenubarSeparator />
                                <MenubarItem inset>
                                    Toggle Fullscreen
                                </MenubarItem>
                                <MenubarSeparator />
                                <MenubarItem inset>Hide Sidebar</MenubarItem>
                            </MenubarContent>
                        </MenubarMenu>
                    </Menubar>
                </div>
            </div>
            <div className="flex flex-1 justify-center">
                <Label>Diagrams/</Label>
                <Label contentEditable suppressContentEditableWarning>
                    aaa
                </Label>
            </div>
            <div className="flex flex-1 justify-end"></div>
        </nav>
    );
};
