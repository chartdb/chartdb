import type { Socket } from 'socket.io-client';
import { encryptData, decryptData } from './encryption';
import {
    WS_EVENTS,
    WS_SUBTYPES,
    type SocketUpdateData,
    type Collaborator,
    type UserIdleState,
} from './types';

export class Portal {
    socket: Socket | null = null;
    socketInitialized = false;
    roomId: string | null = null;
    roomKey: string | null = null;
    broadcastedEntityVersions: Map<string, number> = new Map();

    open(socket: Socket, id: string, key: string): void {
        this.socket = socket;
        this.roomId = id;
        this.roomKey = key;

        this.socket.on('init-room', () => {
            if (this.socket && this.roomId) {
                this.socket.emit('join-room', this.roomId);
            }
        });

        this.socketInitialized = true;
    }

    close(): void {
        if (!this.socket) return;
        this.socket.close();
        this.socket = null;
        this.socketInitialized = false;
        this.roomId = null;
        this.roomKey = null;
        this.broadcastedEntityVersions.clear();
    }

    isOpen(): boolean {
        return !!(this.socketInitialized && this.socket && this.roomId);
    }

    private async broadcastSocketData(
        data: SocketUpdateData,
        volatile: boolean
    ): Promise<void> {
        if (!this.socket || !this.roomId || !this.roomKey) return;

        const json = JSON.stringify(data);
        const { encryptedBuffer, iv } = await encryptData(this.roomKey, json);

        const event = volatile ? WS_EVENTS.SERVER_VOLATILE : WS_EVENTS.SERVER;
        this.socket.emit(event, this.roomId, encryptedBuffer, iv);
    }

    async receiveDecryptedData(
        encryptedBuffer: ArrayBuffer,
        iv: Uint8Array<ArrayBuffer>
    ): Promise<SocketUpdateData | null> {
        if (!this.roomKey) return null;
        try {
            const json = await decryptData(iv, encryptedBuffer, this.roomKey);
            return JSON.parse(json) as SocketUpdateData;
        } catch {
            console.error('Failed to decrypt collab data');
            return null;
        }
    }

    async broadcastSceneInit(data: SocketUpdateData): Promise<void> {
        await this.broadcastSocketData(data, false);
    }

    async broadcastSceneUpdate(data: SocketUpdateData): Promise<void> {
        await this.broadcastSocketData(data, false);
    }

    async broadcastMouseLocation(payload: {
        socketId: string;
        pointer: { x: number; y: number };
        username: string;
    }): Promise<void> {
        await this.broadcastSocketData(
            {
                type: WS_SUBTYPES.MOUSE_LOCATION,
                payload,
            },
            true
        );
    }

    async broadcastIdleChange(payload: {
        socketId: string;
        userState: UserIdleState;
        username: string;
    }): Promise<void> {
        await this.broadcastSocketData(
            {
                type: WS_SUBTYPES.IDLE_STATUS,
                payload,
            },
            true
        );
    }

    async saveSceneToServer(
        encryptedBuffer: ArrayBuffer,
        iv: Uint8Array
    ): Promise<void> {
        if (!this.socket || !this.roomId) return;
        this.socket.emit(
            WS_EVENTS.SAVE_SCENE,
            this.roomId,
            encryptedBuffer,
            iv
        );
    }

    onNewUser: ((socketId: string) => void) | null = null;
    onRoomUserChange:
        | ((clients: { socketId: string; username: string }[]) => void)
        | null = null;
    onCollaboratorsUpdate:
        | ((collaborators: Map<string, Collaborator>) => void)
        | null = null;
}
