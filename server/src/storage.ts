import Database from 'better-sqlite3';
import path from 'node:path';

const DB_PATH =
    process.env.COLLAB_DB_PATH || path.join(process.cwd(), 'collab.db');

let db: Database.Database;

export const initStorage = (): void => {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.exec(`
        CREATE TABLE IF NOT EXISTS rooms (
            room_id TEXT PRIMARY KEY,
            encrypted_scene BLOB NOT NULL,
            iv BLOB NOT NULL,
            updated_at INTEGER NOT NULL DEFAULT (unixepoch())
        )
    `);
};

export const saveScene = (
    roomId: string,
    encryptedScene: Buffer,
    iv: Buffer
): void => {
    const stmt = db.prepare(`
        INSERT INTO rooms (room_id, encrypted_scene, iv, updated_at)
        VALUES (?, ?, ?, unixepoch())
        ON CONFLICT(room_id) DO UPDATE SET
            encrypted_scene = excluded.encrypted_scene,
            iv = excluded.iv,
            updated_at = unixepoch()
    `);
    stmt.run(roomId, encryptedScene, iv);
};

export const loadScene = (
    roomId: string
): { encryptedScene: Buffer; iv: Buffer } | null => {
    const stmt = db.prepare(
        'SELECT encrypted_scene, iv FROM rooms WHERE room_id = ?'
    );
    const row = stmt.get(roomId) as
        | { encrypted_scene: Buffer; iv: Buffer }
        | undefined;
    if (!row) return null;
    return { encryptedScene: row.encrypted_scene, iv: row.iv };
};

export const cleanupOldRooms = (maxAgeHours: number = 24): void => {
    const stmt = db.prepare(
        'DELETE FROM rooms WHERE updated_at < unixepoch() - ?'
    );
    stmt.run(maxAgeHours * 3600);
};
