import React from 'react';
import { RouteObject, createBrowserRouter } from 'react-router-dom';
import { NotFoundPage } from './pages/not-found-page/not-found-page';
import { EditorPage } from './pages/editor-page/editor-page';
import { ChartDBProvider } from './context/chartdb-context/chartdb-provider';
import { ReactFlowProvider } from '@xyflow/react';

const routes: RouteObject[] = [
    {
        path: '/',
        element: (
            <ChartDBProvider>
                <ReactFlowProvider>
                    <EditorPage />
                </ReactFlowProvider>
            </ChartDBProvider>
        ),
    },
    {
        path: '*',
        element: <NotFoundPage />,
    },
];

export const router = createBrowserRouter(routes);
