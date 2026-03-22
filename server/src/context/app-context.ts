import type { ServerEnv } from '../config/env.js';
import { AppRepository } from '../repositories/app-repository.js';
import { MetadataRepository } from '../repositories/metadata-repository.js';
import { ApplyService } from '../services/apply-service.js';
import { ConnectionsService } from '../services/connections-service.js';
import { PersistenceService } from '../services/persistence-service.js';
import { SchemaSyncService } from '../services/schema-sync-service.js';

export interface AppContext {
    env: ServerEnv;
    metadataRepository: MetadataRepository;
    appRepository: AppRepository;
    connectionsService: ConnectionsService;
    schemaSyncService: SchemaSyncService;
    applyService: ApplyService;
    persistenceService: PersistenceService;
    close: () => void;
}

export const createAppContext = (
    env: ServerEnv,
    options?: {
        metadataRepository?: MetadataRepository;
        appRepository?: AppRepository;
    }
): AppContext => {
    const metadataRepository =
        options?.metadataRepository ??
        new MetadataRepository(env.metadataDbPath);
    const appRepository =
        options?.appRepository ?? new AppRepository(env.appDbPath);
    const connectionsService = new ConnectionsService(
        metadataRepository,
        env.encryptionKey
    );
    const schemaSyncService = new SchemaSyncService(
        metadataRepository,
        connectionsService
    );
    const applyService = new ApplyService(
        metadataRepository,
        connectionsService,
        schemaSyncService
    );
    const persistenceService = new PersistenceService(appRepository, {
        defaultOwnerName: env.defaultOwnerName,
        defaultProjectName: env.defaultProjectName,
    });

    return {
        env,
        metadataRepository,
        appRepository,
        connectionsService,
        schemaSyncService,
        applyService,
        persistenceService,
        close: () => {
            if (!options?.metadataRepository) {
                metadataRepository.close();
            }
            if (!options?.appRepository) {
                appRepository.close();
            }
        },
    };
};
