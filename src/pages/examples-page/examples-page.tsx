import React from 'react';
import ChartDBLogo from '@/assets/logo.png';
import { examples } from './examples-data/examples-data';
import { ExampleCard } from './example-card';

export const ExamplesPage: React.FC = () => {
    return (
        <section className="bg-background w-screen flex flex-col">
            <nav className="flex flex-row items-center justify-between px-4 h-12 border-b">
                <div className="flex flex-1 justify-start gap-x-3">
                    <div className="flex font-primary items-center">
                        <a
                            href="https://chartdb.io"
                            className="cursor-pointer"
                            rel="noreferrer"
                        >
                            <img
                                src={ChartDBLogo}
                                alt="chartDB"
                                className="h-4 max-w-fit"
                            />
                        </a>
                    </div>
                </div>
                <div className="flex flex-row flex-1 justify-center items-center group"></div>
                <div className="hidden flex-1 justify-end sm:flex"></div>
            </nav>
            <div className="flex flex-col px-3 pt-3 text-center md:px-28 md:text-left">
                <div className="text-2xl font-bold font-primary">Examples</div>
                <div className="text-md font-primary mt-1 text-muted-foreground">
                    A collection of examples to help you get started with
                    ChartDB.
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 grid-flow-row gap-6 mt-6">
                    {examples.map((example) => (
                        <ExampleCard key={example.id} example={example} />
                    ))}
                </div>
            </div>
        </section>
    );
};
