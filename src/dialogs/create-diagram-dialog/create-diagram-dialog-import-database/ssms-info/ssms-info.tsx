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

export interface SSMSInfoProps {}

export const SSMSInfo = React.forwardRef<
    React.ElementRef<typeof HoverCardTrigger>,
    SSMSInfoProps
>((props, ref) => {
    const [open, setOpen] = React.useState(false);
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
                    <Label className="text-xs">SSMS Instructions</Label>
                </div>
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
                <div className="flex">
                    <div className="space-y-1">
                        <h4 className="text-sm font-semibold">Instructions</h4>
                        <p className="text-xs text-muted-foreground">
                            <span className="font-semibold">1. </span>
                            {
                                'Go to Tools > Options > Query Results > SQL Server.'
                            }
                        </p>
                        <p className="text-xs text-muted-foreground">
                            <span className="font-semibold">2. </span>
                            {`If you're using "Results to Grid," change the Maximum Characters Retrieved for Non-XML data (set to 9999999).`}
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
