import React from 'react';
import type { RouteObject } from 'react-router-dom';
import { createBrowserRouter } from 'react-router-dom';
import type { TemplatePageLoaderData } from './pages/template-page/template-page';

const routes: RouteObject[] = [
    ...['', 'diagrams/:diagramId'].map((path) => ({
        path,
        async lazy() {
            const { EditorPage } = await import(
                './pages/editor-page/editor-page'
            );

            return {
                element: <EditorPage />,
            };
        },
    })),
    {
        path: 'examples',
        async lazy() {
            const { ExamplesPage } = await import(
                './pages/examples-page/examples-page'
            );
            return {
                element: <ExamplesPage />,
            };
        },
    },
    {
        id: 'templates',
        path: 'templates',
        async lazy() {
            const { TemplatesPage } = await import(
                './pages/templates-page/templates-page'
            );
            return {
                element: <TemplatesPage />,
            };
        },
    },
    {
        id: 'templates_featured',
        path: 'templates/featured',
        async lazy() {
            const { TemplatesPage } = await import(
                './pages/templates-page/templates-page'
            );
            return {
                element: <TemplatesPage />,
            };
        },
    },
    {
        id: 'templates_tags',
        path: 'templates/tags/:tag',
        async lazy() {
            const { TemplatesPage } = await import(
                './pages/templates-page/templates-page'
            );
            return {
                element: <TemplatesPage />,
            };
        },
    },
    {
        id: 'templates_templateSlug',
        path: 'templates/:templateSlug',
        async lazy() {
            const { TemplatePage } = await import(
                './pages/template-page/template-page'
            );
            return {
                element: <TemplatePage />,
            };
        },
        loader: async ({ params }): Promise<TemplatePageLoaderData> => {
            const { templates } = await import(
                './templates-data/templates-data'
            );
            return {
                template: templates.find(
                    (template) => template.slug === params.templateSlug
                ),
            };
        },
    },
    {
        path: '*',
        async lazy() {
            const { NotFoundPage } = await import(
                './pages/not-found-page/not-found-page'
            );
            return {
                element: <NotFoundPage />,
            };
        },
    },
];

export const router = createBrowserRouter(routes);
