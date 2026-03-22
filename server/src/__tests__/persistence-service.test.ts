import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { AppRepository } from '../repositories/app-repository.js';
import { diagramDocumentSchema } from '../schemas/persistence.js';
import { PersistenceService } from '../services/persistence-service.js';

const tempDirs: string[] = [];

const createService = () => {
    const dataDir = mkdtempSync(path.join(os.tmpdir(), 'chartdb-persist-'));
    tempDirs.push(dataDir);
    const repository = new AppRepository(
        path.join(dataDir, 'chartdb-app.sqlite')
    );
    const service = new PersistenceService(repository, {
        defaultOwnerName: 'Test Owner',
        defaultProjectName: 'Test Project',
    });

    return { repository, service };
};

afterEach(() => {
    while (tempDirs.length > 0) {
        const dir = tempDirs.pop();
        if (dir) {
            rmSync(dir, { recursive: true, force: true });
        }
    }
});

describe('persistence foundation', () => {
    it('bootstraps a placeholder owner and default project', () => {
        const { repository, service } = createService();
        const bootstrap = service.bootstrap();

        expect(bootstrap.user.authProvider).toBe('placeholder');
        expect(bootstrap.defaultProject.ownerUserId).toBe(bootstrap.user.id);

        repository.close();
    });

    it('validates and stores diagram documents with ownership and visibility metadata', () => {
        const { repository, service } = createService();
        const bootstrap = service.bootstrap();
        const now = new Date('2026-03-22T12:00:00.000Z');

        const saved = service.upsertDiagram('diagram-1', {
            projectId: bootstrap.defaultProject.id,
            ownerUserId: bootstrap.user.id,
            visibility: 'private',
            status: 'active',
            diagram: {
                id: 'ignored-by-route',
                name: 'Backend Foundation',
                databaseType: 'postgresql',
                tables: [{ id: 'tbl-1', name: 'users' }],
                createdAt: now.toISOString(),
                updatedAt: now.toISOString(),
            },
        });

        expect(saved.id).toBe('diagram-1');
        expect(saved.projectId).toBe(bootstrap.defaultProject.id);
        expect(saved.visibility).toBe('private');
        expect(
            diagramDocumentSchema.parse(saved.diagram).createdAt.toISOString()
        ).toBe(now.toISOString());

        repository.close();
    });
});
