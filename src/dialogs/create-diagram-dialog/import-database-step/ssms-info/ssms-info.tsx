import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from '@/components/hover-card/hover-card';
import { Label } from '@/components/label/label';
import { Info } from 'lucide-react';
import React from 'react';
import SSMSInstructions from '@/assets/ssms-instructions.png';
import { ZoomableImage } from '@/components/zoomable-image/zoomable-image';
import { useTranslation } from 'react-i18next';

export interface SSMSInfoProps {}

export const SSMSInfo = React.forwardRef<
    React.ElementRef<typeof HoverCardTrigger>,
    SSMSInfoProps
>((props, ref) => {
    const [open, setOpen] = React.useState(false);
    const { t } = useTranslation();
    return (
        <HoverCard
            open={open}
            onOpenChange={(isOpen) => {
                setOpen(isOpen);
            }}
        >
            <HoverCardTrigger ref={ref} {...props} asChild>
                <div
                    className="flex flex-row items-center gap-1 text-pink-600"
                    onClick={() => {
                        setOpen(!open);
                    }}
                >
                    <Info size={14} />
                    <Label className="text-xs">
                        {t(
                            'new_diagram_dialog.import_database.ssms_instructions.button_text'
                        )}
                    </Label>
                </div>
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
                <div className="flex">
                    <div className="space-y-1">
                        <h4 className="text-sm font-semibold">
                            {t(
                                'new_diagram_dialog.import_database.ssms_instructions.title'
                            )}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                            <span className="font-semibold">1. </span>
                            {t(
                                'new_diagram_dialog.import_database.ssms_instructions.step_1'
                            )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            <span className="font-semibold">2. </span>
                            {t(
                                'new_diagram_dialog.import_database.ssms_instructions.step_2'
                            )}
                        </p>
                        <div className="flex items-center pt-2">
                            <ZoomableImage src={SSMSInstructions} />
                        </div>
                    </div>
                </div>
            </HoverCardContent>
        </HoverCard>
    );
});

SSMSInfo.displayName = 'SSMSInfo';
