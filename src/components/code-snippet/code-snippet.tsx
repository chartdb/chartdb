import { cn } from '@/lib/utils';
import React from 'react';
import { CopyBlock, atomOneDark } from 'react-code-blocks';
import { CodeBlockProps } from 'react-code-blocks/dist/components/CodeBlock';

export interface CodeSnippetProps {
    className?: string;
    codeProps?: CodeBlockProps;
    code: string;
}

export const CodeSnippet: React.FC<CodeSnippetProps> = ({
    className,
    codeProps,
    code,
}) => {
    return (
        <div className={cn('flex flex-1', className)}>
            <CopyBlock
                language="sql"
                text={code}
                theme={atomOneDark}
                customStyle={{
                    display: 'flex',
                    flex: '1',
                    fontSize: '14px',
                    width: '100%',
                }}
                {...codeProps}
            />
        </div>
    );
};
