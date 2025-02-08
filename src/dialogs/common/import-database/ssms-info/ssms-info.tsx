import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from '@/components/hover-card/hover-card';
import { Label } from '@/components/label/label';
import { Info, X } from 'lucide-react';
import React from 'react';
import SSMSInstructions from '@/assets/ssms-instructions.png';
import { ZoomableImage } from '@/components/zoomable-image/zoomable-image';
import { useTranslation } from 'react-i18next';

export interface SSMSInfoProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export const SSMSInfo = React.forwardRef<
    React.ElementRef<typeof HoverCardTrigger>,
    SSMSInfoProps
>(({ open: controlledOpen, onOpenChange }, ref) => {
    const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
    const [forceOpen, setForceOpen] = React.useState(false);
    const { t } = useTranslation();

    // When controlledOpen becomes true, set forceOpen to true
    React.useEffect(() => {
        if (controlledOpen) {
            setForceOpen(true);
        }
    }, [controlledOpen]);

    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? forceOpen && controlledOpen : uncontrolledOpen;
    const setOpen = (isOpen: boolean) => {
        if (isControlled) {
            setForceOpen(isOpen);
            onOpenChange?.(isOpen);
        } else {
            setUncontrolledOpen(isOpen);
        }
    };

    return (
        <HoverCard
            open={open}
            onOpenChange={(isOpen) => {
                // Only allow closing through the X button when in controlled mode
                if (isControlled && forceOpen && !isOpen) {
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
                            onClick={() => setOpen(false)}
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
