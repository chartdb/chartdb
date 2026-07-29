import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { TooltipProvider } from './components/tooltip/tooltip';
import { HelmetData } from './helmet/helmet-data';
import { HelmetProvider } from 'react-helmet-async';
import { AuthGate } from './components/auth/auth-gate';

export const App = () => {
    return (
        <HelmetProvider>
            <HelmetData />
            <TooltipProvider>
                <AuthGate>
                    <RouterProvider router={router} />
                </AuthGate>
            </TooltipProvider>
        </HelmetProvider>
    );
};
