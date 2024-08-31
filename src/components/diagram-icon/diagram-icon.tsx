import React from 'react';
import { Diagram } from '@/lib/domain/diagram';
import { Tooltip, TooltipContent, TooltipTrigger } from '../tooltip/tooltip';
import {
    databaseEditionToImageMap,
    databaseEditionToLabelMap,
} from '@/lib/domain/database-edition';
import {
    databaseSecondaryLogoMap,
    databaseTypeToLabelMap,
} from '@/lib/databases';

export interface DiagramIconProps {
    diagram: Diagram;
}

export const DiagramIcon = React.forwardRef<
    React.ElementRef<typeof TooltipTrigger>,
    DiagramIconProps
>(({ diagram }, ref) =>
    diagram.databaseEdition ? (
        <Tooltip>
            <TooltipTrigger className="mr-1" ref={ref}>
                <img
                    src={databaseEditionToImageMap[diagram.databaseEdition]}
                    className="h-5 max-w-fit rounded-full"
                    alt="database"
                />
            </TooltipTrigger>
            <TooltipContent>
                {databaseEditionToLabelMap[diagram.databaseEdition]}
            </TooltipContent>
        </Tooltip>
    ) : (
        <Tooltip>
            <TooltipTrigger className="mr-2" ref={ref}>
                <img
                    src={databaseSecondaryLogoMap[diagram.databaseType]}
                    className="h-5 max-w-fit"
                    alt="database"
                />
            </TooltipTrigger>
            <TooltipContent>
                {databaseTypeToLabelMap[diagram.databaseType]}
            </TooltipContent>
        </Tooltip>
    )
);

DiagramIcon.displayName = 'DiagramIcon';
