import { cn } from '@/lib/utils';
import React, { lazy, Suspense, useCallback, useEffect } from 'react';
import { Spinner } from '../spinner/spinner';
import { useTheme } from '@/hooks/use-theme';
import { useMonaco } from '@monaco-editor/react';
import { Button } from '../button/button';
import { ClipboardCopy, CopyCheck } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../tooltip/tooltip';
import { useTranslation } from 'react-i18next';

export interface CodeSnippetProps {
    className?: string;
    code: string;
    language?: 'sql' | 'shell';
    loading?: boolean;
}

export const Editor = lazy(() =>
    import('./code-editor').then((module) => ({
        default: module.Editor,
    }))
);

export const CodeSnippet: React.FC<CodeSnippetProps> = React.memo(
    ({ className, code, loading, language = 'sql' }) => {
        const { t } = useTranslation();
        const monaco = useMonaco();
        const { effectiveTheme } = useTheme();
        const [isCopied, setIsCopied] = React.useState(false);

        useEffect(() => {
            monaco?.editor?.setTheme?.(
                effectiveTheme === 'dark' ? 'vs-dark' : 'vs'
            );
        }, [monaco, effectiveTheme]);

        const copyToClipboard = useCallback(() => {
            navigator.clipboard.writeText(code);
            setIsCopied(true);
        }, [code]);

        return (
            <div
                className={cn('flex relative flex-1 justify-center', className)}
            >
                {loading ? (
                    <Spinner />
                ) : (
                    <Suspense fallback={<Spinner />}>
                        <Tooltip>
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
                                            <ClipboardCopy size={16} />
                                        )}
                                    </Button>
                                </span>
                            </TooltipTrigger>
                            <TooltipContent>
                                {t(isCopied ? 'copied' : 'copy_to_clipboard')}
                            </TooltipContent>
                        </Tooltip>

                        <Editor
                            // height="100%"
                            // defaultValue={code}
                            value={code}
                            language={language}
                            loading={<Spinner />}
                            theme={effectiveTheme === 'dark' ? 'vs-dark' : 'vs'}
                            options={{
                                minimap: {
                                    enabled: false,
                                },
                                readOnly: true,
                                readOnlyMessage: {
                                    value: 'Code snippet is read-only',
                                },
                                automaticLayout: true,
                                lineNumbers: 'off',
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
                            }}
                        />
                    </Suspense>
                )}
            </div>
        );
    }
);

CodeSnippet.displayName = 'CodeSnippet';
