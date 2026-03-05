interface RoomUser {
    socketId: string;
    username: string;
}

export class RoomManager {
    private rooms: Map<string, Map<string, RoomUser>> = new Map();

    joinRoom(roomId: string, socketId: string, username: string): boolean {
        if (!this.rooms.has(roomId)) {
            this.rooms.set(roomId, new Map());
        }
        const room = this.rooms.get(roomId)!;
        const isFirstUser = room.size === 0;
        room.set(socketId, { socketId, username });
        return isFirstUser;
    }

    leaveRoom(roomId: string, socketId: string): void {
        const room = this.rooms.get(roomId);
        if (!room) return;
        room.delete(socketId);
        if (room.size === 0) {
            this.rooms.delete(roomId);
        }
    }

    leaveAllRooms(socketId: string): string[] {
        const leftRooms: string[] = [];
        for (const [roomId, room] of this.rooms) {
            if (room.has(socketId)) {
                room.delete(socketId);
                leftRooms.push(roomId);
                if (room.size === 0) {
                    this.rooms.delete(roomId);
                }
            }
        }
        return leftRooms;
    }

    getRoomUsers(roomId: string): RoomUser[] {
        const room = this.rooms.get(roomId);
        if (!room) return [];
        return Array.from(room.values());
    }

    getRoomForSocket(socketId: string): string | null {
        for (const [roomId, room] of this.rooms) {
            if (room.has(socketId)) return roomId;
        }
        return null;
    }

    updateUsername(socketId: string, username: string): void {
        for (const room of this.rooms.values()) {
            const user = room.get(socketId);
            if (user) {
                user.username = username;
            }
        }
    }
}
