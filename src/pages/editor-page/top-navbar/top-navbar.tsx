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
import { Check, Pencil } from 'lucide-react';
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
import {
    databaseSecondaryLogoMap,
    databaseTypeToLabelMap,
} from '@/lib/databases';
import { DatabaseType } from '@/lib/domain/database-type';

export interface TopNavbarProps {}

export const TopNavbar: React.FC<TopNavbarProps> = () => {
    const {
        diagramName,
        updateDiagramName,
        currentDiagram,
        clearDiagramData,
        deleteDiagram,
    } = useChartDB();
    const {
        openCreateDiagramDialog,
        openOpenDiagramDialog,
        openExportSQLDialog,
        showAlert,
    } = useDialog();
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

    const exportPNG = useCallback(() => {
        exportImage('png');
    }, [exportImage]);

    const exportSVG = useCallback(() => {
        exportImage('svg');
    }, [exportImage]);

    const exportJPG = useCallback(() => {
        exportImage('jpeg');
    }, [exportImage]);

    const openChartDBIO = useCallback(() => {
        window.location.href = 'https://chartdb.io';
    }, []);

    const openJoinSlack = useCallback(() => {
        window.open(
            'https://join.slack.com/t/chartdb/shared_invite/zt-2ourrlh5e-mKIHCRML3_~m_gHjD5EcUg',
            '_blank'
        );
    }, []);

    const emojiAI = '✨';

    return (
        <nav className="flex flex-row items-center justify-between px-4 h-12 border-b">
            <div className="flex flex-1 justify-start gap-x-3">
                <div className="flex font-primary items-center">
                    <a
                        href="https://chartdb.io"
                        className="cursor-pointer"
                        rel="noreferrer"
                    >
                        <img
                            src={ChartDBLogo}
                            alt="chartDB"
                            className="h-4 max-w-fit"
                        />
                    </a>
                </div>
                <div>
                    <Menubar className="border-none shadow-none">
                        <MenubarMenu>
                            <MenubarTrigger>File</MenubarTrigger>
                            <MenubarContent>
                                <MenubarItem onClick={createNewDiagram}>
                                    New
                                </MenubarItem>
                                <MenubarItem onClick={openDiagram}>
                                    Open
                                </MenubarItem>
                                <MenubarSeparator />
                                <MenubarSub>
                                    <MenubarSubTrigger>
                                        Export SQL
                                    </MenubarSubTrigger>
                                    <MenubarSubContent>
                                        <MenubarItem
                                            onClick={() =>
                                                openExportSQLDialog({
                                                    targetDatabaseType:
                                                        DatabaseType.GENERIC,
                                                })
                                            }
                                        >
                                            {databaseTypeToLabelMap['generic']}
                                        </MenubarItem>
                                        <MenubarItem
                                            onClick={() =>
                                                openExportSQLDialog({
                                                    targetDatabaseType:
                                                        DatabaseType.POSTGRESQL,
                                                })
                                            }
                                        >
                                            {
                                                databaseTypeToLabelMap[
                                                    'postgresql'
                                                ]
                                            }
                                            <MenubarShortcut className="text-base">
                                                {emojiAI}
                                            </MenubarShortcut>
                                        </MenubarItem>
                                        <MenubarItem
                                            onClick={() =>
                                                openExportSQLDialog({
                                                    targetDatabaseType:
                                                        DatabaseType.MYSQL,
                                                })
                                            }
                                        >
                                            {databaseTypeToLabelMap['mysql']}
                                            <MenubarShortcut className="text-base">
                                                {emojiAI}
                                            </MenubarShortcut>
                                        </MenubarItem>
                                        <MenubarItem
                                            onClick={() =>
                                                openExportSQLDialog({
                                                    targetDatabaseType:
                                                        DatabaseType.SQL_SERVER,
                                                })
                                            }
                                        >
                                            {
                                                databaseTypeToLabelMap[
                                                    'sql_server'
                                                ]
                                            }
                                            <MenubarShortcut className="text-base">
                                                {emojiAI}
                                            </MenubarShortcut>
                                        </MenubarItem>
                                        <MenubarItem
                                            onClick={() =>
                                                openExportSQLDialog({
                                                    targetDatabaseType:
                                                        DatabaseType.MARIADB,
                                                })
                                            }
                                        >
                                            {databaseTypeToLabelMap['mariadb']}
                                            <MenubarShortcut className="text-base">
                                                {emojiAI}
                                            </MenubarShortcut>
                                        </MenubarItem>
                                        <MenubarItem
                                            onClick={() =>
                                                openExportSQLDialog({
                                                    targetDatabaseType:
                                                        DatabaseType.SQLITE,
                                                })
                                            }
                                        >
                                            {databaseTypeToLabelMap['sqlite']}
                                            <MenubarShortcut className="text-base">
                                                {emojiAI}
                                            </MenubarShortcut>
                                        </MenubarItem>
                                    </MenubarSubContent>
                                </MenubarSub>
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
                                <MenubarItem
                                    onClick={() =>
                                        showAlert({
                                            title: 'Delete Diagram',
                                            description:
                                                'This action cannot be undone. This will permanently delete the diagram.',
                                            actionLabel: 'Delete',
                                            closeLabel: 'Cancel',
                                            onAction: deleteDiagram,
                                        })
                                    }
                                >
                                    Delete Diagram
                                </MenubarItem>
                                <MenubarSeparator />
                                <MenubarItem>Exit</MenubarItem>
                            </MenubarContent>
                        </MenubarMenu>
                        <MenubarMenu>
                            <MenubarTrigger>Edit</MenubarTrigger>
                            <MenubarContent>
                                <MenubarItem>Undo</MenubarItem>
                                <MenubarItem>Redo</MenubarItem>
                                <MenubarSeparator />
                                <MenubarItem
                                    onClick={() =>
                                        showAlert({
                                            title: 'Clear Diagram',
                                            description:
                                                'This action cannot be undone. This will permanently delete all the data in the diagram.',
                                            actionLabel: 'Clear',
                                            closeLabel: 'Cancel',
                                            onAction: clearDiagramData,
                                        })
                                    }
                                >
                                    Clear
                                </MenubarItem>
                            </MenubarContent>
                        </MenubarMenu>
                        <MenubarMenu>
                            <MenubarTrigger>Help</MenubarTrigger>
                            <MenubarContent>
                                <MenubarItem onClick={openChartDBIO}>
                                    Visit ChartDB
                                </MenubarItem>
                                <MenubarItem onClick={openJoinSlack}>
                                    Join us on Slack
                                </MenubarItem>
                            </MenubarContent>
                        </MenubarMenu>
                    </Menubar>
                </div>
            </div>
            <div className="flex flex-row flex-1 justify-center items-center group">
                <Tooltip>
                    <TooltipTrigger className="mr-2">
                        <img
                            src={
                                databaseSecondaryLogoMap[
                                    currentDiagram.databaseType
                                ]
                            }
                            className="h-5 max-w-fit"
                            alt="database"
                        />
                    </TooltipTrigger>
                    <TooltipContent>
                        {databaseTypeToLabelMap[currentDiagram.databaseType]}
                    </TooltipContent>
                </Tooltip>
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
                                className="h-7 focus-visible:ring-0 ml-1"
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
