import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { TooltipProvider } from './components/tooltip/tooltip';
import { Helmet, HelmetProvider } from 'react-helmet-async';

export const App = () => {
    return (
        <HelmetProvider>
            <Helmet>
                <meta
                    name="description"
                    content="Free and Open-source database diagrams editor, visualize and design your database with a single query. Tool to help you draw your DB relationship diagrams and export DDL scripts."
                />
                <meta property="og:type" content="website" />
                <meta
                    property="og:title"
                    content="ChartDB - Database schema diagrams visualizer"
                />
                <meta
                    property="og:description"
                    content="Free and Open-source database diagrams editor, visualize and design your database with a single query. Tool to help you draw your DB relationship diagrams and export DDL scripts."
                />
                <meta
                    property="og:image"
                    content="https://app.chartdb.io/ChartDB.png"
                />
                <meta property="og:url" content="https://app.chartdb.io" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta
                    name="twitter:title"
                    content="ChartDB - Database schema diagrams visualizer"
                />
                <meta
                    name="twitter:description"
                    content="Free and Open-source database diagrams editor, visualize and design your database with a single query. Tool to help you draw your DB relationship diagrams and export DDL scripts."
                />
                <meta
                    name="twitter:image"
                    content="https://github.com/chartdb/chartdb/raw/main/public/ChartDB.png"
                />
                <title>ChartDB - Database schema diagrams visualizer</title>
            </Helmet>
            <TooltipProvider>
                <RouterProvider router={router} />
            </TooltipProvider>
        </HelmetProvider>
    );
};
