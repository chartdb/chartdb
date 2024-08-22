import React, { useCallback, useEffect, useState } from 'react';
import TimeAgo from 'timeago-react';
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
import { Check, Pencil, Save } from 'lucide-react';
import { Input } from '@/components/input/input';
import { useChartDB } from '@/hooks/use-chartdb';
import { useClickAway, useKeyPressEvent } from 'react-use';
import ChartDBLogo from '@/assets/logo.png';
import { useDialog } from '@/hooks/use-dialog';
import { Badge } from '@/components/badge/badge';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/tooltip/tooltip';
import { useExportImage } from '@/hooks/use-export-image';

export interface TopNavbarProps {}

export const TopNavbar: React.FC<TopNavbarProps> = () => {
    const { diagramName, updateDiagramName, currentDiagram } = useChartDB();
    const { openCreateDiagramDialog, openOpenDiagramDialog } = useDialog();
    const [editMode, setEditMode] = useState(false);
    const { exportImage } = useExportImage();
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

    const createNewDiagram = () => {
        openCreateDiagramDialog();
    };

    const openDiagram = () => {
        openOpenDiagramDialog();
    };

    const enterEditMode = (
        event: React.MouseEvent<HTMLButtonElement, MouseEvent>
    ) => {
        event.stopPropagation();
        setEditMode(true);
    };

    const exportSql = useCallback(() => {
        console.log('Export SQL');
        console.log({ currentDiagram });
    }, [currentDiagram]);

    const exportPNG = useCallback(() => {
        exportImage('png');
    }, [exportImage]);

    const exportSVG = useCallback(() => {
        exportImage('svg');
    }, [exportImage]);

    const exportJPG = useCallback(() => {
        exportImage('jpeg');
    }, [exportImage]);

    return (
        <nav className="flex flex-row items-center justify-between px-4 h-12 border-b">
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
                                <MenubarItem onClick={createNewDiagram}>
                                    New
                                    <MenubarShortcut>⌘T</MenubarShortcut>
                                </MenubarItem>
                                <MenubarItem onClick={openDiagram}>
                                    Open
                                </MenubarItem>
                                <MenubarSeparator />
                                <MenubarItem onClick={exportSql}>
                                    Export
                                </MenubarItem>
                                <MenubarSub>
                                    <MenubarSubTrigger>
                                        Export as
                                    </MenubarSubTrigger>
                                    <MenubarSubContent>
                                        <MenubarItem onClick={exportPNG}>
                                            PNG
                                        </MenubarItem>
                                        <MenubarItem onClick={exportJPG}>
                                            JPG
                                        </MenubarItem>
                                        <MenubarItem onClick={exportSVG}>
                                            SVG
                                        </MenubarItem>
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
            <div className="hidden flex-1 justify-end sm:flex">
                <Tooltip>
                    <TooltipTrigger>
                        <Badge variant="secondary" className="flex gap-1">
                            <Save className="h-4" />
                            Last saved
                            <TimeAgo datetime={currentDiagram.updatedAt} />
                        </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                        {currentDiagram.updatedAt.toLocaleString()}
                    </TooltipContent>
                </Tooltip>
            </div>
        </nav>
    );
};
