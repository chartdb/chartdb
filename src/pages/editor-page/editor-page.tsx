import React, {
    Suspense,
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';
import { TopNavbar } from './top-navbar/top-navbar';
import { useNavigate, useParams } from 'react-router-dom';
import { useConfig } from '@/hooks/use-config';
import { useChartDB } from '@/hooks/use-chartdb';
import { useDialog } from '@/hooks/use-dialog';
import { useRedoUndoStack } from '@/hooks/use-redo-undo-stack';
import { Toaster } from '@/components/toast/toaster';
import { useFullScreenLoader } from '@/hooks/use-full-screen-spinner';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useLayout } from '@/hooks/use-layout';
import { useToast } from '@/components/toast/use-toast';
import type { Diagram } from '@/lib/domain/diagram';
import { ToastAction } from '@/components/toast/toast';
import { useLocalConfig } from '@/hooks/use-local-config';
import { useTranslation } from 'react-i18next';
import { FullScreenLoaderProvider } from '@/context/full-screen-spinner-context/full-screen-spinner-provider';
import { LayoutProvider } from '@/context/layout-context/layout-provider';
import { LocalConfigProvider } from '@/context/local-config-context/local-config-provider';
import { StorageProvider } from '@/context/storage-context/storage-provider';
import { ConfigProvider } from '@/context/config-context/config-provider';
import { RedoUndoStackProvider } from '@/context/history-context/redo-undo-stack-provider';
import { ChartDBProvider } from '@/context/chartdb-context/chartdb-provider';
import { HistoryProvider } from '@/context/history-context/history-provider';
import { ThemeProvider } from '@/context/theme-context/theme-provider';
import { ReactFlowProvider } from '@xyflow/react';
import { ExportImageProvider } from '@/context/export-image-context/export-image-provider';
import { DialogProvider } from '@/context/dialog-context/dialog-provider';
import { KeyboardShortcutsProvider } from '@/context/keyboard-shortcuts-context/keyboard-shortcuts-provider';
import { Spinner } from '@/components/spinner/spinner';

const OPEN_STAR_US_AFTER_SECONDS = 30;
const SHOW_STAR_US_AGAIN_AFTER_DAYS = 1;

export const EditorDesktopLayoutLazy = React.lazy(
    () => import('./editor-desktop-layout')
);

export const EditorMobileLayoutLazy = React.lazy(
    () => import('./editor-mobile-layout')
);

const EditorPageComponent: React.FC = () => {
    const { loadDiagram, currentDiagram, schemas, filteredSchemas } =
        useChartDB();
    const { openSelectSchema, showSidePanel } = useLayout();
    const { resetRedoStack, resetUndoStack } = useRedoUndoStack();
    const { showLoader, hideLoader } = useFullScreenLoader();
    const { openCreateDiagramDialog, openStarUsDialog } = useDialog();
    const { diagramId } = useParams<{ diagramId: string }>();
    const { config, updateConfig } = useConfig();
    const navigate = useNavigate();
    const { isMd: isDesktop } = useBreakpoint('md');
    const [initialDiagram, setInitialDiagram] = useState<Diagram | undefined>();
    const {
        hideMultiSchemaNotification,
        setHideMultiSchemaNotification,
        starUsDialogLastOpen,
        setStarUsDialogLastOpen,
        githubRepoOpened,
    } = useLocalConfig();
    const { toast } = useToast();
    const { t } = useTranslation();

    useEffect(() => {
        if (!config) {
            return;
        }

        if (currentDiagram?.id === diagramId) {
            return;
        }

        const loadDefaultDiagram = async () => {
            if (diagramId) {
                setInitialDiagram(undefined);
                showLoader();
                resetRedoStack();
                resetUndoStack();
                const diagram = await loadDiagram(diagramId);
                if (!diagram) {
                    navigate('/');
                }
                setInitialDiagram(diagram);
                hideLoader();
            } else if (!diagramId && config.defaultDiagramId) {
                const diagram = await loadDiagram(config.defaultDiagramId);
                if (!diagram) {
                    await updateConfig({
                        defaultDiagramId: '',
                    });
                    navigate('/');
                } else {
                    navigate(`/diagrams/${config.defaultDiagramId}`);
                }
            } else {
                openCreateDiagramDialog();
            }
        };
        loadDefaultDiagram();
    }, [
        diagramId,
        openCreateDiagramDialog,
        config,
        navigate,
        loadDiagram,
        resetRedoStack,
        resetUndoStack,
        hideLoader,
        showLoader,
        currentDiagram?.id,
        updateConfig,
    ]);

    useEffect(() => {
        if (!currentDiagram?.id || githubRepoOpened) {
            return;
        }

        if (
            new Date().getTime() - starUsDialogLastOpen >
            1000 * 60 * 60 * 24 * SHOW_STAR_US_AGAIN_AFTER_DAYS
        ) {
            const lastOpen = new Date().getTime();
            setStarUsDialogLastOpen(lastOpen);
            setTimeout(openStarUsDialog, OPEN_STAR_US_AFTER_SECONDS * 1000);
        }
    }, [
        currentDiagram?.id,
        githubRepoOpened,
        openStarUsDialog,
        setStarUsDialogLastOpen,
        starUsDialogLastOpen,
    ]);

    const lastDiagramId = useRef<string>('');

    const handleChangeSchema = useCallback(async () => {
        showSidePanel();
        if (!isDesktop) {
            await new Promise((resolve) => setTimeout(resolve, 500));
        }
        openSelectSchema();
    }, [openSelectSchema, showSidePanel, isDesktop]);

    useEffect(() => {
        if (lastDiagramId.current === currentDiagram.id) {
            return;
        }

        lastDiagramId.current = currentDiagram.id;
        if (schemas.length > 1 && !hideMultiSchemaNotification) {
            const formattedSchemas = !filteredSchemas
                ? t('multiple_schemas_alert.none')
                : filteredSchemas
                      .map((filteredSchema) =>
                          schemas.find((schema) => schema.id === filteredSchema)
                      )
                      .map((schema) => `'${schema?.name}'`)
                      .join(', ');
            toast({
                duration: 5500,
                title: t('multiple_schemas_alert.title'),
                description: t('multiple_schemas_alert.description', {
                    schemasCount: schemas.length,
                    formattedSchemas,
                }),
                variant: 'default',
                layout: 'column',
                className:
                    'top-0 right-0 flex fixed md:max-w-[420px] md:top-4 md:right-4',
                action: (
                    <div className="flex justify-between gap-1">
                        <ToastAction
                            altText="Don't show this notification again"
                            className="flex-nowrap"
                            onClick={() => setHideMultiSchemaNotification(true)}
                        >
                            {t('multiple_schemas_alert.dont_show_again')}
                        </ToastAction>
                        <ToastAction
                            onClick={() => handleChangeSchema()}
                            altText="Change the schema"
                            className="border border-pink-600 bg-pink-600 text-white hover:bg-pink-500"
                        >
                            {t('multiple_schemas_alert.change_schema')}
                        </ToastAction>
                    </div>
                ),
            });
        }
    }, [
        schemas,
        filteredSchemas,
        toast,
        currentDiagram.id,
        diagramId,
        openSelectSchema,
        t,
        handleChangeSchema,
        hideMultiSchemaNotification,
        setHideMultiSchemaNotification,
    ]);

    return (
        <>
            <section
                className={`bg-background ${isDesktop ? 'h-screen w-screen' : 'h-dvh w-dvw'} flex select-none flex-col overflow-x-hidden`}
            >
                <TopNavbar />
                <Suspense
                    fallback={
                        <div className="flex flex-1 items-center justify-center">
                            <Spinner size={isDesktop ? 'large' : 'medium'} />
                        </div>
                    }
                >
                    {isDesktop ? (
                        <EditorDesktopLayoutLazy
                            initialDiagram={initialDiagram}
                        />
                    ) : (
                        <EditorMobileLayoutLazy
                            initialDiagram={initialDiagram}
                        />
                    )}
                </Suspense>
            </section>
            <Toaster />
        </>
    );
};

export const EditorPage: React.FC = () => (
    <LocalConfigProvider>
        <ThemeProvider>
            <FullScreenLoaderProvider>
                <LayoutProvider>
                    <StorageProvider>
                        <ConfigProvider>
                            <RedoUndoStackProvider>
                                <ChartDBProvider>
                                    <HistoryProvider>
                                        <ReactFlowProvider>
                                            <ExportImageProvider>
                                                <DialogProvider>
                                                    <KeyboardShortcutsProvider>
                                                        <EditorPageComponent />
                                                    </KeyboardShortcutsProvider>
                                                </DialogProvider>
                                            </ExportImageProvider>
                                        </ReactFlowProvider>
                                    </HistoryProvider>
                                </ChartDBProvider>
                            </RedoUndoStackProvider>
                        </ConfigProvider>
                    </StorageProvider>
                </LayoutProvider>
            </FullScreenLoaderProvider>
        </ThemeProvider>
    </LocalConfigProvider>
);
