import { cn } from '@/lib/utils';
import React, { lazy, Suspense, useCallback, useEffect } from 'react';
import { Spinner } from '../spinner/spinner';
import { useTheme } from '@/hooks/use-theme';
import { useMonaco } from '@monaco-editor/react';
import { useToast } from '@/components/toast/use-toast';
import { Button } from '../button/button';
import type { LucideIcon } from 'lucide-react';
import { Copy, CopyCheck } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../tooltip/tooltip';
import { useTranslation } from 'react-i18next';
import { DarkTheme } from './themes/dark';
import { LightTheme } from './themes/light';
import './config.ts';

export const Editor = lazy(() =>
    import('./code-editor').then((module) => ({
        default: module.Editor,
    }))
);

export const DiffEditor = lazy(() =>
    import('./code-editor').then((module) => ({
        default: module.DiffEditor,
    }))
);

type EditorType = typeof Editor;

export interface CodeSnippetAction {
    label: string;
    icon: LucideIcon;
    onClick: () => void;
    className?: string;
}

export interface CodeSnippetProps {
    className?: string;
    code: string;
    codeToCopy?: string;
    language?: 'sql' | 'shell' | 'dbml';
    loading?: boolean;
    autoScroll?: boolean;
    isComplete?: boolean;
    editorProps?: React.ComponentProps<EditorType>;
    actions?: CodeSnippetAction[];
    actionsTooltipSide?: 'top' | 'right' | 'bottom' | 'left';
    allowCopy?: boolean;
}

export const CodeSnippet: React.FC<CodeSnippetProps> = React.memo(
    ({
        className,
        code,
        codeToCopy,
        loading,
        language = 'sql',
        autoScroll = false,
        isComplete = true,
        editorProps,
        actions,
        actionsTooltipSide,
        allowCopy = true,
    }) => {
        const { t } = useTranslation();
        const monaco = useMonaco();
        const { effectiveTheme } = useTheme();
        const { toast } = useToast();
        const [isCopied, setIsCopied] = React.useState(false);
        const [tooltipOpen, setTooltipOpen] = React.useState(false);

        useEffect(() => {
            monaco?.editor?.defineTheme?.(
                effectiveTheme,
                effectiveTheme === 'dark' ? DarkTheme : LightTheme
            );
            monaco?.editor?.setTheme?.(effectiveTheme);
        }, [monaco, effectiveTheme]);

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
                await navigator.clipboard.writeText(codeToCopy ?? code);
                setIsCopied(true);
            } catch {
                setIsCopied(false);
                toast({
                    title: t('copy_to_clipboard_toast.failed.title'),
                    variant: 'destructive',
                    description: t(
                        'copy_to_clipboard_toast.failed.description'
                    ),
                });
            }
        }, [code, codeToCopy, t, toast]);

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
                            <div className="absolute right-1 top-1 z-10 flex flex-col gap-1">
                                {allowCopy ? (
                                    <Tooltip
                                        onOpenChange={setTooltipOpen}
                                        open={isCopied || tooltipOpen}
                                    >
                                        <TooltipTrigger asChild>
                                            <span>
                                                <Button
                                                    className="h-fit p-1.5"
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
                                        <TooltipContent
                                            side={actionsTooltipSide}
                                        >
                                            {t(
                                                isCopied
                                                    ? 'copied'
                                                    : 'copy_to_clipboard'
                                            )}
                                        </TooltipContent>
                                    </Tooltip>
                                ) : null}

                                {actions &&
                                    actions.length > 0 &&
                                    actions.map((action, index) => (
                                        <Tooltip key={index}>
                                            <TooltipTrigger asChild>
                                                <span>
                                                    <Button
                                                        className={cn(
                                                            'h-fit p-1.5',
                                                            action.className
                                                        )}
                                                        variant="outline"
                                                        onClick={action.onClick}
                                                    >
                                                        <action.icon
                                                            size={16}
                                                        />
                                                    </Button>
                                                </span>
                                            </TooltipTrigger>
                                            <TooltipContent
                                                side={actionsTooltipSide}
                                            >
                                                {action.label}
                                            </TooltipContent>
                                        </Tooltip>
                                    ))}
                            </div>
                        ) : null}

                        <Editor
                            value={code}
                            language={language}
                            loading={<Spinner />}
                            theme={effectiveTheme}
                            {...editorProps}
                            options={{
                                editContext: false,
                                readOnly: true,
                                automaticLayout: true,
                                scrollBeyondLastLine: false,
                                renderValidationDecorations: 'off',
                                lineDecorationsWidth: 0,
                                overviewRulerBorder: false,
                                overviewRulerLanes: 0,
                                hideCursorInOverviewRuler: true,
                                contextmenu: false,
                                ...editorProps?.options,
                                guides: {
                                    indentation: false,
                                    ...editorProps?.options?.guides,
                                },
                                scrollbar: {
                                    vertical: 'hidden',
                                    horizontal: 'hidden',
                                    alwaysConsumeMouseWheel: false,
                                    ...editorProps?.options?.scrollbar,
                                },
                                minimap: {
                                    enabled: false,
                                    ...editorProps?.options?.minimap,
                                },
                            }}
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
