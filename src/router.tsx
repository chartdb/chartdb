import React from 'react';
import type { RouteObject } from 'react-router-dom';
import { createBrowserRouter, Navigate } from 'react-router-dom';

const routes: RouteObject[] = [
    {
        path: '/login',
        async lazy() {
            const { LoginPage } = await import('./pages/login/login-page');
            return {
                element: <LoginPage />,
            };
        },
    },
    {
        path: '/',
        async lazy() {
            const { ProtectedLayout } = await import(
                './pages/app-shell/protected-layout'
            );
            return {
                element: <ProtectedLayout />,
            };
        },
        children: [
            {
                async lazy() {
                    const { AppShell } = await import(
                        './pages/app-shell/app-shell'
                    );
                    return {
                        element: <AppShell />,
                    };
                },
                children: [
                    {
                        index: true,
                        element: <Navigate to="diagrams" replace />,
                    },
                    {
                        path: 'diagrams',
                        async lazy() {
                            const { MyDiagramsPage } = await import(
                                './pages/diagrams/my-diagrams-page'
                            );
                            return { element: <MyDiagramsPage /> };
                        },
                    },
                    {
                        path: 'shared',
                        async lazy() {
                            const { SharedWithMePage } = await import(
                                './pages/diagrams/shared-with-me-page'
                            );
                            return { element: <SharedWithMePage /> };
                        },
                    },
                    {
                        path: 'users',
                        async lazy() {
                            const { UserManagementPage } = await import(
                                './pages/user-management/user-management-page'
                            );
                            return { element: <UserManagementPage /> };
                        },
                    },
                    {
                        path: 'audit-logs',
                        async lazy() {
                            const { AuditLogsPage } = await import(
                                './pages/audit-logs/audit-logs-page'
                            );
                            return { element: <AuditLogsPage /> };
                        },
                    },
                ],
            },
            {
                path: 'diagrams/:diagramId',
                async lazy() {
                    const { EditorPage } = await import(
                        './pages/editor-page/editor-page'
                    );
                    return { element: <EditorPage /> };
                },
            },
        ],
    },
    {
        path: '*',
        element: <Navigate to="/diagrams" replace />,
    },
];

export const router = createBrowserRouter(routes);
