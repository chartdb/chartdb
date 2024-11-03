import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { TooltipProvider } from './components/tooltip/tooltip';
import { HelmetProvider } from 'react-helmet-async';
import { HelmetData } from './helmet-data/helmet-data';

export const App = () => {
    return (
        <HelmetProvider>
            <HelmetData />
            <TooltipProvider>
                <RouterProvider router={router} />
            </TooltipProvider>
        </HelmetProvider>
    );
};
