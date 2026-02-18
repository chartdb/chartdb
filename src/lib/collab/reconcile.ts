import type { SyncMetadata, Syncable } from './types';

export const shouldDiscardRemoteElement = (
    local: SyncMetadata,
    remote: SyncMetadata,
    isLocallyEditing: boolean
): boolean => {
    if (isLocallyEditing) return true;
    if (local.version > remote.version) return true;
    if (local.version === remote.version) {
        return local.versionNonce <= remote.versionNonce;
    }
    return false;
};

export const reconcileEntities = <T extends { id: string }>(
    localEntities: Syncable<T>[],
    remoteEntities: Syncable<T>[],
    editingEntityIds?: Set<string>
): Syncable<T>[] => {
    const result = new Map<string, Syncable<T>>();

    for (const local of localEntities) {
        result.set(local.id, local);
    }

    for (const remote of remoteEntities) {
        const local = result.get(remote.id);

        if (!local) {
            // New entity from remote
            if (!remote.isDeleted) {
                result.set(remote.id, remote);
            }
            continue;
        }

        const isEditing = editingEntityIds?.has(remote.id) ?? false;

        if (!shouldDiscardRemoteElement(local, remote, isEditing)) {
            result.set(remote.id, remote);
        }
    }

    // Filter out soft-deleted entities
    return Array.from(result.values()).filter((e) => !e.isDeleted);
};

export const reconcileScene = <
    Scene extends Record<string, Syncable<{ id: string }>[]>,
>(
    local: Scene,
    remote: Scene,
    editingEntityIds?: Set<string>
): Scene => {
    const result = {} as Record<string, Syncable<{ id: string }>[]>;

    for (const key of Object.keys(remote)) {
        const localCollection =
            (local[key] as Syncable<{ id: string }>[]) ?? [];
        const remoteCollection = remote[key] as Syncable<{ id: string }>[];
        result[key] = reconcileEntities(
            localCollection,
            remoteCollection,
            editingEntityIds
        );
    }

    return result as Scene;
};
