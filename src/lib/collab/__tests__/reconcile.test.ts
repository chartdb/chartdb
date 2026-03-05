import { describe, it, expect } from 'vitest';
import { reconcileEntities, shouldDiscardRemoteElement } from '../reconcile';
import type { Syncable } from '../types';

interface TestEntity {
    id: string;
    name: string;
}

const makeSyncable = (
    entity: TestEntity,
    version: number,
    versionNonce: number,
    isDeleted = false
): Syncable<TestEntity> => ({
    ...entity,
    version,
    versionNonce,
    isDeleted,
});

describe('shouldDiscardRemoteElement', () => {
    it('should discard when locally editing', () => {
        expect(
            shouldDiscardRemoteElement(
                { version: 1, versionNonce: 100, isDeleted: false },
                { version: 2, versionNonce: 200, isDeleted: false },
                true
            )
        ).toBe(true);
    });

    it('should discard when local version is higher', () => {
        expect(
            shouldDiscardRemoteElement(
                { version: 3, versionNonce: 100, isDeleted: false },
                { version: 2, versionNonce: 200, isDeleted: false },
                false
            )
        ).toBe(true);
    });

    it('should accept when remote version is higher', () => {
        expect(
            shouldDiscardRemoteElement(
                { version: 1, versionNonce: 100, isDeleted: false },
                { version: 2, versionNonce: 200, isDeleted: false },
                false
            )
        ).toBe(false);
    });

    it('should use versionNonce for tie-breaking', () => {
        // Local nonce <= remote nonce → discard (local wins)
        expect(
            shouldDiscardRemoteElement(
                { version: 2, versionNonce: 100, isDeleted: false },
                { version: 2, versionNonce: 200, isDeleted: false },
                false
            )
        ).toBe(true);

        // Local nonce > remote nonce → accept remote
        expect(
            shouldDiscardRemoteElement(
                { version: 2, versionNonce: 300, isDeleted: false },
                { version: 2, versionNonce: 200, isDeleted: false },
                false
            )
        ).toBe(false);
    });
});

describe('reconcileEntities', () => {
    it('should keep local-only entities', () => {
        const local = [makeSyncable({ id: '1', name: 'local' }, 1, 100)];
        const remote: Syncable<TestEntity>[] = [];

        const result = reconcileEntities(local, remote);
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('local');
    });

    it('should add remote-only entities', () => {
        const local: Syncable<TestEntity>[] = [];
        const remote = [makeSyncable({ id: '1', name: 'remote' }, 1, 100)];

        const result = reconcileEntities(local, remote);
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('remote');
    });

    it('should accept remote when version is higher', () => {
        const local = [makeSyncable({ id: '1', name: 'local' }, 1, 100)];
        const remote = [makeSyncable({ id: '1', name: 'remote' }, 2, 200)];

        const result = reconcileEntities(local, remote);
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('remote');
        expect(result[0].version).toBe(2);
    });

    it('should keep local when version is higher', () => {
        const local = [makeSyncable({ id: '1', name: 'local' }, 3, 100)];
        const remote = [makeSyncable({ id: '1', name: 'remote' }, 2, 200)];

        const result = reconcileEntities(local, remote);
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('local');
    });

    it('should filter out soft-deleted entities', () => {
        const local = [makeSyncable({ id: '1', name: 'active' }, 1, 100)];
        const remote = [
            makeSyncable({ id: '1', name: 'deleted' }, 2, 200, true),
        ];

        const result = reconcileEntities(local, remote);
        expect(result).toHaveLength(0);
    });

    it('should not add soft-deleted remote-only entities', () => {
        const local: Syncable<TestEntity>[] = [];
        const remote = [
            makeSyncable({ id: '1', name: 'deleted' }, 1, 100, true),
        ];

        const result = reconcileEntities(local, remote);
        expect(result).toHaveLength(0);
    });

    it('should skip remote for entities being edited', () => {
        const local = [makeSyncable({ id: '1', name: 'editing' }, 1, 100)];
        const remote = [makeSyncable({ id: '1', name: 'remote' }, 2, 200)];

        const result = reconcileEntities(local, remote, new Set(['1']));
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('editing');
    });

    it('should handle mixed scenario', () => {
        const local = [
            makeSyncable({ id: '1', name: 'unchanged' }, 1, 100),
            makeSyncable({ id: '2', name: 'localWins' }, 3, 100),
            makeSyncable({ id: '3', name: 'localOnly' }, 1, 100),
        ];
        const remote = [
            makeSyncable({ id: '1', name: 'unchanged' }, 1, 100),
            makeSyncable({ id: '2', name: 'remoteUpdate' }, 2, 200),
            makeSyncable({ id: '4', name: 'remoteOnly' }, 1, 100),
        ];

        const result = reconcileEntities(local, remote);
        expect(result).toHaveLength(4);

        const byId = new Map(result.map((e) => [e.id, e]));
        expect(byId.get('1')?.name).toBe('unchanged');
        expect(byId.get('2')?.name).toBe('localWins');
        expect(byId.get('3')?.name).toBe('localOnly');
        expect(byId.get('4')?.name).toBe('remoteOnly');
    });
});
