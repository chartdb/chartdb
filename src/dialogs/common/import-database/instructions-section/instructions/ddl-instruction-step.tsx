import React from 'react';
import { CodeSnippet } from '@/components/code-snippet/code-snippet';

export interface DDLInstructionStepProps {
    index: number;
    text: string;
    code?: string;
    example?: string;
}

export const DDLInstructionStep: React.FC<DDLInstructionStepProps> = ({
    index,
    text,
    code,
    example,
}) => {
    return (
        <div className="flex flex-col gap-1">
            <div className="flex flex-col gap-1 text-sm text-primary">
                <div>
                    <span className="font-medium">{index}.</span> {text}
                </div>

                {code ? (
                    <div className="h-[60px]">
                        <CodeSnippet
                            className="h-full"
                            code={code}
                            language={'shell'}
                        />
                    </div>
                ) : null}
                {example ? (
                    <>
                        <div className="my-2">Example:</div>
                        <div className="h-[60px]">
                            <CodeSnippet
                                className="h-full"
                                code={example}
                                language={'shell'}
                            />
                        </div>
                    </>
                ) : null}
            </div>
        </div>
    );
};
