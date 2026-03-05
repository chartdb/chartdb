import React from 'react';
import { useCollab } from '@/hooks/use-collab';

export const ConnectionStatus: React.FC = () => {
    const { isCollaborating, isConnected } = useCollab();

    if (!isCollaborating) return null;

    return (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
                className={`size-2 rounded-full ${
                    isConnected ? 'bg-green-400' : 'animate-pulse bg-yellow-400'
                }`}
            />
            {isConnected ? 'Connected' : 'Reconnecting...'}
        </div>
    );
};
