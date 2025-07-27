import React, { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/button/button';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCanvas } from '@/hooks/use-canvas';

export interface ShowAllButtonProps {}

export const ShowAllButton: React.FC<ShowAllButtonProps> = () => {
    const { fitView } = useCanvas();
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(true);
        }, 300);

        return () => clearTimeout(timer);
    }, []);

    const showAll = useCallback(() => {
        fitView({
            duration: 500,
            padding: 0.1,
            maxZoom: 0.8,
        });
    }, [fitView]);

    return (
        <div
            className={cn(
                'transition-all duration-300 ease-in-out',
                visible
                    ? 'translate-y-0 opacity-100'
                    : 'pointer-events-none translate-y-4 opacity-0'
            )}
        >
            <div className="sm:hidden">
                <Button
                    onClick={showAll}
                    size="sm"
                    className="h-fit rounded-lg bg-slate-900 px-4 py-1.5 text-xs text-white shadow-lg hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600"
                >
                    Show All
                </Button>
            </div>

            <div className="hidden items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 shadow-lg sm:flex">
                <div className="flex size-6 items-center justify-center rounded-full bg-pink-600">
                    <Info className="size-4 text-white" />
                </div>
                <span className="text-sm text-white">
                    Your content is out of view
                </span>
                <Button
                    onClick={showAll}
                    size="sm"
                    className="ml-2 h-fit rounded-lg bg-slate-700 px-4 py-1.5 text-xs text-white hover:bg-slate-600 dark:hover:bg-slate-800"
                >
                    Show All
                </Button>
            </div>
        </div>
    );
};
