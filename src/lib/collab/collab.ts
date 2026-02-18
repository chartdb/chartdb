import type { Socket } from 'socket.io-client';
import { Portal } from './portal';
import { encryptData } from './encryption';
import { generateEncryptionKey } from './encryption';
import { reconcileEntities } from './reconcile';
import {
    WS_SUBTYPES,
    generateRoomId,
    getCollaborationLink,
    type RoomLinkData,
    type CollabScene,
    type Syncable,
    type Collaborator,
    type SocketUpdateData,
    UserIdleState,
    getCollaboratorColor,
    CURSOR_SYNC_TIMEOUT,
    SYNC_FULL_SCENE_INTERVAL_MS,
    INITIAL_SCENE_UPDATE_TIMEOUT,
    IDLE_THRESHOLD,
} from './types';
import type { DBTable } from '@/lib/domain/db-table';
import type { DBRelationship } from '@/lib/domain/db-relationship';
import type { DBDependency } from '@/lib/domain/db-dependency';
import type { Area } from '@/lib/domain/area';
import type { Note } from '@/lib/domain/note';
import type { DBCustomType } from '@/lib/domain/db-custom-type';
import type { Diagram } from '@/lib/domain/diagram';

export interface CollabCallbacks {
    getDiagram: () => Diagram;
    getTables: () => DBTable[];
    getRelationships: () => DBRelationship[];
    getDependencies: () => DBDependency[];
    getAreas: () => Area[];
    getNotes: () => Note[];
    getCustomTypes: () => DBCustomType[];

    loadScene: (scene: CollabScene) => void;
    applyUpdate: (update: Partial<CollabScene>) => void;

    onCollaboratorsChange: (collaborators: Map<string, Collaborator>) => void;
    onConnectionChange: (connected: boolean) => void;
}

function throttle<T extends (...args: never[]) => void>(
    fn: T,
    delay: number
): T & { flush: () => void } {
    let lastCall = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let lastArgs: Parameters<T> | null = null;

    const throttled = ((...args: Parameters<T>) => {
        lastArgs = args;
        const now = Date.now();
        const remaining = delay - (now - lastCall);

        if (remaining <= 0) {
            if (timer) {
                clearTimeout(timer);
                timer = null;
            }
            lastCall = now;
            fn(...args);
            lastArgs = null;
        } else if (!timer) {
            timer = setTimeout(() => {
                lastCall = Date.now();
                timer = null;
                if (lastArgs) {
                    fn(...lastArgs);
                    lastArgs = null;
                }
            }, remaining);
        }
    }) as T & { flush: () => void };

    throttled.flush = () => {
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }
        if (lastArgs) {
            lastCall = Date.now();
            fn(...lastArgs);
            lastArgs = null;
        }
    };

    return throttled;
}

export class Collab {
    portal: Portal;
    callbacks: CollabCallbacks;
    collaborators: Map<string, Collaborator> = new Map();
    username = 'Anonymous';
    isCollaborating = false;

    private syncableState: {
        tables: Map<string, Syncable<DBTable>>;
        relationships: Map<string, Syncable<DBRelationship>>;
        dependencies: Map<string, Syncable<DBDependency>>;
        areas: Map<string, Syncable<Area>>;
        notes: Map<string, Syncable<Note>>;
        customTypes: Map<string, Syncable<DBCustomType>>;
    } = {
        tables: new Map(),
        relationships: new Map(),
        dependencies: new Map(),
        areas: new Map(),
        notes: new Map(),
        customTypes: new Map(),
    };

    private idleTimeoutId: ReturnType<typeof setTimeout> | null = null;
    private fullSceneSyncInterval: ReturnType<typeof setInterval> | null = null;
    private initTimeoutId: ReturnType<typeof setTimeout> | null = null;
    private sceneInitialized = false;

    constructor(callbacks: CollabCallbacks) {
        this.portal = new Portal();
        this.callbacks = callbacks;
    }

    async startCollaboration(
        existingRoomLinkData?: RoomLinkData
    ): Promise<string> {
        const { io } = await import('socket.io-client');

        const roomId = existingRoomLinkData?.roomId ?? generateRoomId();
        const roomKey =
            existingRoomLinkData?.roomKey ?? (await generateEncryptionKey());

        const serverUrl =
            (import.meta.env.VITE_COLLAB_SERVER_URL as string) ||
            'http://localhost:3710';

        const socket: Socket = io(serverUrl, {
            transports: ['websocket', 'polling'],
        });

        this.portal.open(socket, roomId, roomKey);
        this.isCollaborating = true;
        this.sceneInitialized = !existingRoomLinkData;

        // Update URL hash
        window.location.hash = `room=${roomId},${roomKey}`;

        this.setupSocketListeners(socket);
        this.startFullSceneSync();

        // If creating a new room, initialize syncable state from current diagram
        if (!existingRoomLinkData) {
            this.initSyncableStateFromDiagram();
        }

        // Fallback init timeout for joining an existing room
        if (existingRoomLinkData) {
            this.initTimeoutId = setTimeout(() => {
                if (!this.sceneInitialized) {
                    this.sceneInitialized = true;
                    this.initSyncableStateFromDiagram();
                }
            }, INITIAL_SCENE_UPDATE_TIMEOUT);
        }

        this.callbacks.onConnectionChange(true);

        return getCollaborationLink({ roomId, roomKey });
    }

    stopCollaboration(keepRemoteState = false): void {
        this.isCollaborating = false;
        this.sceneInitialized = false;
        this.portal.close();
        this.collaborators.clear();
        this.callbacks.onCollaboratorsChange(new Map());
        this.callbacks.onConnectionChange(false);

        if (this.fullSceneSyncInterval) {
            clearInterval(this.fullSceneSyncInterval);
            this.fullSceneSyncInterval = null;
        }
        if (this.idleTimeoutId) {
            clearTimeout(this.idleTimeoutId);
            this.idleTimeoutId = null;
        }
        if (this.initTimeoutId) {
            clearTimeout(this.initTimeoutId);
            this.initTimeoutId = null;
        }

        window.location.hash = '';

        if (!keepRemoteState) {
            this.syncableState = {
                tables: new Map(),
                relationships: new Map(),
                dependencies: new Map(),
                areas: new Map(),
                notes: new Map(),
                customTypes: new Map(),
            };
        }
    }

    setUsername(name: string): void {
        this.username = name;
        if (this.portal.socket) {
            this.portal.socket.emit('set-username', name);
        }
    }

    getShareableLink(): string | null {
        if (!this.portal.roomId || !this.portal.roomKey) return null;
        return getCollaborationLink({
            roomId: this.portal.roomId,
            roomKey: this.portal.roomKey,
        });
    }

    // Called when local state changes
    syncElements(): void {
        if (!this.isCollaborating || !this.sceneInitialized) return;
        this.throttledBroadcastUpdate();
    }

    // Cursor tracking
    onPointerUpdate = throttle((pointer: { x: number; y: number }) => {
        if (!this.isCollaborating || !this.portal.socket) return;
        this.portal.broadcastMouseLocation({
            socketId: this.portal.socket.id ?? '',
            pointer,
            username: this.username,
        });
    }, CURSOR_SYNC_TIMEOUT);

    reportActive(): void {
        if (this.idleTimeoutId) clearTimeout(this.idleTimeoutId);
        this.idleTimeoutId = setTimeout(() => {
            this.broadcastIdleStatus(UserIdleState.IDLE);
        }, IDLE_THRESHOLD);
        this.broadcastIdleStatus(UserIdleState.ACTIVE);
    }

    reportIdle(): void {
        this.broadcastIdleStatus(UserIdleState.IDLE);
    }

    reportAway(): void {
        this.broadcastIdleStatus(UserIdleState.AWAY);
    }

    // --- Private methods ---

    private setupSocketListeners(socket: Socket): void {
        socket.on(
            'client-broadcast',
            async (encryptedBuffer: ArrayBuffer, iv: ArrayBuffer) => {
                const data = await this.portal.receiveDecryptedData(
                    encryptedBuffer,
                    new Uint8Array(iv)
                );
                if (!data) return;
                this.handleRemoteData(data);
            }
        );

        socket.on('first-in-room', () => {
            this.sceneInitialized = true;
            this.initSyncableStateFromDiagram();
        });

        socket.on(
            'load-scene',
            async (encryptedBuffer: ArrayBuffer, iv: ArrayBuffer) => {
                // Persisted scene from server
                const data = await this.portal.receiveDecryptedData(
                    encryptedBuffer,
                    new Uint8Array(iv)
                );
                if (data && data.type === WS_SUBTYPES.INIT) {
                    this.handleRemoteSceneInit(data.payload);
                }
            }
        );

        socket.on('new-user', async () => {
            // An existing client is asked to send SCENE_INIT
            await this.broadcastFullScene();
        });

        socket.on(
            'room-user-change',
            (users: { socketId: string; username: string }[]) => {
                this.updateCollaboratorsFromUserList(users);
            }
        );

        socket.on('disconnect', () => {
            this.callbacks.onConnectionChange(false);
        });

        socket.on('connect', () => {
            if (this.isCollaborating) {
                this.callbacks.onConnectionChange(true);
            }
        });
    }

    private handleRemoteData(data: SocketUpdateData): void {
        switch (data.type) {
            case WS_SUBTYPES.INIT:
                this.handleRemoteSceneInit(data.payload);
                break;
            case WS_SUBTYPES.UPDATE:
                this.handleRemoteSceneUpdate(data.payload);
                break;
            case WS_SUBTYPES.MOUSE_LOCATION:
                this.handleRemoteMouseLocation(data.payload);
                break;
            case WS_SUBTYPES.IDLE_STATUS:
                this.handleRemoteIdleStatus(data.payload);
                break;
        }
    }

    private handleRemoteSceneInit(scene: CollabScene): void {
        if (this.initTimeoutId) {
            clearTimeout(this.initTimeoutId);
            this.initTimeoutId = null;
        }
        this.sceneInitialized = true;

        // Store remote syncable state
        this.storeSyncableScene(scene);

        // Apply to local diagram
        this.callbacks.loadScene(scene);
    }

    private handleRemoteSceneUpdate(update: Partial<CollabScene>): void {
        if (!this.sceneInitialized) return;

        // Reconcile each collection
        if (update.tables) {
            const reconciled = reconcileEntities(
                Array.from(this.syncableState.tables.values()),
                update.tables
            );
            this.syncableState.tables = new Map(
                reconciled.map((t) => [t.id, t])
            );
        }
        if (update.relationships) {
            const reconciled = reconcileEntities(
                Array.from(this.syncableState.relationships.values()),
                update.relationships
            );
            this.syncableState.relationships = new Map(
                reconciled.map((r) => [r.id, r])
            );
        }
        if (update.dependencies) {
            const reconciled = reconcileEntities(
                Array.from(this.syncableState.dependencies.values()),
                update.dependencies
            );
            this.syncableState.dependencies = new Map(
                reconciled.map((d) => [d.id, d])
            );
        }
        if (update.areas) {
            const reconciled = reconcileEntities(
                Array.from(this.syncableState.areas.values()),
                update.areas
            );
            this.syncableState.areas = new Map(
                reconciled.map((a) => [a.id, a])
            );
        }
        if (update.notes) {
            const reconciled = reconcileEntities(
                Array.from(this.syncableState.notes.values()),
                update.notes
            );
            this.syncableState.notes = new Map(
                reconciled.map((n) => [n.id, n])
            );
        }
        if (update.customTypes) {
            const reconciled = reconcileEntities(
                Array.from(this.syncableState.customTypes.values()),
                update.customTypes
            );
            this.syncableState.customTypes = new Map(
                reconciled.map((c) => [c.id, c])
            );
        }

        this.callbacks.applyUpdate(update);
    }

    private handleRemoteMouseLocation(payload: {
        socketId: string;
        pointer: { x: number; y: number };
        username: string;
    }): void {
        const existing = this.collaborators.get(payload.socketId);
        if (existing) {
            existing.pointer = payload.pointer;
            existing.username = payload.username;
        } else {
            this.collaborators.set(payload.socketId, {
                socketId: payload.socketId,
                pointer: payload.pointer,
                username: payload.username,
                color: getCollaboratorColor(this.collaborators.size),
                userState: UserIdleState.ACTIVE,
                isCurrentUser: false,
            });
        }
        this.callbacks.onCollaboratorsChange(new Map(this.collaborators));
    }

    private handleRemoteIdleStatus(payload: {
        socketId: string;
        userState: UserIdleState;
        username: string;
    }): void {
        const existing = this.collaborators.get(payload.socketId);
        if (existing) {
            existing.userState = payload.userState;
            this.callbacks.onCollaboratorsChange(new Map(this.collaborators));
        }
    }

    private updateCollaboratorsFromUserList(
        users: { socketId: string; username: string }[]
    ): void {
        const currentSocketId = this.portal.socket?.id;
        const newCollaborators = new Map<string, Collaborator>();

        users.forEach((user, index) => {
            const isCurrentUser = user.socketId === currentSocketId;
            const existing = this.collaborators.get(user.socketId);
            newCollaborators.set(user.socketId, {
                socketId: user.socketId,
                pointer: existing?.pointer,
                username: user.username,
                color: existing?.color ?? getCollaboratorColor(index),
                userState: existing?.userState ?? UserIdleState.ACTIVE,
                isCurrentUser,
            });
        });

        this.collaborators = newCollaborators;
        this.callbacks.onCollaboratorsChange(new Map(this.collaborators));
    }

    private initSyncableStateFromDiagram(): void {
        const tables = this.callbacks.getTables();
        const relationships = this.callbacks.getRelationships();
        const dependencies = this.callbacks.getDependencies();
        const areas = this.callbacks.getAreas();
        const notes = this.callbacks.getNotes();
        const customTypes = this.callbacks.getCustomTypes();

        this.syncableState.tables = new Map(
            tables.map((t) => [t.id, this.makeSyncable(t)])
        );
        this.syncableState.relationships = new Map(
            relationships.map((r) => [r.id, this.makeSyncable(r)])
        );
        this.syncableState.dependencies = new Map(
            dependencies.map((d) => [d.id, this.makeSyncable(d)])
        );
        this.syncableState.areas = new Map(
            areas.map((a) => [a.id, this.makeSyncable(a)])
        );
        this.syncableState.notes = new Map(
            notes.map((n) => [n.id, this.makeSyncable(n)])
        );
        this.syncableState.customTypes = new Map(
            customTypes.map((c) => [c.id, this.makeSyncable(c)])
        );
    }

    private makeSyncable<T extends { id: string }>(entity: T): Syncable<T> {
        // Check if already syncable
        if ('version' in entity && 'versionNonce' in entity) {
            return entity as Syncable<T>;
        }
        return {
            ...entity,
            version: 1,
            versionNonce: Math.floor(Math.random() * 2147483647),
            isDeleted: false,
        };
    }

    private storeSyncableScene(scene: CollabScene): void {
        this.syncableState.tables = new Map(scene.tables.map((t) => [t.id, t]));
        this.syncableState.relationships = new Map(
            scene.relationships.map((r) => [r.id, r])
        );
        this.syncableState.dependencies = new Map(
            scene.dependencies.map((d) => [d.id, d])
        );
        this.syncableState.areas = new Map(scene.areas.map((a) => [a.id, a]));
        this.syncableState.notes = new Map(scene.notes.map((n) => [n.id, n]));
        this.syncableState.customTypes = new Map(
            scene.customTypes.map((c) => [c.id, c])
        );
    }

    private buildCollabScene(): CollabScene {
        const diagram = this.callbacks.getDiagram();
        return {
            meta: {
                diagramName: diagram.name,
                databaseType: diagram.databaseType,
                databaseEdition: diagram.databaseEdition,
            },
            tables: Array.from(this.syncableState.tables.values()),
            relationships: Array.from(
                this.syncableState.relationships.values()
            ),
            dependencies: Array.from(this.syncableState.dependencies.values()),
            areas: Array.from(this.syncableState.areas.values()),
            notes: Array.from(this.syncableState.notes.values()),
            customTypes: Array.from(this.syncableState.customTypes.values()),
        };
    }

    private async broadcastFullScene(): Promise<void> {
        const scene = this.buildCollabScene();
        await this.portal.broadcastSceneInit({
            type: WS_SUBTYPES.INIT,
            payload: scene,
        });
    }

    private throttledBroadcastUpdate = throttle(() => {
        this.broadcastIncrementalUpdate();
    }, 100);

    private async broadcastIncrementalUpdate(): Promise<void> {
        if (!this.isCollaborating) return;

        // Compare current diagram state to syncable state and find changes
        const currentTables = this.callbacks.getTables();
        const currentRelationships = this.callbacks.getRelationships();
        const currentDependencies = this.callbacks.getDependencies();
        const currentAreas = this.callbacks.getAreas();
        const currentNotes = this.callbacks.getNotes();
        const currentCustomTypes = this.callbacks.getCustomTypes();

        const changedTables = this.diffAndUpdate('tables', currentTables);
        const changedRelationships = this.diffAndUpdate(
            'relationships',
            currentRelationships
        );
        const changedDependencies = this.diffAndUpdate(
            'dependencies',
            currentDependencies
        );
        const changedAreas = this.diffAndUpdate('areas', currentAreas);
        const changedNotes = this.diffAndUpdate('notes', currentNotes);
        const changedCustomTypes = this.diffAndUpdate(
            'customTypes',
            currentCustomTypes
        );

        const hasChanges =
            changedTables.length > 0 ||
            changedRelationships.length > 0 ||
            changedDependencies.length > 0 ||
            changedAreas.length > 0 ||
            changedNotes.length > 0 ||
            changedCustomTypes.length > 0;

        if (!hasChanges) return;

        const update: Partial<CollabScene> = {};
        if (changedTables.length > 0) update.tables = changedTables;
        if (changedRelationships.length > 0)
            update.relationships = changedRelationships;
        if (changedDependencies.length > 0)
            update.dependencies = changedDependencies;
        if (changedAreas.length > 0) update.areas = changedAreas;
        if (changedNotes.length > 0) update.notes = changedNotes;
        if (changedCustomTypes.length > 0)
            update.customTypes = changedCustomTypes;

        await this.portal.broadcastSceneUpdate({
            type: WS_SUBTYPES.UPDATE,
            payload: update,
        });
    }

    private diffAndUpdate<T extends { id: string }>(
        collectionKey: keyof typeof this.syncableState,
        currentEntities: T[]
    ): Syncable<T>[] {
        const stateMap = this.syncableState[collectionKey] as unknown as Map<
            string,
            Syncable<T>
        >;
        const changed: Syncable<T>[] = [];
        const currentIds = new Set(currentEntities.map((e) => e.id));

        // Find added or updated entities
        for (const entity of currentEntities) {
            const existing = stateMap.get(entity.id);
            if (!existing) {
                // New entity
                const syncable = this.makeSyncable(entity);
                stateMap.set(entity.id, syncable);
                changed.push(syncable);
            } else {
                // Check if changed (simple JSON comparison)
                const { version } = existing;
                const existingCopy = { ...existing } as unknown as Record<
                    string,
                    unknown
                >;
                delete existingCopy.version;
                delete existingCopy.versionNonce;
                delete existingCopy.isDeleted;
                const existingData = existingCopy;
                const entityJson = JSON.stringify(entity);
                const existingJson = JSON.stringify(existingData);
                if (entityJson !== existingJson) {
                    const updated: Syncable<T> = {
                        ...entity,
                        version: version + 1,
                        versionNonce: Math.floor(Math.random() * 2147483647),
                        isDeleted: false,
                    };
                    stateMap.set(entity.id, updated);
                    changed.push(updated);
                }
            }
        }

        // Find deleted entities
        for (const [id, existing] of stateMap) {
            if (!currentIds.has(id) && !existing.isDeleted) {
                const deleted: Syncable<T> = {
                    ...existing,
                    version: existing.version + 1,
                    versionNonce: Math.floor(Math.random() * 2147483647),
                    isDeleted: true,
                };
                stateMap.set(id, deleted);
                changed.push(deleted);
            }
        }

        return changed;
    }

    private async broadcastIdleStatus(state: UserIdleState): Promise<void> {
        if (!this.isCollaborating || !this.portal.socket) return;
        await this.portal.broadcastIdleChange({
            socketId: this.portal.socket.id ?? '',
            userState: state,
            username: this.username,
        });
    }

    private startFullSceneSync(): void {
        this.fullSceneSyncInterval = setInterval(async () => {
            if (!this.isCollaborating || !this.sceneInitialized) return;

            // Broadcast full scene to all peers
            await this.broadcastFullScene();

            // Persist to server
            if (this.portal.roomKey) {
                const scene = this.buildCollabScene();
                const { encryptedBuffer, iv } = await encryptData(
                    this.portal.roomKey,
                    JSON.stringify({
                        type: WS_SUBTYPES.INIT,
                        payload: scene,
                    })
                );
                await this.portal.saveSceneToServer(encryptedBuffer, iv);
            }
        }, SYNC_FULL_SCENE_INTERVAL_MS);
    }

    destroy(): void {
        this.stopCollaboration();
        this.onPointerUpdate.flush();
        this.throttledBroadcastUpdate.flush();
    }
}
