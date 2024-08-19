import React from 'react';
import { RouteObject, createBrowserRouter } from 'react-router-dom';
import { NotFoundPage } from './pages/not-found-page/not-found-page';
import { EditorPage } from './pages/editor-page/editor-page';
import { ChartDBProvider } from './context/chartdb-context/chartdb-provider';
import { ReactFlowProvider } from '@xyflow/react';
import { StorageProvider } from './context/storage-context/storage-provider';
import { CreateDiagramDialogProvider } from './dialogs/create-diagram-dialog/create-diagram-dialog-provider';
import { ConfigProvider } from './context/config-context/config-provider';

const routes: RouteObject[] = [
    ...['', 'diagrams/:diagramId'].map((path) => ({
        path,
        element: (
            <StorageProvider>
                <ConfigProvider>
                    <ChartDBProvider>
                        <CreateDiagramDialogProvider>
                            <ReactFlowProvider>
                                <EditorPage />
                            </ReactFlowProvider>
                        </CreateDiagramDialogProvider>
                    </ChartDBProvider>
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
