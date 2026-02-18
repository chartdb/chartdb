import { createContext } from 'react';
import type { Collaborator } from '@/lib/collab/types';
import type { RoomLinkData } from '@/lib/collab/types';
import { emptyFn } from '@/lib/utils';

export interface CollabContextType {
    isCollaborating: boolean;
    isConnected: boolean;
    collaborators: Map<string, Collaborator>;
    startCollaboration: (roomLinkData?: RoomLinkData) => Promise<string>;
    stopCollaboration: (keepRemoteState?: boolean) => void;
    onPointerUpdate: (pointer: { x: number; y: number }) => void;
    getShareableLink: () => string | null;
    setUsername: (name: string) => void;
    username: string;
}

export const collabContext = createContext<CollabContextType>({
    isCollaborating: false,
    isConnected: false,
    collaborators: new Map(),
    startCollaboration: emptyFn,
    stopCollaboration: emptyFn,
    onPointerUpdate: emptyFn,
    getShareableLink: () => null,
    setUsername: emptyFn,
    username: 'Anonymous',
});
