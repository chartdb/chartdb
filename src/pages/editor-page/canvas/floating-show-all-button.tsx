import React from 'react';
import { Button } from '@/components/button/button';
import { Info, Scan } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FloatingShowAllButtonProps {
    onClick: () => void;
    visible: boolean;
}

export const FloatingShowAllButton: React.FC<FloatingShowAllButtonProps> = ({
    onClick,
    visible,
}) => {
    return (
        <div
            className={cn(
                'transition-all duration-300 ease-in-out',
                visible
                    ? 'translate-y-0 opacity-100'
                    : 'pointer-events-none translate-y-4 opacity-0'
            )}
        >
            {/* Mobile version - compact button only */}
            <div className="sm:hidden">
                <Button
                    onClick={onClick}
                    size="sm"
                    className="rounded-full bg-gray-900 px-3 py-2 text-xs text-white shadow-lg hover:bg-gray-800"
                >
                    <Scan className="mr-1 size-3" />
                    Show All
                </Button>
            </div>

            {/* Desktop version - full info card */}
            <div className="hidden items-center gap-2 rounded-full bg-gray-900 px-4 py-2 shadow-lg sm:flex">
                <div className="flex size-6 items-center justify-center rounded-full bg-blue-500">
                    <Info className="size-4 text-white" />
                </div>
                <span className="text-sm text-white">
                    Your content is out of view
                </span>
                <Button
                    onClick={onClick}
                    size="sm"
                    className="ml-2 rounded-full bg-gray-700 px-4 py-1 text-xs text-white hover:bg-gray-600"
                >
                    Show All
                </Button>
            </div>
        </div>
    );
};
