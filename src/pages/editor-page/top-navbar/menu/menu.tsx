import React, { useCallback } from 'react';
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
import { useChartDB } from '@/hooks/use-chartdb';
import { useDialog } from '@/hooks/use-dialog';
import { useExportImage } from '@/hooks/use-export-image';
import { databaseTypeToLabelMap } from '@/lib/databases';
import { DatabaseType } from '@/lib/domain/database-type';
import {
    KeyboardShortcutAction,
    keyboardShortcutsForOS,
} from '@/context/keyboard-shortcuts-context/keyboard-shortcuts';
import { useHistory } from '@/hooks/use-history';
import { useTranslation } from 'react-i18next';
import { useLayout } from '@/hooks/use-layout';
import { useTheme } from '@/hooks/use-theme';
import { useLocalConfig } from '@/hooks/use-local-config';
import { useNavigate } from 'react-router-dom';
import { useAlert } from '@/context/alert-context/alert-context';

export interface MenuProps {}

export const Menu: React.FC<MenuProps> = () => {
    const {
        clearDiagramData,
        deleteDiagram,
        updateDiagramUpdatedAt,
        databaseType,
        dependencies,
    } = useChartDB();
    const {
        openCreateDiagramDialog,
        openOpenDiagramDialog,
        openExportSQLDialog,
        openImportDatabaseDialog,
        openExportImageDialog,
        openExportDiagramDialog,
        openImportDiagramDialog,
        openImportDBMLDialog,
    } = useDialog();
    const { showAlert } = useAlert();
    const { setTheme, theme } = useTheme();
    const { hideSidePanel, isSidePanelShowed, showSidePanel } = useLayout();
    const {
        scrollAction,
        setScrollAction,
        setShowCardinality,
        showCardinality,
        setShowDependenciesOnCanvas,
        showDependenciesOnCanvas,
        setShowMiniMapOnCanvas,
        showMiniMapOnCanvas,
    } = useLocalConfig();
    const { t } = useTranslation();
    const { redo, undo, hasRedo, hasUndo } = useHistory();
    const { exportImage } = useExportImage();
    const navigate = useNavigate();

    const handleDeleteDiagramAction = useCallback(() => {
        deleteDiagram();
        navigate('/');
    }, [deleteDiagram, navigate]);

    const createNewDiagram = () => {
        openCreateDiagramDialog();
    };

    const openDiagram = () => {
        openOpenDiagramDialog();
    };

    const exportSVG = useCallback(() => {
        exportImage('svg', {
            scale: 1,
            transparent: true,
            includePatternBG: false,
        });
    }, [exportImage]);

    const exportPNG = useCallback(() => {
        openExportImageDialog({
            format: 'png',
        });
    }, [openExportImageDialog]);

    const exportJPG = useCallback(() => {
        openExportImageDialog({
            format: 'jpeg',
        });
    }, [openExportImageDialog]);

    const openChartDBDocs = useCallback(() => {
        window.open('https://docs.chartdb.io', '_blank');
    }, []);

    const openJoinDiscord = useCallback(() => {
        window.open('https://discord.gg/QeFwyWSKwC', '_blank');
    }, []);

    const exportSQL = useCallback(
        (databaseType: DatabaseType) => {
            if (databaseType === DatabaseType.GENERIC) {
                openExportSQLDialog({
                    targetDatabaseType: DatabaseType.GENERIC,
                });

                return;
            }

            openExportSQLDialog({
                targetDatabaseType: databaseType,
            });
        },
        [openExportSQLDialog]
    );

    const showOrHideSidePanel = useCallback(() => {
        if (isSidePanelShowed) {
            hideSidePanel();
        } else {
            showSidePanel();
        }
    }, [isSidePanelShowed, showSidePanel, hideSidePanel]);

    const showOrHideCardinality = useCallback(() => {
        setShowCardinality(!showCardinality);
    }, [showCardinality, setShowCardinality]);

    const showOrHideDependencies = useCallback(() => {
        setShowDependenciesOnCanvas(!showDependenciesOnCanvas);
    }, [showDependenciesOnCanvas, setShowDependenciesOnCanvas]);

    const showOrHideMiniMap = useCallback(() => {
        setShowMiniMapOnCanvas(!showMiniMapOnCanvas);
    }, [showMiniMapOnCanvas, setShowMiniMapOnCanvas]);

    const emojiAI = '✨';

    return (
        <Menubar className="h-8 border-none py-2 shadow-none md:h-10 md:py-0">
            <MenubarMenu>
                <MenubarTrigger>{t('menu.file.file')}</MenubarTrigger>
                <MenubarContent>
                    <MenubarItem onClick={createNewDiagram}>
                        {t('menu.file.new')}
                    </MenubarItem>
                    <MenubarItem onClick={openDiagram}>
                        {t('menu.file.open')}
                        <MenubarShortcut>
                            {
                                keyboardShortcutsForOS[
                                    KeyboardShortcutAction.OPEN_DIAGRAM
                                ].keyCombinationLabel
                            }
                        </MenubarShortcut>
                    </MenubarItem>
                    <MenubarItem onClick={updateDiagramUpdatedAt}>
                        {t('menu.file.save')}
                        <MenubarShortcut>
                            {
                                keyboardShortcutsForOS[
                                    KeyboardShortcutAction.SAVE_DIAGRAM
                                ].keyCombinationLabel
                            }
                        </MenubarShortcut>
                    </MenubarItem>
                    <MenubarSeparator />
                    <MenubarSub>
                        <MenubarSubTrigger>
                            {t('menu.file.import')}
                        </MenubarSubTrigger>
                        <MenubarSubContent>
                            <MenubarItem onClick={openImportDiagramDialog}>
                                .json
                            </MenubarItem>
                            <MenubarItem onClick={() => openImportDBMLDialog()}>
                                .dbml
                            </MenubarItem>
                            <MenubarSeparator />
                            <MenubarItem
                                onClick={() =>
                                    openImportDatabaseDialog({
                                        databaseType: DatabaseType.POSTGRESQL,
                                    })
                                }
                            >
                                {databaseTypeToLabelMap['postgresql']}
                            </MenubarItem>
                            <MenubarItem
                                onClick={() =>
                                    openImportDatabaseDialog({
                                        databaseType: DatabaseType.MYSQL,
                                    })
                                }
                            >
                                {databaseTypeToLabelMap['mysql']}
                            </MenubarItem>
                            <MenubarItem
                                onClick={() =>
                                    openImportDatabaseDialog({
                                        databaseType: DatabaseType.SQL_SERVER,
                                    })
                                }
                            >
                                {databaseTypeToLabelMap['sql_server']}
                            </MenubarItem>
                            <MenubarItem
                                onClick={() =>
                                    openImportDatabaseDialog({
                                        databaseType: DatabaseType.MARIADB,
                                    })
                                }
                            >
                                {databaseTypeToLabelMap['mariadb']}
                            </MenubarItem>
                            <MenubarItem
                                onClick={() =>
                                    openImportDatabaseDialog({
                                        databaseType: DatabaseType.SQLITE,
                                    })
                                }
                            >
                                {databaseTypeToLabelMap['sqlite']}
                            </MenubarItem>
                        </MenubarSubContent>
                    </MenubarSub>
                    <MenubarSeparator />
                    <MenubarSub>
                        <MenubarSubTrigger>
                            {t('menu.file.export_sql')}
                        </MenubarSubTrigger>
                        <MenubarSubContent>
                            <MenubarItem
                                onClick={() => exportSQL(DatabaseType.GENERIC)}
                            >
                                {databaseTypeToLabelMap['generic']}
                            </MenubarItem>
                            <MenubarItem
                                onClick={() =>
                                    exportSQL(DatabaseType.POSTGRESQL)
                                }
                            >
                                {databaseTypeToLabelMap['postgresql']}
                                {databaseType !== DatabaseType.POSTGRESQL && (
                                    <MenubarShortcut className="text-base">
                                        {emojiAI}
                                    </MenubarShortcut>
                                )}
                            </MenubarItem>
                            <MenubarItem
                                onClick={() => exportSQL(DatabaseType.MYSQL)}
                            >
                                {databaseTypeToLabelMap['mysql']}
                                {databaseType !== DatabaseType.MYSQL && (
                                    <MenubarShortcut className="text-base">
                                        {emojiAI}
                                    </MenubarShortcut>
                                )}
                            </MenubarItem>
                            <MenubarItem
                                onClick={() =>
                                    exportSQL(DatabaseType.SQL_SERVER)
                                }
                            >
                                {databaseTypeToLabelMap['sql_server']}
                                {databaseType !== DatabaseType.SQL_SERVER && (
                                    <MenubarShortcut className="text-base">
                                        {emojiAI}
                                    </MenubarShortcut>
                                )}
                            </MenubarItem>
                            <MenubarItem
                                onClick={() => exportSQL(DatabaseType.MARIADB)}
                            >
                                {databaseTypeToLabelMap['mariadb']}
                                {databaseType !== DatabaseType.MARIADB && (
                                    <MenubarShortcut className="text-base">
                                        {emojiAI}
                                    </MenubarShortcut>
                                )}
                            </MenubarItem>
                            <MenubarItem
                                onClick={() => exportSQL(DatabaseType.SQLITE)}
                            >
                                {databaseTypeToLabelMap['sqlite']}
                                {databaseType !== DatabaseType.SQLITE && (
                                    <MenubarShortcut className="text-base">
                                        {emojiAI}
                                    </MenubarShortcut>
                                )}
                            </MenubarItem>
                        </MenubarSubContent>
                    </MenubarSub>
                    <MenubarSub>
                        <MenubarSubTrigger>
                            {t('menu.file.export_as')}
                        </MenubarSubTrigger>
                        <MenubarSubContent>
                            <MenubarItem onClick={exportPNG}>PNG</MenubarItem>
                            <MenubarItem onClick={exportJPG}>JPG</MenubarItem>
                            <MenubarItem onClick={exportSVG}>SVG</MenubarItem>
                            <MenubarSeparator />
                            <MenubarItem onClick={openExportDiagramDialog}>
                                JSON
                            </MenubarItem>
                        </MenubarSubContent>
                    </MenubarSub>
                    <MenubarSeparator />
                    <MenubarItem
                        onClick={() =>
                            showAlert({
                                title: t('delete_diagram_alert.title'),
                                description: t(
                                    'delete_diagram_alert.description'
                                ),
                                actionLabel: t('delete_diagram_alert.delete'),
                                closeLabel: t('delete_diagram_alert.cancel'),
                                onAction: handleDeleteDiagramAction,
                            })
                        }
                    >
                        {t('menu.file.delete_diagram')}
                    </MenubarItem>
                    <MenubarSeparator />
                    <MenubarItem>{t('menu.file.exit')}</MenubarItem>
                </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
                <MenubarTrigger>{t('menu.edit.edit')}</MenubarTrigger>
                <MenubarContent>
                    <MenubarItem onClick={undo} disabled={!hasUndo}>
                        {t('menu.edit.undo')}
                        <MenubarShortcut>
                            {
                                keyboardShortcutsForOS[
                                    KeyboardShortcutAction.UNDO
                                ].keyCombinationLabel
                            }
                        </MenubarShortcut>
                    </MenubarItem>
                    <MenubarItem onClick={redo} disabled={!hasRedo}>
                        {t('menu.edit.redo')}
                        <MenubarShortcut>
                            {
                                keyboardShortcutsForOS[
                                    KeyboardShortcutAction.REDO
                                ].keyCombinationLabel
                            }
                        </MenubarShortcut>
                    </MenubarItem>
                    <MenubarSeparator />
                    <MenubarItem
                        onClick={() =>
                            showAlert({
                                title: t('clear_diagram_alert.title'),
                                description: t(
                                    'clear_diagram_alert.description'
                                ),
                                actionLabel: t('clear_diagram_alert.clear'),
                                closeLabel: t('clear_diagram_alert.cancel'),
                                onAction: clearDiagramData,
                            })
                        }
                    >
                        {t('menu.edit.clear')}
                    </MenubarItem>
                </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
                <MenubarTrigger>{t('menu.view.view')}</MenubarTrigger>
                <MenubarContent>
                    <MenubarItem onClick={showOrHideSidePanel}>
                        {isSidePanelShowed
                            ? t('menu.view.hide_sidebar')
                            : t('menu.view.show_sidebar')}
                        <MenubarShortcut>
                            {
                                keyboardShortcutsForOS[
                                    KeyboardShortcutAction.TOGGLE_SIDE_PANEL
                                ].keyCombinationLabel
                            }
                        </MenubarShortcut>
                    </MenubarItem>
                    <MenubarSeparator />
                    <MenubarItem onClick={showOrHideCardinality}>
                        {showCardinality
                            ? t('menu.view.hide_cardinality')
                            : t('menu.view.show_cardinality')}
                    </MenubarItem>
                    {databaseType !== DatabaseType.CLICKHOUSE &&
                    dependencies &&
                    dependencies.length > 0 ? (
                        <MenubarItem onClick={showOrHideDependencies}>
                            {showDependenciesOnCanvas
                                ? t('menu.view.hide_dependencies')
                                : t('menu.view.show_dependencies')}
                        </MenubarItem>
                    ) : null}
                    <MenubarItem onClick={showOrHideMiniMap}>
                        {showMiniMapOnCanvas
                            ? t('menu.view.hide_minimap')
                            : t('menu.view.show_minimap')}
                    </MenubarItem>
                    <MenubarSeparator />
                    <MenubarSub>
                        <MenubarSubTrigger>
                            {t('menu.view.zoom_on_scroll')}
                        </MenubarSubTrigger>
                        <MenubarSubContent>
                            <MenubarCheckboxItem
                                checked={scrollAction === 'zoom'}
                                onClick={() => setScrollAction('zoom')}
                            >
                                {t('zoom.on')}
                            </MenubarCheckboxItem>
                            <MenubarCheckboxItem
                                checked={scrollAction === 'pan'}
                                onClick={() => setScrollAction('pan')}
                            >
                                {t('zoom.off')}
                            </MenubarCheckboxItem>
                        </MenubarSubContent>
                    </MenubarSub>
                    <MenubarSeparator />
                    <MenubarSub>
                        <MenubarSubTrigger className="flex items-center gap-1">
                            <span>{t('menu.view.theme')}</span>
                            <div className="flex-1" />
                            <MenubarShortcut>
                                {
                                    keyboardShortcutsForOS[
                                        KeyboardShortcutAction.TOGGLE_THEME
                                    ].keyCombinationLabel
                                }
                            </MenubarShortcut>
                        </MenubarSubTrigger>
                        <MenubarSubContent>
                            <MenubarCheckboxItem
                                checked={theme === 'system'}
                                onClick={() => setTheme('system')}
                            >
                                {t('theme.system')}
                            </MenubarCheckboxItem>
                            <MenubarCheckboxItem
                                checked={theme === 'light'}
                                onClick={() => setTheme('light')}
                            >
                                {t('theme.light')}
                            </MenubarCheckboxItem>
                            <MenubarCheckboxItem
                                checked={theme === 'dark'}
                                onClick={() => setTheme('dark')}
                            >
                                {t('theme.dark')}
                            </MenubarCheckboxItem>
                        </MenubarSubContent>
                    </MenubarSub>
                </MenubarContent>
            </MenubarMenu>

            <MenubarMenu>
                <MenubarTrigger>{t('menu.backup.backup')}</MenubarTrigger>
                <MenubarContent>
                    <MenubarItem onClick={openExportDiagramDialog}>
                        {t('menu.backup.export_diagram')}
                    </MenubarItem>
                    <MenubarItem onClick={openImportDiagramDialog}>
                        {t('menu.backup.restore_diagram')}
                    </MenubarItem>
                </MenubarContent>
            </MenubarMenu>

            <MenubarMenu>
                <MenubarTrigger>{t('menu.help.help')}</MenubarTrigger>
                <MenubarContent>
                    <MenubarItem onClick={openChartDBDocs}>
                        {t('menu.help.docs_website')}
                    </MenubarItem>
                    <MenubarItem onClick={openJoinDiscord}>
                        {t('menu.help.join_discord')}
                    </MenubarItem>
                </MenubarContent>
            </MenubarMenu>
        </Menubar>
    );
};
