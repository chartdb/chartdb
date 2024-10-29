import React, { useEffect } from 'react';
import ChartDBLogo from '@/assets/logo-light.png';
import ChartDBDarkLogo from '@/assets/logo-dark.png';
import { useTheme } from '@/hooks/use-theme';
import { LocalConfigProvider } from '@/context/local-config-context/local-config-provider';
import { ThemeProvider } from '@/context/theme-context/theme-provider';
import { Component, Star } from 'lucide-react';
import { ListMenu } from '@/components/list-menu/list-menu';
import { TemplateCard } from './template-card/template-card';
import { useMatches, useParams } from 'react-router-dom';
import type { Template } from '@/templates-data/templates-data';
import { Spinner } from '@/components/spinner/spinner';
import { removeDups } from '@/lib/utils';

const TemplatesPageComponent: React.FC = () => {
    const { effectiveTheme } = useTheme();
    const { tag } = useParams<{ tag: string }>();
    const matches = useMatches();
    const [templates, setTemplates] = React.useState<Template[]>();
    const [tags, setTags] = React.useState<string[]>();

    const isFeatured = matches.some(
        (match) => match.id === 'templates_featured'
    );
    const isAllTemplates = matches.some((match) => match.id === 'templates');
    const isTags = matches.some((match) => match.id === 'templates_tags');

    useEffect(() => {
        document.title = 'ChartDB - Database Schema Templates';
    }, []);

    useEffect(() => {
        const loadTemplates = async () => {
            const { templates: loadedTemplates } = await import(
                '@/templates-data/templates-data'
            );

            let templatesToLoad = loadedTemplates;

            if (isFeatured) {
                templatesToLoad = loadedTemplates.filter((t) => t.featured);
            }

            if (isTags && tag) {
                templatesToLoad = loadedTemplates.filter((t) =>
                    t.tags.includes(tag)
                );
            }

            setTemplates(templatesToLoad);
            setTags(removeDups(loadedTemplates?.flatMap((t) => t.tags) ?? []));
        };

        loadTemplates();
    }, [isFeatured, isTags, tag]);

    return (
        <section className="flex w-screen flex-col bg-background">
            <nav className="flex h-12 shrink-0 flex-row items-center justify-between border-b px-4">
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
            <div className="flex flex-col p-3 text-center md:px-28 md:text-left">
                <h1 className="font-primary text-2xl font-bold">
                    Database Schema Templates
                </h1>
                <h2 className="mt-1 font-primary text-base text-muted-foreground">
                    Explore a collection of real-world database schemas drawn
                    from real-world live applications and open-source projects.
                    Use these as a foundation or source of inspiration when
                    designing your app’s architecture.
                </h2>
                {!templates ? (
                    <Spinner size={'large'} className="mt-20 text-pink-600" />
                ) : (
                    <div className="mt-6 flex w-full flex-col-reverse gap-4 md:flex-row">
                        <div className="relative top-0 flex h-fit w-full shrink-0 flex-col md:sticky md:top-1 md:w-44">
                            <ListMenu
                                items={[
                                    {
                                        title: 'Featured',
                                        href: '/templates/featured',
                                        icon: Star,
                                        selected: isFeatured,
                                    },
                                    {
                                        title: 'All Templates',
                                        href: '/templates',
                                        icon: Component,
                                        selected: isAllTemplates,
                                    },
                                ]}
                            />

                            <h4 className="mt-4 text-left text-sm font-semibold">
                                Tags
                            </h4>
                            {tags ? (
                                <ListMenu
                                    className="mt-1 w-44 shrink-0"
                                    items={tags.map((currentTag) => ({
                                        title: currentTag,
                                        href: `/templates/tags/${currentTag}`,
                                        selected: tag === currentTag,
                                    }))}
                                />
                            ) : null}
                        </div>
                        <div className="grid flex-1 grid-flow-row grid-cols-1 gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-4">
                            {templates.map((template) => (
                                <TemplateCard
                                    key={`${template.id}`}
                                    template={template}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};

export const TemplatesPage: React.FC = () => (
    <LocalConfigProvider>
        <ThemeProvider>
            <TemplatesPageComponent />
        </ThemeProvider>
    </LocalConfigProvider>
);
