import React from 'react';
import { RouteObject, createBrowserRouter } from 'react-router-dom';
import { NotFoundPage } from './pages/not-found-page/not-found-page';
import { EditorPage } from './pages/editor-page/editor-page';
import { ChartDBProvider } from './context/chartdb-context/chartdb-provider';
import { ReactFlowProvider } from '@xyflow/react';
import { DataProvider } from './context/data-context/data-provider';
import { CreateDiagramDialogProvider } from './dialogs/create-diagram-dialog/create-diagram-dialog-provider';
import { ConfigProvider } from './context/config-context/config-provider';

const routes: RouteObject[] = [
    ...['', 'diagrams/:diagramId'].map((path) => ({
        path,
        element: (
            <DataProvider>
                <ConfigProvider>
                    <ChartDBProvider>
                        <CreateDiagramDialogProvider>
                            <ReactFlowProvider>
                                <EditorPage />
                            </ReactFlowProvider>
                        </CreateDiagramDialogProvider>
                    </ChartDBProvider>
                </ConfigProvider>
            </DataProvider>
        ),
    })),
    {
        path: '*',
        element: <NotFoundPage />,
    },
];

export const router = createBrowserRouter(routes);
