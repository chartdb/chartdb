import React, { useCallback, useEffect } from 'react';
import ChartDBLogo from '@/assets/logo-light.png';
import ChartDBDarkLogo from '@/assets/logo-dark.png';
import { useTheme } from '@/hooks/use-theme';
import { LocalConfigProvider } from '@/context/local-config-context/local-config-provider';
import { StorageProvider } from '@/context/storage-context/storage-provider';
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
import { convertTemplateToNewDiagram } from '@/templates-data/template-utils';
import { useStorage } from '@/hooks/use-storage';
import type { Diagram } from '@/lib/domain/diagram';
import { Helmet } from 'react-helmet-async';

export interface TemplatePageLoaderData {
    template: Template | undefined;
}

const TemplatePageComponent: React.FC = () => {
    const { addDiagram } = useStorage();
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
        if (!template) {
            return;
        }

        const diagram = convertTemplateToNewDiagram(template);

        const now = new Date();
        const diagramToAdd: Diagram = {
            ...diagram,
            createdAt: now,
            updatedAt: now,
        };

        await addDiagram({ diagram: diagramToAdd });
        navigate(`/diagrams/${diagramToAdd.id}`);
    }, [addDiagram, navigate, template]);

    return (
        <>
            <Helmet>
                <title>
                    {template
                        ? `ChartDB - ${template.name} - ${template.shortDescription}`
                        : 'ChartDB - Database Schema Template'}
                </title>
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
                    <div className="group flex flex-1 flex-row items-center justify-center"></div>
                    <div className="hidden flex-1 justify-end sm:flex"></div>
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
                                <h1 className="font-primary text-2xl font-bold">
                                    {template?.name}
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
                                <div>
                                    <h4 className="mb-1 text-base font-semibold md:text-left">
                                        Tags
                                    </h4>
                                    <div className="flex flex-wrap justify-center gap-1 md:justify-start">
                                        {template.tags.map((tag) => (
                                            <Badge
                                                variant="outline"
                                                key={`${template.id}_${tag}`}
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
                                            readonly
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
        <StorageProvider>
            <ThemeProvider>
                <ReactFlowProvider>
                    <TemplatePageComponent />
                </ReactFlowProvider>
            </ThemeProvider>
        </StorageProvider>
    </LocalConfigProvider>
);
