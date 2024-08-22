import React from 'react';
import { RouteObject, createBrowserRouter } from 'react-router-dom';
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

const routes: RouteObject[] = [
    ...['', 'diagrams/:diagramId'].map((path) => ({
        path,
        element: (
            <LayoutProvider>
                <StorageProvider>
                    <ConfigProvider>
                        <RedoUndoStackProvider>
                            <ChartDBProvider>
                                <HistoryProvider>
                                    <DialogProvider>
                                        <ReactFlowProvider>
                                            <ExportImageProvider>
                                                <EditorPage />
                                            </ExportImageProvider>
                                        </ReactFlowProvider>
                                    </DialogProvider>
                                </HistoryProvider>
                            </ChartDBProvider>
                        </RedoUndoStackProvider>
                    </ConfigProvider>
                </StorageProvider>
            </LayoutProvider>
        ),
    })),
    {
        path: '*',
        element: <NotFoundPage />,
    },
];

export const router = createBrowserRouter(routes);
