import React, { useCallback, useEffect } from 'react';
import {
    Menubar,
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
import { Button } from '@/components/button/button';
import { Check, Pencil } from 'lucide-react';
import { Input } from '@/components/input/input';
import { useChartDB } from '@/hooks/use-chartdb';
import { useClickAway, useKeyPressEvent } from 'react-use';
import ChartDBLogo from '@/assets/logo.png';

export interface TopNavbarProps {}

export const TopNavbar: React.FC<TopNavbarProps> = () => {
    const { diagramName, updateDiagramName } = useChartDB();
    const [editMode, setEditMode] = React.useState(false);
    const [editedDiagramName, setEditedDiagramName] =
        React.useState(diagramName);
    const inputRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => {
        setEditedDiagramName(diagramName);
    }, [diagramName]);

    const editDiagramName = useCallback(() => {
        if (!editMode) return;
        if (editedDiagramName.trim()) {
            updateDiagramName(editedDiagramName.trim());
        }

        setEditMode(false);
    }, [editedDiagramName, updateDiagramName, editMode]);

    useClickAway(inputRef, editDiagramName);
    useKeyPressEvent('Enter', editDiagramName);

    const enterEditMode = (
        event: React.MouseEvent<HTMLButtonElement, MouseEvent>
    ) => {
        event.stopPropagation();
        setEditMode(true);
    };
    return (
        <nav className="flex flex-row items-center justify-between px-4 h-12">
            <div className="flex flex-1 justify-start gap-x-3">
                <div className="flex font-primary items-center">
                    <img
                        src={ChartDBLogo}
                        alt="chartDB"
                        className="h-4 max-w-fit"
                    />
                </div>
                <div>
                    <Menubar className="border-none shadow-none">
                        <MenubarMenu>
                            <MenubarTrigger>File</MenubarTrigger>
                            <MenubarContent>
                                <MenubarItem>
                                    New
                                    <MenubarShortcut>⌘T</MenubarShortcut>
                                </MenubarItem>
                                <MenubarItem>
                                    New Window
                                    <MenubarShortcut>⌘N</MenubarShortcut>
                                </MenubarItem>
                                <MenubarItem>Open</MenubarItem>
                                <MenubarItem>Save</MenubarItem>
                                <MenubarItem>Save as</MenubarItem>
                                <MenubarSeparator />
                                <MenubarItem>Export</MenubarItem>
                                <MenubarSub>
                                    <MenubarSubTrigger>
                                        Export as
                                    </MenubarSubTrigger>
                                    <MenubarSubContent>
                                        <MenubarItem>PNG</MenubarItem>
                                        <MenubarItem>JPG</MenubarItem>
                                    </MenubarSubContent>
                                </MenubarSub>
                                <MenubarSub>
                                    <MenubarSubTrigger>Share</MenubarSubTrigger>
                                    <MenubarSubContent>
                                        <MenubarItem>Email link</MenubarItem>
                                        <MenubarItem>Messages</MenubarItem>
                                        <MenubarItem>Notes</MenubarItem>
                                    </MenubarSubContent>
                                </MenubarSub>
                                <MenubarSeparator />
                                <MenubarItem>Exit</MenubarItem>
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
                                <MenubarItem>
                                    Find <MenubarShortcut>⌘F</MenubarShortcut>
                                </MenubarItem>
                                <MenubarSeparator />
                                <MenubarItem>Clear</MenubarItem>
                            </MenubarContent>
                        </MenubarMenu>
                        <MenubarMenu>
                            <MenubarTrigger>Help</MenubarTrigger>
                            <MenubarContent>
                                <MenubarItem>Report a bug</MenubarItem>
                                <MenubarItem>Visit ChartDB</MenubarItem>
                            </MenubarContent>
                        </MenubarMenu>
                    </Menubar>
                </div>
            </div>
            <div className="flex flex-row flex-1 justify-center items-center group">
                <div className="flex">
                    <Label>Diagrams/</Label>
                </div>
                <div className="flex flex-row items-center gap-1">
                    {editMode ? (
                        <>
                            <Input
                                ref={inputRef}
                                autoFocus
                                type="text"
                                placeholder={diagramName}
                                value={editedDiagramName}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) =>
                                    setEditedDiagramName(e.target.value)
                                }
                                className="h-7 focus-visible:ring-0"
                            />
                            <Button
                                variant="ghost"
                                className="hover:bg-primary-foreground p-2 w-7 h-7 text-slate-500 hover:text-slate-700 hidden group-hover:flex"
                                onClick={editDiagramName}
                            >
                                <Check />
                            </Button>
                        </>
                    ) : (
                        <>
                            <Label>{diagramName}</Label>
                            <Button
                                variant="ghost"
                                className="hover:bg-primary-foreground p-2 w-7 h-7 text-slate-500 hover:text-slate-700 hidden group-hover:flex"
                                onClick={enterEditMode}
                            >
                                <Pencil />
                            </Button>
                        </>
                    )}
                </div>
            </div>
            <div className="hidden flex-1 justify-end sm:flex"></div>
        </nav>
    );
};
