import React from 'react';
import { RouteObject, createBrowserRouter } from 'react-router-dom';
import { NotFoundPage } from './pages/not-found-page/not-found-page';
import { EditorPage } from './pages/editor-page/editor-page';
import { ChartDBProvider } from './context/chartdb-context/chartdb-provider';
import { ReactFlowProvider } from '@xyflow/react';
import { DataProvider } from './context/data-context/data-provider';
import { CreateDiagramDialogProvider } from './dialogs/create-diagram-dialog/create-diagram-dialog-provider';

const routes: RouteObject[] = [
    ...['', 'diagrams/:diagramId'].map((path) => ({
        path,
        element: (
            <DataProvider>
                <ChartDBProvider>
                    <CreateDiagramDialogProvider>
                        <ReactFlowProvider>
                            <EditorPage />
                        </ReactFlowProvider>
                    </CreateDiagramDialogProvider>
                </ChartDBProvider>
            </DataProvider>
        ),
    })),
    {
        path: '*',
        element: <NotFoundPage />,
    },
];

export const router = createBrowserRouter(routes);
