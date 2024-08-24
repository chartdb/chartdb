import React, { useCallback } from 'react';
import { Example } from './examples-data/examples-data';
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
import { useStorage } from '@/hooks/use-storage';
import { Diagram } from '@/lib/domain/diagram';
import { useNavigate } from 'react-router-dom';

export interface ExampleCardProps {
    example: Example;
}

export const ExampleCard: React.FC<ExampleCardProps> = ({ example }) => {
    const navigate = useNavigate();
    const { addDiagram, deleteDiagram } = useStorage();
    const { diagram } = example;
    const utilizeExample = useCallback(async () => {
        const { id } = diagram;

        await deleteDiagram(id);

        const now = new Date();
        const diagramToAdd: Diagram = {
            ...diagram,
            createdAt: now,
            updatedAt: now,
        };

        await addDiagram({ diagram: diagramToAdd });
        navigate(`/diagrams/${id}`);
    }, [addDiagram, diagram, navigate, deleteDiagram]);
    return (
        <div
            onClick={utilizeExample}
            className="h-96 rounded-xl flex flex-col w-full bg-slate-50 border-2 border-slate-500 hover:border-pink-600 shadow-sm cursor-pointer transition ease-in-out duration-300 hover:scale-[102%]"
        >
            <div
                className="h-4 rounded-t-xl"
                style={{ backgroundColor: randomColor() }}
            ></div>
            <div className="flex items-center h-12 bg-slate-200 px-2 justify-between">
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
                    <Label className="text-md font-bold cursor-pointer">
                        {example.name}
                    </Label>
                </div>
                <div className="flex-row flex">
                    <Button
                        variant="ghost"
                        className="hover:bg-primary-foreground p-0 w-9 h-9 text-slate-500 hover:text-slate-700"
                        // onClick={openTableInEditor}
                    >
                        <Import className="h-5 w-5" />
                    </Button>
                </div>
            </div>
            <img
                src={example.image}
                alt={example.name}
                className="w-fit border-b"
            />
            <div className="flex p-2 text-md">{example.description}</div>
        </div>
    );
};
