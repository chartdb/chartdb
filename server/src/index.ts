import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import cors from 'cors';
import { RoomManager } from './room-manager.js';
import {
    initStorage,
    saveScene,
    loadScene,
    cleanupOldRooms,
} from './storage.js';
import { WS_EVENTS } from './types.js';

const PORT = parseInt(process.env.PORT || '3710', 10);
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

const app = express();
app.use(cors());

app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});

const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
    maxHttpBufferSize: 10 * 1024 * 1024, // 10MB
});

const roomManager = new RoomManager();

initStorage();

// Periodic cleanup of old rooms
setInterval(() => {
    cleanupOldRooms(24);
}, CLEANUP_INTERVAL_MS);

io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.emit('init-room');

    socket.on('join-room', (roomId: string, username?: string) => {
        const isFirstUser = roomManager.joinRoom(
            roomId,
            socket.id,
            username || 'Anonymous'
        );

        socket.join(roomId);

        if (isFirstUser) {
            // Check if there's a persisted scene
            const stored = loadScene(roomId);
            if (stored) {
                socket.emit('load-scene', stored.encryptedScene, stored.iv);
            } else {
                socket.emit('first-in-room');
            }
        } else {
            // Ask existing clients to send SCENE_INIT to the new user
            socket.to(roomId).emit('new-user', socket.id);
        }

        // Broadcast updated user list
        const users = roomManager.getRoomUsers(roomId);
        io.in(roomId).emit('room-user-change', users);
    });

    // Relay encrypted scene data to other clients in the room
    socket.on(
        WS_EVENTS.SERVER,
        (roomId: string, encryptedBuffer: ArrayBuffer, iv: ArrayBuffer) => {
            socket.to(roomId).emit('client-broadcast', encryptedBuffer, iv);
        }
    );

    // Relay volatile data (cursors, idle status)
    socket.on(
        WS_EVENTS.SERVER_VOLATILE,
        (roomId: string, encryptedBuffer: ArrayBuffer, iv: ArrayBuffer) => {
            socket.volatile
                .to(roomId)
                .emit('client-broadcast', encryptedBuffer, iv);
        }
    );

    // Persist encrypted scene to SQLite
    socket.on(
        WS_EVENTS.SAVE_SCENE,
        (roomId: string, encryptedBuffer: ArrayBuffer, iv: ArrayBuffer) => {
            saveScene(roomId, Buffer.from(encryptedBuffer), Buffer.from(iv));
        }
    );

    socket.on('set-username', (username: string) => {
        roomManager.updateUsername(socket.id, username);
        const roomId = roomManager.getRoomForSocket(socket.id);
        if (roomId) {
            const users = roomManager.getRoomUsers(roomId);
            io.in(roomId).emit('room-user-change', users);
        }
    });

    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        const leftRooms = roomManager.leaveAllRooms(socket.id);
        for (const roomId of leftRooms) {
            const users = roomManager.getRoomUsers(roomId);
            io.in(roomId).emit('room-user-change', users);
        }
    });
});

httpServer.listen(PORT, () => {
    console.log(`ChartDB collab server running on port ${PORT}`);
});
