import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { TooltipProvider } from './components/tooltip/tooltip';

export const App = () => {
    return (
        <TooltipProvider>
            <RouterProvider router={router} />
        </TooltipProvider>
    );
};
