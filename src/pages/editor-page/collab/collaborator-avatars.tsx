import React from 'react';
import type { Collaborator } from '@/lib/collab/types';
import { UserIdleState } from '@/lib/collab/types';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/tooltip/tooltip';

export interface CollaboratorAvatarsProps {
    collaborators: Map<string, Collaborator>;
}

export const CollaboratorAvatars: React.FC<CollaboratorAvatarsProps> = ({
    collaborators,
}) => {
    const users = Array.from(collaborators.values());

    if (users.length === 0) return null;

    return (
        <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">
                Connected ({users.length})
            </label>
            <div className="flex flex-wrap gap-2">
                <TooltipProvider>
                    {users.map((user) => (
                        <Tooltip key={user.socketId}>
                            <TooltipTrigger>
                                <div
                                    className="flex size-8 items-center justify-center rounded-full text-xs font-medium text-white"
                                    style={{
                                        backgroundColor: user.color,
                                        opacity:
                                            user.userState ===
                                            UserIdleState.ACTIVE
                                                ? 1
                                                : 0.5,
                                    }}
                                >
                                    {user.username.slice(0, 2).toUpperCase()}
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>
                                    {user.username}
                                    {user.isCurrentUser && ' (you)'}
                                    {user.userState !== UserIdleState.ACTIVE &&
                                        ` - ${user.userState}`}
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    ))}
                </TooltipProvider>
            </div>
        </div>
    );
};
