import type { DBTable } from '@/lib/domain/db-table';
import type { DBRelationship } from '@/lib/domain/db-relationship';
import type { DBDependency } from '@/lib/domain/db-dependency';
import type { Area } from '@/lib/domain/area';
import type { Note } from '@/lib/domain/note';
import type { DBCustomType } from '@/lib/domain/db-custom-type';
import type { DatabaseType } from '@/lib/domain/database-type';
import type { DatabaseEdition } from '@/lib/domain/database-edition';

// --- Sync Metadata ---

export interface SyncMetadata {
    version: number;
    versionNonce: number;
    isDeleted: boolean;
}

export type Syncable<T> = T & SyncMetadata;

export const createSyncMetadata = (): SyncMetadata => ({
    version: 1,
    versionNonce: Math.floor(Math.random() * 2147483647),
    isDeleted: false,
});

export const bumpVersion = (meta: SyncMetadata): SyncMetadata => ({
    ...meta,
    version: meta.version + 1,
    versionNonce: Math.floor(Math.random() * 2147483647),
});

// --- Socket Events ---

export const WS_EVENTS = {
    SERVER: 'server-broadcast',
    SERVER_VOLATILE: 'server-volatile-broadcast',
    SAVE_SCENE: 'save-scene',
    LOAD_SCENE: 'load-scene',
} as const;

// --- Message Subtypes ---

export enum WS_SUBTYPES {
    INIT = 'SCENE_INIT',
    UPDATE = 'SCENE_UPDATE',
    MOUSE_LOCATION = 'MOUSE_LOCATION',
    IDLE_STATUS = 'IDLE_STATUS',
}

// --- Collaborator ---

export enum UserIdleState {
    ACTIVE = 'active',
    IDLE = 'idle',
    AWAY = 'away',
}

export interface Collaborator {
    socketId: string;
    pointer?: { x: number; y: number };
    username: string;
    color: string;
    userState: UserIdleState;
    isCurrentUser: boolean;
}

// --- Collab Scene (encrypted payload) ---

export interface CollabSceneMeta {
    diagramName: string;
    databaseType: DatabaseType;
    databaseEdition?: DatabaseEdition;
}

export interface CollabScene {
    meta: CollabSceneMeta;
    tables: Syncable<DBTable>[];
    relationships: Syncable<DBRelationship>[];
    dependencies: Syncable<DBDependency>[];
    areas: Syncable<Area>[];
    notes: Syncable<Note>[];
    customTypes: Syncable<DBCustomType>[];
}

// --- Socket Message Payloads ---

export interface SceneInitPayload {
    type: WS_SUBTYPES.INIT;
    payload: CollabScene;
}

export interface SceneUpdatePayload {
    type: WS_SUBTYPES.UPDATE;
    payload: {
        tables?: Syncable<DBTable>[];
        relationships?: Syncable<DBRelationship>[];
        dependencies?: Syncable<DBDependency>[];
        areas?: Syncable<Area>[];
        notes?: Syncable<Note>[];
        customTypes?: Syncable<DBCustomType>[];
    };
}

export interface MouseLocationPayload {
    type: WS_SUBTYPES.MOUSE_LOCATION;
    payload: {
        socketId: string;
        pointer: { x: number; y: number };
        username: string;
    };
}

export interface IdleStatusPayload {
    type: WS_SUBTYPES.IDLE_STATUS;
    payload: {
        socketId: string;
        userState: UserIdleState;
        username: string;
    };
}

export type SocketUpdateData =
    | SceneInitPayload
    | SceneUpdatePayload
    | MouseLocationPayload
    | IdleStatusPayload;

// --- Room Link ---

const RE_COLLAB_LINK = /^#room=([a-zA-Z0-9_-]+),([a-zA-Z0-9_+/=-]+)$/;

export interface RoomLinkData {
    roomId: string;
    roomKey: string;
}

export const getCollaborationLinkData = (link: string): RoomLinkData | null => {
    const hash = new URL(link).hash;
    const match = hash.match(RE_COLLAB_LINK);
    if (!match) return null;
    return { roomId: match[1], roomKey: match[2] };
};

export const getCollaborationLink = (data: RoomLinkData): string => {
    return `${window.location.origin}${window.location.pathname}#room=${data.roomId},${data.roomKey}`;
};

export const generateRoomId = (): string => {
    const buffer = new Uint8Array(10);
    window.crypto.getRandomValues(buffer);
    return Array.from(buffer)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
};

// --- Timing Constants ---

export const CURSOR_SYNC_TIMEOUT = 33; // ~30fps
export const SCENE_UPDATE_DEBOUNCE = 100;
export const SYNC_FULL_SCENE_INTERVAL_MS = 20_000;
export const INITIAL_SCENE_UPDATE_TIMEOUT = 5_000;
export const IDLE_THRESHOLD = 60_000; // 1 minute

// --- Collaborator Colors ---

const COLLAB_COLORS = [
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#96CEB4',
    '#FFEAA7',
    '#DDA0DD',
    '#98D8C8',
    '#F7DC6F',
    '#BB8FCE',
    '#85C1E9',
];

export const getCollaboratorColor = (index: number): string => {
    return COLLAB_COLORS[index % COLLAB_COLORS.length];
};
