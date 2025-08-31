import React, { useRef } from 'react';
import type { Example } from './examples-data/examples-data';
import { randomColor } from '@/lib/colors';
import { Import } from 'lucide-react';
import { Label } from '@/components/label/label';
import { Button } from '@/components/button/button';
import {
    databaseSecondaryLogoMap,
    databaseTypeToLabelMap,
} from '@/lib/databases';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/tooltip/tooltip';
import { useTheme } from '@/hooks/use-theme';
import { Spinner } from '@/components/spinner/spinner';

export interface ExampleCardProps {
    example: Example;
    utilizeExample: () => void;
    loading: boolean;
}

export const ExampleCard: React.FC<ExampleCardProps> = ({
    example,
    utilizeExample,
    loading,
}) => {
    const { effectiveTheme } = useTheme();
    const color = useRef(randomColor());

    return (
        <div
            onClick={utilizeExample}
            className="flex h-96 w-full cursor-pointer flex-col rounded-xl border-2 border-slate-500 bg-slate-50 shadow-sm transition duration-300 ease-in-out hover:scale-[102%] hover:border-pink-600 dark:border-slate-700 dark:bg-slate-950"
        >
            <div
                className="h-4 rounded-t-[10px]"
                style={{ backgroundColor: color.current }}
            ></div>
            <div className="flex h-12 items-center justify-between bg-slate-200 px-2 dark:bg-slate-900">
                <div className="flex items-center gap-2">
                    <Tooltip>
                        <TooltipTrigger className="mr-1">
                            <img
                                src={
                                    databaseSecondaryLogoMap[
                                        example.diagram.databaseType
                                    ]
                                }
                                className="h-5 max-w-fit"
                                alt="database"
                            />
                        </TooltipTrigger>
                        <TooltipContent>
                            {
                                databaseTypeToLabelMap[
                                    example.diagram.databaseType
                                ]
                            }
                        </TooltipContent>
                    </Tooltip>
                    <Label className="cursor-pointer text-base font-bold">
                        {example.name}
                    </Label>
                </div>
                <div className="flex flex-row">
                    {loading ? (
                        <Spinner className="size-5" />
                    ) : (
                        <Button
                            variant="ghost"
                            className="size-9 p-0 text-slate-500 hover:bg-primary-foreground hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                        >
                            <Import className="size-5" />
                        </Button>
                    )}
                </div>
            </div>
            <div className="grow overflow-hidden">
                <img
                    src={
                        effectiveTheme === 'dark'
                            ? example.imageDark
                            : example.image
                    }
                    alt={example.name}
                    className="w-fit object-cover"
                />
            </div>
            <div className="flex p-2 text-base">{example.description}</div>
        </div>
    );
};
