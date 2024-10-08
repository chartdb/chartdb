import React from 'react';
import TimeAgo from 'timeago-react';
import { useChartDB } from '@/hooks/use-chartdb';
import { Badge } from '@/components/badge/badge';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/tooltip/tooltip';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useTranslation } from 'react-i18next';
export interface LastSavedProps {}

export const LastSaved: React.FC<LastSavedProps> = () => {
    const { currentDiagram } = useChartDB();
    const { t } = useTranslation();
    const { isMd: isDesktop } = useBreakpoint('md');
    return (
        <Tooltip>
            <TooltipTrigger>
                <Badge variant="secondary" className="flex gap-1">
                    {isDesktop ? t('last_saved') : t('saved')}
                    <TimeAgo datetime={currentDiagram.updatedAt} />
                </Badge>
            </TooltipTrigger>
            <TooltipContent>
                {currentDiagram.updatedAt.toLocaleString()}
            </TooltipContent>
        </Tooltip>
    );
};
