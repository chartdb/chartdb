import { createContext } from 'react';
import { emptyFn } from '@/lib/utils';

export interface CollaborationParticipant {
    id: string;
    name: string;
    color: string;
    lastActive: number;
    isYou?: boolean;
}

export interface CollaborationContext {
    sessionId: string;
    userId: string;
    username: string;
    participants: CollaborationParticipant[];
    localParticipant: CollaborationParticipant;
    isConnected: boolean;
    isSupported: boolean;
    setUsername: (name: string) => void;
    connect: () => void;
    disconnect: () => void;
}

const defaultParticipant: CollaborationParticipant = {
    id: '',
    name: '',
    color: '#9ca3af',
    lastActive: 0,
    isYou: true,
};

export const collaborationContext = createContext<CollaborationContext>({
    sessionId: '',
    userId: '',
    username: '',
    participants: [defaultParticipant],
    localParticipant: defaultParticipant,
    isConnected: false,
    isSupported: true,
    setUsername: emptyFn,
    connect: emptyFn,
    disconnect: emptyFn,
});
