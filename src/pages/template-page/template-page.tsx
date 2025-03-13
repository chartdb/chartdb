import React, { useCallback, useEffect } from 'react';
import ChartDBLogo from '@/assets/logo-light.png';
import ChartDBDarkLogo from '@/assets/logo-dark.png';
import { useTheme } from '@/hooks/use-theme';
import { LocalConfigProvider } from '@/context/local-config-context/local-config-provider';
import { ThemeProvider } from '@/context/theme-context/theme-provider';
import { Button } from '@/components/button/button';
import { CloudDownload } from 'lucide-react';
import { useLoaderData, useNavigate, useParams } from 'react-router-dom';
import type { Template } from '../../templates-data/templates-data';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
} from '@/components/breadcrumb/breadcrumb';
import { Spinner } from '@/components/spinner/spinner';
import { Separator } from '@/components/separator/separator';
import {
    databaseSecondaryLogoMap,
    databaseTypeToLabelMap,
} from '@/lib/databases';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/tooltip/tooltip';
import { Badge } from '@/components/badge/badge';
import { Canvas } from '../editor-page/canvas/canvas';
import { ReactFlowProvider } from '@xyflow/react';
import { ChartDBProvider } from '@/context/chartdb-context/chartdb-provider';
import { Helmet } from 'react-helmet-async';
import { APP_URL, HOST_URL } from '@/lib/env';
import { Link } from '@/components/link/link';

export interface TemplatePageLoaderData {
    template: Template | undefined;
}

const TemplatePageComponent: React.FC = () => {
    const { templateSlug } = useParams<{ templateSlug: string }>();
    const navigate = useNavigate();
    const data = useLoaderData() as TemplatePageLoaderData;

    const template = data.template;

    useEffect(() => {
        if (!template) {
            navigate('/templates');
        }
    }, [template, navigate]);

    const { effectiveTheme } = useTheme();

    const cloneTemplate = useCallback(async () => {
        if (APP_URL) {
            window.location.href = `${APP_URL}/templates/clone/${templateSlug}`;
        } else {
            navigate(`/templates/clone/${templateSlug}`);
        }
    }, [navigate, templateSlug]);

    return (
        <>
            <Helmet>
                {template ? (
                    <>
                        {HOST_URL !== 'https://chartdb.io' ? (
                            <link
                                rel="canonical"
                                href={`https://chartdb.io/templates/${templateSlug}`}
                            />
                        ) : null}
                        <title>
                            {`Database schema diagram for - ${template.name} | ChartDB`}
                        </title>
                        <meta
                            name="description"
                            content={`${template.shortDescription}: ${template.description}`}
                        />
                        <meta
                            property="og:title"
                            content={`Database schema diagram for - ${template.name} | ChartDB`}
                        />
                        <meta
                            property="og:url"
                            content={`${HOST_URL}/templates/${templateSlug}`}
                        />
                        <meta
                            property="og:description"
                            content={`${template.shortDescription}: ${template.description}`}
                        />
                        <meta
                            property="og:image"
                            content={`${HOST_URL}${template.image}`}
                        />
                        <meta property="og:type" content="website" />
                        <meta property="og:site_name" content="ChartDB" />
                        <meta
                            name="twitter:title"
                            content={`Database schema for - ${template.name} | ChartDB`}
                        />
                        <meta
                            name="twitter:description"
                            content={`${template.shortDescription}: ${template.description}`}
                        />
                        <meta
                            name="twitter:image"
                            content={`${HOST_URL}${template.image}`}
                        />
                        <meta
                            name="twitter:card"
                            content="summary_large_image"
                        />
                        <meta name="twitter:site" content="@ChartDB_io" />
                        <meta name="twitter:creator" content="@ChartDB_io" />
                    </>
                ) : (
                    <title>Database Schema Diagram | ChartDB</title>
                )}
            </Helmet>

            <section className="flex h-screen w-screen flex-col bg-background">
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
                    <div className="flex flex-1 justify-end">
                        <iframe
                            src={`https://ghbtns.com/github-btn.html?user=chartdb&repo=chartdb&type=star&size=large&text=false`}
                            width="40"
                            height="30"
                            title="GitHub"
                        ></iframe>
                    </div>
                </nav>
                {!template ? (
                    <Spinner size={'large'} className="mt-20 text-pink-600" />
                ) : (
                    <div className="flex flex-1 flex-col p-3 pb-5 text-center md:px-28 md:text-left">
                        <Breadcrumb className="mb-2">
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink href={`/templates`}>
                                        Templates
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbLink
                                        href={`/templates/${templateSlug}`}
                                    >
                                        {templateSlug}
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                        <div className="flex flex-col items-center gap-4 md:flex-row md:items-start md:justify-between md:gap-0">
                            <div className="flex flex-col pr-0 md:pr-20">
                                <h1 className="flex flex-col font-primary text-2xl font-bold">
                                    {template?.name}
                                    <span className="text-sm font-normal text-muted-foreground">
                                        Database schema diagram
                                    </span>
                                </h1>
                                <h2 className="mt-3">
                                    <span className="font-semibold">
                                        {template?.shortDescription}
                                        {': '}
                                    </span>
                                    {template?.description}
                                </h2>
                            </div>
                            <div className="flex justify-end">
                                <Button onClick={cloneTemplate}>
                                    <CloudDownload className="mr-2" size="16" />
                                    Clone Template
                                </Button>
                            </div>
                        </div>
                        <Separator className="my-5" />
                        <div className="flex w-full flex-1 flex-col gap-4 md:flex-row">
                            <div className="relative top-0 flex h-fit w-full shrink-0 flex-col gap-4 md:sticky md:top-1 md:w-60">
                                <div>
                                    <h4 className="mb-1 text-base font-semibold md:text-left">
                                        Metadata
                                    </h4>

                                    <div className="text-sm text-muted-foreground">
                                        <div className="inline-flex">
                                            <span className="mr-2">
                                                Database:
                                            </span>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <img
                                                        src={
                                                            databaseSecondaryLogoMap[
                                                                template.diagram
                                                                    .databaseType
                                                            ]
                                                        }
                                                        className="h-5 max-w-fit"
                                                        alt="database"
                                                    />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    {
                                                        databaseTypeToLabelMap[
                                                            template.diagram
                                                                .databaseType
                                                        ]
                                                    }
                                                </TooltipContent>
                                            </Tooltip>
                                        </div>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        <span>Tables:</span>
                                        <span className="ml-2 font-semibold">
                                            {template?.diagram?.tables
                                                ?.length ?? 0}
                                        </span>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        <span>Relationships:</span>
                                        <span className="ml-2 font-semibold">
                                            {template?.diagram?.relationships
                                                ?.length ?? 0}
                                        </span>
                                    </div>
                                </div>
                                <Separator />
                                {template.url ? (
                                    <>
                                        <div>
                                            <h4 className="mb-1 text-base font-semibold md:text-left">
                                                Url
                                            </h4>

                                            <Link
                                                className="break-all text-sm text-muted-foreground"
                                                href={`${template.url}?ref=chartdb`}
                                                target="_blank"
                                            >
                                                {template.url}
                                            </Link>
                                        </div>
                                        <Separator />
                                    </>
                                ) : null}
                                <div>
                                    <h4 className="mb-1 text-base font-semibold md:text-left">
                                        Tags
                                    </h4>
                                    <div className="flex flex-wrap justify-center gap-1 md:justify-start">
                                        {template.tags.map((tag) => (
                                            <Badge
                                                variant="outline"
                                                key={`${template.slug}_${tag}`}
                                            >
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="flex min-h-96 overflow-hidden rounded border md:flex-1 md:rounded-lg">
                                <div className="size-full">
                                    <ChartDBProvider
                                        diagram={template.diagram}
                                        readonly
                                    >
                                        <Canvas
                                            initialTables={
                                                template.diagram.tables ?? []
                                            }
                                        />
                                    </ChartDBProvider>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </section>
        </>
    );
};

export const TemplatePage: React.FC = () => (
    <LocalConfigProvider>
        <ThemeProvider>
            <ReactFlowProvider>
                <TemplatePageComponent />
            </ReactFlowProvider>
        </ThemeProvider>
    </LocalConfigProvider>
);
