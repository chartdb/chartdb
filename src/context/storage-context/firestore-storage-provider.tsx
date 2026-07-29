import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    query,
    setDoc,
    updateDoc,
    where,
    writeBatch,
    Timestamp,
    type DocumentData,
    type DocumentReference,
    type Firestore,
} from 'firebase/firestore';
import type { StorageContext, DiagramSyncChange } from './storage-context';
import { storageContext } from './storage-context';
import type { Diagram } from '@/lib/domain/diagram';
import type { DBTable } from '@/lib/domain/db-table';
import type { DBRelationship } from '@/lib/domain/db-relationship';
import type { ChartDBConfig } from '@/lib/domain/config';
import type { DBDependency } from '@/lib/domain/db-dependency';
import type { Area } from '@/lib/domain/area';
import type { DBCustomType } from '@/lib/domain/db-custom-type';
import type { DiagramFilter } from '@/lib/domain/diagram-filter/diagram-filter';
import type { Note } from '@/lib/domain/note';
import { getFirestoreDb } from '@/lib/firebase/firebase-config';
import { ensureSignedIn } from '@/lib/firebase/firebase-auth';
import { COLLECTIONS } from '@/lib/firebase/firestore-collections';
import { Spinner } from '@/components/spinner/spinner';

const LOCAL_CONFIG_KEY = 'chartdb-cloud-config';

function timestampToDate(value: unknown): Date | undefined {
    if (value instanceof Timestamp) {
        return value.toDate();
    }
    if (value instanceof Date) {
        return value;
    }
    return undefined;
}

function diagramFromSnapshot(id: string, data: DocumentData): Diagram {
    return {
        ...data,
        id,
        createdAt: timestampToDate(data.createdAt) ?? new Date(),
        updatedAt: timestampToDate(data.updatedAt) ?? new Date(),
    } as Diagram;
}

async function getEntity<T>(
    db: Firestore,
    collectionName: string,
    id: string
): Promise<T | undefined> {
    const snap = await getDoc(doc(db, collectionName, id));
    return snap.exists() ? (snap.data() as T) : undefined;
}

async function listEntitiesByDiagram<T>(
    db: Firestore,
    collectionName: string,
    diagramId: string
): Promise<T[]> {
    const q = query(
        collection(db, collectionName),
        where('diagramId', '==', diagramId)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as T);
}

async function deleteEntitiesByDiagram(
    db: Firestore,
    collectionName: string,
    diagramId: string
): Promise<void> {
    const q = query(
        collection(db, collectionName),
        where('diagramId', '==', diagramId)
    );
    const snap = await getDocs(q);
    if (snap.empty) return;

    // Firestore batches cap out at 500 writes; diagrams have far fewer
    // entities than that in practice, but chunk defensively just in case.
    for (let i = 0; i < snap.docs.length; i += 450) {
        const batch = writeBatch(db);
        snap.docs.slice(i, i + 450).forEach((d) => batch.delete(d.ref));
        await batch.commit();
    }
}

async function reparentEntitiesByDiagram(
    db: Firestore,
    collectionName: string,
    fromDiagramId: string,
    toDiagramId: string
): Promise<void> {
    const q = query(
        collection(db, collectionName),
        where('diagramId', '==', fromDiagramId)
    );
    const snap = await getDocs(q);
    if (snap.empty) return;

    for (let i = 0; i < snap.docs.length; i += 450) {
        const batch = writeBatch(db);
        snap.docs
            .slice(i, i + 450)
            .forEach((d) => batch.update(d.ref, { diagramId: toDiagramId }));
        await batch.commit();
    }
}

// setDoc/updateDoc/deleteDoc wrapped to also record when *this client* last
// wrote to a given document id, purely in memory. That record is what lets
// subscribeToDiagram's conflict heuristic tell "someone else changed the
// same thing I just touched" apart from "someone changed something
// unrelated elsewhere in the diagram" (see isLikelyConflict below).
function trackedSetDoc(
    recentWrites: Map<string, number>,
    ref: DocumentReference,
    data: DocumentData
): Promise<void> {
    recentWrites.set(ref.id, Date.now());
    return setDoc(ref, data);
}

function trackedUpdateDoc(
    recentWrites: Map<string, number>,
    ref: DocumentReference,
    data: DocumentData
): Promise<void> {
    recentWrites.set(ref.id, Date.now());
    return updateDoc(ref, data);
}

function trackedDeleteDoc(
    recentWrites: Map<string, number>,
    ref: DocumentReference
): Promise<void> {
    recentWrites.set(ref.id, Date.now());
    return deleteDoc(ref);
}

// How long after our own write we'll still treat an incoming change to the
// same document as a potential conflict rather than just the server
// catching up with what we already know.
const CONFLICT_WINDOW_MS = 8000;

// Availability over strict consistency: this never blocks or rejects a
// write, it only flags changes that look like they landed on top of one of
// ours recently, so the UI can surface a "double check this" notice.
function isLikelyConflict(
    recentWrites: Map<string, number>,
    id: string,
    hasPendingWrites: boolean
): boolean {
    // A change carrying our own not-yet-acknowledged write is just the
    // local echo of the edit we're already showing - not a conflict signal.
    if (hasPendingWrites) return false;

    const lastLocalWrite = recentWrites.get(id);
    if (lastLocalWrite === undefined) return false;

    return Date.now() - lastLocalWrite < CONFLICT_WINDOW_MS;
}

// Firestore delivers each entity collection's changes via docChanges();
// this maps one of those into the generic shape ChartDBProvider merges into
// its own state.
function toSyncChanges(
    kind: DiagramSyncChange['kind'],
    snapshot: {
        docChanges: () => Array<{
            type: 'added' | 'modified' | 'removed';
            doc: {
                id: string;
                data: () => DocumentData;
                metadata: { hasPendingWrites: boolean };
            };
        }>;
    },
    recentWrites: Map<string, number>
): DiagramSyncChange[] {
    return snapshot.docChanges().map((change) => ({
        kind,
        type: change.type,
        id: change.doc.id,
        data: change.type === 'removed' ? undefined : change.doc.data(),
        isPossibleConflict: isLikelyConflict(
            recentWrites,
            change.doc.id,
            change.doc.metadata.hasPendingWrites
        ),
    }));
}

export const FirestoreStorageProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const db = useMemo(() => getFirestoreDb(), []);
    const [userId, setUserId] = useState<string | undefined>();
    // Deliberately a ref, not state: this is write-tracking bookkeeping for
    // the conflict heuristic, not something that should ever trigger a
    // re-render on its own.
    const recentWritesRef = useRef<Map<string, number>>(new Map());

    useEffect(() => {
        ensureSignedIn().then((user) => setUserId(user.uid));
    }, []);

    // --- Config (per-browser preference, not shared across collaborators) --
    const getConfig: StorageContext['getConfig'] = useCallback(async () => {
        const raw = window.localStorage.getItem(LOCAL_CONFIG_KEY);
        return raw ? (JSON.parse(raw) as ChartDBConfig) : undefined;
    }, []);

    const updateConfig: StorageContext['updateConfig'] = useCallback(
        async (config) => {
            const current = await getConfig();
            window.localStorage.setItem(
                LOCAL_CONFIG_KEY,
                JSON.stringify({ ...current, ...config })
            );
        },
        [getConfig]
    );

    // --- Diagram filter ------------------------------------------------
    const getDiagramFilter: StorageContext['getDiagramFilter'] = useCallback(
        async (diagramId) =>
            getEntity<DiagramFilter>(db, COLLECTIONS.diagramFilters, diagramId),
        [db]
    );

    const updateDiagramFilter: StorageContext['updateDiagramFilter'] =
        useCallback(
            async (diagramId, filter) => {
                await trackedSetDoc(
                    recentWritesRef.current,
                    doc(db, COLLECTIONS.diagramFilters, diagramId),
                    filter
                );
            },
            [db]
        );

    const deleteDiagramFilter: StorageContext['deleteDiagramFilter'] =
        useCallback(
            async (diagramId) => {
                await trackedDeleteDoc(
                    recentWritesRef.current,
                    doc(db, COLLECTIONS.diagramFilters, diagramId)
                );
            },
            [db]
        );

    // --- Tables ----------------------------------------------------------
    const addTable: StorageContext['addTable'] = useCallback(
        async ({ diagramId, table }) => {
            await trackedSetDoc(
                recentWritesRef.current,
                doc(db, COLLECTIONS.tables, table.id),
                {
                    ...table,
                    diagramId,
                }
            );
        },
        [db]
    );

    const getTable: StorageContext['getTable'] = useCallback(
        async ({ id }) =>
            getEntity<DBTable & { diagramId: string }>(
                db,
                COLLECTIONS.tables,
                id
            ),
        [db]
    );

    const updateTable: StorageContext['updateTable'] = useCallback(
        async ({ id, attributes }) => {
            await trackedUpdateDoc(
                recentWritesRef.current,
                doc(db, COLLECTIONS.tables, id),
                attributes
            );
        },
        [db]
    );

    const putTable: StorageContext['putTable'] = useCallback(
        async ({ diagramId, table }) => {
            await trackedSetDoc(
                recentWritesRef.current,
                doc(db, COLLECTIONS.tables, table.id),
                {
                    ...table,
                    diagramId,
                }
            );
        },
        [db]
    );

    const deleteTable: StorageContext['deleteTable'] = useCallback(
        async ({ id }) => {
            await trackedDeleteDoc(
                recentWritesRef.current,
                doc(db, COLLECTIONS.tables, id)
            );
        },
        [db]
    );

    const listTables: StorageContext['listTables'] = useCallback(
        async (diagramId) =>
            listEntitiesByDiagram<DBTable>(db, COLLECTIONS.tables, diagramId),
        [db]
    );

    const deleteDiagramTables: StorageContext['deleteDiagramTables'] =
        useCallback(
            async (diagramId) =>
                deleteEntitiesByDiagram(db, COLLECTIONS.tables, diagramId),
            [db]
        );

    // --- Relationships -----------------------------------------------------
    const addRelationship: StorageContext['addRelationship'] = useCallback(
        async ({ diagramId, relationship }) => {
            await trackedSetDoc(
                recentWritesRef.current,
                doc(db, COLLECTIONS.relationships, relationship.id),
                {
                    ...relationship,
                    diagramId,
                }
            );
        },
        [db]
    );

    const getRelationship: StorageContext['getRelationship'] = useCallback(
        async ({ id }) =>
            getEntity<DBRelationship>(db, COLLECTIONS.relationships, id),
        [db]
    );

    const updateRelationship: StorageContext['updateRelationship'] =
        useCallback(
            async ({ id, attributes }) => {
                await trackedUpdateDoc(
                    recentWritesRef.current,
                    doc(db, COLLECTIONS.relationships, id),
                    attributes
                );
            },
            [db]
        );

    const deleteRelationship: StorageContext['deleteRelationship'] =
        useCallback(
            async ({ id }) => {
                await trackedDeleteDoc(
                    recentWritesRef.current,
                    doc(db, COLLECTIONS.relationships, id)
                );
            },
            [db]
        );

    const listRelationships: StorageContext['listRelationships'] = useCallback(
        async (diagramId) => {
            const relationships = await listEntitiesByDiagram<DBRelationship>(
                db,
                COLLECTIONS.relationships,
                diagramId
            );
            return relationships.sort((a, b) => a.name.localeCompare(b.name));
        },
        [db]
    );

    const deleteDiagramRelationships: StorageContext['deleteDiagramRelationships'] =
        useCallback(
            async (diagramId) =>
                deleteEntitiesByDiagram(
                    db,
                    COLLECTIONS.relationships,
                    diagramId
                ),
            [db]
        );

    // --- Dependencies --------------------------------------------------
    const addDependency: StorageContext['addDependency'] = useCallback(
        async ({ diagramId, dependency }) => {
            await trackedSetDoc(
                recentWritesRef.current,
                doc(db, COLLECTIONS.dependencies, dependency.id),
                {
                    ...dependency,
                    diagramId,
                }
            );
        },
        [db]
    );

    const getDependency: StorageContext['getDependency'] = useCallback(
        async ({ id }) =>
            getEntity<DBDependency>(db, COLLECTIONS.dependencies, id),
        [db]
    );

    const updateDependency: StorageContext['updateDependency'] = useCallback(
        async ({ id, attributes }) => {
            await trackedUpdateDoc(
                recentWritesRef.current,
                doc(db, COLLECTIONS.dependencies, id),
                attributes
            );
        },
        [db]
    );

    const deleteDependency: StorageContext['deleteDependency'] = useCallback(
        async ({ id }) => {
            await trackedDeleteDoc(
                recentWritesRef.current,
                doc(db, COLLECTIONS.dependencies, id)
            );
        },
        [db]
    );

    const listDependencies: StorageContext['listDependencies'] = useCallback(
        async (diagramId) =>
            listEntitiesByDiagram<DBDependency>(
                db,
                COLLECTIONS.dependencies,
                diagramId
            ),
        [db]
    );

    const deleteDiagramDependencies: StorageContext['deleteDiagramDependencies'] =
        useCallback(
            async (diagramId) =>
                deleteEntitiesByDiagram(
                    db,
                    COLLECTIONS.dependencies,
                    diagramId
                ),
            [db]
        );

    // --- Areas -----------------------------------------------------------
    const addArea: StorageContext['addArea'] = useCallback(
        async ({ diagramId, area }) => {
            await trackedSetDoc(
                recentWritesRef.current,
                doc(db, COLLECTIONS.areas, area.id),
                {
                    ...area,
                    diagramId,
                }
            );
        },
        [db]
    );

    const getArea: StorageContext['getArea'] = useCallback(
        async ({ id }) => getEntity<Area>(db, COLLECTIONS.areas, id),
        [db]
    );

    const updateArea: StorageContext['updateArea'] = useCallback(
        async ({ id, attributes }) => {
            await trackedUpdateDoc(
                recentWritesRef.current,
                doc(db, COLLECTIONS.areas, id),
                attributes
            );
        },
        [db]
    );

    const deleteArea: StorageContext['deleteArea'] = useCallback(
        async ({ id }) => {
            await trackedDeleteDoc(
                recentWritesRef.current,
                doc(db, COLLECTIONS.areas, id)
            );
        },
        [db]
    );

    const listAreas: StorageContext['listAreas'] = useCallback(
        async (diagramId) =>
            listEntitiesByDiagram<Area>(db, COLLECTIONS.areas, diagramId),
        [db]
    );

    const deleteDiagramAreas: StorageContext['deleteDiagramAreas'] =
        useCallback(
            async (diagramId) =>
                deleteEntitiesByDiagram(db, COLLECTIONS.areas, diagramId),
            [db]
        );

    // --- Custom types ------------------------------------------------
    const addCustomType: StorageContext['addCustomType'] = useCallback(
        async ({ diagramId, customType }) => {
            await trackedSetDoc(
                recentWritesRef.current,
                doc(db, COLLECTIONS.customTypes, customType.id),
                {
                    ...customType,
                    diagramId,
                }
            );
        },
        [db]
    );

    const getCustomType: StorageContext['getCustomType'] = useCallback(
        async ({ id }) =>
            getEntity<DBCustomType>(db, COLLECTIONS.customTypes, id),
        [db]
    );

    const updateCustomType: StorageContext['updateCustomType'] = useCallback(
        async ({ id, attributes }) => {
            await trackedUpdateDoc(
                recentWritesRef.current,
                doc(db, COLLECTIONS.customTypes, id),
                attributes
            );
        },
        [db]
    );

    const deleteCustomType: StorageContext['deleteCustomType'] = useCallback(
        async ({ id }) => {
            await trackedDeleteDoc(
                recentWritesRef.current,
                doc(db, COLLECTIONS.customTypes, id)
            );
        },
        [db]
    );

    const listCustomTypes: StorageContext['listCustomTypes'] = useCallback(
        async (diagramId) => {
            const customTypes = await listEntitiesByDiagram<DBCustomType>(
                db,
                COLLECTIONS.customTypes,
                diagramId
            );
            return customTypes.sort((a, b) => a.name.localeCompare(b.name));
        },
        [db]
    );

    const deleteDiagramCustomTypes: StorageContext['deleteDiagramCustomTypes'] =
        useCallback(
            async (diagramId) =>
                deleteEntitiesByDiagram(db, COLLECTIONS.customTypes, diagramId),
            [db]
        );

    // --- Notes -----------------------------------------------------------
    const addNote: StorageContext['addNote'] = useCallback(
        async ({ diagramId, note }) => {
            await trackedSetDoc(
                recentWritesRef.current,
                doc(db, COLLECTIONS.notes, note.id),
                {
                    ...note,
                    diagramId,
                }
            );
        },
        [db]
    );

    const getNote: StorageContext['getNote'] = useCallback(
        async ({ id }) => getEntity<Note>(db, COLLECTIONS.notes, id),
        [db]
    );

    const updateNote: StorageContext['updateNote'] = useCallback(
        async ({ id, attributes }) => {
            await trackedUpdateDoc(
                recentWritesRef.current,
                doc(db, COLLECTIONS.notes, id),
                attributes
            );
        },
        [db]
    );

    const deleteNote: StorageContext['deleteNote'] = useCallback(
        async ({ id }) => {
            await trackedDeleteDoc(
                recentWritesRef.current,
                doc(db, COLLECTIONS.notes, id)
            );
        },
        [db]
    );

    const listNotes: StorageContext['listNotes'] = useCallback(
        async (diagramId) =>
            listEntitiesByDiagram<Note>(db, COLLECTIONS.notes, diagramId),
        [db]
    );

    const deleteDiagramNotes: StorageContext['deleteDiagramNotes'] =
        useCallback(
            async (diagramId) =>
                deleteEntitiesByDiagram(db, COLLECTIONS.notes, diagramId),
            [db]
        );

    // --- Diagrams ----------------------------------------------------------
    // Cloud diagrams are one shared pool: every signed-in user (anonymous or
    // otherwise) can see and edit every diagram, so there's no owner/editor/
    // viewer ACL to stamp here - just the diagram's own fields. See
    // firestore.rules for the corresponding "any authenticated user" rules.
    const addDiagram: StorageContext['addDiagram'] = useCallback(
        async ({ diagram }) => {
            await ensureSignedIn();

            await trackedSetDoc(
                recentWritesRef.current,
                doc(db, COLLECTIONS.diagrams, diagram.id),
                {
                    name: diagram.name,
                    databaseType: diagram.databaseType,
                    databaseEdition: diagram.databaseEdition ?? null,
                    createdAt: diagram.createdAt,
                    updatedAt: diagram.updatedAt,
                    storageMode: 'cloud',
                }
            );

            const promises: Promise<void>[] = [];
            (diagram.tables ?? []).forEach((table) =>
                promises.push(addTable({ diagramId: diagram.id, table }))
            );
            (diagram.relationships ?? []).forEach((relationship) =>
                promises.push(
                    addRelationship({ diagramId: diagram.id, relationship })
                )
            );
            (diagram.dependencies ?? []).forEach((dependency) =>
                promises.push(
                    addDependency({ diagramId: diagram.id, dependency })
                )
            );
            (diagram.areas ?? []).forEach((area) =>
                promises.push(addArea({ diagramId: diagram.id, area }))
            );
            (diagram.customTypes ?? []).forEach((customType) =>
                promises.push(
                    addCustomType({ diagramId: diagram.id, customType })
                )
            );
            (diagram.notes ?? []).forEach((note) =>
                promises.push(addNote({ diagramId: diagram.id, note }))
            );

            await Promise.all(promises);
        },
        [
            db,
            addArea,
            addCustomType,
            addDependency,
            addRelationship,
            addTable,
            addNote,
        ]
    );

    const listDiagrams: StorageContext['listDiagrams'] = useCallback(
        async (options = {}): Promise<Diagram[]> => {
            await ensureSignedIn();

            const snap = await getDocs(collection(db, COLLECTIONS.diagrams));
            let diagrams = snap.docs.map((d) =>
                diagramFromSnapshot(d.id, d.data())
            );

            if (options.includeTables) {
                diagrams = await Promise.all(
                    diagrams.map(async (diagram) => {
                        diagram.tables = await listTables(diagram.id);
                        return diagram;
                    })
                );
            }
            if (options.includeRelationships) {
                diagrams = await Promise.all(
                    diagrams.map(async (diagram) => {
                        diagram.relationships = await listRelationships(
                            diagram.id
                        );
                        return diagram;
                    })
                );
            }
            if (options.includeDependencies) {
                diagrams = await Promise.all(
                    diagrams.map(async (diagram) => {
                        diagram.dependencies = await listDependencies(
                            diagram.id
                        );
                        return diagram;
                    })
                );
            }
            if (options.includeAreas) {
                diagrams = await Promise.all(
                    diagrams.map(async (diagram) => {
                        diagram.areas = await listAreas(diagram.id);
                        return diagram;
                    })
                );
            }
            if (options.includeCustomTypes) {
                diagrams = await Promise.all(
                    diagrams.map(async (diagram) => {
                        diagram.customTypes = await listCustomTypes(diagram.id);
                        return diagram;
                    })
                );
            }
            if (options.includeNotes) {
                diagrams = await Promise.all(
                    diagrams.map(async (diagram) => {
                        diagram.notes = await listNotes(diagram.id);
                        return diagram;
                    })
                );
            }

            return diagrams;
        },
        [
            db,
            listAreas,
            listCustomTypes,
            listDependencies,
            listRelationships,
            listTables,
            listNotes,
        ]
    );

    const getDiagram: StorageContext['getDiagram'] = useCallback(
        async (id, options = {}): Promise<Diagram | undefined> => {
            const snap = await getDoc(doc(db, COLLECTIONS.diagrams, id));
            if (!snap.exists()) return undefined;

            const diagram = diagramFromSnapshot(id, snap.data());

            if (options.includeTables) {
                diagram.tables = await listTables(id);
            }
            if (options.includeRelationships) {
                diagram.relationships = await listRelationships(id);
            }
            if (options.includeDependencies) {
                diagram.dependencies = await listDependencies(id);
            }
            if (options.includeAreas) {
                diagram.areas = await listAreas(id);
            }
            if (options.includeCustomTypes) {
                diagram.customTypes = await listCustomTypes(id);
            }
            if (options.includeNotes) {
                diagram.notes = await listNotes(id);
            }

            return diagram;
        },
        [
            db,
            listAreas,
            listCustomTypes,
            listDependencies,
            listRelationships,
            listTables,
            listNotes,
        ]
    );

    const updateDiagram: StorageContext['updateDiagram'] = useCallback(
        async ({ id, attributes }) => {
            await trackedUpdateDoc(
                recentWritesRef.current,
                doc(db, COLLECTIONS.diagrams, id),
                attributes
            );

            if (attributes.id && attributes.id !== id) {
                const newId = attributes.id;
                await Promise.all(
                    [
                        COLLECTIONS.tables,
                        COLLECTIONS.relationships,
                        COLLECTIONS.dependencies,
                        COLLECTIONS.areas,
                        COLLECTIONS.customTypes,
                        COLLECTIONS.notes,
                    ].map((collectionName) =>
                        reparentEntitiesByDiagram(db, collectionName, id, newId)
                    )
                );
            }
        },
        [db]
    );

    const deleteDiagram: StorageContext['deleteDiagram'] = useCallback(
        async (id) => {
            await Promise.all([
                trackedDeleteDoc(
                    recentWritesRef.current,
                    doc(db, COLLECTIONS.diagrams, id)
                ),
                deleteEntitiesByDiagram(db, COLLECTIONS.tables, id),
                deleteEntitiesByDiagram(db, COLLECTIONS.relationships, id),
                deleteEntitiesByDiagram(db, COLLECTIONS.dependencies, id),
                deleteEntitiesByDiagram(db, COLLECTIONS.areas, id),
                deleteEntitiesByDiagram(db, COLLECTIONS.customTypes, id),
                deleteEntitiesByDiagram(db, COLLECTIONS.notes, id),
                trackedDeleteDoc(
                    recentWritesRef.current,
                    doc(db, COLLECTIONS.diagramFilters, id)
                ).catch(() => undefined),
            ]);
        },
        [db]
    );

    // Live sync: one listener on the diagram doc itself, plus one per entity
    // collection scoped to this diagram, so ChartDBProvider can merge in
    // whatever any other client (or this same client, once the write is
    // echoed back) does to it. Firestore's own offline queuing/local cache
    // already means this never blocks on connectivity - a disconnected
    // client just keeps its last-known state and catches up automatically,
    // which is the "availability first" behavior we want here.
    const subscribeToDiagram: StorageContext['subscribeToDiagram'] =
        useCallback(
            (diagramId, onChange) => {
                const recentWrites = recentWritesRef.current;
                const unsubscribes: Array<() => void> = [];

                unsubscribes.push(
                    onSnapshot(
                        doc(db, COLLECTIONS.diagrams, diagramId),
                        (snap) => {
                            if (!snap.exists()) return;
                            onChange({
                                kind: 'diagram',
                                type: 'modified',
                                id: snap.id,
                                data: diagramFromSnapshot(snap.id, snap.data()),
                                isPossibleConflict: isLikelyConflict(
                                    recentWrites,
                                    snap.id,
                                    snap.metadata.hasPendingWrites
                                ),
                            });
                        },
                        (error) => {
                            // Don't let a sync-listener error take down the
                            // editor - the app still works, it just won't
                            // get live updates until the next reload.

                            console.error(
                                'Diagram sync listener error:',
                                error
                            );
                        }
                    )
                );

                const entityCollections: Array<{
                    kind: DiagramSyncChange['kind'];
                    name: string;
                }> = [
                    { kind: 'table', name: COLLECTIONS.tables },
                    { kind: 'relationship', name: COLLECTIONS.relationships },
                    { kind: 'dependency', name: COLLECTIONS.dependencies },
                    { kind: 'area', name: COLLECTIONS.areas },
                    { kind: 'customType', name: COLLECTIONS.customTypes },
                    { kind: 'note', name: COLLECTIONS.notes },
                ];

                entityCollections.forEach(({ kind, name }) => {
                    const q = query(
                        collection(db, name),
                        where('diagramId', '==', diagramId)
                    );
                    unsubscribes.push(
                        onSnapshot(
                            q,
                            (snap) => {
                                toSyncChanges(kind, snap, recentWrites).forEach(
                                    onChange
                                );
                            },
                            (error) => {
                                console.error(
                                    `Diagram sync listener error (${name}):`,
                                    error
                                );
                            }
                        )
                    );
                });

                return () =>
                    unsubscribes.forEach((unsubscribe) => unsubscribe());
            },
            [db]
        );

    if (!userId) {
        // Anonymous/auth handshake with Firebase happens once on mount;
        // block rendering children briefly rather than let early calls into
        // Firestore race ahead of the client actually being signed in (the
        // security rules require request.auth != null for every operation).
        return (
            <div className="flex h-screen w-screen items-center justify-center">
                <Spinner size="large" />
            </div>
        );
    }

    return (
        <storageContext.Provider
            value={{
                subscribeToDiagram,
                getConfig,
                updateConfig,
                addDiagram,
                listDiagrams,
                getDiagram,
                updateDiagram,
                deleteDiagram,
                addTable,
                getTable,
                updateTable,
                putTable,
                deleteTable,
                listTables,
                addRelationship,
                getRelationship,
                updateRelationship,
                deleteRelationship,
                listRelationships,
                deleteDiagramTables,
                deleteDiagramRelationships,
                addDependency,
                getDependency,
                updateDependency,
                deleteDependency,
                listDependencies,
                deleteDiagramDependencies,
                addArea,
                getArea,
                updateArea,
                deleteArea,
                listAreas,
                deleteDiagramAreas,
                addCustomType,
                getCustomType,
                updateCustomType,
                deleteCustomType,
                listCustomTypes,
                deleteDiagramCustomTypes,
                addNote,
                getNote,
                updateNote,
                deleteNote,
                listNotes,
                deleteDiagramNotes,
                getDiagramFilter,
                updateDiagramFilter,
                deleteDiagramFilter,
            }}
        >
            {children}
        </storageContext.Provider>
    );
};
