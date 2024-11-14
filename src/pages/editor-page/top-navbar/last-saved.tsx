import React from 'react';
import TimeAgo from 'timeago-react';
import { register as registerLocale } from 'timeago.js';
import { useChartDB } from '@/hooks/use-chartdb';
import { Badge } from '@/components/badge/badge';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/tooltip/tooltip';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useTranslation } from 'react-i18next';

import en from 'timeago.js/lib/lang/en_US';
import es from 'timeago.js/lib/lang/es';
import fr from 'timeago.js/lib/lang/fr';
import de from 'timeago.js/lib/lang/de';
import hi from 'timeago.js/lib/lang/hi_IN';
import ja from 'timeago.js/lib/lang/ja';
import ko from 'timeago.js/lib/lang/ko';
import pt from 'timeago.js/lib/lang/pt_BR';
import uk from 'timeago.js/lib/lang/uk';
import ru from 'timeago.js/lib/lang/ru';
import zh_CN from 'timeago.js/lib/lang/zh_CN';
import zh_TW from 'timeago.js/lib/lang/zh_TW';

registerLocale('en', en);
registerLocale('es', es);
registerLocale('fr', fr);
registerLocale('de', de);
registerLocale('hi', hi);
registerLocale('ja', ja);
registerLocale('ko_KR', ko);
registerLocale('pt_BR', pt);
registerLocale('uk', uk);
registerLocale('ru', ru);
registerLocale('zh_CN', zh_CN);
registerLocale('zh_TW', zh_TW);

export interface LastSavedProps {}

export const LastSaved: React.FC<LastSavedProps> = () => {
    const { currentDiagram } = useChartDB();
    const { t, i18n } = useTranslation();
    const { isMd: isDesktop } = useBreakpoint('md');
    return (
        <Tooltip>
            <TooltipTrigger>
                <Badge variant="secondary" className="flex gap-1">
                    {isDesktop ? t('last_saved') : t('saved')}
                    <TimeAgo
                        datetime={currentDiagram.updatedAt}
                        locale={i18n.language}
                    />
                </Badge>
            </TooltipTrigger>
            <TooltipContent>
                {currentDiagram.updatedAt.toLocaleString()}
            </TooltipContent>
        </Tooltip>
    );
};
