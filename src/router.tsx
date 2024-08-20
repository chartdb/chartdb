import React from 'react';
import { RouteObject, createBrowserRouter } from 'react-router-dom';
import { NotFoundPage } from './pages/not-found-page/not-found-page';
import { EditorPage } from './pages/editor-page/editor-page';
import { ChartDBProvider } from './context/chartdb-context/chartdb-provider';
import { ReactFlowProvider } from '@xyflow/react';
import { StorageProvider } from './context/storage-context/storage-provider';
import { CreateDiagramDialogProvider } from './dialogs/create-diagram-dialog/create-diagram-dialog-provider';
import { OpenDiagramDialogProvider } from './dialogs/open-diagram-dialog/open-diagram-dialog-provider';
import { ConfigProvider } from './context/config-context/config-provider';
import { HistoryProvider } from './context/history-context/history-provider';
import { RedoUndoStackProvider } from './context/history-context/redo-undo-stack-provider';

const routes: RouteObject[] = [
    ...['', 'diagrams/:diagramId'].map((path) => ({
        path,
        element: (
            <StorageProvider>
                <ConfigProvider>
                    <RedoUndoStackProvider>
                        <ChartDBProvider>
                            <HistoryProvider>
                                <CreateDiagramDialogProvider>
                                    <OpenDiagramDialogProvider>
                                        <ReactFlowProvider>
                                            <EditorPage />
                                        </ReactFlowProvider>
                                    </OpenDiagramDialogProvider>
                                </CreateDiagramDialogProvider>
                            </HistoryProvider>
                        </ChartDBProvider>
                    </RedoUndoStackProvider>
                </ConfigProvider>
            </StorageProvider>
        ),
    })),
    {
        path: '*',
        element: <NotFoundPage />,
    },
];

export const router = createBrowserRouter(routes);
