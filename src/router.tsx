import React from 'react';
import type { RouteObject } from 'react-router-dom';
import { createBrowserRouter } from 'react-router-dom';
import { NotFoundPage } from './pages/not-found-page/not-found-page';
import { EditorPage } from './pages/editor-page/editor-page';
import { ChartDBProvider } from './context/chartdb-context/chartdb-provider';
import { ReactFlowProvider } from '@xyflow/react';
import { StorageProvider } from './context/storage-context/storage-provider';
import { ConfigProvider } from './context/config-context/config-provider';
import { HistoryProvider } from './context/history-context/history-provider';
import { RedoUndoStackProvider } from './context/history-context/redo-undo-stack-provider';
import { LayoutProvider } from './context/layout-context/layout-provider';
import { DialogProvider } from './context/dialog-context/dialog-provider';
import { ExportImageProvider } from './context/export-image-context/export-image-provider';
import { FullScreenLoaderProvider } from './context/full-screen-spinner-context/full-screen-spinner-provider';
import { ExamplesPage } from './pages/examples-page/examples-page';
import { KeyboardShortcutsProvider } from './context/keyboard-shortcuts-context/keyboard-shortcuts-provider';
import { ThemeProvider } from './context/theme-context/theme-provider';
import { LocalConfigProvider } from './context/local-config-context/local-config-provider';

const routes: RouteObject[] = [
    ...['', 'diagrams/:diagramId'].map((path) => ({
        path,
        element: (
            <FullScreenLoaderProvider>
                <LayoutProvider>
                    <LocalConfigProvider>
                        <StorageProvider>
                            <ConfigProvider>
                                <RedoUndoStackProvider>
                                    <ChartDBProvider>
                                        <HistoryProvider>
                                            <ThemeProvider>
                                                <ReactFlowProvider>
                                                    <DialogProvider>
                                                        <ExportImageProvider>
                                                            <KeyboardShortcutsProvider>
                                                                <EditorPage />
                                                            </KeyboardShortcutsProvider>
                                                        </ExportImageProvider>
                                                    </DialogProvider>
                                                </ReactFlowProvider>
                                            </ThemeProvider>
                                        </HistoryProvider>
                                    </ChartDBProvider>
                                </RedoUndoStackProvider>
                            </ConfigProvider>
                        </StorageProvider>
                    </LocalConfigProvider>
                </LayoutProvider>
            </FullScreenLoaderProvider>
        ),
    })),
    {
        path: 'examples',
        element: (
            <LocalConfigProvider>
                <StorageProvider>
                    <ThemeProvider>
                        <ExamplesPage />
                    </ThemeProvider>
                </StorageProvider>
            </LocalConfigProvider>
        ),
    },
    {
        path: '*',
        element: <NotFoundPage />,
    },
];

export const router = createBrowserRouter(routes);
