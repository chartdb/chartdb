import React from 'react';
import { RouteObject, createBrowserRouter } from 'react-router-dom';
import { NotFoundPage } from './not-found-page/not-found-page';
import { EditorPage } from './editor-page/editor-page';

const routes: RouteObject[] = [
    {
        path: '/',
        element: <EditorPage />,
    },
    {
        path: '*',
        element: <NotFoundPage />,
    },
];

export const router = createBrowserRouter(routes);
