import React from 'react';
import ChartDBLogo from '@/assets/logo.png';
import ChartDBDarkLogo from '@/assets/logo-dark.png';
import { examples } from './examples-data/examples-data';
import { ExampleCard } from './example-card';
import { useTheme } from '@/hooks/use-theme';

export const ExamplesPage: React.FC = () => {
    const { effectiveTheme } = useTheme();
    return (
        <section className="flex w-screen flex-col bg-background">
            <nav className="flex h-12 flex-row items-center justify-between border-b px-4">
                <div className="flex flex-1 justify-start gap-x-3">
                    <div className="flex items-center font-primary">
                        <a
                            href="https://chartdb.io"
                            className="cursor-pointer"
                            rel="noreferrer"
                        >
                            <img
                                src={
                                    effectiveTheme === 'light'
                                        ? ChartDBLogo
                                        : ChartDBDarkLogo
                                }
                                alt="chartDB"
                                className="h-4 max-w-fit"
                            />
                        </a>
                    </div>
                </div>
                <div className="group flex flex-1 flex-row items-center justify-center"></div>
                <div className="hidden flex-1 justify-end sm:flex"></div>
            </nav>
            <div className="flex flex-col px-3 pt-3 text-center md:px-28 md:text-left">
                <div className="font-primary text-2xl font-bold">Examples</div>
                <div className="mt-1 font-primary text-base text-muted-foreground">
                    A collection of examples to help you get started with
                    ChartDB.
                </div>
                <div className="mt-6 grid grid-flow-row grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {examples.map((example) => (
                        <ExampleCard key={example.id} example={example} />
                    ))}
                </div>
            </div>
        </section>
    );
};
