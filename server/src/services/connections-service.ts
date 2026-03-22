import type {
    ConnectionSummary,
    ConnectionTestRequest,
    ConnectionTestResponse,
    ConnectionUpsert,
    DatabaseConnectionSecret,
} from '@chartdb/schema-sync-core';
import { decryptJson, encryptJson } from '../security/encryption.js';
import type { MetadataRepository } from '../repositories/metadata-repository.js';
import { generateId } from '../utils/id.js';
import { testPostgresConnection } from '../postgres/introspection.js';

export class ConnectionsService {
    constructor(
        private readonly repository: MetadataRepository,
        private readonly encryptionKey: Buffer
    ) {}

    listConnections(): ConnectionSummary[] {
        return this.repository.listConnections();
    }

    getDecryptedSecret(connectionId: string): DatabaseConnectionSecret {
        const connection = this.repository.getConnection(connectionId);
        if (!connection) {
            throw new Error(`Connection ${connectionId} not found`);
        }
        return decryptJson<DatabaseConnectionSecret>(
            connection.secretCiphertext,
            this.encryptionKey
        );
    }

    createConnection(payload: ConnectionUpsert): ConnectionSummary {
        const now = new Date().toISOString();
        const id = generateId();
        this.repository.putConnection({
            id,
            name: payload.name,
            engine: 'postgresql',
            defaultSchemas: payload.defaultSchemas,
            host: payload.secret.host,
            port: payload.secret.port,
            database: payload.secret.database,
            username: payload.secret.username,
            secretCiphertext: encryptJson(payload.secret, this.encryptionKey),
            createdAt: now,
            updatedAt: now,
        });

        return this.repository
            .listConnections()
            .find((item) => item.id === id)!;
    }

    updateConnection(id: string, payload: ConnectionUpsert): ConnectionSummary {
        const existing = this.repository.getConnection(id);
        if (!existing) {
            throw new Error(`Connection ${id} not found`);
        }

        this.repository.putConnection({
            ...existing,
            name: payload.name,
            defaultSchemas: payload.defaultSchemas,
            host: payload.secret.host,
            port: payload.secret.port,
            database: payload.secret.database,
            username: payload.secret.username,
            secretCiphertext: encryptJson(payload.secret, this.encryptionKey),
            updatedAt: new Date().toISOString(),
        });

        return this.repository
            .listConnections()
            .find((item) => item.id === id)!;
    }

    deleteConnection(id: string) {
        this.repository.deleteConnection(id);
    }

    async testConnection(
        request: ConnectionTestRequest
    ): Promise<ConnectionTestResponse> {
        const secret = request.connectionId
            ? this.getDecryptedSecret(request.connectionId)
            : request.connection?.secret;

        if (!secret) {
            return {
                ok: false,
                error: 'Connection details are required.',
                availableSchemas: [],
            };
        }

        try {
            const result = await testPostgresConnection(secret);
            return result;
        } catch (error) {
            return {
                ok: false,
                availableSchemas: [],
                error:
                    error instanceof Error
                        ? error.message
                        : 'Unable to connect to PostgreSQL.',
            };
        }
    }
}
