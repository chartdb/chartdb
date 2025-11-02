import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { TooltipProvider } from './components/tooltip/tooltip';
import { HelmetData } from './helmet/helmet-data';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './context/auth-context/auth-context';
import { StorageProvider } from './context/storage-context/storage-provider';

export const App = () => {
    return (
        <HelmetProvider>
            <HelmetData />
            <StorageProvider>
                <AuthProvider>
                    <TooltipProvider>
                        <RouterProvider router={router} />
                    </TooltipProvider>
                </AuthProvider>
            </StorageProvider>
        </HelmetProvider>
    );
};
