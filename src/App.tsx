import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './pages/router';

export const App = () => {
    return <RouterProvider router={router} />;
};
