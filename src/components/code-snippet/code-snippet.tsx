import { cn } from '@/lib/utils';
import React, { lazy, Suspense, useCallback, useEffect, useMemo } from 'react';
import { Spinner } from '../spinner/spinner';
import { useTheme } from '@/hooks/use-theme';
import { useMonaco } from '@monaco-editor/react';
import { useToast } from '@/components/toast/use-toast';
import { Button } from '../button/button';
import { Copy, CopyCheck } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../tooltip/tooltip';
import { useTranslation } from 'react-i18next';
import { DarkTheme } from './themes/dark';
import { LightTheme } from './themes/light';
import './config.ts';

export interface CodeSnippetProps {
    className?: string;
    code: string;
    language?: 'sql' | 'shell';
    loading?: boolean;
    autoScroll?: boolean;
    isComplete?: boolean;
}

export const Editor = lazy(() =>
    import('./code-editor').then((module) => ({
        default: module.Editor,
    }))
);

export const CodeSnippet: React.FC<CodeSnippetProps> = React.memo(
    ({
        className,
        code,
        loading,
        language = 'sql',
        autoScroll = false,
        isComplete = true,
    }) => {
        const { t } = useTranslation();
        const monaco = useMonaco();
        const { effectiveTheme } = useTheme();
        const { toast } = useToast();
        const [isCopied, setIsCopied] = React.useState(false);
        const [tooltipOpen, setTooltipOpen] = React.useState(false);

        const monacoConfig = useMemo(() => ({
            minimap: { enabled: false },
            readOnly: true,
            automaticLayout: true,
            scrollbar: {
                vertical: 'hidden',
                horizontal: 'hidden',
                alwaysConsumeMouseWheel: false,
            },
            scrollBeyondLastLine: false,
            renderValidationDecorations: 'off',
            lineDecorationsWidth: 0,
            overviewRulerBorder: false,
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            guides: { indentation: false },
            contextmenu: false,
        }), []);

        useEffect(() => {
            if (!monaco?.editor) return;
            
            const theme = effectiveTheme === 'dark' ? DarkTheme : LightTheme;
            monaco.editor.defineTheme(effectiveTheme, theme);
            monaco.editor.setTheme(effectiveTheme);
        }, [monaco?.editor, effectiveTheme]);

        useEffect(() => {
            if (!isCopied) return;
            setTimeout(() => {
                setIsCopied(false);
            }, 1500);
        }, [isCopied]);

        useEffect(() => {
            if (monaco) {
                const editor = monaco.editor.getModels()[0];
                if (editor && autoScroll) {
                    const lineCount = editor.getLineCount();
                    monaco.editor.getEditors()[0]?.revealLine(lineCount);
                }
            }
        }, [code, monaco, autoScroll]);

        const copyToClipboard = useCallback(async () => {
            if (!navigator?.clipboard) {
                toast({
                    title: t('copy_to_clipboard_toast.unsupported.title'),
                    variant: 'destructive',
                    description: t(
                        'copy_to_clipboard_toast.unsupported.description'
                    ),
                });
                return;
            }

            try {
                await navigator.clipboard.writeText(code);
                setIsCopied(true);
            } catch (error) {
                setIsCopied(false);
                toast({
                    title: t('copy_to_clipboard_toast.failed.title'),
                    variant: 'destructive',
                    description: t(
                        'copy_to_clipboard_toast.failed.description'
                    ),
                });
            }
        }, [code, t, toast]);

        return (
            <div
                className={cn(
                    'flex relative flex-1 justify-center border rounded-md overflow-hidden',
                    className
                )}
            >
                {loading ? (
                    <Spinner />
                ) : (
                    <Suspense fallback={<Spinner />}>
                        {isComplete ? (
                            <Tooltip
                                onOpenChange={setTooltipOpen}
                                open={isCopied || tooltipOpen}
                            >
                                <TooltipTrigger
                                    asChild
                                    className="absolute right-1 top-1 z-10"
                                >
                                    <span>
                                        <Button
                                            className=" h-fit p-1.5"
                                            variant="outline"
                                            onClick={copyToClipboard}
                                        >
                                            {isCopied ? (
                                                <CopyCheck size={16} />
                                            ) : (
                                                <Copy size={16} />
                                            )}
                                        </Button>
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                    {t(
                                        isCopied
                                            ? 'copied'
                                            : 'copy_to_clipboard'
                                    )}
                                </TooltipContent>
                            </Tooltip>
                        ) : null}

                        <Editor
                            value={code}
                            language={language}
                            loading={<Spinner />}
                            theme={effectiveTheme}
                            options={monacoConfig}
                        />
                        {!isComplete ? (
                            <div className="absolute bottom-2 right-2 size-2 animate-blink rounded-full bg-pink-600" />
                        ) : null}
                    </Suspense>
                )}
            </div>
        );
    }
);

CodeSnippet.displayName = 'CodeSnippet';
