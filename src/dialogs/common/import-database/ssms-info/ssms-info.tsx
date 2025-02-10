import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from '@/components/hover-card/hover-card';
import { Label } from '@/components/label/label';
import { Info, X } from 'lucide-react';
import React, { useCallback, useEffect, useMemo } from 'react';
import SSMSInstructions from '@/assets/ssms-instructions.png';
import { ZoomableImage } from '@/components/zoomable-image/zoomable-image';
import { useTranslation } from 'react-i18next';

export interface SSMSInfoProps {
    open?: boolean;
    setOpen?: (open: boolean) => void;
}

export const SSMSInfo = React.forwardRef<
    React.ElementRef<typeof HoverCardTrigger>,
    SSMSInfoProps
>(({ open: controlledOpen, setOpen: setControlledOpen }, ref) => {
    const [open, setOpen] = React.useState(false);
    const { t } = useTranslation();

    useEffect(() => {
        if (controlledOpen) {
            setOpen(true);
        }
    }, [controlledOpen]);

    const closeHandler = useCallback(() => {
        setOpen(false);
        setControlledOpen?.(false);
    }, [setControlledOpen]);

    const isOpen = useMemo(
        () => open || controlledOpen,
        [open, controlledOpen]
    );

    return (
        <HoverCard
            open={isOpen}
            onOpenChange={(isOpen) => {
                if (controlledOpen) {
                    return;
                }
                setOpen(isOpen);
            }}
        >
            <HoverCardTrigger ref={ref} asChild>
                <div
                    className="flex flex-row items-center gap-1 text-pink-600"
                    onClick={() => {
                        setOpen?.(!open);
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
                <div className="flex flex-col">
                    <div className="flex items-start justify-between">
                        <h4 className="text-sm font-semibold">
                            {t(
                                'new_diagram_dialog.import_database.ssms_instructions.title'
                            )}
                        </h4>
                        <button
                            onClick={closeHandler}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            <X size={16} />
                        </button>
                    </div>
                    <div className="space-y-1">
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
