import React from 'react';
import { TopNavbar } from './top-navbar/top-navbar';
import { Toolbar } from './toolbar/toolbar';

export const EditorPage: React.FC = () => {
    return (
        <section className="bg-background">
            <TopNavbar />
            <Toolbar />
        </section>
    );
};
