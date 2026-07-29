import React from 'react';
import { STORAGE_MODE } from '@/lib/env';
import { DexieStorageProvider } from './dexie-storage-provider';
import { FirestoreStorageProvider } from './firestore-storage-provider';

// Selects the storage backend once at app startup based on STORAGE_MODE
// (see src/lib/env.ts). Everything below `StorageContext` only ever talks to
// the `StorageContext` interface, so callers of `StorageProvider` don't need
// to know or care which implementation is mounted.
export const StorageProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) =>
    STORAGE_MODE === 'cloud' ? (
        <FirestoreStorageProvider>{children}</FirestoreStorageProvider>
    ) : (
        <DexieStorageProvider>{children}</DexieStorageProvider>
    );
