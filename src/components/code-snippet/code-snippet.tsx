import { cn } from '@/lib/utils';
import React, { Suspense } from 'react';
import type { CopyBlockProps } from 'react-code-blocks/dist/components/CopyBlock';
import { Spinner } from '../spinner/spinner';

export interface CodeSnippetProps {
    className?: string;
    codeProps?: CopyBlockProps;
    code: string;
    language?: 'sql' | 'bash';
    loading?: boolean;
}

const CopyBlock = React.lazy(() =>
    import('react-code-blocks').then((module) => ({
        default: (props: CopyBlockProps) => (
            <module.CopyBlock {...props} theme={module.atomOneDark} />
        ),
    }))
);

export const CodeSnippet: React.FC<CodeSnippetProps> = React.memo(
    ({ className, codeProps, code, loading, language = 'sql' }) => (
        <div className={cn('flex flex-1 justify-center', className)}>
            {loading ? (
                <Spinner />
            ) : (
                <Suspense fallback={<Spinner />}>
                    <CopyBlock
                        language={language}
                        text={code}
                        customStyle={{
                            display: 'flex',
                            flex: '1',
                            fontSize: '14px',
                            width: '100%',
                        }}
                        {...codeProps}
                    />
                </Suspense>
            )}
        </div>
    )
);

CodeSnippet.displayName = 'CodeSnippet';
