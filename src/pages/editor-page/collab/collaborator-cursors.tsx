import React from 'react';
import { useCollab } from '@/hooks/use-collab';
import { useReactFlow } from '@xyflow/react';
import { UserIdleState } from '@/lib/collab/types';

export const CollaboratorCursors: React.FC = () => {
    const { collaborators, isCollaborating } = useCollab();
    const { flowToScreenPosition } = useReactFlow();

    if (!isCollaborating) return null;

    const otherUsers = Array.from(collaborators.values()).filter(
        (c) => !c.isCurrentUser && c.pointer
    );

    return (
        <div className="pointer-events-none fixed inset-0 z-50">
            {otherUsers.map((user) => {
                if (!user.pointer) return null;

                const screenPos = flowToScreenPosition({
                    x: user.pointer.x,
                    y: user.pointer.y,
                });

                return (
                    <div
                        key={user.socketId}
                        className="absolute transition-transform duration-100"
                        style={{
                            transform: `translate(${screenPos.x}px, ${screenPos.y}px)`,
                            opacity:
                                user.userState === UserIdleState.ACTIVE
                                    ? 1
                                    : 0.4,
                        }}
                    >
                        {/* Cursor arrow SVG */}
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M0.928711 0.571533L5.46871 15.1035L8.16171 9.29453L14.3337 8.15553L0.928711 0.571533Z"
                                fill={user.color}
                                stroke="white"
                                strokeWidth="1"
                            />
                        </svg>
                        {/* Username label */}
                        <div
                            className="-mt-1 ml-4 whitespace-nowrap rounded px-1.5 py-0.5 text-xs text-white"
                            style={{ backgroundColor: user.color }}
                        >
                            {user.username}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
